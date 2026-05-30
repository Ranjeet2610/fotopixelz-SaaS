import type { Request, Response } from 'express'
import { getPricingStatus } from './pricing.service'

export function getPricingHealth(_req: Request, res: Response) {
  res.status(200).json(getPricingStatus())
}

