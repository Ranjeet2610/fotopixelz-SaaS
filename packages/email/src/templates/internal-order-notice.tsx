import React from 'react'
import { Text } from '@react-email/components'
import type { EmailBrandConfig, LocalizedEmailCopy } from '../types'
import { EmailButton } from './components/email-button'
import { EmailDetailList, type EmailDetailItem } from './components/email-detail-list'
import { EmailLayout } from './components/email-layout'

export type InternalOrderNoticeEmailCopy = LocalizedEmailCopy & {
  preview: string
  title: string
  greeting: string
  body: string
  ctaLabel: string
  comment?: string
}

export type InternalOrderNoticeEmailProps = {
  brand: EmailBrandConfig
  copy: InternalOrderNoticeEmailCopy
  details: EmailDetailItem[]
  orderUrl: string
}

export function InternalOrderNoticeEmail({
  brand,
  copy,
  details,
  orderUrl
}: InternalOrderNoticeEmailProps) {
  return (
    <EmailLayout brand={brand} preview={copy.preview} title={copy.title}>
      <Text style={paragraphStyle}>{copy.greeting}</Text>
      <Text style={paragraphStyle}>{copy.body}</Text>
      <EmailDetailList items={details} />
      {copy.comment ? <Text style={paragraphStyle}>{copy.comment}</Text> : null}
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
