import type { Prisma } from '@prisma/client'
import { requireRole } from '@repo/auth'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type {
  AssignEditorInput,
  AssignQaInput,
  CreateOrderInput,
  ListOrdersQuery,
  OrderStatus,
  RequestContext,
  UpdateOrderInput,
  UpdateOrderStatusInput
} from './orders.types'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const
const CREATE_ROLES = ['CLIENT', 'ADMIN', 'SUPER_ADMIN'] as const
const CLIENT_STATUS_UPDATES: readonly OrderStatus[] = ['DRAFT', 'UPLOADED', 'PENDING', 'CANCELLED']
const EDITOR_STATUS_UPDATES: readonly OrderStatus[] = ['IN_PROGRESS', 'READY_FOR_QA']
const QA_STATUS_UPDATES: readonly OrderStatus[] = ['REVISION_REQUIRED', 'APPROVED']

const orderSelect = {
  id: true,
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

  return prisma.order.create({
    data: {
      organizationId: input.organizationId,
      createdById: context.userId,
      categoryId: input.categoryId ?? null,
      title: input.title,
      instructions: input.instructions ?? null,
      totalImages: input.totalImages,
      creditsUsed: input.creditsUsed,
      totalAmount: input.totalAmount ?? 0,
      priority: input.priority,
      dueDate: input.dueDate ?? null,
      dueAt: input.dueDate ?? null,
      status: 'DRAFT'
    },
    select: orderSelect
  })
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

  return prisma.order.update({
    where: { id: order.id },
    data: {
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
      ...(input.totalImages !== undefined ? { totalImages: input.totalImages } : {}),
      ...(input.creditsUsed !== undefined ? { creditsUsed: input.creditsUsed } : {}),
      ...(input.totalAmount !== undefined ? { totalAmount: input.totalAmount } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate, dueAt: input.dueDate } : {})
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

  return prisma.order.update({
    where: { id: order.id },
    data: { status: input.status },
    select: orderSelect
  })
}

export async function assignEditor(context: RequestContext, input: AssignEditorInput) {
  if (!isAdmin(context)) {
    throw new AppError(403, 'Forbidden')
  }

  const order = await findActiveOrder(input.orderId)
  await ensureUserRole(input.editorId, 'EDITOR')

  return prisma.order.update({
    where: { id: order.id },
    data: {
      assignedEditorId: input.editorId,
      status: 'ASSIGNED'
    },
    select: orderSelect
  })
}

export async function assignQa(context: RequestContext, input: AssignQaInput) {
  if (!isAdmin(context)) {
    throw new AppError(403, 'Forbidden')
  }

  const order = await findActiveOrder(input.orderId)
  await ensureUserRole(input.qaId, 'QA')

  return prisma.order.update({
    where: { id: order.id },
    data: {
      assignedQaId: input.qaId
    },
    select: orderSelect
  })
}

async function buildListWhere(context: RequestContext, query: ListOrdersQuery): Promise<Prisma.OrderWhereInput> {
  const base: Prisma.OrderWhereInput = {
    isDeleted: false,
    ...(query.organizationId ? { organizationId: query.organizationId } : {}),
    ...(query.status ? { status: query.status } : {})
  }

  if (isAdmin(context)) {
    if (query.scope === 'client') {
      return { ...base, createdBy: { role: 'CLIENT' } }
    }

    if (query.scope === 'editor') {
      return { ...base, assignedEditorId: { not: null } }
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
    return { ...base, assignedEditorId: context.userId }
  }

  if (context.role === 'QA') {
    return { ...base, assignedQaId: context.userId }
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
