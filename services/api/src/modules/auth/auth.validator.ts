import { z } from "zod"

export const registerSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    organizationName: z.string().trim().min(2).max(120).optional()
  })
  .strict()

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
  app: z.enum(['web', 'admin']).optional()
})

export const verifyEmailQuerySchema = z.object({
  token: z.string().min(1)
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128)
})

export const googleOAuthQuerySchema = z.object({
  next: z.string().optional()
})
