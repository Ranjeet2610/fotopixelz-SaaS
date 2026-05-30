import bcrypt from "bcryptjs"
import jwt, { type SignOptions } from "jsonwebtoken"
import { env } from "../../config/env"
import { prisma } from "../../database/prisma"
import type { AuthResponse, AuthUserDTO, LoginInput, RegisterInput } from "./auth.types"

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

