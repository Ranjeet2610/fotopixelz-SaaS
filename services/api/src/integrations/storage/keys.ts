import crypto from 'node:crypto'

export function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file'
}

export function createUploadStorageKey(input: {
  organizationId: string
  orderId: string
  fileName: string
}) {
  return `uploads/${input.organizationId}/${input.orderId}/${crypto.randomUUID()}-${sanitizeFileName(input.fileName)}`
}

export function createDeliverableStorageKey(input: {
  organizationId: string
  orderId: string
  fileName: string
}) {
  return `deliverables/${input.organizationId}/${input.orderId}/${crypto.randomUUID()}-${sanitizeFileName(input.fileName)}`
}
