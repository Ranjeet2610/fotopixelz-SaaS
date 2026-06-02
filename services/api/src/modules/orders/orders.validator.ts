import { z } from 'zod'

export const orderStatusSchema = z.enum([
  'DRAFT',
  'UPLOADED',
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'READY_FOR_QA',
  'REVISION_REQUIRED',
  'APPROVED',
  'DELIVERED',
  'CANCELLED'
])

export const orderPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
export const orderScopeSchema = z.enum(['client', 'editor', 'admin'])

export const orderIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const listOrdersQuerySchema = z.object({
  scope: orderScopeSchema.optional(),
  organizationId: z.string().min(1).optional(),
  status: orderStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
})

export const createOrderSchema = z.object({
  organizationId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  title: z.string().trim().min(2),
  instructions: z.string().trim().min(1).optional(),
  totalImages: z.coerce.number().int().nonnegative().default(0),
  creditsUsed: z.coerce.number().int().nonnegative().default(0),
  totalAmount: z.coerce.number().nonnegative().optional(),
  priority: orderPrioritySchema.default('NORMAL'),
  dueDate: z.coerce.date().optional().nullable()
})

export const updateOrderSchema = z
  .object({
    categoryId: z.string().min(1).nullable().optional(),
    title: z.string().trim().min(2).optional(),
    instructions: z.string().trim().min(1).nullable().optional(),
    totalImages: z.coerce.number().int().nonnegative().optional(),
    creditsUsed: z.coerce.number().int().nonnegative().optional(),
    totalAmount: z.coerce.number().nonnegative().optional(),
    priority: orderPrioritySchema.optional(),
    dueDate: z.coerce.date().optional().nullable()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: orderStatusSchema
})

export const assignEditorSchema = z.object({
  orderId: z.string().min(1),
  editorId: z.string().min(1)
})

export const assignQaSchema = z.object({
  orderId: z.string().min(1),
  qaId: z.string().min(1)
})
