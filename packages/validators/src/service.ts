import { z } from 'zod'

export const serviceSchema = z.object({
  id: z.string().min(8),
  categoryId: z.string().min(8),
  name: z.string().min(2),
  basePrice: z.number().nonnegative()
})
