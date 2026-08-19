import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { signAccessToken, type AccessTokenExpiresIn } from "@repo/auth"
import { sendForgotPasswordEmail, sendPasswordChangedEmail, logEmailEvent } from "@repo/email"
import { env } from "../../config/env"
import { buildPasswordResetUrl, getAuthEmailContext } from "../../config/email"
import { prisma } from "../../database/prisma"
import {
  createClientUserWithWorkspace,
  clientOrganizationSelect
} from "./client-workspace-bootstrap"
import { sendRegistrationEmails } from "./email-verification.service"
import type {
  AuthResponse,
  AuthUserDTO,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  RegisterResponse,
  ResetPasswordInput
} from "./auth.types"

const organizationSelect = clientOrganizationSelect

function toAuthUser(user: {
  id: string
  name: string | null
  email: string
  role: AuthUserDTO["role"]
  emailVerifiedAt?: Date | null
}): AuthUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt ?? null
  }
}

function issueAccessToken(user: AuthUserDTO): string {
  if (!env.jwtAccessSecret) {
    throw new Error("JWT_ACCESS_SECRET is missing")
  }

  return signAccessToken(user, {
    secret: env.jwtAccessSecret,
    expiresIn: env.jwtAccessTtl as AccessTokenExpiresIn
  })
}

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new Error("Email already registered")
  }

  const password = await bcrypt.hash(input.password, 10)

  const { user } = await prisma.$transaction(async (tx) => {
    return createClientUserWithWorkspace(
      tx,
      {
        name: input.name,
        email: input.email.trim().toLowerCase(),
        password
      },
      {
        name: input.name,
        email: input.email.trim().toLowerCase(),
        organizationName: input.organizationName
      }
    )
  })

  void sendRegistrationEmails({
    id: user.id,
    email: user.email,
    name: user.name
  })

  // Deliberately no token/session is issued here: the account is created
  // unverified and must not be authenticated until email verification
  // completes (see login()'s enforceEmailVerification gate).
  return {
    message: "Account created successfully. Please verify your email before signing in."
  }
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: input.email.trim().toLowerCase(),
        mode: 'insensitive'
      }
    }
  })
  if (!user) {
    throw new Error("Invalid credentials")
  }

  if (!user.password) {
    throw new Error("Invalid credentials")
  }

  const validPassword = await bcrypt.compare(input.password, user.password)
  if (!validPassword) {
    throw new Error("Invalid credentials")
  }

  if (!user.isActive) {
    throw new Error("Account is inactive")
  }

  if (env.enforceEmailVerification && !user.emailVerifiedAt) {
    throw new Error("Please verify your email before signing in")
  }

  const authUser = toAuthUser(user)
  const token = issueAccessToken(authUser)
  return { token, user: authUser }
}

export async function getCurrentUser(userId: string): Promise<AuthUserDTO | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerifiedAt: true
    }
  })

  return user ? toAuthUser(user) : null
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, name: true }
  })

  if (!user) {
    return
  }

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashResetToken(rawToken)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: tokenHash,
      passwordResetExpiresAt: expiresAt
    }
  })

  const app = input.app ?? 'web'
  const resetUrl = buildPasswordResetUrl(app, rawToken)
  const ctx = getAuthEmailContext()

  try {
    await sendForgotPasswordEmail(ctx, {
      to: user.email,
      recipientName: user.name,
      resetUrl
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    logEmailEvent('error', 'Forgot password email failed', {
      userId: user.id,
      message
    })
  }
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const tokenHash = hashResetToken(input.token)

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetExpiresAt: {
        gt: new Date()
      }
    },
    select: {
      id: true,
      email: true,
      name: true
    }
  })

  if (!user) {
    throw new Error("Invalid or expired reset token")
  }

  const passwordHash = await bcrypt.hash(input.password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null
    }
  })

  const ctx = getAuthEmailContext()

  try {
    await sendPasswordChangedEmail(ctx, {
      to: user.email,
      recipientName: user.name
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    logEmailEvent('error', 'Password changed email failed', {
      userId: user.id,
      message
    })
  }
}
