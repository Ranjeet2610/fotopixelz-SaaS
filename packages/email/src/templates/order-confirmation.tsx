import React from 'react'
import { Text } from '@react-email/components'
import type { EmailBrandConfig, LocalizedEmailCopy } from '../types'
import { EmailDetailList } from './components/email-detail-list'
import { EmailLayout } from './components/email-layout'

export type OrderConfirmationEmailCopy = LocalizedEmailCopy & {
  preview: string
  title: string
  greeting: string
  body: string
  closing: string
}

export type OrderConfirmationEmailProps = {
  brand: EmailBrandConfig
  copy: OrderConfirmationEmailCopy
  orderNumber: string
  services: string
  totalImages: number
  estimatedTurnaround: string
}

export function OrderConfirmationEmail({
  brand,
  copy,
  orderNumber,
  services,
  totalImages,
  estimatedTurnaround
}: OrderConfirmationEmailProps) {
  return (
    <EmailLayout brand={brand} preview={copy.preview} title={copy.title}>
      <Text style={paragraphStyle}>{copy.greeting}</Text>
      <Text style={paragraphStyle}>{copy.body}</Text>
      <EmailDetailList
        items={[
          { label: 'Order number', value: orderNumber },
          { label: 'Services', value: services },
          { label: 'Quantity', value: String(totalImages) },
          { label: 'Estimated turnaround', value: estimatedTurnaround }
        ]}
      />
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

export const defaultOrderConfirmationEmailCopy = (recipientName: string): OrderConfirmationEmailCopy => ({
  preview: 'Your order has been received',
  title: 'Order received',
  greeting: `Hi ${recipientName},`,
  body: "We've received your order and it's now in our queue. Here's a summary of what you sent us.",
  closing: 'Thank you for choosing us — we will notify you as your order moves through production.'
})
