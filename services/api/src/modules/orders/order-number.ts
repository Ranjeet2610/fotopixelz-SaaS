import { prisma } from '../../database/prisma'

export async function generateOrderNumber(createdAt = new Date()) {
  const year = createdAt.getUTCFullYear()
  const prefix = `FP-${year}-`

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const latest = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        orderNumber: 'desc'
      },
      select: {
        orderNumber: true
      }
    })

    const nextSequence = latest ? Number(latest.orderNumber.slice(-6)) + 1 : 1
    const orderNumber = `${prefix}${String(nextSequence).padStart(6, '0')}`

    const existing = await prisma.order.findFirst({
      where: { orderNumber },
      select: { id: true }
    })

    if (!existing) {
      return orderNumber
    }
  }

  throw new Error('Unable to generate a unique order number')
}

export function isPreUploadOrderStatus(status: string) {
  return status === 'DRAFT' || status === 'SUBMITTED'
}
