import React from 'react'
import { sendEmail, type EmailTransportConfig } from '../send-email'
import {
  ForgotPasswordEmail,
  defaultForgotPasswordEmailCopy,
  type ForgotPasswordEmailCopy
} from '../templates/forgot-password'
import {
  PasswordChangedEmail,
  defaultPasswordChangedEmailCopy,
  type PasswordChangedEmailCopy
} from '../templates/password-changed'
import {
  VerifyEmail,
  defaultVerifyEmailCopy,
  type VerifyEmailCopy
} from '../templates/verify-email'
import {
  WelcomeEmail,
  defaultWelcomeEmailCopy,
  type WelcomeEmailCopy
} from '../templates/welcome'
import type { EmailBrandConfig } from '../types'
import { formatRecipientName } from '../utils'

export type AuthEmailContext = {
  transport: EmailTransportConfig
  brand: EmailBrandConfig
}

export type SendWelcomeEmailInput = {
  to: string
  recipientName?: string | null
  copy?: WelcomeEmailCopy
}

export async function sendWelcomeEmail(ctx: AuthEmailContext, input: SendWelcomeEmailInput) {
  const recipientName = formatRecipientName(input.recipientName)
  const copy = input.copy ?? defaultWelcomeEmailCopy(recipientName)

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: `Welcome to ${ctx.brand.appName}`,
    react: <WelcomeEmail brand={ctx.brand} copy={copy} />,
    tags: [{ name: 'category', value: 'auth_welcome' }]
  })
}

export type SendVerifyEmailInput = {
  to: string
  verifyUrl: string
  recipientName?: string | null
  copy?: VerifyEmailCopy
}

export async function sendVerifyEmail(ctx: AuthEmailContext, input: SendVerifyEmailInput) {
  const recipientName = formatRecipientName(input.recipientName)
  const copy = input.copy ?? defaultVerifyEmailCopy(recipientName)

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: `Verify your ${ctx.brand.appName} email`,
    react: <VerifyEmail brand={ctx.brand} copy={copy} verifyUrl={input.verifyUrl} />,
    tags: [{ name: 'category', value: 'auth_verify_email' }]
  })
}

export type SendForgotPasswordEmailInput = {
  to: string
  resetUrl: string
  recipientName?: string | null
  copy?: ForgotPasswordEmailCopy
}

export async function sendForgotPasswordEmail(
  ctx: AuthEmailContext,
  input: SendForgotPasswordEmailInput
) {
  const recipientName = formatRecipientName(input.recipientName)
  const copy = input.copy ?? defaultForgotPasswordEmailCopy(recipientName)

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: `Reset your ${ctx.brand.appName} password`,
    react: <ForgotPasswordEmail brand={ctx.brand} copy={copy} resetUrl={input.resetUrl} />,
    tags: [{ name: 'category', value: 'auth_forgot_password' }]
  })
}

export type SendPasswordChangedEmailInput = {
  to: string
  recipientName?: string | null
  copy?: PasswordChangedEmailCopy
}

export async function sendPasswordChangedEmail(
  ctx: AuthEmailContext,
  input: SendPasswordChangedEmailInput
) {
  const recipientName = formatRecipientName(input.recipientName)
  const copy = input.copy ?? defaultPasswordChangedEmailCopy(recipientName)

  return sendEmail(ctx.transport, {
    to: input.to,
    subject: `Your ${ctx.brand.appName} password was changed`,
    react: <PasswordChangedEmail brand={ctx.brand} copy={copy} />,
    tags: [{ name: 'category', value: 'auth_password_changed' }]
  })
}
