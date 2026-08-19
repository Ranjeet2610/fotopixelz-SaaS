import type { Prisma } from '@prisma/client'
import { requireRole } from '@repo/auth'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import { createUploadStorageKey, getStorageService, storageConfig } from '../../integrations/storage'
import { isPreviewableImage } from './upload-image-utils'
import type {
  CompleteUploadInput,
  CreateBatchUploadInput,
  CreateUploadInput,
  CreateZipUploadInput,
  ListUploadsQuery,
  PresignedUrlInput,
  RequestContext,
  UploadDTO
} from './uploads.types'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const

const uploadSelect = {
  id: true,
  organizationId: true,
  userId: true,
  orderId: true,
  originalName: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  storageProvider: true,
  storageKey: true,
  storageUrl: true,
  status: true,
  createdAt: true,
  updatedAt: true
} as const

function isAdmin(context: RequestContext) {
  return requireRole(context.role, ADMIN_ROLES)
}

export function getUploadsStatus() {
  return { module: 'uploads', status: 'ok' as const }
}

export async function listUploads(context: RequestContext, query: ListUploadsQuery) {
  const skip = (query.page - 1) * query.limit
  const where = await buildListWhere(context, query)

  const [items, total] = await prisma.$transaction([
    prisma.upload.findMany({
      where,
      select: uploadSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit
    }),
    prisma.upload.count({ where })
  ])

  return {
    items,
    page: query.page,
    limit: query.limit,
    total
  }
}

export async function listUploadsByOrder(context: RequestContext, orderId: string) {
  await ensureCanAccessOrderUploads(context, orderId)
  const where = await buildListWhere(context, { orderId, page: 1, limit: 100 })

  return prisma.upload.findMany({
    where,
    select: uploadSelect,
    orderBy: { createdAt: 'desc' }
  })
}

export async function getUpload(context: RequestContext, uploadId: string): Promise<UploadDTO> {
  const upload = await prisma.upload.findFirst({
    where: {
      id: uploadId,
      status: { not: 'DELETED' }
    },
    select: uploadSelect
  })

  if (!upload) {
    throw new AppError(404, 'Upload not found')
  }

  await ensureCanAccessUploadRecord(context, upload)

  return upload
}

export async function getUploadPreviewUrl(context: RequestContext, uploadId: string) {
  const upload = await prisma.upload.findFirst({
    where: {
      id: uploadId,
      status: { not: 'DELETED' }
    },
    select: uploadSelect
  })

  if (!upload) {
    throw new AppError(404, 'Upload not found')
  }

  await ensureCanAccessUploadRecord(context, upload)

  if (upload.status !== 'UPLOADED') {
    throw new AppError(400, 'Preview is only available for uploaded files')
  }

  if (!isPreviewableImage(upload.mimeType, upload.fileName)) {
    throw new AppError(400, 'Preview is not available for this file type')
  }

  const storage = getStorageService()
  const signed = await storage.createPresignedGetUrl({
    storageKey: upload.storageKey,
    expiresInSeconds: storageConfig.downloadExpirySeconds
  })

  return {
    previewUrl: signed.downloadUrl,
    expiresIn: signed.expiresInSeconds,
    fileName: upload.fileName,
    mimeType: upload.mimeType
  }
}

export async function createUpload(context: RequestContext, input: CreateUploadInput): Promise<UploadDTO> {
  await ensureOrganizationAccess(context, input.organizationId)

  return prisma.upload.create({
    data: {
      organizationId: input.organizationId,
      userId: context.userId,
      orderId: input.orderId ?? null,
      originalName: input.originalName,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storageProvider: input.storageProvider,
      storageKey: input.storageKey,
      storageUrl: input.storageUrl ?? null,
      status: input.status
    },
    select: uploadSelect
  })
}

export async function createBatchUploads(context: RequestContext, input: CreateBatchUploadInput) {
  await ensureOrganizationAccess(context, input.organizationId)

  const uploads = await prisma.$transaction(
    input.uploads.map((upload) =>
      prisma.upload.create({
        data: {
          organizationId: input.organizationId,
          userId: context.userId,
          orderId: upload.orderId ?? null,
          originalName: upload.originalName,
          fileName: upload.fileName,
          mimeType: upload.mimeType,
          fileSize: upload.fileSize,
          storageProvider: upload.storageProvider,
          storageKey: upload.storageKey,
          storageUrl: upload.storageUrl ?? null,
          status: 'PENDING'
        },
        select: uploadSelect
      })
    )
  )

  return {
    count: uploads.length,
    uploads
  }
}

export async function createZipUpload(context: RequestContext, input: CreateZipUploadInput) {
  return createUpload(context, input)
}

