import { render } from '@react-email/render'
import { getResendClient } from './provider'
import type { SendEmailInput, SendEmailResult } from './types'
import { logEmailEvent } from './utils'

export type EmailTransportConfig = {
  from: string
  replyTo?: string
  apiKey?: string
}

export async function sendEmail(
  config: EmailTransportConfig,
  input: SendEmailInput
): Promise<SendEmailResult> {
  const resend = getResendClient(config.apiKey)

  if (!resend) {
    logEmailEvent('error', 'Resend is not configured; email skipped', {
      subject: input.subject,
      to: input.to
    })
    return { sent: false, error: 'provider_unconfigured' }
  }

  if (!config.from) {
    logEmailEvent('error', 'EMAIL_FROM is missing; email skipped', { subject: input.subject })
    return { sent: false, error: 'from_unconfigured' }
  }

  try {
    const html = await render(input.react)
    const text = await render(input.react, { plainText: true })

    const { data, error } = await resend.emails.send({
      from: config.from,
      to: input.to,
      subject: input.subject,
      html,
      text,
      replyTo: input.replyTo ?? config.replyTo,
      tags: input.tags
    })

    if (error) {
      logEmailEvent('error', 'Resend send failed', {
        subject: input.subject,
        message: error.message
      })
      return { sent: false, error: error.message }
    }

    logEmailEvent('info', 'Email sent', { subject: input.subject, id: data?.id })
    return { sent: true, id: data?.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    logEmailEvent('error', 'Email send threw', { subject: input.subject, message })
    return { sent: false, error: message }
  }
}
