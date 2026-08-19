import React from 'react'
import { Text } from '@react-email/components'
import type { EmailBrandConfig, LocalizedEmailCopy } from '../types'
import { EmailLayout } from './components/email-layout'

export type WelcomeEmailCopy = LocalizedEmailCopy & {
  preview: string
  title: string
  greeting: string
  body: string
  closing: string
}

export type WelcomeEmailProps = {
  brand: EmailBrandConfig
  copy: WelcomeEmailCopy
}

export function WelcomeEmail({ brand, copy }: WelcomeEmailProps) {
  return (
    <EmailLayout brand={brand} preview={copy.preview} title={copy.title}>
      <Text style={paragraphStyle}>{copy.greeting}</Text>
      <Text style={paragraphStyle}>{copy.body}</Text>
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

export const defaultWelcomeEmailCopy = (recipientName: string): WelcomeEmailCopy => ({
  preview: 'Welcome to Fotopixelz',
  title: 'Welcome aboard',
  greeting: `Hi ${recipientName},`,
  body: 'Your client workspace is ready. You can sign in anytime to create orders, upload assets, and track deliverables.',
  closing: 'We are glad to have you with us.'
})
