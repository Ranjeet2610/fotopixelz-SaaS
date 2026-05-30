import type { Request, Response, NextFunction } from 'express'
import { requireRole } from '@repo/auth/guards'
import type { Role } from '@repo/auth/roles'

const ADMIN_ROLES: readonly Role[] = ['ADMIN', 'SUPER_ADMIN']

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.role as Role | undefined
  if (!role || !requireRole(role, ADMIN_ROLES)) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  next()
}
