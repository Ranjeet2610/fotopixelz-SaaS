import { z } from 'zod'

export const addonPricingTypeSchema = z.enum(['FIXED', 'PER_IMAGE'])

export const listAddonsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25)
})

export const addonIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const createAddonSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  price: z.number().nonnegative().optional(),
  pricingType: addonPricingTypeSchema.optional(),
  credits: z.number().int().nonnegative().optional()
})

export const updateAddonSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  slug: z.string().trim().min(1).optional(),
  price: z.number().nonnegative().optional(),
  pricingType: addonPricingTypeSchema.optional(),
  credits: z.number().int().nonnegative().optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required'
})
