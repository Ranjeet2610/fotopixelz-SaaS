import type { Prisma } from '@prisma/client'

export const CLIENT_DEMO_TRIAL_DAYS = 15
export const CLIENT_DEMO_FREE_IMAGE_CREDITS = 10

type WorkspaceIdentityInput = {
  name?: string | null
  email: string
  organizationName?: string | null
}

export function deriveOrganizationName(input: WorkspaceIdentityInput) {
  const explicit = input.organizationName?.trim()
  if (explicit) {
    return explicit
  }

  const userName = input.name?.trim()
  if (userName) {
    return `${userName}'s workspace`
  }

  const localPart = input.email.split('@')[0]?.trim()
  if (localPart) {
    return `${localPart}'s workspace`
  }

  return 'My workspace'
}

export function slugifyOrganization(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function deriveOrganizationSlugBase(input: WorkspaceIdentityInput) {
  const explicit = input.organizationName?.trim()
  if (explicit) {
    return slugifyOrganization(explicit)
  }

  const userName = input.name?.trim()
  if (userName) {
    return slugifyOrganization(userName)
  }

  const localPart = input.email.split('@')[0]?.trim()
  return slugifyOrganization(localPart || 'workspace')
}

export async function createUniqueOrganizationSlug(
  tx: Prisma.TransactionClient,
  base: string
) {
  const normalized = slugifyOrganization(base) || 'workspace'
  let candidate = normalized
  let suffix = 2

  while (
    await tx.organization.findUnique({
      where: { slug: candidate },
      select: { id: true }
    })
  ) {
    candidate = `${normalized}-${suffix}`
    suffix += 1
  }

  return candidate
}

export function buildClientDemoTrialEndsAt(now = new Date()) {
  return new Date(now.getTime() + CLIENT_DEMO_TRIAL_DAYS * 24 * 60 * 60 * 1000)
}
