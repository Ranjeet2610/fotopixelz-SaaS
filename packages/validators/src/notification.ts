import { z } from 'zod'

export const notificationSchema = z.object({
  id: z.string().min(8),
  userId: z.string().min(8),
  type: z.string(),
  title: z.string().min(1)
})
