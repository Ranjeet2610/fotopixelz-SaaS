import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type {
  ObjectHeadResult,
  PresignedGetResult,
  PresignedPutResult,
  PrismaStorageProvider,
  StorageService
} from './types'

type S3CompatibleProviderOptions = {
  provider: PrismaStorageProvider
  bucket: string
  region: string
  endpoint?: string
  forcePathStyle?: boolean
  accessKeyId: string
  secretAccessKey: string
  publicUrl?: string
}

export class S3CompatibleStorageProvider implements StorageService {
  readonly bucket: string
  readonly provider: PrismaStorageProvider

  private readonly client: S3Client
  private readonly publicUrl?: string

  constructor(options: S3CompatibleProviderOptions) {
    this.bucket = options.bucket
    this.provider = options.provider
    this.publicUrl = options.publicUrl

    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle ?? Boolean(options.endpoint),
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey
      }
    })
  }

  getObjectUrl(storageKey: string) {
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${storageKey}`
    }

    if (this.provider === 'CLOUDFLARE_R2') {
      return `https://${this.bucket}.r2.dev/${storageKey}`
    }

    return `https://${this.bucket}.s3.amazonaws.com/${storageKey}`
  }

  async createPresignedPutUrl(input: {
    storageKey: string
    mimeType: string
    expiresInSeconds: number
  }): Promise<PresignedPutResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.storageKey,
      ContentType: input.mimeType
    })

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds
    })

    return {
      uploadUrl,
      storageKey: input.storageKey,
      bucket: this.bucket,
      provider: this.provider,
      storageUrl: this.getObjectUrl(input.storageKey),
      expiresInSeconds: input.expiresInSeconds,
      headers: {
        'Content-Type': input.mimeType
      }
    }
  }

  async createPresignedGetUrl(input: {
    storageKey: string
    expiresInSeconds: number
    responseContentDisposition?: string
  }): Promise<PresignedGetResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: input.storageKey,
      ...(input.responseContentDisposition
        ? { ResponseContentDisposition: input.responseContentDisposition }
        : {})
    })

    const downloadUrl = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds
    })

    return {
      downloadUrl,
      expiresInSeconds: input.expiresInSeconds
    }
  }

  async headObject(storageKey: string): Promise<ObjectHeadResult> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: storageKey
        })
      )

      return {
        exists: true,
        contentLength: response.ContentLength ?? 0
      }
    } catch (error) {
      const statusCode =
        typeof error === 'object' &&
        error !== null &&
        '$metadata' in error &&
        typeof error.$metadata === 'object' &&
        error.$metadata !== null &&
        'httpStatusCode' in error.$metadata
          ? Number(error.$metadata.httpStatusCode)
          : undefined

      if (statusCode === 404) {
        return { exists: false, contentLength: 0 }
      }

      throw error
    }
  }

  async deleteObject(storageKey: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey
      })
    )
  }
}
