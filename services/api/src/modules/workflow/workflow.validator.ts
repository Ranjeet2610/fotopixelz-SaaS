import { z } from 'zod'

export const orderWorkflowParamsSchema = z.object({
  orderId: z.string().min(1)
})
