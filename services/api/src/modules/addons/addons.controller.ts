import type { Request, Response } from 'express'
import { AppError } from '../../common/errors/app-error'
import {
  createAddon,
  deleteAddon,
  getAddonById,
  listAddons,
  updateAddon
} from './addons.service'
import {
  addonIdParamsSchema,
  createAddonSchema,
  listAddonsQuerySchema,
  updateAddonSchema
} from './addons.validator'

export async function listAddonsHandler(req: Request, res: Response) {
  const parsed = listAddonsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await listAddons(parsed.data)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function getAddonByIdHandler(req: Request, res: Response) {
  const parsed = addonIdParamsSchema.safeParse(req.params)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await getAddonById(parsed.data.id)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createAddonHandler(req: Request, res: Response) {
  const parsed = createAddonSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await createAddon(parsed.data)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateAddonHandler(req: Request, res: Response) {
  const parsedParams = addonIdParamsSchema.safeParse(req.params)
  if (!parsedParams.success) {
    return res.status(400).json({ success: false, errors: parsedParams.error.flatten() })
  }

  const parsedBody = updateAddonSchema.safeParse(req.body)
  if (!parsedBody.success) {
    return res.status(400).json({ success: false, errors: parsedBody.error.flatten() })
  }

  try {
    const result = await updateAddon(parsedParams.data.id, parsedBody.data)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteAddonHandler(req: Request, res: Response) {
  const parsed = addonIdParamsSchema.safeParse(req.params)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    await deleteAddon(parsed.data.id)
    return res.status(200).json({ success: true, message: 'Addon deleted successfully' })
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
