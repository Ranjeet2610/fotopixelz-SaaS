import type { StorageProviderKind } from './types'

function parseProviderKind(value: string | undefined): StorageProviderKind {
  const normalized = value?.trim().toUpperCase()

  if (normalized === 'S3' || normalized === 'AWS_S3') {
    return 'S3'
  }

  if (normalized === 'R2' || normalized === 'CLOUDFLARE_R2') {
    return 'R2'
  }

  throw new Error('STORAGE_PROVIDER must be S3 or R2')
}

export const storageConfig = {
  get provider() {
    return parseProviderKind(process.env.STORAGE_PROVIDER)
  },
  uploadExpirySeconds: Number(process.env.STORAGE_UPLOAD_EXPIRY_SECONDS ?? 900),
  downloadExpirySeconds: Number(process.env.STORAGE_DOWNLOAD_EXPIRY_SECONDS ?? 300),
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    region: process.env.AWS_REGION ?? '',
    bucket: process.env.AWS_S3_BUCKET ?? '',
    endpoint: process.env.AWS_S3_ENDPOINT,
    publicUrl: process.env.AWS_S3_PUBLIC_URL
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.R2_BUCKET_NAME ?? '',
    publicUrl: process.env.R2_PUBLIC_URL
  }
}

export function assertStorageConfig() {
  if (storageConfig.provider === 'S3') {
    const missing = [
      !storageConfig.s3.accessKeyId ? 'AWS_ACCESS_KEY_ID' : null,
      !storageConfig.s3.secretAccessKey ? 'AWS_SECRET_ACCESS_KEY' : null,
      !storageConfig.s3.region ? 'AWS_REGION' : null,
      !storageConfig.s3.bucket ? 'AWS_S3_BUCKET' : null
    ].filter(Boolean)

    if (missing.length > 0) {
      throw new Error(`Missing S3 storage configuration: ${missing.join(', ')}`)
    }

    return
  }

  const missing = [
    !storageConfig.r2.accountId ? 'R2_ACCOUNT_ID' : null,
    !storageConfig.r2.accessKeyId ? 'R2_ACCESS_KEY_ID' : null,
    !storageConfig.r2.secretAccessKey ? 'R2_SECRET_ACCESS_KEY' : null,
    !storageConfig.r2.bucket ? 'R2_BUCKET_NAME' : null
  ].filter(Boolean)

  if (missing.length > 0) {
    throw new Error(`Missing R2 storage configuration: ${missing.join(', ')}`)
  }
}
