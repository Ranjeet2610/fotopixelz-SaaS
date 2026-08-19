export interface WorkflowEventDTO {
  id: string
  orderId: string
  actorId?: string
  eventType: string
  payload?: Record<string, unknown>
  createdAt?: string
}

export const WORKFLOW_EVENT_LABELS: Record<string, string> = {
  ORDER_CREATED: 'Order created',
  IMAGES_UPLOADED: 'Images uploaded',
  ORDER_SUBMITTED: 'Order submitted',
  EDITOR_ASSIGNED: 'Editor assigned',
  EDITOR_STARTED: 'Editor started work',
  ASSET_UPLOADED: 'Deliverable uploaded',
  QA_ASSIGNED: 'QA reviewer assigned',
  READY_FOR_QA: 'Ready for QA',
  QA_APPROVED: 'QA approved',
  QA_REVISION_REQUESTED: 'QA requested revision',
  DELIVERY_SENT: 'Delivered to client',
  ORDER_STATUS_CHANGED: 'Order status updated',
  // Legacy labels (historical audit rows)
  QA_SUBMITTED: 'QA submitted (legacy)',
  REVISION_REQUESTED: 'Revision requested (legacy)',
  PAYMENT_CONFIRMED: 'Order submitted (legacy)',
  AI_JOB_STARTED: 'AI job started',
  AI_JOB_COMPLETED: 'AI job completed'
}

function payloadText(payload: Record<string, unknown> | undefined, key: string) {
  const value = payload?.[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function describeWorkflowEvent(
  eventType: string,
  payload?: Record<string, unknown> | null
): string {
  const label = WORKFLOW_EVENT_LABELS[eventType] ?? eventType.replaceAll('_', ' ').toLowerCase()
  const fromStatus = payloadText(payload ?? undefined, 'fromStatus')
  const toStatus = payloadText(payload ?? undefined, 'toStatus')
  const note = payloadText(payload ?? undefined, 'note')
  const fileName = payloadText(payload ?? undefined, 'fileName')
  const assetName = payloadText(payload ?? undefined, 'assetName')

  if (eventType === 'ORDER_STATUS_CHANGED' && fromStatus && toStatus) {
    return `${label}: ${fromStatus} → ${toStatus}`
  }

  if (fromStatus && toStatus && fromStatus !== toStatus) {
    return `${label} (${fromStatus} → ${toStatus})`
  }

  if (note) {
    return `${label} — ${note}`
  }

  if (fileName) {
    return `${label}: ${fileName}`
  }

  if (assetName) {
    return `${label}: ${assetName}`
  }

  if (eventType === 'QA_ASSIGNED') {
    return 'QA reviewer assigned to this order'
  }

  return label
}
