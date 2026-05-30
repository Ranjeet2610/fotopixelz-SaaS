import type { Request, Response } from 'express'
import { getOrdersStatus } from './orders.service'

export function getOrdersHealth(_req: Request, res: Response) {
  res.status(200).json(getOrdersStatus())
}

