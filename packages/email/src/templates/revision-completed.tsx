import React from 'react'
import { Text } from '@react-email/components'
import type { EmailBrandConfig, LocalizedEmailCopy } from '../types'
import { EmailDetailList } from './components/email-detail-list'
import { EmailLayout } from './components/email-layout'

export type RevisionCompletedEmailCopy = LocalizedEmailCopy & {
  preview: string
  title: string
  greeting: string
  body: string
  closing: string
}

export type RevisionCompletedEmailProps = {
  brand: EmailBrandConfig
  copy: RevisionCompletedEmailCopy
  orderNumber: string
}

export function RevisionCompletedEmail({ brand, copy, orderNumber }: RevisionCompletedEmailProps) {
  return (
    <EmailLayout brand={brand} preview={copy.preview} title={copy.title}>
      <Text style={paragraphStyle}>{copy.greeting}</Text>
      <Text style={paragraphStyle}>{copy.body}</Text>
      <EmailDetailList items={[{ label: 'Order number', value: orderNumber }]} />
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

export const defaultRevisionCompletedEmailCopy = (recipientName: string): RevisionCompletedEmailCopy => ({
  preview: 'Your revision has been completed',
  title: 'Your revision has been completed',
  greeting: `Hi ${recipientName},`,
  body: 'The requested revisions are complete and your order is back in final review.',
  closing: "We'll let you know as soon as it's ready for delivery."
})
