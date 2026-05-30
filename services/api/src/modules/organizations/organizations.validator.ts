import { z } from 'zod'

export const organizationsHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
