import type { Request, Response } from 'express'
import { getOrganizationsStatus } from './organizations.service'

export function getOrganizationsHealth(_req: Request, res: Response) {
  res.status(200).json(getOrganizationsStatus())
}

