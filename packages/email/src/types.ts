import type { ReactElement } from 'react'

/** Locale key reserved for future i18n — templates accept copy via props today. */
export type EmailLocale = string

export type EmailBrandConfig = {
  appName: string
  logoUrl?: string
  supportEmail: string
  webAppUrl: string
  copyrightYear: number
}

export type SendEmailInput = {
  to: string | string[]
  subject: string
  react: ReactElement
  replyTo?: string
  tags?: { name: string; value: string }[]
}

export type SendEmailResult = {
  sent: boolean
  id?: string
  error?: string
}

export type LocalizedEmailCopy = {
  locale?: EmailLocale
}
