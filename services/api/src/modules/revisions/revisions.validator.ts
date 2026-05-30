import { z } from 'zod'

export const revisionsHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
