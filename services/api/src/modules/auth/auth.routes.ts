import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import { authMutationRateLimiter, googleOAuthRateLimiter } from './auth-rate-limit'
import {
  forgotPasswordHandler,
  getAuthHealth,
  googleAuthCallbackHandler,
  googleAuthStartHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  oauthExchangeHandler,
  registerHandler,
  resendVerificationByEmailHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  verifyEmailHandler
} from './auth.controller'

const authRouter = Router()

authRouter.get('/health', getAuthHealth)
authRouter.get('/google', googleOAuthRateLimiter, googleAuthStartHandler)
authRouter.get('/google/callback', googleOAuthRateLimiter, googleAuthCallbackHandler)
authRouter.post('/oauth/exchange', authMutationRateLimiter, oauthExchangeHandler)
authRouter.get('/verify-email', authMutationRateLimiter, verifyEmailHandler)
authRouter.post('/register', authMutationRateLimiter, registerHandler)
authRouter.post('/login', authMutationRateLimiter, loginHandler)
authRouter.post('/forgot-password', authMutationRateLimiter, forgotPasswordHandler)
authRouter.post('/reset-password', authMutationRateLimiter, resetPasswordHandler)
authRouter.post('/resend-verification', authMutationRateLimiter, requireAuth, resendVerificationHandler)
authRouter.post('/resend-verification-email', authMutationRateLimiter, resendVerificationByEmailHandler)
authRouter.get('/me', requireAuth, meHandler)
authRouter.post('/logout', requireAuth, logoutHandler)

export default authRouter
