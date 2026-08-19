import { z } from 'zod'

export const workflowEventSchema = z.object({
  id: z.string().min(8),
  orderId: z.string().min(8),
  eventType: z.string()
})
