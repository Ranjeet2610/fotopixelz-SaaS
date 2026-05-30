import type { Request, Response } from 'express'
import { loginSchema, registerSchema } from './auth.validator'
import { getCurrentUser, login, register } from './auth.service'

export function getAuthHealth(_req: Request, res: Response) {
  res.status(200).json({ module: "auth", status: "ok" })
}

export async function registerHandler(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await register(parsed.data)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed"
    const status = message === "Email already registered" ? 409 : 400
    return res.status(status).json({ success: false, message })
  }
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await login(parsed.data)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed"
    return res.status(401).json({ success: false, message })
  }
}

export async function meHandler(req: Request, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" })
  }

  const user = await getCurrentUser(req.userId)
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" })
  }

  return res.status(200).json({ success: true, data: user })
}

