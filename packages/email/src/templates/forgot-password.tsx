import { Text } from '@react-email/components'
import type { EmailBrandConfig, LocalizedEmailCopy } from '../types'
import { EmailButton } from './components/email-button'
import { EmailLayout } from './components/email-layout'

export type ForgotPasswordEmailCopy = LocalizedEmailCopy & {
  preview: string
  title: string
  greeting: string
  body: string
  ctaLabel: string
  expiryNote: string
}

export type ForgotPasswordEmailProps = {
  brand: EmailBrandConfig
  copy: ForgotPasswordEmailCopy
  resetUrl: string
}

export function ForgotPasswordEmail({ brand, copy, resetUrl }: ForgotPasswordEmailProps) {
  return (
    <EmailLayout brand={brand} preview={copy.preview} title={copy.title}>
      <Text style={paragraphStyle}>{copy.greeting}</Text>
      <Text style={paragraphStyle}>{copy.body}</Text>
      <EmailButton href={resetUrl} label={copy.ctaLabel} />
      <Text style={noteStyle}>{copy.expiryNote}</Text>
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
  margin: '20px 0 0'
}

export const defaultForgotPasswordEmailCopy = (recipientName: string): ForgotPasswordEmailCopy => ({
  preview: 'Reset your password',
  title: 'Reset your password',
  greeting: `Hi ${recipientName},`,
  body: 'We received a request to reset your password. Use the button below to choose a new one.',
  ctaLabel: 'Reset password',
  expiryNote: 'This link expires in 1 hour. If you did not request a reset, you can safely ignore this email.'
})
