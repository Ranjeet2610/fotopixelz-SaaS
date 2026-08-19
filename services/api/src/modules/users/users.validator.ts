import { z } from 'zod'

export const usersHealthSchema = z.object({
  module: z.string(),
  status: z.literal('ok')
})

export const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(120)
})

export const updateMyBillingSchema = z.object({
  companyName: z.string().trim().min(1).nullable().optional(),
  address: z.string().trim().min(1).nullable().optional(),
  city: z.string().trim().min(1).nullable().optional(),
  country: z.string().trim().min(1).nullable().optional(),
  postalCode: z.string().trim().min(1).nullable().optional(),
  taxId: z.string().trim().min(1).nullable().optional()
})
