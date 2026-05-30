import { z } from 'zod'

export const uploadsHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
