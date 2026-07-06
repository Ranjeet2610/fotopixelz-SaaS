export { getResendClient, resetResendClientForTests } from './provider'
export { sendEmail, type EmailTransportConfig } from './send-email'
export type {
  EmailBrandConfig,
  EmailLocale,
  LocalizedEmailCopy,
  SendEmailInput,
  SendEmailResult
} from './types'
export { formatRecipientName, logEmailEvent, normalizeEmailAddress } from './utils'

export {
  sendForgotPasswordEmail,
  sendPasswordChangedEmail,
  sendVerifyEmail,
  sendWelcomeEmail,
  type AuthEmailContext,
  type SendForgotPasswordEmailInput,
  type SendPasswordChangedEmailInput,
  type SendVerifyEmailInput,
  type SendWelcomeEmailInput
} from './auth/send-auth-emails'

export {
  ForgotPasswordEmail,
  defaultForgotPasswordEmailCopy,
  type ForgotPasswordEmailCopy,
  type ForgotPasswordEmailProps
} from './templates/forgot-password'
export {
  PasswordChangedEmail,
  defaultPasswordChangedEmailCopy,
  type PasswordChangedEmailCopy,
  type PasswordChangedEmailProps
} from './templates/password-changed'
export {
  VerifyEmail,
  defaultVerifyEmailCopy,
  type VerifyEmailCopy,
  type VerifyEmailProps
} from './templates/verify-email'
export {
  WelcomeEmail,
  defaultWelcomeEmailCopy,
  type WelcomeEmailCopy,
  type WelcomeEmailProps
} from './templates/welcome'

export { EmailLayout } from './templates/components/email-layout'
export { EmailButton } from './templates/components/email-button'
export { EmailFooter } from './templates/components/email-footer'
