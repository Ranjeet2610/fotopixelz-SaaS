import type { Request, Response } from 'express'
import { verifyAccessToken } from '@repo/auth'
import { AppError } from '../../common/errors/app-error'
import {
  createService,
  deleteService,
  getServiceById,
  getServicesStatus,
  listServices,
  updateService
} from './services.service'
import {
  createServiceSchema,
  listServicesQuerySchema,
  serviceIdParamsSchema,
  updateServiceSchema
} from './services.validator'

export function getServicesHealth(_req: Request, res: Response) {
  return res.status(200).json(getServicesStatus())
}

export async function listServicesHandler(req: Request, res: Response) {
  const parsed = listServicesQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const includeInactive = parsed.data.includeInactive === true && isRequestAdmin(req)
    const result = await listServices(parsed.data, includeInactive)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function getServiceByIdHandler(req: Request, res: Response) {
  const parsed = serviceIdParamsSchema.safeParse(req.params)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await getServiceById(parsed.data.id, isRequestAdmin(req))
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createServiceHandler(req: Request, res: Response) {
  const parsed = createServiceSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await createService(parsed.data)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateServiceHandler(req: Request, res: Response) {
  const parsedParams = serviceIdParamsSchema.safeParse(req.params)
  if (!parsedParams.success) {
    return res.status(400).json({ success: false, errors: parsedParams.error.flatten() })
  }

  const parsedBody = updateServiceSchema.safeParse(req.body)
  if (!parsedBody.success) {
    return res.status(400).json({ success: false, errors: parsedBody.error.flatten() })
  }

  try {
    const result = await updateService(parsedParams.data.id, parsedBody.data)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteServiceHandler(req: Request, res: Response) {
  const parsed = serviceIdParamsSchema.safeParse(req.params)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    await deleteService(parsed.data.id)
    return res.status(200).json({ success: true, message: 'Service deactivated successfully' })
  } catch (error) {
    return sendError(res, error)
  }
}

function isRequestAdmin(req: Request) {
  if (req.role === 'ADMIN' || req.role === 'SUPER_ADMIN') {
    return true
  }

  const authHeader = req.header('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }

  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) {
    return false
  }

  try {
    const decoded = verifyAccessToken(authHeader.replace('Bearer ', '').trim(), secret)
    return decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN'
  } catch {
    return false
  }
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message })
  }

  const message = error instanceof Error ? error.message : 'Internal server error'
  return res.status(500).json({ success: false, message })
}
