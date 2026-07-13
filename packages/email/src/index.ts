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
  sendAdminNewOrderEmail,
  sendEditorAssignedEmail,
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
  sendOrderReadyForReviewEmail,
  sendQaAssignedEmail,
  sendReworkRequiredEmail,
  sendRevisionCompletedEmail,
  sendRevisionRequestedEmail,
  type OrderEmailContext,
  type SendAdminNewOrderEmailInput,
  type SendEditorAssignedEmailInput,
  type SendOrderConfirmationEmailInput,
  type SendOrderDeliveredEmailInput,
  type SendOrderReadyForReviewEmailInput,
  type SendQaAssignedEmailInput,
  type SendReworkRequiredEmailInput,
  type SendRevisionCompletedEmailInput,
  type SendRevisionRequestedEmailInput
} from './orders/send-order-emails'

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
export { EmailDetailList, type EmailDetailItem } from './templates/components/email-detail-list'

export {
  OrderConfirmationEmail,
  defaultOrderConfirmationEmailCopy,
  type OrderConfirmationEmailCopy,
  type OrderConfirmationEmailProps
} from './templates/order-confirmation'
export {
  OrderReadyForReviewEmail,
  defaultOrderReadyForReviewEmailCopy,
  type OrderReadyForReviewEmailCopy,
  type OrderReadyForReviewEmailProps
} from './templates/order-ready-for-review'
export {
  OrderDeliveredEmail,
  defaultOrderDeliveredEmailCopy,
  type OrderDeliveredEmailCopy,
  type OrderDeliveredEmailProps
} from './templates/order-delivered'
export {
  RevisionRequestedEmail,
  defaultRevisionRequestedEmailCopy,
  type RevisionRequestedEmailCopy,
  type RevisionRequestedEmailProps
} from './templates/revision-requested'
export {
  RevisionCompletedEmail,
  defaultRevisionCompletedEmailCopy,
  type RevisionCompletedEmailCopy,
  type RevisionCompletedEmailProps
} from './templates/revision-completed'
export {
  InternalOrderNoticeEmail,
  type InternalOrderNoticeEmailCopy,
  type InternalOrderNoticeEmailProps
} from './templates/internal-order-notice'
