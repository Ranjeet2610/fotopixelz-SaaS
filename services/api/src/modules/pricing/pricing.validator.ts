import { z } from 'zod'

export const pricingHealthSchema = z.object({
  module: z.string(),
  status: z.literal('ok')
})

export const quoteItemInputSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().min(1).optional()
})

export const quoteAddonInputSchema = z.object({
  addonId: z.string().min(1),
  quantity: z.coerce.number().int().positive().optional()
})

export const quoteSchema = z.object({
  organizationId: z.string().min(1),
  items: z.array(quoteItemInputSchema).default([]),
  addons: z.array(quoteAddonInputSchema).default([]),
  currency: z.string().trim().min(3).max(3).default('USD')
})
