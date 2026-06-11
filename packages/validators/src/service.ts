import { z } from 'zod'

export const serviceSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  organizationId: z.string().min(1).nullable().optional(),
  name: z.string().min(2),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
  basePrice: z.number().nonnegative(),
  isActive: z.boolean().optional()
})
