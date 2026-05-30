import { z } from 'zod'

export const workflowHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
