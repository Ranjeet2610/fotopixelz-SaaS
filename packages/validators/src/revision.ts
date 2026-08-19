import { z } from 'zod'

export const revisionSchema = z.object({
  id: z.string().min(8),
  orderId: z.string().min(8),
  reason: z.string().min(2)
})
