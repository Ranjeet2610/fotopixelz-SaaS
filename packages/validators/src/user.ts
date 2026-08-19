import { z } from 'zod'

export const userSchema = z.object({
  id: z.string().min(8),
  email: z.string().email(),
  role: z.enum(['CLIENT', 'EDITOR', 'QA', 'ADMIN', 'SUPER_ADMIN'])
})
