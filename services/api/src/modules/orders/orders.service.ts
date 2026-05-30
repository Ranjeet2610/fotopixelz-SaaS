import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type {
  CreateOrderInput,
  ListOrdersQuery,
  OrderItemInput,
  RequestContext,
  UpdateOrderInput
} from './orders.types'

const orderInclude = {
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
    include: {
      service: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true
        }
      }
    },
    orderBy: { createdAt: 'asc' as const }
  },
  assets: {
    select: {
      id: true,
      fileName: true,
      originalUrl: true,
      status: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: 'desc' as const }
  }
}

type NormalizedOrderItem = {
  serviceId: string
  quantity: number
  unitPrice: number
  notes?: string
}

function isAdmin(role: RequestContext['role']) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

export function getOrdersStatus() {
  return { module: 'orders', status: 'ok' as const }
}

export async function listOrders(context: RequestContext, query: ListOrdersQuery) {
  const where = {
    ...(query.organizationId ? { organizationId: query.organizationId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.createdById ? { createdById: query.createdById } : {}),
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
  }

  const skip = (query.page - 1) * query.limit
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit
    }),
    prisma.order.count({ where })
  ])

  return {
    items: orders,
    page: query.page,
    limit: query.limit,
    total
  }
}

export async function getOrder(context: RequestContext, orderId: string) {
  const order = await prisma.order.findFirst({
    where: accessibleOrderWhere(context, orderId),
    include: orderInclude
  })

  if (!order) {
    throw new AppError(404, 'Order not found')
  }

  return order
}

export async function createOrder(context: RequestContext, input: CreateOrderInput) {
  await ensureActiveOrganizationAccess(context, input.organizationId)

  const items = await normalizeOrderItems(input.items ?? [])
  const totalAmount = calculateTotal(items)

  return prisma.order.create({
    data: {
      organizationId: input.organizationId,
      createdById: context.userId,
      title: input.title,
      status: input.status,
      totalAmount,
      currency: input.currency,
      dueAt: input.dueAt,
      ...(items.length > 0
        ? {
            items: {
              create: items
            }
          }
        : {})
    },
    include: orderInclude
  })
}

export async function updateOrder(context: RequestContext, orderId: string, input: UpdateOrderInput) {
  await ensureOrderAccess(context, orderId)

  if (input.organizationId) {
    await ensureActiveOrganizationAccess(context, input.organizationId)
  }

  const normalizedItems = input.items ? await normalizeOrderItems(input.items) : undefined
  const totalAmount =
    input.totalAmount ?? (normalizedItems ? calculateTotal(normalizedItems) : undefined)

  return prisma.$transaction(async (tx) => {
    if (normalizedItems) {
      await tx.orderItem.deleteMany({ where: { orderId } })
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        organizationId: input.organizationId,
        title: input.title,
        status: input.status,
        totalAmount,
        currency: input.currency,
        dueAt: input.dueAt,
        ...(normalizedItems
          ? {
              items: {
                create: normalizedItems
              }
            }
          : {})
      },
      include: orderInclude
    })
  })
}

export async function deleteOrder(context: RequestContext, orderId: string) {
  await ensureOrderAccess(context, orderId)

  await prisma.$transaction(async (tx) => {
    const assets = await tx.asset.findMany({
      where: { orderId },
      select: { id: true }
    })
    const assetIds = assets.map((asset) => asset.id)

    if (assetIds.length > 0) {
      await tx.assetVersion.deleteMany({ where: { assetId: { in: assetIds } } })
      await tx.editingJob.deleteMany({ where: { assetId: { in: assetIds } } })
      await tx.aiJob.deleteMany({ where: { assetId: { in: assetIds } } })
      await tx.qAReview.deleteMany({ where: { assetId: { in: assetIds } } })
      await tx.asset.deleteMany({ where: { id: { in: assetIds } } })
    }

    await tx.orderItem.deleteMany({ where: { orderId } })
    await tx.revision.deleteMany({ where: { orderId } })
    await tx.payment.deleteMany({ where: { orderId } })
    await tx.invoice.deleteMany({ where: { orderId } })
    await tx.workflowEvent.deleteMany({ where: { orderId } })
    await tx.order.delete({ where: { id: orderId } })
  })
}

function accessibleOrderWhere(context: RequestContext, orderId: string) {
  return {
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
  }
}

async function ensureOrderAccess(context: RequestContext, orderId: string) {
  const order = await prisma.order.findFirst({
    where: accessibleOrderWhere(context, orderId),
    select: { id: true }
  })

  if (!order) {
    throw new AppError(404, 'Order not found')
  }
}

async function ensureActiveOrganizationAccess(context: RequestContext, organizationId: string) {
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      isActive: true,
      ...(isAdmin(context.role)
        ? {}
        : {
            memberships: {
              some: { userId: context.userId }
            }
          })
    },
    select: { id: true }
  })

  if (!organization) {
    throw new AppError(404, 'Organization not found')
  }
}

async function normalizeOrderItems(items: OrderItemInput[]): Promise<NormalizedOrderItem[]> {
  if (items.length === 0) {
    return []
  }

  const services = await prisma.service.findMany({
    where: {
      id: {
        in: items.map((item) => item.serviceId)
      },
      isActive: true
    },
    select: {
      id: true,
      basePrice: true
    }
  })

  const priceByServiceId = new Map(services.map((service) => [service.id, service.basePrice]))

  return items.map((item) => {
    const basePrice = priceByServiceId.get(item.serviceId)
    if (basePrice === undefined) {
      throw new AppError(404, `Service not found: ${item.serviceId}`)
    }

    return {
      serviceId: item.serviceId,
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? basePrice,
      notes: item.notes
    }
  })
}

function calculateTotal(items: NormalizedOrderItem[]) {
  return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
}
