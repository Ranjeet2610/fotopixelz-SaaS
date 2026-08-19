import { z } from 'zod'

export const paymentSchema = z.object({
  id: z.string().min(8),
  orderId: z.string().min(8),
  amount: z.number().positive(),
  status: z.string()
})
