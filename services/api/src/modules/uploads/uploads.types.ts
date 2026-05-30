import type { Role } from '@repo/auth/roles'
import type { z } from 'zod'
import type {
  createUploadSchema,
  listUploadsQuerySchema,
  updateUploadSchema
} from './uploads.validator'

export type RequestContext = {
  userId: string
  role: Role
}

export type CreateUploadInput = z.infer<typeof createUploadSchema>
export type UpdateUploadInput = z.infer<typeof updateUploadSchema>
export type ListUploadsQuery = z.infer<typeof listUploadsQuerySchema>
