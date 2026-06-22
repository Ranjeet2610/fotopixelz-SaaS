import type { AssetStatus } from '@prisma/client'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'

const ACTIVE_DELIVERABLE_STATUSES: AssetStatus[] = ['PENDING', 'READY', 'DELIVERED']
const COUNTED_DELIVERABLE_STATUSES: AssetStatus[] = ['READY', 'DELIVERED']

export type DeliverableQuota = {
  sourceImageCount: number
  existingDeliverables: number
  pendingUploads: number
  maximumAllowed: number
  remainingAllowed: number
  reviewRound: number
  batchVersion: number
}

export type ActiveBatchContext = {
  reviewRound: number
  batchVersion: number
}

export async function getActiveBatchContext(orderId: string): Promise<ActiveBatchContext> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, isDeleted: false },
    select: {
      reviewRound: true,
      deliverableVersion: true
    }
  })

  if (!order) {
    throw new AppError(404, 'Order not found')
  }

  return {
    reviewRound: order.reviewRound,
    batchVersion: order.deliverableVersion > 0 ? order.deliverableVersion : 1
  }
}

export async function countSourceImages(orderId: string) {
  return prisma.upload.count({
    where: {
      orderId,
      status: 'UPLOADED'
    }
  })
}

export async function countActiveBatchDeliverables(
  orderId: string,
  batch: ActiveBatchContext,
  statuses: AssetStatus[] = ACTIVE_DELIVERABLE_STATUSES,
  excludeAssetIds?: string[]
) {
  return prisma.asset.count({
    where: {
      orderId,
      isDeleted: false,
      reviewRound: batch.reviewRound,
      version: batch.batchVersion,
      status: { in: statuses },
      ...(excludeAssetIds?.length ? { id: { notIn: excludeAssetIds } } : {})
    }
  })
}

export type QuotaValidationOptions = {
  replacesAssetId?: string
  excludeAssetIds?: string[]
}

export async function getDeliverableQuota(
  orderId: string,
  options?: Pick<QuotaValidationOptions, 'excludeAssetIds'>
): Promise<DeliverableQuota> {
  const batch = await getActiveBatchContext(orderId)
  const excludeAssetIds = options?.excludeAssetIds
  const sourceImageCount = await countSourceImages(orderId)
  const existingDeliverables = await countActiveBatchDeliverables(
    orderId,
    batch,
    COUNTED_DELIVERABLE_STATUSES,
    excludeAssetIds
  )
  const pendingUploads = await countActiveBatchDeliverables(
    orderId,
    batch,
    ['PENDING'],
    excludeAssetIds
  )
  const maximumAllowed = sourceImageCount
  const remainingAllowed = Math.max(maximumAllowed - existingDeliverables - pendingUploads, 0)

  return {
    sourceImageCount,
    existingDeliverables,
    pendingUploads,
    maximumAllowed,
    remainingAllowed,
    reviewRound: batch.reviewRound,
    batchVersion: batch.batchVersion
  }
}

function formatQuotaError(quota: DeliverableQuota, attemptedUpload: number) {
  return [
    'Maximum deliverables reached.',
    `Source images: ${quota.sourceImageCount}`,
    `Existing deliverables: ${quota.existingDeliverables}`,
    ...(quota.pendingUploads > 0 ? [`Pending uploads: ${quota.pendingUploads}`] : []),
    `Attempted upload: ${attemptedUpload}`,
    `Maximum allowed: ${quota.maximumAllowed}`
  ].join('\n')
}

export async function assertCanAddDeliverables(
  orderId: string,
  newUploadCount: number,
  options?: QuotaValidationOptions
) {
  if (newUploadCount <= 0) {
    return getDeliverableQuota(orderId, options)
  }

  if (options?.replacesAssetId) {
    await assertReplaceableDeliverable(orderId, options.replacesAssetId)
    return getDeliverableQuota(orderId, options)
  }

  const quota = await getDeliverableQuota(orderId, options)

  if (quota.sourceImageCount === 0) {
    throw new AppError(400, 'Source images must be uploaded before deliverables can be added.')
  }

  const projectedTotal = quota.existingDeliverables + quota.pendingUploads + newUploadCount
  if (projectedTotal > quota.maximumAllowed) {
    throw new AppError(400, formatQuotaError(quota, newUploadCount))
  }

  return quota
}

export async function assertSourceDeliverableCountMatch(orderId: string) {
  const batch = await getActiveBatchContext(orderId)
  const sourceImageCount = await countSourceImages(orderId)
  const deliverableCount = await countActiveBatchDeliverables(orderId, batch, COUNTED_DELIVERABLE_STATUSES)

  if (sourceImageCount !== deliverableCount) {
    throw new AppError(400, 'Source and deliverable counts do not match.')
  }

  return {
    sourceImageCount,
    deliverableCount
  }
}

async function assertReplaceableDeliverable(orderId: string, replacesAssetId: string) {
  const batch = await getActiveBatchContext(orderId)
  const asset = await prisma.asset.findFirst({
    where: {
      id: replacesAssetId,
      orderId,
      isDeleted: false,
      reviewRound: batch.reviewRound,
      version: batch.batchVersion,
      status: { in: ['READY', 'DELIVERED'] }
    },
    select: { id: true }
  })

  if (!asset) {
    throw new AppError(400, 'Deliverable cannot be replaced in the current batch.')
  }
}

export async function archiveReplacedDeliverable(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  replacesAssetId: string,
  orderId: string
) {
  const replaced = await tx.asset.findFirst({
    where: {
      id: replacesAssetId,
      orderId,
      isDeleted: false
    },
    select: { id: true }
  })

  if (!replaced) {
    throw new AppError(400, 'Deliverable to replace was not found.')
  }

  await tx.asset.update({
    where: { id: replaced.id },
    data: {
      status: 'ARCHIVED',
      isCurrent: false,
      isDeleted: true
    }
  })
}
