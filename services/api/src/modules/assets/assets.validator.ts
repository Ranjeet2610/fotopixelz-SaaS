import { z } from 'zod'

export const assetsHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
