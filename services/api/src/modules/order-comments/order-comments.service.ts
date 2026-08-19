import type { CommentStatus, CommentType, NotificationType, Prisma } from '@prisma/client'
import { requireRole } from '@repo/auth'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import {
  createCommentAttachmentStorageKey,
  getStorageService,
  storageConfig
} from '../../integrations/storage'
import { createNotificationsForUsers } from '../notifications/notifications.service'
import { recordWorkflowEvent } from '../workflow/workflow.service'
import { emitOrderRoomEvent } from '../../sockets/socket'
import type {
  CreateOrderCommentInput,
  ListOrderCommentsQuery,
  RequestContext,
  UpdateOrderCommentInput
} from './order-comments.types'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const
const ATTACHMENT_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf'
])

const commentSelect = {
  id: true,
  orderId: true,
  userId: true,
  assetId: true,
  parentId: true,
  commentType: true,
  status: true,
  body: true,
  attachmentStorageKey: true,
  attachmentFileName: true,
  attachmentMimeType: true,
  attachmentUrl: true,
  resolvedById: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  resolvedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  asset: {
    select: {
      id: true,
      name: true,
      fileName: true,
      mimeType: true,
      version: true,
      reviewRound: true
    }
  }
} as const

export function getOrderCommentsStatus() {
  return { module: 'order-comments', status: 'ok' as const }
}

function isAdmin(context: RequestContext) {
  return requireRole(context.role, ADMIN_ROLES)
}

function canViewInternalNotes(context: RequestContext) {
  return context.role !== 'CLIENT'
}

function assertCommentTypeAllowed(context: RequestContext, commentType: CommentType) {
  if (commentType === 'INTERNAL_NOTE' && !isAdmin(context)) {
    throw new AppError(403, 'Only admins can create internal notes')
  }

  if (commentType === 'REVISION' && context.role !== 'QA' && !isAdmin(context)) {
    throw new AppError(403, 'Only QA can create revision comments')
  }

  if (commentType === 'QA_NOTE' && context.role !== 'QA' && !isAdmin(context)) {
    throw new AppError(403, 'Only QA can create QA notes')
  }

  if (commentType === 'CLIENT_FEEDBACK' && context.role !== 'CLIENT' && !isAdmin(context)) {
    throw new AppError(403, 'Only clients can create client feedback')
  }

  if (commentType === 'SYSTEM') {
    throw new AppError(403, 'System comments cannot be created manually')
  }
}

async function findOrderForComments(orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, isDeleted: false },
    select: {
      id: true,
      orderNumber: true,
      organizationId: true,
      assignedEditorId: true,
      assignedQaId: true,
      createdById: true,
      status: true
    }
  })

  if (!order) {
    throw new AppError(404, 'Order not found')
  }

  return order
}

async function ensureCanAccessOrderComments(
  context: RequestContext,
  order: {
    organizationId: string
    assignedEditorId: string | null
    assignedQaId: string | null
  }
) {
  if (isAdmin(context)) {
    return
  }

  if (context.role === 'CLIENT') {
    const membership = await prisma.membership.findFirst({
      where: { organizationId: order.organizationId, userId: context.userId },
      select: { id: true }
    })

    if (!membership) {
      throw new AppError(404, 'Order not found')
    }

    return
  }

  if (context.role === 'EDITOR' && order.assignedEditorId === context.userId) {
    return
  }

  if (context.role === 'QA' && order.assignedQaId === context.userId) {
    return
  }

  throw new AppError(404, 'Order not found')
}

function buildCommentWhere(
  context: RequestContext,
  orderId: string,
  query: ListOrderCommentsQuery
): Prisma.OrderCommentWhereInput {
  const where: Prisma.OrderCommentWhereInput = {
    orderId,
    isDeleted: false,
    ...(query.commentType ? { commentType: query.commentType } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.assetId ? { assetId: query.assetId } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.search
      ? {
          body: {
            contains: query.search,
            mode: 'insensitive'
          }
        }
      : {})
  }

  if (!canViewInternalNotes(context)) {
    if (query.commentType === 'INTERNAL_NOTE') {
      return { ...where, id: '__never__' }
    }

    return {
      ...where,
      commentType: query.commentType ?? { not: 'INTERNAL_NOTE' }
    }
  }

  return where
}

async function resolveAttachmentUrl(comment: {
  attachmentStorageKey: string | null
  attachmentUrl: string | null
}) {
  if (!comment.attachmentStorageKey) {
    return comment.attachmentUrl
  }

  const storage = getStorageService()
  const signed = await storage.createPresignedGetUrl({
    storageKey: comment.attachmentStorageKey,
    expiresInSeconds: storageConfig.downloadExpirySeconds
  })

  return signed.downloadUrl
}

