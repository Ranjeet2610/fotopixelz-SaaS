import { z } from 'zod'

export const servicesHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
