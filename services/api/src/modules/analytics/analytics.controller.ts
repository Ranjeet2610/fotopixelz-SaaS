import type { Request, Response } from 'express'
import { getAnalyticsStatus } from './analytics.service'

export function getAnalyticsHealth(_req: Request, res: Response) {
  res.status(200).json(getAnalyticsStatus())
}

