import type { Prisma } from '@prisma/client'
import { requireRole } from '@repo/auth'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type {
  CreateAssetInput,
  CreateAssetVersionInput,
  ListAssetsQuery,
  RequestContext,
  StorageProvider,
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
  createdById: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      id: true,
      title: true,
      status: true,
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

function mockStorageBaseUrl(provider: StorageProvider) {
  return provider === 'AWS_S3'
    ? 'https://mock-s3.local'
    : 'https://mock-r2.local'
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
  if (!isAdmin(context)) {
    throw new AppError(403, 'Forbidden')
  }

  const order = await ensureOrderForAsset(input.organizationId, input.orderId)
  await ensureUploadForAsset(input.organizationId, input.orderId, input.uploadId)

  return prisma.asset.create({
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
  if (!isAdmin(context)) {
    throw new AppError(403, 'Forbidden')
  }

  const asset = await findActiveAsset(assetId)

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

export async function getAssetDownloadUrl(context: RequestContext, assetId: string) {
  const asset = await findActiveAsset(assetId)
  await ensureCanViewAsset(context, asset)

  const baseUrl = asset.storageUrl ?? `${mockStorageBaseUrl(asset.storageProvider)}/${asset.storageKey}`

  return {
    downloadUrl: `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}mockDownload=true`,
    expiresIn: 900
  }
}

async function buildListWhere(context: RequestContext, query: ListAssetsQuery): Promise<Prisma.AssetWhereInput> {
  const base: Prisma.AssetWhereInput = {
    isDeleted: false,
    ...(query.organizationId ? { organizationId: query.organizationId } : {}),
    ...(query.orderId ? { orderId: query.orderId } : {}),
    ...(query.status ? { status: query.status } : {})
  }

  if (isAdmin(context)) {
    return base
  }

  if (context.role === 'CLIENT') {
    if (query.organizationId) {
      await ensureOrganizationAccess(context, query.organizationId)
      return base
    }

    const organizationIds = await getUserOrganizationIds(context.userId)
    return {
      ...base,
      organizationId: { in: organizationIds }
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
    select: { id: true }
  })

  if (!order) {
    throw new AppError(404, 'Order not found')
  }

  return order
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
