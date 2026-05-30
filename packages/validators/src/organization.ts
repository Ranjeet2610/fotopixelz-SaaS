import { z } from 'zod'

export const organizationSchema = z.object({
  id: z.string().min(8),
  name: z.string().min(2),
  slug: z.string().min(2)
})
