import { z } from 'zod'

export const auditLogsHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
