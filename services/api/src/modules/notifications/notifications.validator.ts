import { z } from 'zod'

export const notificationsHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
