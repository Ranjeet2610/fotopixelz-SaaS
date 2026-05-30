import type { Request, Response } from 'express'
import { getAssetsStatus } from './assets.service'

export function getAssetsHealth(_req: Request, res: Response) {
  res.status(200).json(getAssetsStatus())
}

