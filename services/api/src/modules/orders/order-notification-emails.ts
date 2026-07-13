import {
  logEmailEvent,
  sendAdminNewOrderEmail,
  sendEditorAssignedEmail,
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
  sendOrderReadyForReviewEmail,
  sendQaAssignedEmail,
  sendReworkRequiredEmail,
  sendRevisionCompletedEmail,
  sendRevisionRequestedEmail
} from '@repo/email'
import { prisma } from '../../database/prisma'
import { buildAdminOrderUrl, buildOrderUrl, getAuthEmailContext } from '../../config/email'
import { env } from '../../config/env'

type OrderSummary = {
  id: string
  orderNumber: string
  totalImages: number
  dueAt: Date | null
  createdBy: { name: string | null; email: string }
  items: { quantity: number; service: { name: string } | null }[]
}

function formatServices(items: OrderSummary['items']) {
  const names = items.map((item) => item.service?.name).filter((name): name is string => Boolean(name))
  return names.length > 0 ? Array.from(new Set(names)).join(', ') : 'Custom services'
}

function formatTurnaround(dueAt: Date | null) {
  return dueAt ? dueAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'To be confirmed'
}

async function findUserContact(userId: string | null) {
  if (!userId) return null
  return prisma.user.findFirst({ where: { id: userId }, select: { name: true, email: true } })
}

export async function sendOrderPlacedEmails(order: OrderSummary) {
  const ctx = getAuthEmailContext()

  try {
    await sendOrderConfirmationEmail(ctx, {
      to: order.createdBy.email,
      recipientName: order.createdBy.name,
      orderNumber: order.orderNumber,
      services: formatServices(order.items),
      totalImages: order.totalImages,
      estimatedTurnaround: formatTurnaround(order.dueAt)
    })
  } catch (error) {
    logEmailEvent('error', 'Order confirmation email dispatch failed', {
      orderId: order.id,
      message: error instanceof Error ? error.message : 'unknown_error'
    })
  }

  try {
    const adminTo = env.adminNotificationEmail
      ? [env.adminNotificationEmail]
      : (
          await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
            select: { email: true }
          })
        ).map((admin) => admin.email)

    if (adminTo.length > 0) {
      await sendAdminNewOrderEmail(ctx, {
        to: adminTo,
        customerName: order.createdBy.name ?? order.createdBy.email,
        orderNumber: order.orderNumber,
        service: formatServices(order.items),
        totalImages: order.totalImages,
        orderUrl: buildAdminOrderUrl(order.id)
      })
    }
  } catch (error) {
    logEmailEvent('error', 'Admin new order email dispatch failed', {
      orderId: order.id,
      message: error instanceof Error ? error.message : 'unknown_error'
    })
  }
}

export async function sendEditorAssignmentEmail(input: {
  orderId: string
  orderNumber: string
  editorId: string
  customerName: string
  service: string
  dueAt: Date | null
}) {
  try {
    const editor = await findUserContact(input.editorId)
    if (!editor) return

    const ctx = getAuthEmailContext()
    await sendEditorAssignedEmail(ctx, {
      to: editor.email,
      recipientName: editor.name,
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      service: input.service,
      dueLabel: formatTurnaround(input.dueAt),
      orderUrl: buildAdminOrderUrl(input.orderId)
    })
  } catch (error) {
    logEmailEvent('error', 'Editor assignment email dispatch failed', {
      orderId: input.orderId,
      message: error instanceof Error ? error.message : 'unknown_error'
    })
  }
}

export async function sendQaAssignmentEmail(input: {
  orderId: string
  orderNumber: string
  qaId: string
  customerName: string
  service: string
}) {
  try {
    const qaUser = await findUserContact(input.qaId)
    if (!qaUser) return

    const ctx = getAuthEmailContext()
    await sendQaAssignedEmail(ctx, {
      to: qaUser.email,
      recipientName: qaUser.name,
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      service: input.service,
      orderUrl: buildAdminOrderUrl(input.orderId)
    })
  } catch (error) {
    logEmailEvent('error', 'QA assignment email dispatch failed', {
      orderId: input.orderId,
      message: error instanceof Error ? error.message : 'unknown_error'
    })
  }
}

export async function sendOrderReadyForReviewEmails(order: OrderSummary) {
  try {
    const ctx = getAuthEmailContext()
    await sendOrderReadyForReviewEmail(ctx, {
      to: order.createdBy.email,
      recipientName: order.createdBy.name,
      orderNumber: order.orderNumber,
      orderUrl: buildOrderUrl(order.id)
    })
  } catch (error) {
    logEmailEvent('error', 'Order ready-for-review email dispatch failed', {
      orderId: order.id,
      message: error instanceof Error ? error.message : 'unknown_error'
    })
  }
}

export async function sendOrderDeliveredEmails(order: OrderSummary) {
  try {
    const ctx = getAuthEmailContext()
    await sendOrderDeliveredEmail(ctx, {
      to: order.createdBy.email,
      recipientName: order.createdBy.name,
      orderNumber: order.orderNumber,
      downloadUrl: buildOrderUrl(order.id),
      downloadExpiryNote: 'Sign in to your dashboard to view and download your delivered images.'
    })
  } catch (error) {
    logEmailEvent('error', 'Order delivered email dispatch failed', {
      orderId: order.id,
      message: error instanceof Error ? error.message : 'unknown_error'
    })
  }
}

export async function sendRevisionRequestedEmails(order: OrderSummary) {
  try {
    const ctx = getAuthEmailContext()
    await sendRevisionRequestedEmail(ctx, {
      to: order.createdBy.email,
      recipientName: order.createdBy.name,
      orderNumber: order.orderNumber
    })
  } catch (error) {
    logEmailEvent('error', 'Revision requested email dispatch failed', {
      orderId: order.id,
      message: error instanceof Error ? error.message : 'unknown_error'
    })
  }
}

export async function sendReworkRequiredEmails(input: {
  orderId: string
  orderNumber: string
  editorId: string | null
  qaComment?: string
}) {
  try {
    const editor = await findUserContact(input.editorId)
    if (!editor) return

    const ctx = getAuthEmailContext()
    await sendReworkRequiredEmail(ctx, {
      to: editor.email,
      recipientName: editor.name,
      orderNumber: input.orderNumber,
      qaComment: input.qaComment,
      orderUrl: buildAdminOrderUrl(input.orderId)
    })
  } catch (error) {
    logEmailEvent('error', 'Rework required email dispatch failed', {
      orderId: input.orderId,
      message: error instanceof Error ? error.message : 'unknown_error'
    })
  }
}

export async function sendRevisionCompletedEmails(order: OrderSummary) {
  try {
    const ctx = getAuthEmailContext()
    await sendRevisionCompletedEmail(ctx, {
      to: order.createdBy.email,
      recipientName: order.createdBy.name,
      orderNumber: order.orderNumber
    })
  } catch (error) {
    logEmailEvent('error', 'Revision completed email dispatch failed', {
      orderId: order.id,
      message: error instanceof Error ? error.message : 'unknown_error'
    })
  }
}
