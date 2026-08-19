import type { Request, Response } from 'express'
import { getRevisionsStatus } from './revisions.service'

export function getRevisionsHealth(_req: Request, res: Response) {
  res.status(200).json(getRevisionsStatus())
}

