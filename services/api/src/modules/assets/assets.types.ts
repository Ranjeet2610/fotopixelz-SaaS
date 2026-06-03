import type { Role } from '@repo/auth'
import type { z } from 'zod'
import type {
  assetIdParamsSchema,
  assetStatusSchema,
  assetVersionParamsSchema,
  createAssetSchema,
  createAssetVersionSchema,
  listAssetsQuerySchema,
  storageProviderSchema,
  updateAssetSchema,
  updateAssetVersionSchema
} from './assets.validator'

export type RequestContext = {
  userId: string
  role: Role
}

export type AssetStatus = z.infer<typeof assetStatusSchema>
export type StorageProvider = z.infer<typeof storageProviderSchema>
export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>
export type CreateAssetVersionInput = z.infer<typeof createAssetVersionSchema>
export type UpdateAssetVersionInput = z.infer<typeof updateAssetVersionSchema>
export type AssetIdParams = z.infer<typeof assetIdParamsSchema>
export type AssetVersionParams = z.infer<typeof assetVersionParamsSchema>
