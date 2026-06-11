import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { signAccessToken, type AccessTokenExpiresIn } from "@repo/auth"
import { env } from "../../config/env"
import { prisma } from "../../database/prisma"
import {
  buildClientDemoTrialEndsAt,
  CLIENT_DEMO_FREE_IMAGE_CREDITS,
  createUniqueOrganizationSlug,
  deriveOrganizationName,
  deriveOrganizationSlugBase
} from "./client-workspace"
import type {
  AuthOrganizationDTO,
  AuthResponse,
  AuthUserDTO,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput
} from "./auth.types"

const organizationSelect = {
  id: true,
  name: true,
  slug: true,
  plan: true,
  subscriptionStatus: true,
  trialEndsAt: true,
  freeImageCredits: true,
  usedImageCredits: true
} as const

function toAuthUser(user: { id: string; name: string | null; email: string; role: AuthUserDTO["role"] }): AuthUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  }
}

function toAuthOrganization(organization: {
  id: string
  name: string
  slug: string
  plan: AuthOrganizationDTO["plan"]
  subscriptionStatus: AuthOrganizationDTO["subscriptionStatus"]
  trialEndsAt: Date | null
  freeImageCredits: number
  usedImageCredits: number
}): AuthOrganizationDTO {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    plan: organization.plan,
    subscriptionStatus: organization.subscriptionStatus,
    trialEndsAt: organization.trialEndsAt,
    freeImageCredits: organization.freeImageCredits,
    usedImageCredits: organization.usedImageCredits
  }
}

function issueAccessToken(user: AuthUserDTO): string {
  if (!env.jwtAccessSecret) {
    throw new Error("JWT_ACCESS_SECRET is missing")
  }

  return signAccessToken(user, {
    secret: env.jwtAccessSecret,
    expiresIn: env.jwtAccessTtl as AccessTokenExpiresIn
  })
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
  const organizationName = deriveOrganizationName(input)
  const slugBase = deriveOrganizationSlugBase(input)
  const trialEndsAt = buildClientDemoTrialEndsAt()

  const { user, organization } = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password,
        role: "CLIENT"
      }
    })

    const slug = await createUniqueOrganizationSlug(tx, slugBase)
    const createdOrganization = await tx.organization.create({
      data: {
        name: organizationName,
        slug,
        plan: "DEMO",
        subscriptionStatus: "TRIAL",
        trialEndsAt,
        freeImageCredits: CLIENT_DEMO_FREE_IMAGE_CREDITS,
        usedImageCredits: 0
      },
      select: organizationSelect
    })

    await tx.membership.create({
      data: {
        organizationId: createdOrganization.id,
        userId: createdUser.id,
        role: "OWNER"
      }
    })

    return { user: createdUser, organization: createdOrganization }
  })

  const authUser = toAuthUser(user)
  const token = issueAccessToken(authUser)

  return {
    token,
    user: authUser,
    organization: toAuthOrganization(organization)
  }
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

  if (!user.isActive) {
    throw new Error("Account is inactive")
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
