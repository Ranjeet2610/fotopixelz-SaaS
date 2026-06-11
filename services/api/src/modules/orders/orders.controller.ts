import type { Request, Response } from 'express'
import { AppError } from '../../common/errors/app-error'
import {
  assignEditor,
  assignQa,
  createOrder,
  deleteOrder,
  getOrder,
  getOrdersStatus,
  listOrders,
  requestOrderRevision,
  submitOrder,
  updateOrder,
  updateOrderStatus
} from './orders.service'
import {
  assignEditorSchema,
  assignQaSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamsSchema,
  requestOrderRevisionSchema,
  updateOrderSchema,
  updateOrderStatusSchema
} from './orders.validator'
import type { RequestContext } from './orders.types'

export function getOrdersHealth(_req: Request, res: Response) {
  res.status(200).json(getOrdersStatus())
}

export async function createOrderHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = createOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const order = await createOrder(context, parsed.data)
    return res.status(201).json({ success: true, data: order })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function listOrdersHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = listOrdersQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const orders = await listOrders(context, parsed.data)
    return res.status(200).json({ success: true, data: orders })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function getOrderHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = orderIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const order = await getOrder(context, params.data.id)
    return res.status(200).json({ success: true, data: order })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateOrderHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = orderIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const parsed = updateOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const order = await updateOrder(context, params.data.id, parsed.data)
    return res.status(200).json({ success: true, data: order })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteOrderHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = orderIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    await deleteOrder(context, params.data.id)
    return res.status(200).json({ success: true, message: 'Order deleted successfully' })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function submitOrderHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = orderIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const result = await submitOrder(context, params.data.id)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateOrderStatusHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = updateOrderStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const order = await updateOrderStatus(context, parsed.data)
    return res.status(200).json({ success: true, data: order })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function assignEditorHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = assignEditorSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const order = await assignEditor(context, parsed.data)
    return res.status(200).json({ success: true, data: order })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function requestOrderRevisionHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = requestOrderRevisionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const order = await requestOrderRevision(context, parsed.data)
    return res.status(200).json({ success: true, data: order })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function assignQaHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = assignQaSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const order = await assignQa(context, parsed.data)
    return res.status(200).json({ success: true, data: order })
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
