import { z } from 'zod'

export const ordersHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
