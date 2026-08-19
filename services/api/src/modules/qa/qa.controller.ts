import type { Request, Response } from 'express'
import { getQaStatus } from './qa.service'

export function getQaHealth(_req: Request, res: Response) {
  res.status(200).json(getQaStatus())
}

