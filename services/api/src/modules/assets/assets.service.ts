import type { Prisma } from '@prisma/client'
import { requireRole } from '@repo/auth'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import {
  createDeliverableStorageKey,
  getStorageService,
  storageConfig
} from '../../integrations/storage'
import { recordWorkflowEvent } from '../workflow/workflow.service'
import type {
  CompleteDeliverableInput,
  CreateAssetInput,
  CreateAssetVersionInput,
  DeliverablePresignedUrlInput,
  ListAssetsQuery,
  RequestContext,
  UpdateAssetInput,
  UpdateAssetVersionInput
} from './assets.types'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const
const VERSION_MANAGER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'EDITOR', 'QA'] as const

const assetSelect = {
  id: true,
  organizationId: true,
  orderId: true,
  uploadId: true,
  name: true,
  fileName: true,
  mimeType: true,
  storageProvider: true,
  storageKey: true,
  storageUrl: true,
  status: true,
  version: true,
  reviewRound: true,
  isCurrent: true,
  uploadedById: true,
  qaNotes: true,
  replacesAssetId: true,
  createdById: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  uploadedBy: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  order: {
    select: {
      id: true,
      title: true,
      status: true,
      reviewRound: true,
      deliverableVersion: true,
      updatedAt: true,
      organizationId: true,
      createdById: true,
      assignedEditorId: true,
      assignedQaId: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  }
} as const

const versionSelect = {
  id: true,
  assetId: true,
  versionNumber: true,
  fileName: true,
  mimeType: true,
  storageProvider: true,
  storageKey: true,
  storageUrl: true,
  notes: true,
  createdById: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true
} as const

function isAdmin(context: RequestContext) {
  return requireRole(context.role, ADMIN_ROLES)
}

function canManageVersion(context: RequestContext) {
  return requireRole(context.role, VERSION_MANAGER_ROLES)
}

export function getAssetsStatus() {
  return { module: 'assets', status: 'ok' as const }
}

export async function listAssets(context: RequestContext, query: ListAssetsQuery) {
  const where = await buildListWhere(context, query)
  const skip = (query.page - 1) * query.limit

  const [items, total] = await prisma.$transaction([
    prisma.asset.findMany({
      where,
      select: assetSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit
    }),
    prisma.asset.count({ where })
  ])

  return {
    items,
    page: query.page,
    limit: query.limit,
    total
  }
}

export async function getAsset(context: RequestContext, assetId: string) {
  const asset = await findActiveAsset(assetId)
  await ensureCanViewAsset(context, asset)
  return asset
}

export async function createAsset(context: RequestContext, input: CreateAssetInput) {
  const order = await ensureOrderForAsset(input.organizationId, input.orderId)
  await ensureCanCreateAsset(context, order)
  await ensureUploadForAsset(input.organizationId, input.orderId, input.uploadId)

  const asset = await prisma.asset.create({
    data: {
      organizationId: input.organizationId,
      orderId: order.id,
      uploadId: input.uploadId ?? null,
      name: input.name,
      fileName: input.fileName,
      mimeType: input.mimeType,
      storageProvider: input.storageProvider,
      storageKey: input.storageKey,
      storageUrl: input.storageUrl ?? null,
      originalUrl: input.storageUrl ?? null,
      status: input.status,
      createdById: context.userId
    },
    select: assetSelect
  })

  await recordWorkflowEvent({
    orderId: order.id,
    actorId: context.userId,
    eventType: 'ASSET_UPLOADED',
    payload: {
      assetId: asset.id,
      assetName: asset.name,
      fileName: asset.fileName
    }
  })

  return asset
}

export async function updateAsset(context: RequestContext, assetId: string, input: UpdateAssetInput) {
  if (!isAdmin(context)) {
    throw new AppError(403, 'Forbidden')
  }

  const asset = await findActiveAsset(assetId)

  return prisma.asset.update({
    where: { id: asset.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.storageKey !== undefined ? { storageKey: input.storageKey } : {}),
      ...(input.storageUrl !== undefined ? { storageUrl: input.storageUrl, originalUrl: input.storageUrl } : {})
    },
    select: assetSelect
  })
}

export async function deleteAsset(context: RequestContext, assetId: string) {
  const asset = await findActiveAsset(assetId)
  await ensureCanDeleteAsset(context, asset)

  await prisma.asset.update({
    where: { id: asset.id },
    data: {
      isDeleted: true,
      status: 'ARCHIVED'
    }
  })
}