export async function createPresignedUrl(context: RequestContext, input: PresignedUrlInput) {
  await ensureOrganizationAccess(context, input.organizationId)

  if (!input.orderId) {
    throw new AppError(400, 'orderId is required for presigned uploads')
  }

  const storage = getStorageService()
  const storageKey = createUploadStorageKey({
    organizationId: input.organizationId,
    orderId: input.orderId,
    fileName: input.fileName
  })

  const presigned = await storage.createPresignedPutUrl({
    storageKey,
    mimeType: input.mimeType,
    expiresInSeconds: storageConfig.uploadExpirySeconds
  })

  const upload = await prisma.upload.create({
    data: {
      organizationId: input.organizationId,
      userId: context.userId,
      orderId: input.orderId,
      originalName: input.originalName,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      storageProvider: storage.provider,
      storageKey: presigned.storageKey,
      storageUrl: presigned.storageUrl,
      status: 'PENDING'
    },
    select: uploadSelect
  })

  return {
    upload,
    presigned: {
      provider: presigned.provider,
      method: 'PUT' as const,
      uploadUrl: presigned.uploadUrl,
      storageKey: presigned.storageKey,
      storageUrl: presigned.storageUrl,
      bucket: presigned.bucket,
      expiresInSeconds: presigned.expiresInSeconds,
      headers: presigned.headers
    }
  }
}

export async function completeUpload(context: RequestContext, input: CompleteUploadInput) {
  const upload = await getUpload(context, input.uploadId)

  if (upload.status === 'UPLOADED') {
    return upload
  }

  const storageKey = input.storageKey ?? upload.storageKey
  const storage = getStorageService()
  const head = await storage.headObject(storageKey)
  const verified = head.exists && head.contentLength > 0

  return prisma.upload.update({
    where: { id: upload.id },
    data: {
      status: verified ? 'UPLOADED' : 'FAILED',
      storageKey,
      storageUrl: input.storageUrl ?? upload.storageUrl ?? storage.getObjectUrl(storageKey),
      ...(verified && head.contentLength > 0 ? { fileSize: head.contentLength } : {})
    },
    select: uploadSelect
  })
}

export async function deleteUpload(context: RequestContext, uploadId: string) {
  const upload = await getUpload(context, uploadId)

  if (upload.status === 'UPLOADED' && upload.storageKey) {
    try {
      const storage = getStorageService()
      await storage.deleteObject(upload.storageKey)
    } catch {
      // Keep soft-delete even if remote object removal fails.
    }
  }

  await prisma.upload.update({
    where: { id: upload.id },
    data: { status: 'DELETED' }
  })
}

async function buildListWhere(context: RequestContext, query: ListUploadsQuery): Promise<Prisma.UploadWhereInput> {
  const base: Prisma.UploadWhereInput = {
    status: query.status ?? { not: 'DELETED' },
    ...(query.orderId ? { orderId: query.orderId } : {})
  }

  if (isAdmin(context)) {
    return {
      ...base,
      ...(query.organizationId ? { organizationId: query.organizationId } : {})
    }
  }

  if (query.orderId && (context.role === 'EDITOR' || context.role === 'QA')) {
    const order = await prisma.order.findFirst({
      where: {
        id: query.orderId,
        isDeleted: false
      },
      select: {
        assignedEditorId: true,
        assignedQaId: true
      }
    })

    if (context.role === 'EDITOR' && order?.assignedEditorId === context.userId) {
      return base
    }

    if (context.role === 'QA' && order?.assignedQaId === context.userId) {
      return base
    }
  }

  if (query.organizationId) {
    await ensureOrganizationAccess(context, query.organizationId)
    return {
      ...base,
      organizationId: query.organizationId
    }
  }

  const organizationIds = await getUserOrganizationIds(context.userId)
  return {
    ...base,
    organizationId: { in: organizationIds }
  }
}

async function ensureCanAccessOrderUploads(context: RequestContext, orderId: string) {
  if (isAdmin(context)) {
    return
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      isDeleted: false
    },
    select: {
      id: true,
      organizationId: true,
      assignedEditorId: true,
      assignedQaId: true
    }
  })

  if (!order) {
    throw new AppError(404, 'Order not found')
  }

  if (context.role === 'EDITOR' && order.assignedEditorId === context.userId) {
    return
  }

  if (context.role === 'QA' && order.assignedQaId === context.userId) {
    return
  }

  await ensureOrganizationMembership(context, order.organizationId)
}

async function ensureCanAccessUploadRecord(
  context: RequestContext,
  upload: Pick<UploadDTO, 'organizationId' | 'orderId'>
) {
  if (isAdmin(context)) {
    return
  }

  if (upload.orderId && (context.role === 'EDITOR' || context.role === 'QA')) {
    const order = await prisma.order.findFirst({
      where: {
        id: upload.orderId,
        isDeleted: false
      },
      select: {
        assignedEditorId: true,
        assignedQaId: true
      }
    })

    if (context.role === 'EDITOR' && order?.assignedEditorId === context.userId) {
      return
    }

    if (context.role === 'QA' && order?.assignedQaId === context.userId) {
      return
    }
  }

  await ensureOrganizationMembership(context, upload.organizationId)
}

async function ensureOrganizationMembership(context: RequestContext, organizationId: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      organizationId,
      userId: context.userId
    },
    select: { id: true }
  })

  if (!membership) {
    throw new AppError(403, 'Forbidden')
  }
}

async function ensureUploadAccess(context: RequestContext, organizationId: string) {
  if (isAdmin(context)) {
    return
  }

  await ensureOrganizationMembership(context, organizationId)
}

async function ensureOrganizationAccess(context: RequestContext, organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true }
  })

  if (!organization) {
    throw new AppError(404, 'Organization not found')
  }

  await ensureUploadAccess(context, organizationId)
}

async function getUserOrganizationIds(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: { organizationId: true }
  })

  return memberships.map((membership) => membership.organizationId)
}
