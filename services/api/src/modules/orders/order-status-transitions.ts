import type { Role } from '@repo/auth'
import type { OrderStatus } from './orders.types'

const EDITOR_TRANSITIONS: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['READY_FOR_QA'],
  REVISION_REQUIRED: ['IN_PROGRESS', 'READY_FOR_QA']
}

const QA_TRANSITIONS: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  READY_FOR_QA: ['DELIVERED', 'REVISION_REQUIRED']
}

export function assertAllowedStatusTransition(
  role: Role,
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
) {
  if (currentStatus === nextStatus) {
    return
  }

  const allowed =
    role === 'EDITOR'
      ? EDITOR_TRANSITIONS[currentStatus]
      : role === 'QA'
        ? QA_TRANSITIONS[currentStatus]
        : undefined

  if (!allowed?.includes(nextStatus)) {
    throw new Error(`Cannot move order from ${currentStatus} to ${nextStatus}`)
  }
}
