import type { Request, Response } from 'express'
import { getservicesHealth } from './services.service'

export function getservicesStatus(_req: Request, res: Response) {
  res.status(200).json(getservicesHealth())
}
