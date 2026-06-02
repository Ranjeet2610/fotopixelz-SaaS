import type { Role } from '@repo/auth'
import type { z } from 'zod'
import type {
  assignEditorSchema,
  assignQaSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamsSchema,
  orderPrioritySchema,
  orderStatusSchema,
  updateOrderSchema,
  updateOrderStatusSchema
} from './orders.validator'

export type RequestContext = {
  userId: string
  role: Role
}

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type OrderPriority = z.infer<typeof orderPrioritySchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type AssignEditorInput = z.infer<typeof assignEditorSchema>
export type AssignQaInput = z.infer<typeof assignQaSchema>
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>
