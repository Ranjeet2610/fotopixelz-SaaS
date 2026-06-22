export type StorageProviderKind = 'S3' | 'R2'

export type PrismaStorageProvider = 'AWS_S3' | 'CLOUDFLARE_R2'

export type ObjectHeadResult = {
  exists: boolean
  contentLength: number
}

export type PresignedPutResult = {
  uploadUrl: string
  storageKey: string
  bucket: string
  provider: PrismaStorageProvider
  storageUrl: string
  expiresInSeconds: number
  headers: Record<string, string>
}

export type PresignedGetResult = {
  downloadUrl: string
  expiresInSeconds: number
}

export interface StorageService {
  readonly bucket: string
  readonly provider: PrismaStorageProvider
  getObjectUrl(storageKey: string): string
  createPresignedPutUrl(input: {
    storageKey: string
    mimeType: string
    expiresInSeconds: number
  }): Promise<PresignedPutResult>
  createPresignedGetUrl(input: {
    storageKey: string
    expiresInSeconds: number
    responseContentDisposition?: string
  }): Promise<PresignedGetResult>
  headObject(storageKey: string): Promise<ObjectHeadResult>
  deleteObject(storageKey: string): Promise<void>
}
