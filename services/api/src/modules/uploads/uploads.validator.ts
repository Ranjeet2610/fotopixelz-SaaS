import { z } from 'zod'

export const storageProviderSchema = z.enum(['AWS_S3', 'CLOUDFLARE_R2'])
export const uploadStatusSchema = z.enum(['PENDING', 'UPLOADED', 'FAILED', 'DELETED'])
const activeUploadStatusSchema = z.enum(['PENDING', 'UPLOADED', 'FAILED'])

const uploadMetadataSchema = z.object({
  organizationId: z.string().min(1),
  orderId: z.string().min(1).optional(),
  originalName: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  fileSize: z.number().int().nonnegative(),
  storageProvider: storageProviderSchema.default('AWS_S3'),
  storageKey: z.string().trim().min(1),
  storageUrl: z.string().trim().url().optional(),
  status: activeUploadStatusSchema.default('PENDING')
})

const batchUploadItemSchema = uploadMetadataSchema.omit({
  organizationId: true,
  status: true
})

export const uploadIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const orderUploadsParamsSchema = z.object({
  orderId: z.string().min(1)
})

export const listUploadsQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
  status: activeUploadStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
})

export const createUploadSchema = uploadMetadataSchema

export const createBatchUploadSchema = z.object({
  organizationId: z.string().min(1),
  uploads: z.array(batchUploadItemSchema).min(1).max(100)
})

export const createZipUploadSchema = uploadMetadataSchema.extend({
  mimeType: z
    .enum(['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'])
    .default('application/zip')
})

export const presignedUrlSchema = z.object({
  organizationId: z.string().min(1),
  orderId: z.string().min(1).optional(),
  originalName: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  fileSize: z.number().int().nonnegative(),
  storageProvider: storageProviderSchema.default('AWS_S3')
})

export const completeUploadSchema = z.object({
  uploadId: z.string().min(1),
  storageKey: z.string().trim().min(1).optional(),
  storageUrl: z.string().trim().url().optional()
})
