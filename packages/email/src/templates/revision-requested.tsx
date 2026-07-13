import React from 'react'
import { Text } from '@react-email/components'
import type { EmailBrandConfig, LocalizedEmailCopy } from '../types'
import { EmailDetailList } from './components/email-detail-list'
import { EmailLayout } from './components/email-layout'

export type RevisionRequestedEmailCopy = LocalizedEmailCopy & {
  preview: string
  title: string
  greeting: string
  body: string
  closing: string
}

export type RevisionRequestedEmailProps = {
  brand: EmailBrandConfig
  copy: RevisionRequestedEmailCopy
  orderNumber: string
}

export function RevisionRequestedEmail({ brand, copy, orderNumber }: RevisionRequestedEmailProps) {
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

export const defaultRevisionRequestedEmailCopy = (recipientName: string): RevisionRequestedEmailCopy => ({
  preview: 'Your revision request has been received',
  title: 'Revision request received',
  greeting: `Hi ${recipientName},`,
  body: 'Our QA team has flagged your order for revisions and it is back with our editing team.',
  closing: "We'll notify you as soon as the revised images are ready."
})