export async function listAssetVersions(context: RequestContext, assetId: string) {
  const asset = await findActiveAsset(assetId)
  await ensureCanViewAsset(context, asset)

  return prisma.assetVersion.findMany({
    where: {
      assetId,
      isDeleted: false
    },
    select: versionSelect,
    orderBy: { versionNumber: 'desc' }
  })
}

export async function createAssetVersion(
  context: RequestContext,
  assetId: string,
  input: CreateAssetVersionInput
) {
  const asset = await findActiveAsset(assetId)
  await ensureCanManageAssetVersion(context, asset)

  const versionNumber = await nextAssetVersionNumber(asset.id)

  return prisma.assetVersion.create({
    data: {
      assetId: asset.id,
      versionNumber,
      fileName: input.fileName,
      mimeType: input.mimeType,
      storageProvider: input.storageProvider,
      storageKey: input.storageKey,
      storageUrl: input.storageUrl ?? null,
      notes: input.notes ?? null,
      createdById: context.userId
    },
    select: versionSelect
  })
}

export async function updateAssetVersion(
  context: RequestContext,
  assetId: string,
  versionId: string,
  input: UpdateAssetVersionInput
) {
  const asset = await findActiveAsset(assetId)
  await ensureCanManageAssetVersion(context, asset)
  await ensureActiveVersion(asset.id, versionId)

  return prisma.assetVersion.update({
    where: { id: versionId },
    data: {
      ...(input.fileName !== undefined ? { fileName: input.fileName } : {}),
      ...(input.mimeType !== undefined ? { mimeType: input.mimeType } : {}),
      ...(input.storageProvider !== undefined ? { storageProvider: input.storageProvider } : {}),
      ...(input.storageKey !== undefined ? { storageKey: input.storageKey } : {}),
      ...(input.storageUrl !== undefined ? { storageUrl: input.storageUrl } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {})
    },
    select: versionSelect
  })
}

export async function deleteAssetVersion(context: RequestContext, assetId: string, versionId: string) {
  const asset = await findActiveAsset(assetId)
  await ensureCanManageAssetVersion(context, asset)
  await ensureActiveVersion(asset.id, versionId)

  await prisma.assetVersion.update({
    where: { id: versionId },
    data: { isDeleted: true }
  })
}

