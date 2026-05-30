import type { Role } from '@repo/auth/roles'
import type { z } from 'zod'
import type {
  createAssetSchema,
  createAssetVersionSchema,
  listAssetsQuerySchema,
  updateAssetSchema,
  updateAssetVersionSchema
} from './assets.validator'

export type RequestContext = {
  userId: string
  role: Role
}

export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>
export type CreateAssetVersionInput = z.infer<typeof createAssetVersionSchema>
export type UpdateAssetVersionInput = z.infer<typeof updateAssetVersionSchema>
