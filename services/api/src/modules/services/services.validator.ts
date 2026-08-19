import { z } from 'zod'

export const servicesHealthSchema = z.object({
  module: z.string(),
  status: z.literal('ok')
})

export const serviceScopeSchema = z.enum(['global', 'organization', 'all'])

export const listServicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  categoryId: z.string().min(1).optional(),
  organizationId: z.string().min(1).optional(),
  scope: serviceScopeSchema.optional(),
  includeInactive: z.coerce.boolean().optional(),
  q: z.string().trim().min(1).optional()
})

export const serviceIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const createServiceSchema = z.object({
  categoryId: z.string().min(1),
  organizationId: z.string().min(1).nullable().optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  basePrice: z.number().nonnegative().optional(),
  isActive: z.boolean().optional()
})

export const updateServiceSchema = z
  .object({
    categoryId: z.string().min(1).optional(),
    organizationId: z.string().min(1).nullable().optional(),
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).nullable().optional(),
    slug: z.string().trim().min(1).optional(),
    basePrice: z.number().nonnegative().optional(),
    isActive: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  })