export async function createDeliverablePresignedUrl(
  context: RequestContext,
  input: DeliverablePresignedUrlInput
) {
  const order = await ensureOrderForAsset(input.organizationId, input.orderId)
  await ensureCanCreateAsset(context, order)

  const storage = getStorageService()
  const storageKey = createDeliverableStorageKey({
    organizationId: input.organizationId,
    orderId: input.orderId,
    fileName: input.fileName
  })

  const presigned = await storage.createPresignedPutUrl({
    storageKey,
    mimeType: input.mimeType,
    expiresInSeconds: storageConfig.uploadExpirySeconds
  })

  const asset = await prisma.asset.create({
    data: {
      organizationId: input.organizationId,
      orderId: order.id,
      uploadId: input.uploadId ?? null,
      name: input.name ?? input.fileName,
      fileName: input.fileName,
      mimeType: input.mimeType,
      storageProvider: storage.provider,
      storageKey: presigned.storageKey,
      storageUrl: presigned.storageUrl,
      originalUrl: presigned.storageUrl,
      status: 'PENDING',
      reviewRound: order.reviewRound,
      isCurrent: false,
      createdById: context.userId
    },
    select: assetSelect
  })

  return {
    asset,
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

export async function completeDeliverableUpload(
  context: RequestContext,
  input: CompleteDeliverableInput
) {
  const asset = await findActiveAsset(input.assetId)
  await ensureCanCreateAsset(context, {
    id: asset.orderId,
    status: asset.order.status,
    reviewRound: asset.order.reviewRound,
    deliverableVersion: asset.order.deliverableVersion,
    assignedEditorId: asset.order.assignedEditorId,
    assignedQaId: asset.order.assignedQaId
  })

  if (asset.status === 'READY' || asset.status === 'DELIVERED') {
    return asset
  }

  const storageKey = input.storageKey ?? asset.storageKey
  const storage = getStorageService()
  const head = await storage.headObject(storageKey)
  const verified = head.exists && head.contentLength > 0

  if (!verified) {
    throw new AppError(400, 'Deliverable upload verification failed')
  }

  const updatedAsset = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM "Order" WHERE id = ${asset.orderId} FOR UPDATE`

    const order = await tx.order.findUnique({
      where: { id: asset.orderId },
      select: {
        id: true,
        reviewRound: true,
        deliverableVersion: true
      }
    })

    if (!order) {
      throw new AppError(404, 'Order not found')
    }

    const readyInActiveBatch =
      order.deliverableVersion > 0
        ? await tx.asset.count({
            where: {
              orderId: order.id,
              reviewRound: order.reviewRound,
              version: order.deliverableVersion,
              status: { in: ['READY', 'DELIVERED'] },
              isDeleted: false
            }
          })
        : 0

    let nextVersion = order.deliverableVersion

    if (readyInActiveBatch > 0) {
      nextVersion = order.deliverableVersion
    } else {
      nextVersion = order.deliverableVersion + 1
      await tx.order.update({
        where: { id: order.id },
        data: { deliverableVersion: nextVersion }
      })
      await tx.asset.updateMany({
        where: {
          orderId: order.id,
          isDeleted: false,
          OR: [
            { reviewRound: { lt: order.reviewRound } },
            {
              reviewRound: order.reviewRound,
              version: { lt: nextVersion }
            }
          ]
        },
        data: { isCurrent: false }
      })
    }

    return tx.asset.update({
      where: { id: asset.id },
      data: {
        status: 'READY',
        version: nextVersion,
        reviewRound: order.reviewRound,
        isCurrent: true,
        uploadedById: context.userId,
        storageKey,
        storageUrl: input.storageUrl ?? asset.storageUrl ?? storage.getObjectUrl(storageKey),
        originalUrl: input.storageUrl ?? asset.storageUrl ?? storage.getObjectUrl(storageKey)
      },
      select: assetSelect
    })
  })

  await recordWorkflowEvent({
    orderId: asset.orderId,
    actorId: context.userId,
    eventType: 'DELIVERABLE_VERSION_UPLOADED',
    payload: {
      assetId: updatedAsset.id,
      assetName: updatedAsset.name,
      fileName: updatedAsset.fileName,
      version: updatedAsset.version,
      reviewRound: updatedAsset.reviewRound
    }
  })

  return updatedAsset
}

export async function getAssetDownloadUrl(context: RequestContext, assetId: string) {
  const asset = await findActiveAsset(assetId)
  await ensureCanViewAsset(context, asset)

  const storage = getStorageService()
  const signed = await storage.createPresignedGetUrl({
    storageKey: asset.storageKey,
    expiresInSeconds: storageConfig.downloadExpirySeconds
  })

  return {
    downloadUrl: signed.downloadUrl,
    expiresIn: signed.expiresInSeconds
  }
}

async function buildListWhere(context: RequestContext, query: ListAssetsQuery): Promise<Prisma.AssetWhereInput> {
  const base: Prisma.AssetWhereInput = {
    isDeleted: false,
    ...(query.organizationId ? { organizationId: query.organizationId } : {}),
    ...(query.orderId ? { orderId: query.orderId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.isCurrent !== undefined ? { isCurrent: query.isCurrent } : {}),
    ...(query.reviewRound ? { reviewRound: query.reviewRound } : {}),
    ...(query.version ? { version: query.version } : {})
  }

  if (isAdmin(context)) {
    return base
  }

  if (context.role === 'CLIENT') {
    const deliveredOrderFilter = {
      isDeleted: false,
      status: 'DELIVERED' as const
    }

    const clientBase = {
      ...base,
      isCurrent: true,
      status: 'DELIVERED' as const
    }

    if (query.organizationId) {
      await ensureOrganizationAccess(context, query.organizationId)
      return {
        ...clientBase,
        organizationId: query.organizationId,
        order: deliveredOrderFilter
      }
    }

    const organizationIds = await getUserOrganizationIds(context.userId)
    return {
      ...clientBase,
      organizationId: { in: organizationIds },
      order: deliveredOrderFilter
    }
  }

  if (context.role === 'EDITOR') {
    return {
      ...base,
      order: {
        assignedEditorId: context.userId
      }
    }
  }

  if (context.role === 'QA') {
    return {
      ...base,
      order: {
        assignedQaId: context.userId
      }
    }
  }

  return {
    ...base,
    id: '__never__'
  }
}

async function findActiveAsset(assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      isDeleted: false
    },
    select: assetSelect
  })

  if (!asset) {
    throw new AppError(404, 'Asset not found')
  }

  return asset
}

async function ensureCanViewAsset(
  context: RequestContext,
  asset: Awaited<ReturnType<typeof findActiveAsset>>
) {
  if (isAdmin(context)) {
    return
  }

  if (context.role === 'CLIENT') {
    await ensureOrganizationAccess(context, asset.organizationId)

    if (asset.order.status !== 'DELIVERED') {
      throw new AppError(404, 'Asset not found')
    }

    return
  }

  if (context.role === 'EDITOR' && asset.order.assignedEditorId === context.userId) {
    return
  }

  if (context.role === 'QA' && asset.order.assignedQaId === context.userId) {
    return
  }

  throw new AppError(404, 'Asset not found')
}

async function ensureCanManageAssetVersion(
  context: RequestContext,
  asset: Awaited<ReturnType<typeof findActiveAsset>>
) {
  if (!canManageVersion(context)) {
    throw new AppError(403, 'Forbidden')
  }

  if (isAdmin(context)) {
    return
  }

  if (context.role === 'EDITOR' && asset.order.assignedEditorId === context.userId) {
    return
  }

  if (context.role === 'QA' && asset.order.assignedQaId === context.userId) {
    return
  }

  throw new AppError(403, 'Forbidden')
}

async function ensureOrderForAsset(organizationId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      organizationId,
      isDeleted: false
    },
    select: {
      id: true,
      status: true,
      reviewRound: true,
      deliverableVersion: true,
      assignedEditorId: true,
      assignedQaId: true
    }
  })

  if (!order) {
    throw new AppError(404, 'Order not found')
  }

  return order
}

export async function countCurrentReadyDeliverables(orderId: string, reviewRound?: number) {
  return prisma.asset.count({
    where: {
      orderId,
      isDeleted: false,
      isCurrent: true,
      status: 'READY',
      ...(reviewRound ? { reviewRound } : {})
    }
  })
}

async function ensureCanCreateAsset(
  context: RequestContext,
  order: Awaited<ReturnType<typeof ensureOrderForAsset>>
) {
  if (isAdmin(context)) {
    return
  }

  if (context.role === 'EDITOR' && order.assignedEditorId === context.userId) {
    if (!['ASSIGNED', 'IN_PROGRESS', 'REVISION_REQUIRED'].includes(order.status)) {
      throw new AppError(400, 'Deliverables can only be uploaded while the order is in production')
    }
    return
  }

  throw new AppError(403, 'Forbidden')
}

async function ensureCanDeleteAsset(
  context: RequestContext,
  asset: Awaited<ReturnType<typeof findActiveAsset>>
) {
  if (isAdmin(context)) {
    return
  }

  if (context.role === 'EDITOR' && asset.order.assignedEditorId === context.userId) {
    if (!['ASSIGNED', 'IN_PROGRESS', 'REVISION_REQUIRED'].includes(asset.order.status)) {
      throw new AppError(400, 'Deliverables can only be removed while the order is in production')
    }

    if (asset.status === 'DELIVERED') {
      throw new AppError(400, 'Delivered assets cannot be removed')
    }

    return
  }

  throw new AppError(403, 'Forbidden')
}

async function ensureUploadForAsset(organizationId: string, orderId: string, uploadId: string | undefined) {
  if (!uploadId) {
    return
  }

  const upload = await prisma.upload.findFirst({
    where: {
      id: uploadId,
      organizationId,
      status: { not: 'DELETED' }
    },
    select: {
      id: true,
      orderId: true
    }
  })

  if (!upload) {
    throw new AppError(404, 'Upload not found')
  }

  if (upload.orderId && upload.orderId !== orderId) {
    throw new AppError(400, 'Upload does not belong to order')
  }
}

async function ensureActiveVersion(assetId: string, versionId: string) {
  const version = await prisma.assetVersion.findFirst({
    where: {
      id: versionId,
      assetId,
      isDeleted: false
    },
    select: { id: true }
  })

  if (!version) {
    throw new AppError(404, 'Asset version not found')
  }

  return version
}

async function ensureOrganizationAccess(context: RequestContext, organizationId: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      organizationId,
      userId: context.userId,
      organization: {
        isActive: true
      }
    },
    select: { id: true }
  })

  if (!membership) {
    throw new AppError(403, 'Forbidden')
  }
}

async function getUserOrganizationIds(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      organization: {
        isActive: true
      }
    },
    select: { organizationId: true }
  })

  return memberships.map((membership) => membership.organizationId)
}

async function nextAssetVersionNumber(assetId: string) {
  const latest = await prisma.assetVersion.findFirst({
    where: { assetId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true }
  })

  return (latest?.versionNumber ?? 0) + 1
}
