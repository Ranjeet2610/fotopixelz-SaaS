import React from 'react'
import { Text } from '@react-email/components'
import type { EmailBrandConfig, LocalizedEmailCopy } from '../types'
import { EmailButton } from './components/email-button'
import { EmailDetailList } from './components/email-detail-list'
import { EmailLayout } from './components/email-layout'

export type OrderDeliveredEmailCopy = LocalizedEmailCopy & {
  preview: string
  title: string
  greeting: string
  body: string
  ctaLabel: string
  closing: string
}

export type OrderDeliveredEmailProps = {
  brand: EmailBrandConfig
  copy: OrderDeliveredEmailCopy
  orderNumber: string
  downloadUrl: string
  downloadExpiryNote?: string
}

export function OrderDeliveredEmail({
  brand,
  copy,
  orderNumber,
  downloadUrl,
  downloadExpiryNote
}: OrderDeliveredEmailProps) {
  return (
    <EmailLayout brand={brand} preview={copy.preview} title={copy.title}>
      <Text style={paragraphStyle}>{copy.greeting}</Text>
      <Text style={paragraphStyle}>{copy.body}</Text>
      <EmailDetailList items={[{ label: 'Order number', value: orderNumber }]} />
      <EmailButton href={downloadUrl} label={copy.ctaLabel} />
      {downloadExpiryNote ? <Text style={noteStyle}>{downloadExpiryNote}</Text> : null}
      <Text style={paragraphStyle}>{copy.closing}</Text>
    </EmailLayout>
  )
}

const paragraphStyle = {
  color: '#3f3f46',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px'
}

const noteStyle = {
  color: '#71717a',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '16px 0 0'
}

export const defaultOrderDeliveredEmailCopy = (recipientName: string): OrderDeliveredEmailCopy => ({
  preview: 'Your images are ready',
  title: 'Your images are ready',
  greeting: `Hi ${recipientName},`,
  body: 'Your order has been delivered and your finished images are available now.',
  ctaLabel: 'Download your images',
  closing: 'Thank you for your order — let us know if you need anything else.'
})
