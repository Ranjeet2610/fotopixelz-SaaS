import type { Request, Response } from 'express'
import { getAuditLogsHealth } from './audit-logs.service'

export function getAuditLogsStatus(_req: Request, res: Response) {
  res.status(200).json(getAuditLogsHealth())
}
