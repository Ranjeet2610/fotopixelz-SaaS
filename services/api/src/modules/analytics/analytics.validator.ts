import { z } from 'zod'

export const analyticsHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
