import type { Request, Response } from 'express'
import { getworkflowHealth } from './workflow.service'

export function getworkflowStatus(_req: Request, res: Response) {
  res.status(200).json(getworkflowHealth())
}
