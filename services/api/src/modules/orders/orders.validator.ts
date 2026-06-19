import { z } from 'zod'

export const orderStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
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
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
})

export const orderItemInputSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().min(1).optional()
})

export const orderAddonInputSchema = z.object({
  addonId: z.string().min(1),
  quantity: z.coerce.number().int().positive().optional()
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
  dueDate: z.coerce.date().optional().nullable(),
  items: z.array(orderItemInputSchema).optional(),
  addons: z.array(orderAddonInputSchema).optional()
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
    dueDate: z.coerce.date().optional().nullable(),
    items: z.array(orderItemInputSchema).optional(),
    addons: z.array(orderAddonInputSchema).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

export const updateOrderStatusSchema = z
  .object({
    orderId: z.string().min(1),
    status: orderStatusSchema,
    revisionTitle: z.string().trim().min(1).max(120).optional(),
    revisionComment: z.string().trim().min(1).max(2000).optional(),
    assetId: z.string().min(1).optional(),
    attachmentStorageKey: z.string().min(1).optional(),
    attachmentFileName: z.string().min(1).optional(),
    attachmentMimeType: z.string().min(1).optional()
  })
  .superRefine((value, ctx) => {
    if (value.status === 'REVISION_REQUIRED') {
      ctx.addIssue({
        code: 'custom',
        message: 'Use POST /orders/request-revision to request changes',
        path: ['status']
      })
    }
  })

export const assignEditorSchema = z.object({
  orderId: z.string().min(1),
  editorId: z.string().min(1)
})

export const assignQaSchema = z.object({
  orderId: z.string().min(1),
  qaId: z.string().min(1)
})

export const requestOrderRevisionSchema = z.object({
  orderId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  comment: z.string().trim().min(1).max(2000),
  assetId: z.string().min(1).optional(),
  attachmentStorageKey: z.string().min(1).optional(),
  attachmentFileName: z.string().min(1).optional(),
  attachmentMimeType: z.string().min(1).optional()
})
