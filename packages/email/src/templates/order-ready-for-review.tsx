import React from 'react'
import { Text } from '@react-email/components'
import type { EmailBrandConfig, LocalizedEmailCopy } from '../types'
import { EmailButton } from './components/email-button'
import { EmailDetailList } from './components/email-detail-list'
import { EmailLayout } from './components/email-layout'

export type OrderReadyForReviewEmailCopy = LocalizedEmailCopy & {
  preview: string
  title: string
  greeting: string
  body: string
  ctaLabel: string
}

export type OrderReadyForReviewEmailProps = {
  brand: EmailBrandConfig
  copy: OrderReadyForReviewEmailCopy
  orderNumber: string
  orderUrl: string
}

export function OrderReadyForReviewEmail({
  brand,
  copy,
  orderNumber,
  orderUrl
}: OrderReadyForReviewEmailProps) {
  return (
    <EmailLayout brand={brand} preview={copy.preview} title={copy.title}>
      <Text style={paragraphStyle}>{copy.greeting}</Text>
      <Text style={paragraphStyle}>{copy.body}</Text>
      <EmailDetailList items={[{ label: 'Order number', value: orderNumber }]} />
      <EmailButton href={orderUrl} label={copy.ctaLabel} />
    </EmailLayout>
  )
}

const paragraphStyle = {
  color: '#3f3f46',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px'
}

export const defaultOrderReadyForReviewEmailCopy = (
  recipientName: string
): OrderReadyForReviewEmailCopy => ({
  preview: 'Your order is ready for review',
  title: 'Your order is ready for review',
  greeting: `Hi ${recipientName},`,
  body: 'Production is complete and your order has entered final review before delivery.',
  ctaLabel: 'View order'
})
