import { z } from 'zod'

export const usersHealthSchema = z.object({
  module: z.string(),
  status: z.literal('placeholder')
})
