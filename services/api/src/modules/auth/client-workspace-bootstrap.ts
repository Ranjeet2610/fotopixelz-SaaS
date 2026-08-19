import type { Prisma } from '@prisma/client'
import {
  buildClientDemoTrialEndsAt,
  CLIENT_DEMO_FREE_IMAGE_CREDITS,
  createUniqueOrganizationSlug,
  deriveOrganizationName,
  deriveOrganizationSlugBase
} from './client-workspace'

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

export type ClientWorkspaceIdentity = {
  name?: string | null
  email: string
  organizationName?: string | null
}

export type CreateClientUserInput = {
  name?: string | null
  email: string
  password?: string | null
  googleId?: string | null
  emailVerifiedAt?: Date | null
}

export async function createClientUserWithWorkspace(
  tx: Prisma.TransactionClient,
  userData: CreateClientUserInput,
  identity: ClientWorkspaceIdentity
) {
  const organizationName = deriveOrganizationName(identity)
  const slugBase = deriveOrganizationSlugBase(identity)
  const trialEndsAt = buildClientDemoTrialEndsAt()

  const user = await tx.user.create({
    data: {
      name: userData.name ?? null,
      email: userData.email,
      password: userData.password ?? null,
      googleId: userData.googleId ?? null,
      emailVerifiedAt: userData.emailVerifiedAt ?? null,
      role: 'CLIENT'
    }
  })

  const slug = await createUniqueOrganizationSlug(tx, slugBase)
  const organization = await tx.organization.create({
    data: {
      name: organizationName,
      slug,
      plan: 'DEMO',
      subscriptionStatus: 'TRIAL',
      trialEndsAt,
      freeImageCredits: CLIENT_DEMO_FREE_IMAGE_CREDITS,
      usedImageCredits: 0
    },
    select: organizationSelect
  })

  await tx.membership.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      role: 'OWNER'
    }
  })

  return { user, organization }
}

export { organizationSelect as clientOrganizationSelect }
