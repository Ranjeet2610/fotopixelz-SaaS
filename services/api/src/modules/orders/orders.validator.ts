import { z } from 'zod'

const orderStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'AI_PROCESSING',
  'EDITOR_ASSIGNED',
  'EDITING_IN_PROGRESS',
  'QA_PENDING',
  'QA_REJECTED',
  'CLIENT_REVIEW',
  'REVISION_REQUESTED',
  'APPROVED',
  'DELIVERED',
  'COMPLETED',
  'CANCELED'
])

export const orderIdParamsSchema = z.object({
  orderId: z.string().min(1)
})

export const listOrdersQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: orderStatusSchema.optional(),
  createdById: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
})

export const orderItemInputSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().min(1).optional()
})

export const createOrderSchema = z.object({
  organizationId: z.string().min(1),
  title: z.string().trim().min(2),
  status: orderStatusSchema.default('DRAFT'),
  currency: z.string().trim().length(3).default('USD'),
  dueAt: z.coerce.date().optional().nullable(),
  items: z.array(orderItemInputSchema).optional()
})

export const updateOrderSchema = z
  .object({
    organizationId: z.string().min(1).optional(),
    title: z.string().trim().min(2).optional(),
    status: orderStatusSchema.optional(),
    totalAmount: z.coerce.number().nonnegative().optional(),
    currency: z.string().trim().length(3).optional(),
    dueAt: z.coerce.date().optional().nullable(),
    items: z.array(orderItemInputSchema).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })
