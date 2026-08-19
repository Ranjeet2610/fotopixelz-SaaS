import type { Prisma } from '@prisma/client'
import { requireRole } from '@repo/auth'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import { countCurrentReadyDeliverables } from '../assets/assets.service'
import { assertSourceDeliverableCountMatch, countActiveBatchDeliverables, getActiveBatchContext } from '../assets/deliverable-integrity'
import { buildQuote } from '../pricing/pricing.service'
import { generateOrderNumber, isPreUploadOrderStatus } from './order-number'
import { calculateOrderBilling } from './order-billing'
import { assertAllowedStatusTransition } from './order-status-transitions'
import { recordOrderStatusChange, recordWorkflowEvent } from '../workflow/workflow.service'
import {
  createRevisionOrderComment,
  createSystemOrderComment
} from '../order-comments/order-comments.service'
import {
  sendEditorAssignmentEmail,
  sendOrderDeliveredEmails,
  sendOrderPlacedEmails,
  sendOrderReadyForReviewEmails,
  sendQaAssignmentEmail,
  sendRevisionCompletedEmails,
  sendRevisionRequestedEmails,
  sendReworkRequiredEmails
} from './order-notification-emails'
import type {
  AssignEditorInput,
  AssignQaInput,
  CreateOrderInput,
  ListOrdersQuery,
  OrderStatus,
  RequestContext,
  RequestOrderRevisionInput,
  UpdateOrderInput,
  UpdateOrderStatusInput
} from './orders.types'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const
const CREATE_ROLES = ['CLIENT', 'ADMIN', 'SUPER_ADMIN'] as const
const CLIENT_STATUS_UPDATES: readonly OrderStatus[] = ['DRAFT', 'SUBMITTED', 'UPLOADED', 'PENDING', 'CANCELLED']
const EDITOR_STATUS_UPDATES: readonly OrderStatus[] = ['IN_PROGRESS', 'READY_FOR_QA']
const QA_STATUS_UPDATES: readonly OrderStatus[] = ['DELIVERED', 'REVISION_REQUIRED']
const ASSIGNABLE_ORDER_STATUSES: readonly OrderStatus[] = ['PENDING']
const QA_ASSIGNABLE_STATUSES: readonly OrderStatus[] = [
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'READY_FOR_QA',
  'REVISION_REQUIRED'
]

const orderItemSelect = {
  id: true,
  serviceId: true,
  quantity: true,
  unitPrice: true,
  subtotal: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  service: {
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      categoryId: true
    }
  }
} as const

const orderAddonSelect = {
  id: true,
  addonId: true,
  quantity: true,
  unitPrice: true,
  pricingType: true,
  subtotal: true,
  credits: true,
  createdAt: true,
  updatedAt: true,
  addon: {
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      pricingType: true,
      credits: true
    }
  }
} as const

const orderSelect = {
  id: true,
  orderNumber: true,
  organizationId: true,
  createdById: true,
  categoryId: true,
  assignedEditorId: true,
  assignedQaId: true,
  title: true,
  instructions: true,
  status: true,
  priority: true,
  totalImages: true,
  creditsUsed: true,
  totalAmount: true,
  currency: true,
  dueDate: true,
  dueAt: true,
  reviewRound: true,
  deliverableVersion: true,
  isDeleted: true,
  createdAt: true,
  updatedAt: true,
  organization: {
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true
    }
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  items: {
    select: orderItemSelect,
    orderBy: { createdAt: 'asc' as const }
  },
  addons: {
    select: orderAddonSelect,
    orderBy: { createdAt: 'asc' as const }
  }
} as const

function isAdmin(context: RequestContext) {
  return requireRole(context.role, ADMIN_ROLES)
}

export function getOrdersStatus() {
  return { module: 'orders', status: 'ok' as const }
}

export async function listOrders(context: RequestContext, query: ListOrdersQuery) {
  const where = await buildListWhere(context, query)
  const skip = (query.page - 1) * query.limit

  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: orderSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit
    }),
    prisma.order.count({ where })
  ])

  return {
    items,
    page: query.page,
    limit: query.limit,
    total
  }
}

export async function getOrder(context: RequestContext, orderId: string) {
  const order = await findActiveOrder(orderId)
  await ensureCanViewOrder(context, order)
  return order
}

export async function createOrder(context: RequestContext, input: CreateOrderInput) {
  if (!requireRole(context.role, CREATE_ROLES)) {
    throw new AppError(403, 'Forbidden')
  }

  await ensureOrganizationAccess(context, input.organizationId)
  await ensureCategoryExists(input.categoryId)

  const quote = await buildQuote({
    organizationId: input.organizationId,
    items: mapItemsForQuote(input.items, context),
    addons: input.addons ?? [],
    allowManualPricing: isAdmin(context),
    manualTotalAmount: isAdmin(context) ? input.totalAmount : undefined
  })

  const hasCatalogLines = quote.items.length > 0 || quote.addons.length > 0
  const totalImages = hasCatalogLines ? quote.totalImageCount : input.totalImages
  const creditsUsed = hasCatalogLines ? quote.creditsUsed : input.creditsUsed

  const orderNumber = await generateOrderNumber()

  const order = await prisma.order.create({
    data: {
      orderNumber,
      organizationId: input.organizationId,
      createdById: context.userId,
      categoryId: input.categoryId ?? null,
      title: input.title,
      instructions: input.instructions ?? null,
      totalImages,
      creditsUsed,
      totalAmount: quote.grandTotal,
      currency: quote.currency,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
      dueAt: input.dueDate ?? null,
      status: 'SUBMITTED',
      ...(quote.items.length > 0
        ? {
            items: {
              create: quote.items.map((item) => ({
                serviceId: item.serviceId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                notes: item.notes
              }))
            }
          }
        : {}),
      ...(quote.addons.length > 0
        ? {
            addons: {
              create: quote.addons.map((addon) => ({
                addonId: addon.addonId,
                quantity: addon.quantity,
                unitPrice: addon.unitPrice,
                pricingType: addon.pricingType,
                subtotal: addon.subtotal,
                credits: addon.credits
              }))
            }
          }
        : {})
    },
    select: orderSelect
  })

  await recordWorkflowEvent({
    orderId: order.id,
    actorId: context.userId,
    eventType: 'ORDER_CREATED',
    payload: {
      title: order.title,
      status: order.status,
      orderNumber: order.orderNumber
    }
  })

  await sendOrderPlacedEmails(order)

  return order
}

export async function updateOrder(context: RequestContext, orderId: string, input: UpdateOrderInput) {
  const order = await findActiveOrder(orderId)

  if (!isAdmin(context) && context.role !== 'CLIENT') {
    throw new AppError(403, 'Forbidden')
  }

  if (!isAdmin(context)) {
    await ensureOrganizationAccess(context, order.organizationId)
  }

  await ensureCategoryExists(input.categoryId === null ? undefined : input.categoryId)

  const pricingChanged = input.items !== undefined || input.addons !== undefined
  if (pricingChanged && !isPreUploadOrderStatus(order.status)) {
    throw new AppError(400, 'Order pricing lines can only be modified while awaiting uploads')
  }

  let quoteUpdate: Awaited<ReturnType<typeof buildQuote>> | undefined
  if (pricingChanged || (isAdmin(context) && input.totalAmount !== undefined)) {
    const nextItems =
      input.items ??
      order.items.map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        unitPrice: isAdmin(context) ? item.unitPrice : undefined,
        notes: item.notes ?? undefined
      }))
    const nextAddons =
      input.addons ??
      order.addons.map((addon) => ({
        addonId: addon.addonId,
        quantity: addon.quantity
      }))

    quoteUpdate = await buildQuote({
      organizationId: order.organizationId,
      items: mapItemsForQuote(nextItems, context),
      addons: nextAddons,
      allowManualPricing: isAdmin(context),
      manualTotalAmount: isAdmin(context) ? input.totalAmount : undefined
    })
  }

  const hasCatalogLines = quoteUpdate
    ? quoteUpdate.items.length > 0 || quoteUpdate.addons.length > 0
    : order.items.length > 0 || order.addons.length > 0

  return prisma.order.update({
    where: { id: order.id },
    data: {
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
      ...(quoteUpdate && hasCatalogLines
        ? { totalImages: quoteUpdate.totalImageCount, creditsUsed: quoteUpdate.creditsUsed }
        : {
            ...(input.totalImages !== undefined ? { totalImages: input.totalImages } : {}),
            ...(input.creditsUsed !== undefined ? { creditsUsed: input.creditsUsed } : {})
          }),
      ...(quoteUpdate
        ? { totalAmount: quoteUpdate.grandTotal, currency: quoteUpdate.currency }
        : isAdmin(context) && input.totalAmount !== undefined
          ? { totalAmount: input.totalAmount }
          : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate, dueAt: input.dueDate } : {}),
      ...(quoteUpdate
        ? {
            items: {
              deleteMany: {},
              create: quoteUpdate.items.map((item) => ({
                serviceId: item.serviceId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                notes: item.notes
              }))
            },
            addons: {
              deleteMany: {},
              create: quoteUpdate.addons.map((addon) => ({
                addonId: addon.addonId,
                quantity: addon.quantity,
                unitPrice: addon.unitPrice,
                pricingType: addon.pricingType,
                subtotal: addon.subtotal,
                credits: addon.credits
              }))
            }
          }
        : {})
    },
    select: orderSelect
  })
}

export async function deleteOrder(context: RequestContext, orderId: string) {
  if (!isAdmin(context)) {
    throw new AppError(403, 'Forbidden')
  }

  const order = await findActiveOrder(orderId)

  await prisma.order.update({
    where: { id: order.id },
    data: { isDeleted: true }
  })
}

export async function updateOrderStatus(context: RequestContext, input: UpdateOrderStatusInput) {
  const order = await findActiveOrder(input.orderId)
  await ensureCanUpdateStatus(context, order, input.status)

  if (input.status === 'REVISION_REQUIRED' && order.status !== 'REVISION_REQUIRED') {
    throw new AppError(400, 'Use POST /orders/request-revision to request changes')
  }

  if (
    !isAdmin(context) &&
    order.status !== input.status &&
    (context.role === 'EDITOR' || context.role === 'QA')
  ) {
    try {
      assertAllowedStatusTransition(context.role, order.status, input.status)
    } catch (error) {
      throw new AppError(
        400,
        error instanceof Error ? error.message : 'Invalid status transition'
      )
    }
  }

  if (
    context.role === 'EDITOR' &&
    input.status === 'READY_FOR_QA' &&
    order.status !== 'READY_FOR_QA' &&
    !order.assignedQaId
  ) {
    throw new AppError(400, 'A QA reviewer must be assigned before sending this order to QA')
  }

  if (
    context.role === 'EDITOR' &&
    input.status === 'READY_FOR_QA' &&
    order.status !== 'READY_FOR_QA'
  ) {
    const readyCount = await countCurrentReadyDeliverables(order.id, order.reviewRound)
    if (readyCount === 0) {
      throw new AppError(
        400,
        order.status === 'REVISION_REQUIRED'
          ? 'Upload revised deliverables before submitting to QA.'
          : 'Upload at least one deliverable before submitting to QA.'
      )
    }

    await assertSourceDeliverableCountMatch(order.id)
  }

  if (input.status === 'DELIVERED' && order.status !== 'DELIVERED') {
    if (!isAdmin(context) && order.status !== 'READY_FOR_QA') {
      throw new AppError(400, 'Order must pass QA review before it can be delivered')
    }
    await ensureOrderHasDeliverables(order.id)
    await assertSourceDeliverableCountMatch(order.id)
  }

  if (
    input.status === 'REVISION_REQUIRED' &&
    order.status !== 'REVISION_REQUIRED' &&
    context.role === 'QA'
  ) {
    if (!input.revisionTitle || !input.revisionComment) {
      throw new AppError(400, 'Revision notes are required when requesting changes')
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (input.status === 'REVISION_REQUIRED' && order.status === 'READY_FOR_QA') {
      await tx.asset.updateMany({
        where: {
          orderId: order.id,
          reviewRound: order.reviewRound,
          isDeleted: false
        },
        data: {
          isCurrent: false,
          qaNotes: {
            title: input.revisionTitle ?? 'Revision requested',
            comment: input.revisionComment ?? '',
            reviewRound: order.reviewRound,
            requestedAt: new Date().toISOString()
          }
        }
      })
    }

    const nextOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        ...(input.status === 'REVISION_REQUIRED' && order.status === 'READY_FOR_QA'
          ? { reviewRound: order.reviewRound + 1 }
          : {})
      },
      select: orderSelect
    })

    if (order.status !== input.status && input.status === 'DELIVERED') {
      await tx.asset.updateMany({
        where: {
          orderId: order.id,
          isDeleted: false,
          isCurrent: true
        },
        data: {
          status: 'DELIVERED'
        }
      })
    }

    return nextOrder
  })

  if (order.status !== input.status) {
    await recordOrderStatusChange({
      orderId: order.id,
      actorId: context.userId,
      fromStatus: order.status,
      toStatus: input.status,
      note:
        input.status === 'REVISION_REQUIRED' ? input.revisionComment : undefined,
      extraPayload:
        input.status === 'REVISION_REQUIRED'
          ? {
              title: input.revisionTitle,
              comment: input.revisionComment,
              reviewRound: order.reviewRound,
              assetId: input.assetId
            }
          : undefined
    })

    if (input.status === 'REVISION_REQUIRED' && input.revisionTitle && input.revisionComment) {
      await createRevisionOrderComment(context, {
        orderId: order.id,
        title: input.revisionTitle,
        comment: input.revisionComment,
        assetId: input.assetId,
        attachmentStorageKey: input.attachmentStorageKey,
        attachmentFileName: input.attachmentFileName,
        attachmentMimeType: input.attachmentMimeType
      })
    }

    if (input.status === 'READY_FOR_QA' && order.status === 'REVISION_REQUIRED') {
      await sendRevisionCompletedEmails(updated)
    } else if (input.status === 'READY_FOR_QA') {
      await sendOrderReadyForReviewEmails(updated)
    } else if (input.status === 'DELIVERED') {
      await sendOrderDeliveredEmails(updated)
    }
  }

  return updated
}

export async function submitOrder(context: RequestContext, orderId: string) {
  if (context.role !== 'CLIENT') {
    throw new AppError(403, 'Forbidden')
  }

  const order = await findActiveOrder(orderId)
  await ensureOrganizationAccess(context, order.organizationId)

  if (order.status !== 'UPLOADED') {
    throw new AppError(400, 'Order must be uploaded before submission')
  }

  const uploadCount = await prisma.upload.count({
    where: {
      orderId: order.id,
      status: 'UPLOADED'
    }
  })

  if (uploadCount === 0) {
    throw new AppError(400, 'Upload at least one image before submitting')
  }

  const organization = await prisma.organization.findUnique({
    where: { id: order.organizationId },
    select: {
      id: true,
      freeImageCredits: true,
      usedImageCredits: true
    }
  })

  if (!organization) {
    throw new AppError(404, 'Organization not found')
  }

  const creditsRemaining = organization.freeImageCredits - organization.usedImageCredits
  const billing = calculateOrderBilling({
    uploadedImages: uploadCount,
    availableCredits: creditsRemaining,
    serviceLines: order.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })),
    fallbackExpectedImages: order.totalImages
  })

  const updatedOrder = await prisma.$transaction(async (tx) => {
    if (billing.freeCreditsUsed > 0) {
      await tx.organization.update({
        where: { id: organization.id },
        data: {
          usedImageCredits: {
            increment: billing.freeCreditsUsed
          }
        }
      })
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PENDING',
        creditsUsed: billing.freeCreditsUsed,
        totalImages: uploadCount,
        totalAmount: billing.amountDue
      },
      select: orderSelect
    })
  })

  await recordOrderStatusChange({
    orderId: order.id,
    actorId: context.userId,
    fromStatus: order.status,
    toStatus: 'PENDING',
    note: 'Order submitted by client'
  })

  return {
    order: updatedOrder,
    billing,
    amountDue: billing.amountDue,
    imageCreditsApplied: billing.freeCreditsUsed,
    paymentRequired: billing.paymentRequired
  }
}

export async function assignEditor(context: RequestContext, input: AssignEditorInput) {
  if (!isAdmin(context)) {
    throw new AppError(403, 'Forbidden')
  }

  const order = await findActiveOrder(input.orderId)
  await ensureUserRole(input.editorId, 'EDITOR')

  if (!ASSIGNABLE_ORDER_STATUSES.includes(order.status)) {
    throw new AppError(400, 'Editor can only be assigned while order is pending')
  }

  const previousStatus = order.status
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      assignedEditorId: input.editorId,
      status: 'ASSIGNED'
    },
    select: orderSelect
  })

  await recordWorkflowEvent({
    orderId: order.id,
    actorId: context.userId,
    eventType: 'EDITOR_ASSIGNED',
    payload: {
      editorId: input.editorId,
      fromStatus: previousStatus,
      toStatus: 'ASSIGNED'
    }
  })

  const editor = await prisma.user.findFirst({
    where: { id: input.editorId },
    select: { name: true, email: true }
  })
  const editorLabel = editor?.name ?? editor?.email ?? 'editor'
  await createSystemOrderComment(order.id, `${order.orderNumber}: Order assigned to ${editorLabel}`, context.userId)

  await sendEditorAssignmentEmail({
    orderId: order.id,
    orderNumber: order.orderNumber,
    editorId: input.editorId,
    customerName: order.createdBy.name ?? order.createdBy.email,
    service: order.items.map((item) => item.service?.name).filter(Boolean).join(', ') || 'Custom services',
    dueAt: order.dueAt
  })

  return updated
}

export async function assignQa(context: RequestContext, input: AssignQaInput) {
  if (!isAdmin(context)) {
    throw new AppError(403, 'Forbidden')
  }

  const order = await findActiveOrder(input.orderId)
  await ensureUserRole(input.qaId, 'QA')

  if (!QA_ASSIGNABLE_STATUSES.includes(order.status)) {
    throw new AppError(400, 'QA cannot be assigned after delivery')
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      assignedQaId: input.qaId
    },
    select: orderSelect
  })

  await recordWorkflowEvent({
    orderId: order.id,
    actorId: context.userId,
    eventType: 'QA_ASSIGNED',
    payload: {
      qaId: input.qaId,
      orderStatus: order.status
    }
  })

  const qaUser = await prisma.user.findFirst({
    where: { id: input.qaId },
    select: { name: true, email: true }
  })
  const qaLabel = qaUser?.name ?? qaUser?.email ?? 'QA reviewer'
  await createSystemOrderComment(order.id, `${order.orderNumber}: QA reviewer assigned: ${qaLabel}`, context.userId)

  await sendQaAssignmentEmail({
    orderId: order.id,
    orderNumber: order.orderNumber,
    qaId: input.qaId,
    customerName: order.createdBy.name ?? order.createdBy.email,
    service: order.items.map((item) => item.service?.name).filter(Boolean).join(', ') || 'Custom services'
  })

  return updated
}

async function buildListWhere(context: RequestContext, query: ListOrdersQuery): Promise<Prisma.OrderWhereInput> {
  const base: Prisma.OrderWhereInput = {
    isDeleted: false,
    ...(query.organizationId ? { organizationId: query.organizationId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { orderNumber: { contains: query.search, mode: 'insensitive' } },
            { title: { contains: query.search, mode: 'insensitive' } }
          ]
        }
      : {})
  }

  if (isAdmin(context)) {
    if (query.scope === 'client') {
      return { ...base, createdBy: { role: 'CLIENT' } }
    }

    if (query.scope === 'editor') {
      return { ...base, assignedEditorId: { not: null } }
    }

    if (!query.status) {
      return {
        ...base,
        status: { notIn: ['DRAFT', 'SUBMITTED', 'UPLOADED'] }
      }
    }

    return base
  }

  if (query.scope && query.scope !== roleScope(context.role)) {
    throw new AppError(403, 'Forbidden')
  }

  if (context.role === 'CLIENT') {
    if (query.organizationId) {
      await ensureOrganizationAccess(context, query.organizationId)
      return base
    }

    const organizationIds = await getUserOrganizationIds(context.userId)
    return { ...base, organizationId: { in: organizationIds } }
  }

  if (context.role === 'EDITOR') {
    return {
      ...base,
      assignedEditorId: context.userId,
      ...(!query.status ? { status: { notIn: ['DRAFT', 'SUBMITTED', 'UPLOADED'] } } : {})
    }
  }

  if (context.role === 'QA') {
    return {
      ...base,
      assignedQaId: context.userId,
      ...(!query.status ? { status: { in: ['READY_FOR_QA', 'REVISION_REQUIRED', 'DELIVERED'] } } : {})
    }
  }

  return { ...base, id: '__never__' }
}

function roleScope(role: RequestContext['role']) {
  if (role === 'CLIENT') return 'client'
  if (role === 'EDITOR') return 'editor'
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return 'admin'
  return undefined
}

async function findActiveOrder(orderId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      isDeleted: false
    },
    select: orderSelect
  })

  if (!order) {
    throw new AppError(404, 'Order not found')
  }

  return order
}

async function ensureCanViewOrder(
  context: RequestContext,
  order: Awaited<ReturnType<typeof findActiveOrder>>
) {
  if (isAdmin(context)) {
    return
  }

  if (context.role === 'CLIENT') {
    await ensureOrganizationAccess(context, order.organizationId)
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

async function ensureCanUpdateStatus(
  context: RequestContext,
  order: Awaited<ReturnType<typeof findActiveOrder>>,
  status: OrderStatus
) {
  if (isAdmin(context)) {
    return
  }

  if (context.role === 'CLIENT' && CLIENT_STATUS_UPDATES.includes(status)) {
    await ensureOrganizationAccess(context, order.organizationId)
    return
  }

  if (
    context.role === 'EDITOR' &&
    order.assignedEditorId === context.userId &&
    EDITOR_STATUS_UPDATES.includes(status)
  ) {
    return
  }

  if (context.role === 'QA' && order.assignedQaId === context.userId && QA_STATUS_UPDATES.includes(status)) {
    return
  }

  throw new AppError(403, 'Forbidden')
}

async function ensureOrganizationAccess(context: RequestContext, organizationId: string) {
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      isActive: true
    },
    select: { id: true }
  })

  if (!organization) {
    throw new AppError(404, 'Organization not found')
  }

  if (isAdmin(context)) {
    return
  }

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

async function ensureCategoryExists(categoryId: string | undefined) {
  if (!categoryId) {
    return
  }

  const category = await prisma.serviceCategory.findUnique({
    where: { id: categoryId },
    select: { id: true }
  })

  if (!category) {
    throw new AppError(404, 'Category not found')
  }
}

export async function requestOrderRevision(context: RequestContext, input: RequestOrderRevisionInput) {
  const order = await findActiveOrder(input.orderId)

  if (context.role !== 'QA' || order.assignedQaId !== context.userId) {
    throw new AppError(403, 'Forbidden')
  }

  if (order.status !== 'READY_FOR_QA') {
    throw new AppError(400, 'Revisions can only be requested while the order is ready for QA')
  }

  const nextReviewRound = order.reviewRound + 1

  const updated = await prisma.$transaction(async (tx) => {
    await tx.asset.updateMany({
      where: {
        orderId: order.id,
        reviewRound: order.reviewRound,
        isDeleted: false
      },
      data: {
        isCurrent: false,
        qaNotes: {
          title: input.title,
          comment: input.comment,
          reviewRound: order.reviewRound,
          requestedAt: new Date().toISOString()
        }
      }
    })

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: 'REVISION_REQUIRED',
        reviewRound: nextReviewRound
      },
      select: orderSelect
    })
  })

  await recordWorkflowEvent({
    orderId: order.id,
    actorId: context.userId,
    eventType: 'REVISION_REQUESTED',
    payload: {
      title: input.title,
      comment: input.comment,
      reviewRound: order.reviewRound,
      nextReviewRound,
      fromStatus: 'READY_FOR_QA',
      toStatus: 'REVISION_REQUIRED',
      assetId: input.assetId
    }
  })

  await createRevisionOrderComment(context, {
    orderId: order.id,
    title: input.title,
    comment: input.comment,
    assetId: input.assetId,
    attachmentStorageKey: input.attachmentStorageKey,
    attachmentFileName: input.attachmentFileName,
    attachmentMimeType: input.attachmentMimeType
  })

  await sendRevisionRequestedEmails(updated)
  await sendReworkRequiredEmails({
    orderId: order.id,
    orderNumber: order.orderNumber,
    editorId: order.assignedEditorId,
    qaComment: input.comment
  })

  return updated
}

async function ensureOrderHasDeliverables(orderId: string) {
  const batch = await getActiveBatchContext(orderId)
  const assetCount = await countActiveBatchDeliverables(orderId, batch, ['READY', 'DELIVERED'])

  if (assetCount === 0) {
    throw new AppError(400, 'At least one current deliverable is required before delivery.')
  }
}

async function ensureUserRole(userId: string, role: 'EDITOR' | 'QA') {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role,
      isActive: true
    },
    select: { id: true }
  })

  if (!user) {
    throw new AppError(404, `${role === 'EDITOR' ? 'Editor' : 'QA user'} not found`)
  }
}

async function getUserOrganizationIds(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: { organizationId: true }
  })

  return memberships.map((membership) => membership.organizationId)
}

function mapItemsForQuote(
  items: CreateOrderInput['items'],
  context: RequestContext
): NonNullable<CreateOrderInput['items']> {
  if (!items || items.length === 0) {
    return []
  }

  return items.map((item) => ({
    serviceId: item.serviceId,
    quantity: item.quantity,
    unitPrice: isAdmin(context) ? item.unitPrice : undefined,
    notes: item.notes
  }))
}
