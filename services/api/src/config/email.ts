import type { AuthEmailContext } from '@repo/email'
import { env } from './env'

export function getAuthEmailContext(): AuthEmailContext {
  return {
    transport: {
      from: env.emailFrom,
      replyTo: env.emailReplyTo || undefined,
      apiKey: env.resendApiKey
    },
    brand: {
      appName: env.appName,
      logoUrl: env.emailLogoUrl || undefined,
      supportEmail: env.supportEmail,
      webAppUrl: env.webAppUrl,
      copyrightYear: new Date().getFullYear()
    }
  }
}

export function buildVerifyEmailUrl(rawToken: string) {
  const token = encodeURIComponent(rawToken)
  return `${env.apiBaseUrl}/api/v1/auth/verify-email?token=${token}`
}

export function buildPasswordResetUrl(app: 'web' | 'admin', rawToken: string) {
  const baseUrl = app === 'admin' ? env.adminAppUrl : env.webAppUrl
  const token = encodeURIComponent(rawToken)
  return `${baseUrl}/reset-password?token=${token}`
}

export function buildLoginVerifiedRedirectUrl(verified: boolean) {
  return `${env.webAppUrl}/login?verified=${verified ? 'true' : 'false'}`
}
