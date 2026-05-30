import type { Request, Response } from 'express'
import { getUsersStatus } from './users.service'

export function getUsersHealth(_req: Request, res: Response) {
  res.status(200).json(getUsersStatus())
}

