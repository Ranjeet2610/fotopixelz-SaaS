import { z } from 'zod'

export const editingHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
