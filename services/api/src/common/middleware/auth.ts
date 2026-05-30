import type { Request, Response, NextFunction } from 'express'
import type { Role } from '@repo/auth/roles'

function parseRole(value: string | undefined): Role | undefined {
  if (!value) return undefined
  const upper = value.toUpperCase()
  if (upper === 'CLIENT' || upper === 'EDITOR' || upper === 'QA' || upper === 'ADMIN' || upper === 'SUPER_ADMIN') {
    return upper
  }
  return undefined
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const role = parseRole(req.header('x-user-role') ?? undefined)
  const userId = req.header('x-user-id') ?? undefined

  if (!userId || !role) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  req.userId = userId
  req.role = role
  next()
}
