import type { Request, Response } from 'express'
import { AppError } from '../../common/errors/app-error'
import {
  createCommentAttachmentPresignedUrl,
  createOrderComment,
  deleteOrderComment,
  getCommentAttachmentDownloadUrl,
  getOrderCommentsStatus,
  listOrderComments,
  listOrderTimeline,
  updateOrderComment
} from './order-comments.service'
import {
  commentAttachmentPresignedSchema,
  commentIdParamsSchema,
  createOrderCommentSchema,
  listOrderCommentsQuerySchema,
  orderIdParamsSchema,
  updateOrderCommentSchema
} from './order-comments.validator'

function getContext(req: Request) {
  return {
    userId: req.user!.id,
    role: req.user!.role
  }
}

export function getOrderCommentsHealth(_req: Request, res: Response) {
  return res.status(200).json(getOrderCommentsStatus())
}

export async function listOrderCommentsHandler(req: Request, res: Response) {
  const parsedParams = orderIdParamsSchema.safeParse(req.params)
  if (!parsedParams.success) {
    return res.status(400).json({ success: false, errors: parsedParams.error.flatten() })
  }

  const parsedQuery = listOrderCommentsQuerySchema.safeParse(req.query)
  if (!parsedQuery.success) {
    return res.status(400).json({ success: false, errors: parsedQuery.error.flatten() })
  }

  try {
    const result = await listOrderComments(getContext(req), parsedParams.data.orderId, parsedQuery.data)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function listOrderTimelineHandler(req: Request, res: Response) {
  const parsedParams = orderIdParamsSchema.safeParse(req.params)
  if (!parsedParams.success) {
    return res.status(400).json({ success: false, errors: parsedParams.error.flatten() })
  }

  try {
    const result = await listOrderTimeline(getContext(req), parsedParams.data.orderId)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createOrderCommentHandler(req: Request, res: Response) {
  const parsed = createOrderCommentSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await createOrderComment(getContext(req), parsed.data)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateOrderCommentHandler(req: Request, res: Response) {
  const parsedParams = commentIdParamsSchema.safeParse(req.params)
  if (!parsedParams.success) {
    return res.status(400).json({ success: false, errors: parsedParams.error.flatten() })
  }

  const parsedBody = updateOrderCommentSchema.safeParse(req.body)
  if (!parsedBody.success) {
    return res.status(400).json({ success: false, errors: parsedBody.error.flatten() })
  }

  try {
    const result = await updateOrderComment(getContext(req), parsedParams.data.commentId, parsedBody.data)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteOrderCommentHandler(req: Request, res: Response) {
  const parsedParams = commentIdParamsSchema.safeParse(req.params)
  if (!parsedParams.success) {
    return res.status(400).json({ success: false, errors: parsedParams.error.flatten() })
  }

  try {
    const result = await deleteOrderComment(getContext(req), parsedParams.data.commentId)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createCommentAttachmentPresignedHandler(req: Request, res: Response) {
  const parsed = commentAttachmentPresignedSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await createCommentAttachmentPresignedUrl(getContext(req), parsed.data)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function getCommentAttachmentDownloadHandler(req: Request, res: Response) {
  const parsedParams = commentIdParamsSchema.safeParse(req.params)
  if (!parsedParams.success) {
    return res.status(400).json({ success: false, errors: parsedParams.error.flatten() })
  }

  try {
    const result = await getCommentAttachmentDownloadUrl(getContext(req), parsedParams.data.commentId)
    return res.status(200).json({ success: true, data: result })
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
