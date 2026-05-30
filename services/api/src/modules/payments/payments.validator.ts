import { z } from 'zod'

export const paymentsHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
