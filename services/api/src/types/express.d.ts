import 'express'
import type { AuthUser, Role } from '@repo/auth'

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
      userId?: string
      role?: Role
    }
  }
}

export {}

