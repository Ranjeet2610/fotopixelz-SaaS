import type { OrderStatus, Prisma, WorkflowEventType } from '@prisma/client'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type { RequestContext } from './workflow.types'

const workflowEventSelect = {
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
} as const

export function getWorkflowStatus() {
  return { module: 'workflow', status: 'ok' as const }
}

export async function recordWorkflowEvent(input: {
  orderId: string
  actorId?: string | null
  eventType: WorkflowEventType
  payload?: Prisma.InputJsonValue
}) {
  return prisma.workflowEvent.create({
    data: {
      orderId: input.orderId,
      actorId: input.actorId ?? null,
      eventType: input.eventType,
      payload: input.payload
    },
    select: workflowEventSelect
  })
}

export async function recordOrderStatusChange(input: {
  orderId: string
  actorId?: string | null
  fromStatus: OrderStatus
  toStatus: OrderStatus
  note?: string
  extraPayload?: Record<string, unknown>
}) {
  return recordWorkflowEvent({
    orderId: input.orderId,
    actorId: input.actorId,
    eventType: resolveStatusEventType(input.fromStatus, input.toStatus),
    payload: {
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      ...(input.note ? { note: input.note } : {}),
      ...(input.extraPayload ?? {})
    }
  })
}

export async function listOrderWorkflowEvents(context: RequestContext, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, isDeleted: false },
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

  await ensureCanViewOrderWorkflow(context, order)

  return prisma.workflowEvent.findMany({
    where: { orderId },
    select: workflowEventSelect,
    orderBy: { createdAt: 'asc' }
  })
}

async function ensureCanViewOrderWorkflow(
  context: RequestContext,
  order: {
    id: string
    organizationId: string
    assignedEditorId: string | null
    assignedQaId: string | null
  }
) {
  if (context.role === 'ADMIN' || context.role === 'SUPER_ADMIN') {
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

export function resolveStatusEventType(fromStatus: OrderStatus, toStatus: OrderStatus): WorkflowEventType {
  if (fromStatus === toStatus) {
    return 'ORDER_STATUS_CHANGED'
  }

  if (toStatus === 'UPLOADED') {
    return 'IMAGES_UPLOADED'
  }

  if (toStatus === 'PENDING' && fromStatus === 'UPLOADED') {
    return 'ORDER_SUBMITTED'
  }

  if (toStatus === 'ASSIGNED') {
    return 'EDITOR_ASSIGNED'
  }

  if (toStatus === 'IN_PROGRESS' && (fromStatus === 'ASSIGNED' || fromStatus === 'REVISION_REQUIRED')) {
    return 'EDITOR_STARTED'
  }

  if (toStatus === 'READY_FOR_QA' && fromStatus === 'REVISION_REQUIRED') {
    return 'REVISION_SUBMITTED'
  }

  if (toStatus === 'READY_FOR_QA') {
    return 'READY_FOR_QA'
  }

  if (toStatus === 'REVISION_REQUIRED') {
    return 'REVISION_REQUESTED'
  }

  if (toStatus === 'DELIVERED' && fromStatus === 'READY_FOR_QA') {
    return 'QA_APPROVED'
  }

  if (toStatus === 'DELIVERED') {
    return 'DELIVERY_SENT'
  }

  if (toStatus === 'APPROVED') {
    return 'QA_APPROVED'
  }

  if (toStatus === 'IN_PROGRESS' && fromStatus === 'READY_FOR_QA') {
    return 'REVISION_REQUESTED'
  }

  return 'ORDER_STATUS_CHANGED'
}
