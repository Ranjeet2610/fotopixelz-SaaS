import type { Request, Response } from 'express'
import { AppError } from '../../common/errors/app-error'
import { getWorkflowStatus, listOrderWorkflowEvents } from './workflow.service'
import { orderWorkflowParamsSchema } from './workflow.validator'
import type { RequestContext } from './workflow.types'

export function getWorkflowHealth(_req: Request, res: Response) {
  res.status(200).json(getWorkflowStatus())
}

export async function listOrderWorkflowEventsHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = orderWorkflowParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const events = await listOrderWorkflowEvents(context, params.data.orderId)
    return res.status(200).json({ success: true, data: events })
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
