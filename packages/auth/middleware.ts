import type { NextFunction, Request, Response } from 'express'
import { requireRole } from './guards'
import type { AuthUser } from './tokens'
import { verifyAccessToken } from './tokens'
import type { Role } from './roles'

const ADMIN_ROLES: readonly Role[] = ['ADMIN', 'SUPER_ADMIN']

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
      userId?: string
      role?: Role
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const token = authHeader.replace('Bearer ', '').trim()
  const secret = process.env.JWT_ACCESS_SECRET

  if (!secret) {
    return res.status(500).json({
      success: false,
      message: 'JWT_ACCESS_SECRET is missing'
    })
  }

  try {
    const decoded = verifyAccessToken(token, secret)
    const userId = decoded.sub
    const role = decoded.role

    if (!userId || !role) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    const user: AuthUser = {
      id: userId,
      email: decoded.email,
      role
    }

    req.user = user
    req.userId = user.id
    req.role = role

    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.role

  if (!role || !requireRole(role, ADMIN_ROLES)) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  next()
}
