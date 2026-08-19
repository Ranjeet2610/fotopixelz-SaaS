import type { Role } from '@repo/auth'
import type { z } from 'zod'
import type {
  completeUploadSchema,
  createBatchUploadSchema,
  createUploadSchema,
  createZipUploadSchema,
  listUploadsQuerySchema,
  orderUploadsParamsSchema,
  presignedUrlSchema,
  storageProviderSchema,
  uploadIdParamsSchema,
  uploadStatusSchema
} from './uploads.validator'

export type RequestContext = {
  userId: string
  role: Role
}

export type StorageProvider = z.infer<typeof storageProviderSchema>
export type UploadStatus = z.infer<typeof uploadStatusSchema>

export type UploadDTO = {
  id: string
  organizationId: string
  userId: string
  orderId: string | null
  originalName: string
  fileName: string
  mimeType: string
  fileSize: number
  storageProvider: StorageProvider
  storageKey: string
  storageUrl: string | null
  status: UploadStatus
  createdAt: Date
  updatedAt: Date
}

export type CreateUploadInput = z.infer<typeof createUploadSchema>
export type CreateBatchUploadInput = z.infer<typeof createBatchUploadSchema>
export type CreateZipUploadInput = z.infer<typeof createZipUploadSchema>
export type PresignedUrlInput = z.infer<typeof presignedUrlSchema>
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>
export type ListUploadsQuery = z.infer<typeof listUploadsQuerySchema>
export type UploadIdParams = z.infer<typeof uploadIdParamsSchema>
export type OrderUploadsParams = z.infer<typeof orderUploadsParamsSchema>
