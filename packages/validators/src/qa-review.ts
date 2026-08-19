import { z } from 'zod'

export const qaReviewSchema = z.object({
  id: z.string().min(8),
  assetId: z.string().min(8),
  status: z.string()
})
