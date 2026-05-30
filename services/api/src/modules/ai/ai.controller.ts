import type { Request, Response } from 'express'
import { getAiStatus } from './ai.service'

export function getAiHealth(_req: Request, res: Response) {
  res.status(200).json(getAiStatus())
}

