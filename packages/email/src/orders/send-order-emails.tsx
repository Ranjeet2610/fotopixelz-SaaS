import React from 'react'
import { sendEmail, type EmailTransportConfig } from '../send-email'
import {
  InternalOrderNoticeEmail,
  type InternalOrderNoticeEmailCopy
} from '../templates/internal-order-notice'
import type { EmailDetailItem } from '../templates/components/email-detail-list'
import {
  OrderConfirmationEmail,
  defaultOrderConfirmationEmailCopy,
  type OrderConfirmationEmailCopy
} from '../templates/order-confirmation'
import {
  OrderDeliveredEmail,
  defaultOrderDeliveredEmailCopy,
  type OrderDeliveredEmailCopy
} from '../templates/order-delivered'
import {
  OrderReadyForReviewEmail,
  defaultOrderReadyForReviewEmailCopy,
  type OrderReadyForReviewEmailCopy
} from '../templates/order-ready-for-review'
import {
  RevisionCompletedEmail,
  defaultRevisionCompletedEmailCopy,
  type RevisionCompletedEmailCopy
} from '../templates/revision-completed'
import {
  RevisionRequestedEmail,
  defaultRevisionRequestedEmailCopy,
  type RevisionRequestedEmailCopy
} from '../templates/revision-requested'
import type { EmailBrandConfig } from '../types'
import { formatRecipientName } from '../utils'

export type OrderEmailContext = {
  transport: EmailTransportConfig
  brand: EmailBrandConfig
}

export type SendOrderConfirmationEmailInput = {
  to: string
  recipientName?: string | null
  orderNumber: string
  services: string
  totalImages: number
  estimatedTurnaround: string
  copy?: OrderConfirmationEmailCopy
}

export async function sendOrderConfirmationEmail(
  ctx: OrderEmailContext,
  input: SendOrderConfirmationEmailInput
) {
  const recipientName = formatRecipientName(input.recipientName)
  const copy = input.copy ?? defaultOrderConfirmationEmailCopy(recipientName)

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: `Order Received – ${input.orderNumber}`,
    react: (
      <OrderConfirmationEmail
        brand={ctx.brand}
        copy={copy}
        orderNumber={input.orderNumber}
        services={input.services}
        totalImages={input.totalImages}
        estimatedTurnaround={input.estimatedTurnaround}
      />
    ),
    tags: [{ name: 'category', value: 'order_confirmation' }]
  })
}

export type SendOrderReadyForReviewEmailInput = {
  to: string
  recipientName?: string | null
  orderNumber: string
  orderUrl: string
  copy?: OrderReadyForReviewEmailCopy
}

export async function sendOrderReadyForReviewEmail(
  ctx: OrderEmailContext,
  input: SendOrderReadyForReviewEmailInput
) {
  const recipientName = formatRecipientName(input.recipientName)
  const copy = input.copy ?? defaultOrderReadyForReviewEmailCopy(recipientName)

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: 'Your Order Is Ready for Review',
    react: (
      <OrderReadyForReviewEmail
        brand={ctx.brand}
        copy={copy}
        orderNumber={input.orderNumber}
        orderUrl={input.orderUrl}
      />
    ),
    tags: [{ name: 'category', value: 'order_ready_for_review' }]
  })
}

export type SendOrderDeliveredEmailInput = {
  to: string
  recipientName?: string | null
  orderNumber: string
  downloadUrl: string
  downloadExpiryNote?: string
  copy?: OrderDeliveredEmailCopy
}

export async function sendOrderDeliveredEmail(
  ctx: OrderEmailContext,
  input: SendOrderDeliveredEmailInput
) {
  const recipientName = formatRecipientName(input.recipientName)
  const copy = input.copy ?? defaultOrderDeliveredEmailCopy(recipientName)

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: 'Your Images Are Ready',
    react: (
      <OrderDeliveredEmail
        brand={ctx.brand}
        copy={copy}
        orderNumber={input.orderNumber}
        downloadUrl={input.downloadUrl}
        downloadExpiryNote={input.downloadExpiryNote}
      />
    ),
    tags: [{ name: 'category', value: 'order_delivered' }]
  })
}

export type SendRevisionRequestedEmailInput = {
  to: string
  recipientName?: string | null
  orderNumber: string
  copy?: RevisionRequestedEmailCopy
}

export async function sendRevisionRequestedEmail(
  ctx: OrderEmailContext,
  input: SendRevisionRequestedEmailInput
) {
  const recipientName = formatRecipientName(input.recipientName)
  const copy = input.copy ?? defaultRevisionRequestedEmailCopy(recipientName)

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: 'Revision Request Received',
    react: <RevisionRequestedEmail brand={ctx.brand} copy={copy} orderNumber={input.orderNumber} />,
    tags: [{ name: 'category', value: 'revision_requested' }]
  })
}

export type SendRevisionCompletedEmailInput = {
  to: string
  recipientName?: string | null
  orderNumber: string
  copy?: RevisionCompletedEmailCopy
}

