import { z } from 'zod'

export const editingJobSchema = z.object({
  id: z.string().min(8),
  assetId: z.string().min(8),
  status: z.string()
})
