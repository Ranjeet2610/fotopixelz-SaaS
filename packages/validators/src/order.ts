import { z } from 'zod'

export const orderSchema = z.object({
  id: z.string().min(8),
  title: z.string().min(2),
  status: z.string()
})