export async function sendRevisionCompletedEmail(
  ctx: OrderEmailContext,
  input: SendRevisionCompletedEmailInput
) {
  const recipientName = formatRecipientName(input.recipientName)
  const copy = input.copy ?? defaultRevisionCompletedEmailCopy(recipientName)

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: 'Your Revision Has Been Completed',
    react: <RevisionCompletedEmail brand={ctx.brand} copy={copy} orderNumber={input.orderNumber} />,
    tags: [{ name: 'category', value: 'revision_completed' }]
  })
}

export type SendEditorAssignedEmailInput = {
  to: string
  recipientName?: string | null
  orderNumber: string
  customerName: string
  service: string
  dueLabel: string
  orderUrl: string
}

export async function sendEditorAssignedEmail(
  ctx: OrderEmailContext,
  input: SendEditorAssignedEmailInput
) {
  const recipientName = formatRecipientName(input.recipientName)
  const details: EmailDetailItem[] = [
    { label: 'Order number', value: input.orderNumber },
    { label: 'Customer', value: input.customerName },
    { label: 'Service', value: input.service },
    { label: 'Due', value: input.dueLabel }
  ]
  const copy: InternalOrderNoticeEmailCopy = {
    preview: 'New order assigned to you',
    title: 'New order assigned',
    greeting: `Hi ${recipientName},`,
    body: 'A new order has been assigned to you for editing.',
    ctaLabel: 'Open order'
  }

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: 'New Order Assigned',
    react: (
      <InternalOrderNoticeEmail brand={ctx.brand} copy={copy} details={details} orderUrl={input.orderUrl} />
    ),
    tags: [{ name: 'category', value: 'editor_assigned' }]
  })
}

export type SendQaAssignedEmailInput = {
  to: string
  recipientName?: string | null
  orderNumber: string
  customerName: string
  service: string
  orderUrl: string
}

export async function sendQaAssignedEmail(ctx: OrderEmailContext, input: SendQaAssignedEmailInput) {
  const recipientName = formatRecipientName(input.recipientName)
  const details: EmailDetailItem[] = [
    { label: 'Order number', value: input.orderNumber },
    { label: 'Customer', value: input.customerName },
    { label: 'Service', value: input.service }
  ]
  const copy: InternalOrderNoticeEmailCopy = {
    preview: 'An order is ready for your QA review',
    title: 'Order ready for QA',
    greeting: `Hi ${recipientName},`,
    body: 'An order has been assigned to you for QA review.',
    ctaLabel: 'Review order'
  }

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: 'Order Ready For QA',
    react: (
      <InternalOrderNoticeEmail brand={ctx.brand} copy={copy} details={details} orderUrl={input.orderUrl} />
    ),
    tags: [{ name: 'category', value: 'qa_assigned' }]
  })
}

export type SendReworkRequiredEmailInput = {
  to: string
  recipientName?: string | null
  orderNumber: string
  qaComment?: string
  orderUrl: string
}

export async function sendReworkRequiredEmail(
  ctx: OrderEmailContext,
  input: SendReworkRequiredEmailInput
) {
  const recipientName = formatRecipientName(input.recipientName)
  const details: EmailDetailItem[] = [{ label: 'Order number', value: input.orderNumber }]
  const copy: InternalOrderNoticeEmailCopy = {
    preview: 'Rework required on an order',
    title: 'Rework required',
    greeting: `Hi ${recipientName},`,
    body: 'QA has sent this order back for rework.',
    ctaLabel: 'Open order',
    comment: input.qaComment ? `QA comments: ${input.qaComment}` : undefined
  }

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: 'Rework Required',
    react: (
      <InternalOrderNoticeEmail brand={ctx.brand} copy={copy} details={details} orderUrl={input.orderUrl} />
    ),
    tags: [{ name: 'category', value: 'rework_required' }]
  })
}

export type SendAdminNewOrderEmailInput = {
  to: string | string[]
  customerName: string
  orderNumber: string
  service: string
  totalImages: number
  orderUrl: string
}

export async function sendAdminNewOrderEmail(
  ctx: OrderEmailContext,
  input: SendAdminNewOrderEmailInput
) {
  const details: EmailDetailItem[] = [
    { label: 'Customer', value: input.customerName },
    { label: 'Order number', value: input.orderNumber },
    { label: 'Service', value: input.service },
    { label: 'Total images', value: String(input.totalImages) }
  ]
  const copy: InternalOrderNoticeEmailCopy = {
    preview: 'A new order was placed',
    title: 'New order received',
    greeting: 'Hi,',
    body: 'A new order was just placed.',
    ctaLabel: 'View order'
  }

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: 'New Order Received',
    react: (
      <InternalOrderNoticeEmail brand={ctx.brand} copy={copy} details={details} orderUrl={input.orderUrl} />
    ),
    tags: [{ name: 'category', value: 'admin_new_order' }]
  })
}
