import type { Request, Response } from 'express'
import { AppError } from '../../common/errors/app-error'
import {
  completeUpload,
  createBatchUploads,
  createPresignedUrl,
  createUpload,
  createZipUpload,
  deleteUpload,
  getUpload,
  getUploadsStatus,
  listUploads,
  listUploadsByOrder
} from './uploads.service'
import {
  completeUploadSchema,
  createBatchUploadSchema,
  createUploadSchema,
  createZipUploadSchema,
  listUploadsQuerySchema,
  orderUploadsParamsSchema,
  presignedUrlSchema,
  uploadIdParamsSchema
} from './uploads.validator'
import type { RequestContext } from './uploads.types'

export function getUploadsHealth(_req: Request, res: Response) {
  res.status(200).json(getUploadsStatus())
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

export async function createBatchUploadsHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = createBatchUploadSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await createBatchUploads(context, parsed.data)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createZipUploadHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = createZipUploadSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const upload = await createZipUpload(context, parsed.data)
    return res.status(201).json({ success: true, data: upload })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createPresignedUrlHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = presignedUrlSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await createPresignedUrl(context, parsed.data)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function completeUploadHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = completeUploadSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const upload = await completeUpload(context, parsed.data)
    return res.status(200).json({ success: true, data: upload })
  } catch (error) {
    return sendError(res, error)
  }
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
    const upload = await getUpload(context, params.data.id)
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
    await deleteUpload(context, params.data.id)
    return res.status(200).json({ success: true, message: 'Upload deleted successfully' })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function listUploadsByOrderHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = orderUploadsParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const uploads = await listUploadsByOrder(context, params.data.orderId)
    return res.status(200).json({ success: true, data: uploads })
  } catch (error) {
    return sendError(res, error)
  }
}

function requestContext(req: Request): RequestContext | undefined {
  const userId = req.user?.id ?? req.userId

  if (!userId || !req.role) {
    return undefined
  }

  return {
    userId,
    role: req.role
  }
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message })
  }

  const message = error instanceof Error ? error.message : 'Internal server error'
  return res.status(500).json({ success: false, message })
}
