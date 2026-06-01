import { z } from "zod"

export const registerSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["CLIENT", "EDITOR", "QA", "ADMIN", "SUPER_ADMIN"]).optional()
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
})

export const forgotPasswordSchema = z.object({
  email: z.string().email()
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128)
})
