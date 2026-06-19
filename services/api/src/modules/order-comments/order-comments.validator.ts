import { z } from 'zod'

export const commentTypeSchema = z.enum([
  'GENERAL',
  'REVISION',
  'CLIENT_FEEDBACK',
  'QA_NOTE',
  'INTERNAL_NOTE',
  'SYSTEM'
])

export const commentStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED'])

export const orderIdParamsSchema = z.object({
  orderId: z.string().min(1)
})

export const commentIdParamsSchema = z.object({
  commentId: z.string().min(1)
})

export const listOrderCommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().trim().min(1).optional(),
  userId: z.string().min(1).optional(),
  commentType: commentTypeSchema.optional(),
  status: commentStatusSchema.optional(),
  assetId: z.string().min(1).optional()
})

export const createOrderCommentSchema = z.object({
  orderId: z.string().min(1),
  body: z.string().trim().min(1).max(4000),
  commentType: commentTypeSchema.optional(),
  status: commentStatusSchema.optional(),
  assetId: z.string().min(1).optional(),
  parentId: z.string().min(1).optional(),
  attachmentStorageKey: z.string().min(1).optional(),
  attachmentFileName: z.string().min(1).optional(),
  attachmentMimeType: z.string().min(1).optional(),
  attachmentUrl: z.string().url().optional()
})

export const updateOrderCommentSchema = z
  .object({
    body: z.string().trim().min(1).max(4000).optional(),
    status: commentStatusSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })

export const commentAttachmentPresignedSchema = z.object({
  orderId: z.string().min(1),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1),
  fileSize: z.coerce.number().int().positive().max(25 * 1024 * 1024)
})
