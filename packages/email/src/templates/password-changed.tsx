import React from 'react'
import { Text } from '@react-email/components'
import type { EmailBrandConfig, LocalizedEmailCopy } from '../types'
import { EmailLayout } from './components/email-layout'

export type PasswordChangedEmailCopy = LocalizedEmailCopy & {
  preview: string
  title: string
  greeting: string
  body: string
  supportNote: string
}

export type PasswordChangedEmailProps = {
  brand: EmailBrandConfig
  copy: PasswordChangedEmailCopy
}

export function PasswordChangedEmail({ brand, copy }: PasswordChangedEmailProps) {
  return (
    <EmailLayout brand={brand} preview={copy.preview} title={copy.title}>
      <Text style={paragraphStyle}>{copy.greeting}</Text>
      <Text style={paragraphStyle}>{copy.body}</Text>
      <Text style={noteStyle}>{copy.supportNote}</Text>
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
  margin: '0'
}

export const defaultPasswordChangedEmailCopy = (recipientName: string): PasswordChangedEmailCopy => ({
  preview: 'Your password was changed',
  title: 'Password changed',
  greeting: `Hi ${recipientName},`,
  body: 'Your account password was updated successfully. If this was you, no further action is needed.',
  supportNote: 'If you did not make this change, contact support immediately.'
})
