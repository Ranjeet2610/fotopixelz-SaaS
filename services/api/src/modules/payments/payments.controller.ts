import type { Request, Response } from 'express'
import { getPaymentsStatus } from './payments.service'

export function getPaymentsHealth(_req: Request, res: Response) {
  res.status(200).json(getPaymentsStatus())
}

