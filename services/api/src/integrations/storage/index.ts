import { AppError } from '../../common/errors/app-error'
import { assertStorageConfig, storageConfig } from './config'
import { S3CompatibleStorageProvider } from './s3-compatible-provider'
import type { StorageService } from './types'

let storageService: StorageService | undefined

export function getStorageService(): StorageService {
  if (storageService) {
    return storageService
  }

  try {
    assertStorageConfig()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Storage is not configured'
    throw new AppError(503, message)
  }

  if (storageConfig.provider === 'S3') {
    storageService = new S3CompatibleStorageProvider({
      provider: 'AWS_S3',
      bucket: storageConfig.s3.bucket,
      region: storageConfig.s3.region,
      endpoint: storageConfig.s3.endpoint,
      accessKeyId: storageConfig.s3.accessKeyId,
      secretAccessKey: storageConfig.s3.secretAccessKey,
      publicUrl: storageConfig.s3.publicUrl
    })
  } else {
    storageService = new S3CompatibleStorageProvider({
      provider: 'CLOUDFLARE_R2',
      bucket: storageConfig.r2.bucket,
      region: 'auto',
      endpoint: `https://${storageConfig.r2.accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      accessKeyId: storageConfig.r2.accessKeyId,
      secretAccessKey: storageConfig.r2.secretAccessKey,
      publicUrl: storageConfig.r2.publicUrl
    })
  }

  return storageService
}

export { createCommentAttachmentStorageKey, createDeliverableStorageKey, createUploadStorageKey, sanitizeFileName } from './keys'
export { storageConfig } from './config'
export type {
  ObjectHeadResult,
  PresignedGetResult,
  PresignedPutResult,
  PrismaStorageProvider,
  StorageProviderKind,
  StorageService
} from './types'
