import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import jwt, { type SignOptions } from "jsonwebtoken"
import { env } from "../../config/env"
import { prisma } from "../../database/prisma"
import type {
  AuthResponse,
  AuthUserDTO,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput
} from "./auth.types"

function toAuthUser(user: { id: string; name: string | null; email: string; role: AuthUserDTO["role"] }): AuthUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  }
}

function issueAccessToken(user: AuthUserDTO): string {
  if (!env.jwtAccessSecret) {
    throw new Error("JWT_ACCESS_SECRET is missing")
  }

  const expiresIn = env.jwtAccessTtl as SignOptions["expiresIn"]

  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    env.jwtAccessSecret,
    { expiresIn }
  )
}

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new Error("Email already registered")
  }

  const password = await bcrypt.hash(input.password, 10)
  const created = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password,
      role: input.role ?? "CLIENT"
    }
  })

  const user = toAuthUser(created)
  const token = issueAccessToken(user)

  return { token, user }
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    throw new Error("Invalid credentials")
  }

  const validPassword = await bcrypt.compare(input.password, user.password)
  if (!validPassword) {
    throw new Error("Invalid credentials")
  }

  const authUser = toAuthUser(user)
  const token = issueAccessToken(authUser)
  return { token, user: authUser }
}

export async function getCurrentUser(userId: string): Promise<AuthUserDTO | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  })

  return user ? toAuthUser(user) : null
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true }
  })

  if (!user) {
    return
  }

  const rawToken = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashResetToken(rawToken)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: tokenHash,
      passwordResetExpiresAt: expiresAt
    }
  })

  const resetLink = `${env.appBaseUrl}/reset-password?token=${rawToken}`
  console.log(`Password reset requested for ${user.email}. Reset link: ${resetLink}`)
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const tokenHash = hashResetToken(input.token)

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: tokenHash,
      passwordResetExpiresAt: {
        gt: new Date()
      }
    },
    select: {
      id: true
    }
  })

  if (!user) {
    throw new Error("Invalid or expired reset token")
  }

  const passwordHash = await bcrypt.hash(input.password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null
    }
  })
}

