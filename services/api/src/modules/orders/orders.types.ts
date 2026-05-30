import type { Role } from '@repo/auth/roles'
import type { z } from 'zod'
import type {
  createOrderSchema,
  listOrdersQuerySchema,
  orderItemInputSchema,
  updateOrderSchema
} from './orders.validator'

export type RequestContext = {
  userId: string
  role: Role
}

export type OrderItemInput = z.infer<typeof orderItemInputSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>
