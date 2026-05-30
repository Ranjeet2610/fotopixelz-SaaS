import { z } from 'zod'

export const adminHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
