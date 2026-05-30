import type { Request, Response } from 'express'
import { getUploadsStatus } from './uploads.service'

export function getUploadsHealth(_req: Request, res: Response) {
  res.status(200).json(getUploadsStatus())
}

