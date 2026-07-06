import { Text } from '@react-email/components'
import type { EmailBrandConfig, LocalizedEmailCopy } from '../types'
import { EmailButton } from './components/email-button'
import { EmailLayout } from './components/email-layout'

export type VerifyEmailCopy = LocalizedEmailCopy & {
  preview: string
  title: string
  greeting: string
  body: string
  ctaLabel: string
  expiryNote: string
}

export type VerifyEmailProps = {
  brand: EmailBrandConfig
  copy: VerifyEmailCopy
  verifyUrl: string
}

export function VerifyEmail({ brand, copy, verifyUrl }: VerifyEmailProps) {
  return (
    <EmailLayout brand={brand} preview={copy.preview} title={copy.title}>
      <Text style={paragraphStyle}>{copy.greeting}</Text>
      <Text style={paragraphStyle}>{copy.body}</Text>
      <EmailButton href={verifyUrl} label={copy.ctaLabel} />
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

export const defaultVerifyEmailCopy = (recipientName: string): VerifyEmailCopy => ({
  preview: 'Verify your email address',
  title: 'Verify your email',
  greeting: `Hi ${recipientName},`,
  body: 'Please confirm your email address to unlock order creation and other workspace actions.',
  ctaLabel: 'Verify email address',
  expiryNote: 'This link expires in 24 hours. If you did not create an account, you can ignore this email.'
})
