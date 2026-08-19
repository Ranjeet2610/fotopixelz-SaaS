import { z } from 'zod'

export const aiHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
