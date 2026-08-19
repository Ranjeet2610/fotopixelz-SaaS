import type { Request, Response } from 'express'
import { getNotificationsStatus } from './notifications.service'

export function getNotificationsHealth(_req: Request, res: Response) {
  res.status(200).json(getNotificationsStatus())
}

