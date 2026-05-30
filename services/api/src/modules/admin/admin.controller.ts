import type { Request, Response } from 'express'
import { getAdminStatus } from './admin.service'

export function getAdminHealth(_req: Request, res: Response) {
  res.status(200).json(getAdminStatus())
}

