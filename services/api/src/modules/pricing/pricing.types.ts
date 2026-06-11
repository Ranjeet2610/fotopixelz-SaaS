import type { AddonPricingType } from '@prisma/client'
import type { z } from 'zod'
import type { quoteAddonInputSchema, quoteItemInputSchema, quoteSchema } from './pricing.validator'

export type QuoteInput = {
  organizationId: z.infer<typeof quoteSchema>['organizationId']
  items?: z.infer<typeof quoteItemInputSchema>[]
  addons?: z.infer<typeof quoteAddonInputSchema>[]
  currency?: z.infer<typeof quoteSchema>['currency']
  allowManualPricing?: boolean
  manualTotalAmount?: number
}

export type QuotedServiceLine = {
  serviceId: string
  serviceName: string
  serviceSlug: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes: string | null
}

export type QuotedAddonLine = {
  addonId: string
  addonName: string
  addonSlug: string
  quantity: number
  unitPrice: number
  pricingType: AddonPricingType
  subtotal: number
  credits: number
}

export type QuoteResult = {
  organizationId: string
  currency: string
  totalImageCount: number
  items: QuotedServiceLine[]
  addons: QuotedAddonLine[]
  servicesSubtotal: number
  addonsSubtotal: number
  grandTotal: number
  creditsUsed: number
  isManualTotal: boolean
}
