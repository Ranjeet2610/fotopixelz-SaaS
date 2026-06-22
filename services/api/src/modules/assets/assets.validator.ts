import { z } from 'zod'

export const assetStatusSchema = z.enum(['PENDING', 'PROCESSING', 'READY', 'DELIVERED', 'ARCHIVED'])
export const storageProviderSchema = z.enum(['AWS_S3', 'CLOUDFLARE_R2'])

export const assetIdParamsSchema = z.object({
  assetId: z.string().min(1)
})

export const assetVersionParamsSchema = assetIdParamsSchema.extend({
  versionId: z.string().min(1)
})

export const listAssetsQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
  status: assetStatusSchema.optional(),
  isCurrent: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  reviewRound: z.coerce.number().int().positive().optional(),
  version: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
})

export const createAssetSchema = z.object({
  organizationId: z.string().min(1),
  orderId: z.string().min(1),
  uploadId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  storageProvider: storageProviderSchema.default('AWS_S3'),
  storageKey: z.string().trim().min(1),
  storageUrl: z.string().trim().url().optional(),
  status: assetStatusSchema.default('PENDING')
})

export const updateAssetSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: assetStatusSchema.optional(),
  storageKey: z.string().trim().min(1).optional(),
  storageUrl: z.string().trim().url().nullable().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required'
})

export const createAssetVersionSchema = z.object({
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  storageProvider: storageProviderSchema.default('AWS_S3'),
  storageKey: z.string().trim().min(1),
  storageUrl: z.string().trim().url().optional(),
  notes: z.string().trim().min(1).optional()
})

export const deliverablePresignedUrlSchema = z.object({
  organizationId: z.string().min(1),
  orderId: z.string().min(1),
  uploadId: z.string().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  fileSize: z.number().int().nonnegative(),
  replacesAssetId: z.string().min(1).optional()
})

export const completeDeliverableSchema = z.object({
  assetId: z.string().min(1),
  storageKey: z.string().trim().min(1).optional(),
  storageUrl: z.string().trim().url().optional()
})

export const updateAssetVersionSchema = z.object({
  fileName: z.string().trim().min(1).optional(),
  mimeType: z.string().trim().min(1).optional(),
  storageProvider: storageProviderSchema.optional(),
  storageKey: z.string().trim().min(1).optional(),
  storageUrl: z.string().trim().url().nullable().optional(),
  notes: z.string().trim().min(1).nullable().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required'
})
