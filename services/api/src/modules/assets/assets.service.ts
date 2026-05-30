import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type {
  CreateAssetInput,
  CreateAssetVersionInput,
  ListAssetsQuery,
  RequestContext,
  UpdateAssetInput,
  UpdateAssetVersionInput
} from './assets.types'

const assetInclude = {
  order: {
    select: {
      id: true,
      title: true,
      status: true,
      organizationId: true,
      createdById: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  },
  versions: {
    orderBy: { version: 'desc' as const }
  }
}

function isAdmin(role: RequestContext['role']) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

function uniqueConstraintMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
    return fallback
  }
  return undefined
}

export function getAssetsStatus() {
  return { module: 'assets', status: 'ok' as const }
}

export async function listAssets(context: RequestContext, query: ListAssetsQuery) {
  const where = {
    ...(query.orderId ? { orderId: query.orderId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(isAdmin(context.role)
      ? {}
      : {
          order: {
            OR: [
              { createdById: context.userId },
              {
                organization: {
                  memberships: {
                    some: { userId: context.userId }
                  }
                }
              }
            ]
          }
        })
  }

  const skip = (query.page - 1) * query.limit
  const [assets, total] = await prisma.$transaction([
    prisma.asset.findMany({
      where,
      include: assetInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit
    }),
    prisma.asset.count({ where })
  ])

  return {
    items: assets,
    page: query.page,
    limit: query.limit,
    total
  }
}

export async function getAsset(context: RequestContext, assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: accessibleAssetWhere(context, assetId),
    include: assetInclude
  })

  if (!asset) {
    throw new AppError(404, 'Asset not found')
  }

  return asset
}

export async function createAsset(context: RequestContext, input: CreateAssetInput) {
  await ensureOrderAccess(context, input.orderId)

  return prisma.asset.create({
    data: {
      orderId: input.orderId,
      fileName: input.fileName,
      originalUrl: input.originalUrl,
      status: input.status,
      versions: {
        create: {
          version: 1,
          fileUrl: input.originalUrl,
          notes: input.versionNotes
        }
      }
    },
    include: assetInclude
  })
}

export async function updateAsset(context: RequestContext, assetId: string, input: UpdateAssetInput) {
  await ensureAssetAccess(context, assetId)

  return prisma.asset.update({
    where: { id: assetId },
    data: input,
    include: assetInclude
  })
}

export async function deleteAsset(context: RequestContext, assetId: string) {
  await ensureAssetAccess(context, assetId)

  await prisma.$transaction(async (tx) => {
    await tx.assetVersion.deleteMany({ where: { assetId } })
    await tx.editingJob.deleteMany({ where: { assetId } })
    await tx.aiJob.deleteMany({ where: { assetId } })
    await tx.qAReview.deleteMany({ where: { assetId } })
    await tx.asset.delete({ where: { id: assetId } })
  })
}

export async function listAssetVersions(context: RequestContext, assetId: string) {
  await ensureAssetAccess(context, assetId)

  return prisma.assetVersion.findMany({
    where: { assetId },
    orderBy: { version: 'desc' }
  })
}

export async function createAssetVersion(
  context: RequestContext,
  assetId: string,
  input: CreateAssetVersionInput
) {
  await ensureAssetAccess(context, assetId)

  const version = input.version ?? (await nextAssetVersion(assetId))

  try {
    return await prisma.assetVersion.create({
      data: {
        assetId,
        version,
        fileUrl: input.fileUrl,
        notes: input.notes
      }
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Asset version already exists')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function updateAssetVersion(
  context: RequestContext,
  assetId: string,
  versionId: string,
  input: UpdateAssetVersionInput
) {
  await ensureAssetVersionAccess(context, assetId, versionId)

  try {
    return await prisma.assetVersion.update({
      where: { id: versionId },
      data: input
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Asset version already exists')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function deleteAssetVersion(context: RequestContext, assetId: string, versionId: string) {
  await ensureAssetVersionAccess(context, assetId, versionId)

  await prisma.assetVersion.delete({
    where: { id: versionId }
  })
}

function accessibleAssetWhere(context: RequestContext, assetId: string) {
  return {
    id: assetId,
    ...(isAdmin(context.role)
      ? {}
      : {
          order: {
            OR: [
              { createdById: context.userId },
              {
                organization: {
                  memberships: {
                    some: { userId: context.userId }
                  }
                }
              }
            ]
          }
        })
  }
}

async function ensureAssetAccess(context: RequestContext, assetId: string) {
  const asset = await prisma.asset.findFirst({
    where: accessibleAssetWhere(context, assetId),
    select: { id: true }
  })

  if (!asset) {
    throw new AppError(404, 'Asset not found')
  }
}

async function ensureAssetVersionAccess(context: RequestContext, assetId: string, versionId: string) {
  await ensureAssetAccess(context, assetId)

  const version = await prisma.assetVersion.findFirst({
    where: { id: versionId, assetId },
    select: { id: true }
  })

  if (!version) {
    throw new AppError(404, 'Asset version not found')
  }
}

async function ensureOrderAccess(context: RequestContext, orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(isAdmin(context.role)
        ? {}
        : {
            OR: [
              { createdById: context.userId },
              {
                organization: {
                  memberships: {
                    some: { userId: context.userId }
                  }
                }
              }
            ]
          })
    },
    select: { id: true }
  })

  if (!order) {
    throw new AppError(404, 'Order not found')
  }
}

async function nextAssetVersion(assetId: string) {
  const latest = await prisma.assetVersion.findFirst({
    where: { assetId },
    orderBy: { version: 'desc' },
    select: { version: true }
  })

  return (latest?.version ?? 0) + 1
}