async function mapComment(comment: Prisma.OrderCommentGetPayload<{ select: typeof commentSelect }>) {
  const attachmentUrl = await resolveAttachmentUrl(comment)

  return {
    ...comment,
    attachmentUrl
  }
}

export async function listOrderComments(context: RequestContext, orderId: string, query: ListOrderCommentsQuery) {
  const order = await findOrderForComments(orderId)
  await ensureCanAccessOrderComments(context, order)

  const skip = (query.page - 1) * query.limit
  const where = buildCommentWhere(context, orderId, query)

  const [items, total] = await prisma.$transaction([
    prisma.orderComment.findMany({
      where,
      select: commentSelect,
      orderBy: { createdAt: 'asc' },
      skip,
      take: query.limit
    }),
    prisma.orderComment.count({ where })
  ])

  return {
    items: await Promise.all(items.map((item) => mapComment(item))),
    page: query.page,
    limit: query.limit,
    total
  }
}

export async function listOrderTimeline(context: RequestContext, orderId: string) {
  const order = await findOrderForComments(orderId)
  await ensureCanAccessOrderComments(context, order)

  const commentWhere = buildCommentWhere(context, orderId, { page: 1, limit: 500 })

  const [events, comments] = await prisma.$transaction([
    prisma.workflowEvent.findMany({
      where: { orderId },
      select: {
        id: true,
        orderId: true,
        actorId: true,
        eventType: true,
        payload: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.orderComment.findMany({
      where: commentWhere,
      select: commentSelect,
      orderBy: { createdAt: 'asc' }
    })
  ])

  const mappedComments = await Promise.all(comments.map((item) => mapComment(item)))

  const timeline = [
    ...events.map((event) => ({
      kind: 'workflow' as const,
      id: event.id,
      createdAt: event.createdAt,
      event
    })),
    ...mappedComments.map((comment) => ({
      kind: 'comment' as const,
      id: comment.id,
      createdAt: comment.createdAt,
      comment
    }))
  ].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())

  return { items: timeline, total: timeline.length }
}

export async function createOrderComment(
  context: RequestContext,
  input: CreateOrderCommentInput,
  options?: { skipTypeCheck?: boolean; systemUserId?: string }
) {
  const order = await findOrderForComments(input.orderId)
  await ensureCanAccessOrderComments(context, order)

  const commentType = input.commentType ?? 'GENERAL'
  if (!options?.skipTypeCheck) {
    assertCommentTypeAllowed(context, commentType)
  }

  if (input.assetId) {
    const asset = await prisma.asset.findFirst({
      where: {
        id: input.assetId,
        orderId: order.id,
        isDeleted: false
      },
      select: { id: true }
    })

    if (!asset) {
      throw new AppError(400, 'Asset not found on this order')
    }
  }

  if (input.parentId) {
    const parent = await prisma.orderComment.findFirst({
      where: {
        id: input.parentId,
        orderId: order.id,
        isDeleted: false
      },
      select: { id: true }
    })

    if (!parent) {
      throw new AppError(400, 'Parent comment not found')
    }
  }

  const initialStatus =
    commentType === 'REVISION' || commentType === 'QA_NOTE' ? 'OPEN' : input.status ?? 'OPEN'

  const created = await prisma.orderComment.create({
    data: {
      orderId: order.id,
      userId: options?.systemUserId ?? context.userId,
      assetId: input.assetId ?? null,
      parentId: input.parentId ?? null,
      commentType,
      status: initialStatus,
      body: input.body,
      attachmentStorageKey: input.attachmentStorageKey ?? null,
      attachmentFileName: input.attachmentFileName ?? null,
      attachmentMimeType: input.attachmentMimeType ?? null,
      attachmentUrl: input.attachmentUrl ?? null
    },
    select: commentSelect
  })

  if (commentType !== 'SYSTEM') {
    await recordWorkflowEvent({
      orderId: order.id,
      actorId: context.userId,
      eventType: 'COMMENT_CREATED',
      payload: {
        commentId: created.id,
        commentType,
        status: created.status,
        assetId: created.assetId,
        body: created.body.slice(0, 200)
      }
    })
  }

  const mapped = await mapComment(created)
  await notifyCommentCreated(order, mapped, context)
  emitOrderRoomEvent(order.id, 'comment.created', mapped)
  emitOrderRoomEvent(order.id, 'timeline.updated', { orderId: order.id })

  return mapped
}

export async function createSystemOrderComment(
  orderId: string,
  body: string,
  actorId?: string | null
) {
  const order = await findOrderForComments(orderId)

  const created = await prisma.orderComment.create({
    data: {
      orderId: order.id,
      userId: actorId ?? order.createdById,
      commentType: 'SYSTEM',
      status: 'RESOLVED',
      body,
      resolvedAt: new Date(),
      resolvedById: actorId ?? null
    },
    select: commentSelect
  })

  const mapped = await mapComment(created)
  emitOrderRoomEvent(order.id, 'comment.created', mapped)
  emitOrderRoomEvent(order.id, 'timeline.updated', { orderId: order.id })
  return mapped
}

export async function updateOrderComment(
  context: RequestContext,
  commentId: string,
  input: UpdateOrderCommentInput
) {
  const existing = await prisma.orderComment.findFirst({
    where: { id: commentId, isDeleted: false },
    select: {
      ...commentSelect,
      order: {
        select: {
          id: true,
          orderNumber: true,
          organizationId: true,
          assignedEditorId: true,
          assignedQaId: true,
          createdById: true
        }
      }
    }
  })

  if (!existing) {
    throw new AppError(404, 'Comment not found')
  }

  await ensureCanAccessOrderComments(context, existing.order)

  if (existing.commentType === 'SYSTEM' && !isAdmin(context)) {
    throw new AppError(403, 'System comments cannot be edited')
  }

  if (input.status) {
    assertStatusTransitionAllowed(context, existing.status, input.status, existing.commentType)
  }

  const data: Prisma.OrderCommentUpdateInput = {}

  if (input.body !== undefined) {
    if (existing.commentType === 'SYSTEM') {
      throw new AppError(403, 'System comments cannot be edited')
    }
    data.body = input.body
  }

  if (input.status) {
    data.status = input.status
    if (input.status === 'RESOLVED') {
      data.resolvedBy = { connect: { id: context.userId } }
      data.resolvedAt = new Date()
    } else {
      data.resolvedBy = { disconnect: true }
      data.resolvedAt = null
    }
  }

  const updated = await prisma.orderComment.update({
    where: { id: commentId },
    data,
    select: commentSelect
  })

  const mapped = await mapComment(updated)

  if (input.status === 'RESOLVED') {
    await recordWorkflowEvent({
      orderId: existing.orderId,
      actorId: context.userId,
      eventType: 'COMMENT_RESOLVED',
      payload: {
        commentId: updated.id,
        commentType: updated.commentType
      }
    })
    await notifyCommentResolved(existing.order, mapped)
    emitOrderRoomEvent(existing.orderId, 'comment.resolved', mapped)
  } else {
    emitOrderRoomEvent(existing.orderId, 'comment.updated', mapped)
  }

  emitOrderRoomEvent(existing.orderId, 'timeline.updated', { orderId: existing.orderId })
  return mapped
}

export async function deleteOrderComment(context: RequestContext, commentId: string) {
  if (!isAdmin(context)) {
    throw new AppError(403, 'Only admins can delete comments')
  }

  const existing = await prisma.orderComment.findFirst({
    where: { id: commentId, isDeleted: false },
    select: { id: true, orderId: true }
  })

  if (!existing) {
    throw new AppError(404, 'Comment not found')
  }

  await prisma.orderComment.update({
    where: { id: commentId },
    data: { isDeleted: true }
  })

  emitOrderRoomEvent(existing.orderId, 'comment.deleted', { id: commentId })
  emitOrderRoomEvent(existing.orderId, 'timeline.updated', { orderId: existing.orderId })

  return { success: true }
}

export async function createCommentAttachmentPresignedUrl(
  context: RequestContext,
  input: {
    orderId: string
    fileName: string
    mimeType: string
    fileSize: number
  }
) {
  const order = await findOrderForComments(input.orderId)
  await ensureCanAccessOrderComments(context, order)

  if (!ATTACHMENT_MIME_TYPES.has(input.mimeType.toLowerCase())) {
    throw new AppError(400, 'Unsupported attachment type')
  }

  const storageKey = createCommentAttachmentStorageKey({
    organizationId: order.organizationId,
    orderId: order.id,
    fileName: input.fileName
  })

  const storage = getStorageService()
  const presigned = await storage.createPresignedPutUrl({
    storageKey,
    mimeType: input.mimeType,
    expiresInSeconds: storageConfig.uploadExpirySeconds
  })

  return {
    storageKey,
    uploadUrl: presigned.uploadUrl,
    expiresIn: storageConfig.uploadExpirySeconds,
    fileName: input.fileName,
    mimeType: input.mimeType
  }
}

export async function getCommentAttachmentDownloadUrl(context: RequestContext, commentId: string) {
  const comment = await prisma.orderComment.findFirst({
    where: { id: commentId, isDeleted: false },
    select: {
      id: true,
      orderId: true,
      attachmentStorageKey: true,
      attachmentFileName: true,
      attachmentMimeType: true,
      order: {
        select: {
          organizationId: true,
          assignedEditorId: true,
          assignedQaId: true
        }
      }
    }
  })

  if (!comment?.attachmentStorageKey) {
    throw new AppError(404, 'Attachment not found')
  }

  await ensureCanAccessOrderComments(context, comment.order)

  const storage = getStorageService()
  const signed = await storage.createPresignedGetUrl({
    storageKey: comment.attachmentStorageKey,
    expiresInSeconds: storageConfig.downloadExpirySeconds
  })

  return {
    downloadUrl: signed.downloadUrl,
    expiresIn: storageConfig.downloadExpirySeconds,
    fileName: comment.attachmentFileName ?? 'attachment',
    mimeType: comment.attachmentMimeType ?? 'application/octet-stream'
  }
}

function assertStatusTransitionAllowed(
  context: RequestContext,
  current: CommentStatus,
  next: CommentStatus,
  commentType: CommentType
) {
  if (commentType === 'SYSTEM') {
    throw new AppError(403, 'System comments cannot change status')
  }

  if (isAdmin(context) || context.role === 'QA') {
    return
  }

  if (context.role === 'EDITOR') {
    const allowed: Record<CommentStatus, CommentStatus[]> = {
      OPEN: ['IN_PROGRESS', 'RESOLVED'],
      IN_PROGRESS: ['RESOLVED', 'OPEN'],
      RESOLVED: []
    }

    if (!allowed[current].includes(next)) {
      throw new AppError(403, 'Editors can only move comments to in progress or resolved')
    }

    return
  }

  throw new AppError(403, 'Forbidden')
}

async function notifyCommentCreated(
  order: {
    id: string
    orderNumber: string
    assignedEditorId: string | null
    assignedQaId: string | null
    createdById: string
  },
  comment: { commentType: CommentType; body: string; user: { name: string | null; email: string } },
  context: RequestContext
) {
  const author = comment.user.name ?? comment.user.email
  const recipients = new Set<string>()

  if (comment.commentType === 'CLIENT_FEEDBACK') {
    if (order.assignedEditorId) recipients.add(order.assignedEditorId)
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true }
    })
    admins.forEach((admin) => recipients.add(admin.id))
  }

  if (comment.commentType === 'REVISION' || comment.commentType === 'QA_NOTE') {
    if (order.assignedEditorId) recipients.add(order.assignedEditorId)
  }

  if (context.role === 'EDITOR' && order.assignedQaId) {
    recipients.add(order.assignedQaId)
  }

  if (context.role === 'CLIENT' && comment.commentType === 'GENERAL' && order.assignedEditorId) {
    recipients.add(order.assignedEditorId)
  }

  recipients.delete(context.userId)

  const type: NotificationType =
    comment.commentType === 'REVISION' ? 'REVISION' : comment.commentType === 'CLIENT_FEEDBACK' ? 'ORDER' : 'ORDER'

  await createNotificationsForUsers(Array.from(recipients), {
    type,
    title: `${order.orderNumber}: new ${comment.commentType.replaceAll('_', ' ').toLowerCase()}`,
    message: `${author}: ${comment.body.slice(0, 160)}`
  })
}

async function notifyCommentResolved(
  order: { orderNumber: string; assignedQaId: string | null },
  comment: { body: string }
) {
  if (!order.assignedQaId) {
    return
  }

  await createNotificationsForUsers([order.assignedQaId], {
    type: 'REVISION',
    title: `${order.orderNumber}: revision issue resolved`,
    message: comment.body.slice(0, 160)
  })
}

export async function createRevisionOrderComment(
  context: RequestContext,
  input: {
    orderId: string
    title: string
    comment: string
    assetId?: string
    attachmentStorageKey?: string
    attachmentFileName?: string
    attachmentMimeType?: string
  }
) {
  return createOrderComment(
    context,
    {
      orderId: input.orderId,
      body: `${input.title}\n\n${input.comment}`,
      commentType: 'REVISION',
      status: 'OPEN',
      assetId: input.assetId,
      attachmentStorageKey: input.attachmentStorageKey,
      attachmentFileName: input.attachmentFileName,
      attachmentMimeType: input.attachmentMimeType
    },
    { skipTypeCheck: true }
  )
}
