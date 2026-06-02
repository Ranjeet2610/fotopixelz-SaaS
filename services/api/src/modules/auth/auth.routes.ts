import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import {
  forgotPasswordHandler,
  getAuthHealth,
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
  resetPasswordHandler
} from './auth.controller'

const authRouter = Router()

authRouter.get('/health', getAuthHealth)
authRouter.post('/register', registerHandler)
authRouter.post('/login', loginHandler)
authRouter.post('/forgot-password', forgotPasswordHandler)
authRouter.post('/reset-password', resetPasswordHandler)
authRouter.get('/me', requireAuth, meHandler)
authRouter.post('/logout', requireAuth, logoutHandler)

export default authRouter
