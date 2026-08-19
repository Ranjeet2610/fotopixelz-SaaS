import type { Request, Response } from 'express'
import { AppError } from '../../common/errors/app-error'
import {
  getMe,
  getMyBilling,
  getMyCredits,
  getUsersStatus,
  updateMe,
  updateMyBilling
} from './users.service'
import { updateMeSchema, updateMyBillingSchema } from './users.validator'

export function getUsersHealth(_req: Request, res: Response) {
  res.status(200).json(getUsersStatus())
}

export async function getMeHandler(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  try {
    const me = await getMe(req.userId)
    return res.status(200).json({ success: true, data: me })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateMeHandler(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = updateMeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const me = await updateMe(req.userId, parsed.data)
    return res.status(200).json({ success: true, data: me })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function getMyBillingHandler(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  try {
    const billing = await getMyBilling(req.userId)
    return res.status(200).json({ success: true, data: billing })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateMyBillingHandler(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = updateMyBillingSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const billing = await updateMyBilling(req.userId, parsed.data)
    return res.status(200).json({ success: true, data: billing })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function getMyCreditsHandler(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  try {
    const credits = await getMyCredits(req.userId)
    return res.status(200).json({ success: true, data: credits })
  } catch (error) {
    return sendError(res, error)
  }
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message })
  }

  const message = error instanceof Error ? error.message : 'Internal server error'
  return res.status(500).json({ success: false, message })
}

