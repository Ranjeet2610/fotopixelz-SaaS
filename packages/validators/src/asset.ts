import { z } from 'zod'

export const assetSchema = z.object({
  id: z.string().min(8),
  orderId: z.string().min(8),
  originalUrl: z.string().url()
})
