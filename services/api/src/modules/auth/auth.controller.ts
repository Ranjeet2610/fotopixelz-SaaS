import type { Request, Response } from 'express'
import {
  forgotPasswordSchema,
  googleOAuthQuerySchema,
  loginSchema,
  oauthExchangeSchema,
  registerSchema,
  resendVerificationEmailSchema,
  resetPasswordSchema,
  verifyEmailQuerySchema
} from './auth.validator'
import { forgotPassword, getCurrentUser, login, register, resetPassword } from './auth.service'
import {
  buildGoogleAuthorizationUrl,
  exchangeOAuthHandoffCode,
  handleGoogleOAuthCallback
} from './google-oauth.service'
import {
  resendVerificationEmail,
  resendVerificationEmailByAddress,
  verifyEmailByToken
} from './email-verification.service'
import { buildLoginVerifiedRedirectUrl } from '../../config/email'

// Messages that represent "credentials are valid but access is currently
// forbidden by an account-state policy" — distinct from bad credentials (401).
const LOGIN_FORBIDDEN_MESSAGES = new Set([
  "Account is inactive",
  "Please verify your email before signing in"
])

export function getAuthHealth(_req: Request, res: Response) {
  res.status(200).json({ module: "auth", status: "ok" })
}

export async function registerHandler(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await register(parsed.data)
    return res.status(201).json({ success: true, message: result.message })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed"
    const status = message === "Email already registered" ? 409 : 400
    return res.status(status).json({ success: false, message })
  }
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await login(parsed.data)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed"
    const status = LOGIN_FORBIDDEN_MESSAGES.has(message) ? 403 : 401
    return res.status(status).json({ success: false, message })
  }
}

export async function meHandler(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" })
  }

  const user = await getCurrentUser(req.userId)
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  return res.status(200).json({ success: true, data: user })
}

export function logoutHandler(_req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  })
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  await forgotPassword(parsed.data)

  return res.status(200).json({
    success: true,
    message: "If this email exists, a reset link has been sent."
  })
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    await resetPassword(parsed.data)
    return res.status(200).json({
      success: true,
      message: "Password reset successful"
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset password failed"
    const status = message === "Invalid or expired reset token" ? 400 : 500
    return res.status(status).json({ success: false, message })
  }
}

export function googleAuthStartHandler(req: Request, res: Response) {
  const parsed = googleOAuthQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const authorizationUrl = buildGoogleAuthorizationUrl(parsed.data.next)
    return res.redirect(authorizationUrl)
  } catch {
    return res.status(503).json({
      success: false,
      message: "Google sign-in is temporarily unavailable"
    })
  }
}

export async function googleAuthCallbackHandler(req: Request, res: Response) {
  const { code, state } = req.query
  const result = await handleGoogleOAuthCallback(
    typeof code === 'string' ? code : undefined,
    typeof state === 'string' ? state : undefined
  )

  return res.redirect(result.redirectUrl)
}

export async function oauthExchangeHandler(req: Request, res: Response) {
  const parsed = oauthExchangeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await exchangeOAuthHandoffCode(parsed.data.code)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Exchange failed'
    const status = message === 'Invalid or expired code' ? 400 : 500
    return res.status(status).json({ success: false, message })
  }
}

export async function verifyEmailHandler(req: Request, res: Response) {
  const parsed = verifyEmailQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.redirect(buildLoginVerifiedRedirectUrl(false))
  }

  const verified = await verifyEmailByToken(parsed.data.token)
  return res.redirect(buildLoginVerifiedRedirectUrl(verified))
}

export async function resendVerificationHandler(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  await resendVerificationEmail(req.userId)

  return res.status(200).json({
    success: true,
    message: 'If your email is unverified, a new verification link has been sent.'
  })
}

// Unauthenticated companion to resendVerificationHandler: required because a
// user who cannot pass email verification can no longer obtain a session
// token to call the authenticated endpoint above once login enforces
// verification. Mirrors forgotPasswordHandler's non-enumerating response.
export async function resendVerificationByEmailHandler(req: Request, res: Response) {
  const parsed = resendVerificationEmailSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  await resendVerificationEmailByAddress(parsed.data.email)

  return res.status(200).json({
    success: true,
    message: 'If this email exists and is unverified, a new verification link has been sent.'
  })
}

