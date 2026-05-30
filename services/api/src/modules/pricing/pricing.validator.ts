import { z } from 'zod'

export const pricingHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
