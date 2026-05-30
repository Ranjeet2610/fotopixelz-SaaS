import { z } from 'zod'

export const audit-logsHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
