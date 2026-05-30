import type { Request, Response } from 'express'
import type { Role } from '@repo/auth/roles'
import { AppError } from '../../common/errors/app-error'
import {
  createUploadSchema,
  listUploadsQuerySchema,
  updateUploadSchema,
  uploadIdParamsSchema
} from './uploads.validator'
import {
  createUpload,
  deleteUpload,
  getUpload,
  getUploadsStatus,
  listUploads,
  updateUpload
} from './uploads.service'
import type { RequestContext } from './uploads.types'

export function getUploadsHealth(_req: Request, res: Response) {
  res.status(200).json(getUploadsStatus())
}

export async function listUploadsHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = listUploadsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const uploads = await listUploads(context, parsed.data)
    return res.status(200).json({ success: true, data: uploads })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function getUploadHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = uploadIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const upload = await getUpload(context, params.data.uploadId)
    return res.status(200).json({ success: true, data: upload })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createUploadHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = createUploadSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const upload = await createUpload(context, parsed.data)
    return res.status(201).json({ success: true, data: upload })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateUploadHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = uploadIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const parsed = updateUploadSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const upload = await updateUpload(context, params.data.uploadId, parsed.data)
    return res.status(200).json({ success: true, data: upload })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteUploadHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = uploadIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    await deleteUpload(context, params.data.uploadId)
    return res.status(204).send()
  } catch (error) {
    return sendError(res, error)
  }
}

function requestContext(req: Request): RequestContext | undefined {
  if (!req.userId || !req.role) {
    return undefined
  }

  return {
    userId: req.userId,
    role: req.role as Role
  }
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message })
  }

  const message = error instanceof Error ? error.message : 'Internal server error'
  return res.status(500).json({ success: false, message })
}
