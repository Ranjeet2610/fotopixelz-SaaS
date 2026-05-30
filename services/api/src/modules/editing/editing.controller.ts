import type { Request, Response } from 'express'
import { getEditingStatus } from './editing.service'

export function getEditingHealth(_req: Request, res: Response) {
  res.status(200).json(getEditingStatus())
}

