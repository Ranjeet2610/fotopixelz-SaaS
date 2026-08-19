import { signAccessToken, type AccessTokenExpiresIn } from '@repo/auth'
import { env } from '../../config/env'
import { prisma } from '../../database/prisma'
import { createClientUserWithWorkspace } from './client-workspace-bootstrap'
import { consumeOAuthHandoffCode, createOAuthHandoffCode } from './oauth-handoff'
import {
  createSignedOAuthState,
  generatePkcePair,
  sanitizeOAuthNextPath,
  verifySignedOAuthState
} from './oauth-state'
import type { AuthResponse, AuthUserDTO } from './auth.types'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

type GoogleUserInfo = {
  sub: string
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
}

type GoogleTokenResponse = {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  id_token?: string
}

function oauthStateSecret() {
  return env.oauthStateSecret || env.jwtAccessSecret
}

type OAuthSessionUser = {
  id: string
  name: string | null
  email: string
  role: AuthUserDTO['role']
  emailVerifiedAt: Date | null
  isActive: boolean
}

const oauthUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  emailVerifiedAt: true,
  isActive: true
} as const

function toAuthUser(user: OAuthSessionUser): AuthUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt
  }
}

function issueAccessToken(user: AuthUserDTO): string {
  if (!env.jwtAccessSecret) {
    throw new Error('JWT_ACCESS_SECRET is missing')
  }

  return signAccessToken(user, {
    secret: env.jwtAccessSecret,
    expiresIn: env.jwtAccessTtl as AccessTokenExpiresIn
  })
}

function verifiedAtFromGoogle(emailVerified?: boolean) {
  return emailVerified === true ? new Date() : null
}

function assertGoogleOAuthConfigured() {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    throw new Error('Google OAuth is not configured')
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function buildGoogleAuthorizationUrl(nextPath?: string) {
  assertGoogleOAuthConfigured()

  const next = sanitizeOAuthNextPath(nextPath)
  const { codeVerifier, codeChallenge } = generatePkcePair()
  const state = createSignedOAuthState({ codeVerifier, next }, oauthStateSecret())

  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account'
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

async function exchangeGoogleCode(code: string, codeVerifier: string): Promise<GoogleTokenResponse> {
  assertGoogleOAuthConfigured()

  const body = new URLSearchParams({
    code,
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    redirect_uri: env.googleRedirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier
  })

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: body.toString()
  })

  if (!response.ok) {
    throw new Error('Google token exchange failed')
  }

  return (await response.json()) as GoogleTokenResponse
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error('Google userinfo request failed')
  }

  const profile = (await response.json()) as GoogleUserInfo

  if (!profile.sub || !profile.email) {
    throw new Error('Google profile is incomplete')
  }

  return profile
}

async function findUserByGoogleId(googleId: string) {
  return prisma.user.findUnique({
    where: { googleId },
    select: oauthUserSelect
  })
}

async function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: {
      email: {
        equals: normalizeEmail(email),
        mode: 'insensitive'
      }
    },
    select: {
      ...oauthUserSelect,
      googleId: true
    }
  })
}

async function linkGoogleAccount(
  user: NonNullable<Awaited<ReturnType<typeof findUserByEmail>>>,
  profile: GoogleUserInfo
) {
  if (user.googleId && user.googleId !== profile.sub) {
    throw new Error('Google account conflict')
  }

  const emailVerifiedAt =
    user.emailVerifiedAt ?? verifiedAtFromGoogle(profile.email_verified)

  return prisma.user.update({
    where: { id: user.id },
    data: {
      googleId: user.googleId ?? profile.sub,
      name: user.name ?? profile.name ?? null,
      ...(emailVerifiedAt ? { emailVerifiedAt } : {})
    },
    select: oauthUserSelect
  })
}

async function createGoogleClientUser(profile: GoogleUserInfo) {
  const email = normalizeEmail(profile.email!)
  const emailVerifiedAt = verifiedAtFromGoogle(profile.email_verified)

  return prisma.$transaction(async (tx) => {
    return createClientUserWithWorkspace(
      tx,
      {
        name: profile.name ?? null,
        email,
        password: null,
        googleId: profile.sub,
        emailVerifiedAt
      },
      {
        name: profile.name ?? null,
        email,
        organizationName: undefined
      }
    )
  })
}

export type GoogleCallbackResult = {
  redirectUrl: string
}

export async function handleGoogleOAuthCallback(
  code: string | undefined,
  state: string | undefined
): Promise<GoogleCallbackResult> {
  const failureRedirect = (reason: string) => ({
    redirectUrl: `${env.webAppUrl}/auth/callback?error=${encodeURIComponent(reason)}`
  })

  if (!code || !state) {
    return failureRedirect('oauth_failed')
  }

  try {
    const statePayload = verifySignedOAuthState(state, oauthStateSecret())
    const tokenResponse = await exchangeGoogleCode(code, statePayload.codeVerifier)
    const profile = await fetchGoogleUserInfo(tokenResponse.access_token)

    let user: OAuthSessionUser | null = await findUserByGoogleId(profile.sub)

    if (!user) {
      const existingByEmail = await findUserByEmail(profile.email!)
      if (existingByEmail) {
        user = await linkGoogleAccount(existingByEmail, profile)
      } else {
        const created = await createGoogleClientUser(profile)
        user = {
          id: created.user.id,
          name: created.user.name,
          email: created.user.email,
          role: created.user.role,
          emailVerifiedAt: created.user.emailVerifiedAt,
          isActive: created.user.isActive
        }
      }
    } else if (profile.email_verified === true && !user.emailVerifiedAt) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
        select: oauthUserSelect
      })
    }

    if (!user) {
      return failureRedirect('oauth_failed')
    }

    if (!user.isActive) {
      return failureRedirect('account_inactive')
    }

    const authUser = toAuthUser(user)
    const token = issueAccessToken(authUser)

    const next = sanitizeOAuthNextPath(statePayload.next)
    const handoffCode = await createOAuthHandoffCode({ token, user: authUser })
    const params = new URLSearchParams({
      code: handoffCode,
      next
    })

    return {
      redirectUrl: `${env.webAppUrl}/auth/callback?${params.toString()}`
    }
  } catch (error) {
    console.error('[google-oauth] callback failed:', error)
    return failureRedirect('oauth_failed')
  }
}

export async function exchangeOAuthHandoffCode(code: string): Promise<AuthResponse> {
  const payload = await consumeOAuthHandoffCode(code)
  if (!payload) {
    throw new Error('Invalid or expired code')
  }

  return { token: payload.token, user: payload.user }
}
