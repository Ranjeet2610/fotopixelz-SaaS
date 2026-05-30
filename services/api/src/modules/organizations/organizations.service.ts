import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type {
  CreateMembershipInput,
  CreateOrganizationInput,
  ListOrganizationsQuery,
  RequestContext,
  UpdateMembershipInput,
  UpdateOrganizationInput
} from './organizations.types'

const organizationInclude = {
  memberships: {
    select: {
      id: true,
      userId: true,
      organizationId: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      }
    },
    orderBy: { createdAt: 'desc' as const }
  }
}

function isAdmin(role: RequestContext['role']) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

function uniqueConstraintMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
    return fallback
  }
  return undefined
}

export function getOrganizationsStatus() {
  return { module: 'organizations', status: 'ok' as const }
}

export async function listOrganizations(context: RequestContext, query: ListOrganizationsQuery) {
  return prisma.organization.findMany({
    where: {
      ...(query.includeInactive ? {} : { isActive: true }),
      memberships: {
        some: { userId: context.userId }
      }
    },
    include: organizationInclude,
    orderBy: { createdAt: 'desc' }
  })
}

export async function getOrganization(context: RequestContext, organizationId: string) {
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      memberships: {
        some: { userId: context.userId }
      }
    },
    include: organizationInclude
  })

  if (!organization) {
    throw new AppError(404, 'Organization not found')
  }

  return organization
}

export async function createOrganization(context: RequestContext, input: CreateOrganizationInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: input
      })

      await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: context.userId,
          role: 'ADMIN'
        }
      })

      return tx.organization.findUniqueOrThrow({
        where: { id: organization.id },
        include: organizationInclude
      })
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Organization slug already exists')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function updateOrganization(
  context: RequestContext,
  organizationId: string,
  input: UpdateOrganizationInput
) {
  await ensureOrganizationAdminAccess(context, organizationId)

  try {
    return await prisma.organization.update({
      where: { id: organizationId },
      data: input,
      include: organizationInclude
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Organization slug already exists')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function deleteOrganization(context: RequestContext, organizationId: string) {
  await ensureOrganizationAdminAccess(context, organizationId)

  return prisma.organization.update({
    where: { id: organizationId },
    data: { isActive: false },
    include: organizationInclude
  })
}

export async function listMemberships(context: RequestContext, organizationId: string) {
  await ensureOrganizationAdminAccess(context, organizationId)

  return prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createMembership(
  context: RequestContext,
  organizationId: string,
  input: CreateMembershipInput
) {
  await ensureOrganizationAdminAccess(context, organizationId)
  await ensureUserExists(input.userId)

  try {
    return await prisma.membership.create({
      data: {
        organizationId,
        userId: input.userId,
        role: input.role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        }
      }
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'User is already a member of this organization')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function updateMembership(
  context: RequestContext,
  organizationId: string,
  membershipId: string,
  input: UpdateMembershipInput
) {
  await ensureOrganizationAdminAccess(context, organizationId)
  await ensureMembershipExists(organizationId, membershipId)

  return prisma.membership.update({
    where: { id: membershipId },
    data: { role: input.role },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      }
    }
  })
}

export async function deleteMembership(
  context: RequestContext,
  organizationId: string,
  membershipId: string
) {
  await ensureOrganizationAdminAccess(context, organizationId)
  await ensureMembershipExists(organizationId, membershipId)

  await prisma.membership.delete({
    where: { id: membershipId }
  })
}

async function ensureOrganizationExists(organizationId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true }
  })

  if (!organization) {
    throw new AppError(404, 'Organization not found')
  }
}

async function ensureUserExists(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }
}

async function ensureMembershipExists(organizationId: string, membershipId: string) {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId },
    select: { id: true }
  })

  if (!membership) {
    throw new AppError(404, 'Membership not found')
  }
}

async function ensureOrganizationAdminAccess(context: RequestContext, organizationId: string) {
  const membership = await prisma.membership.findFirst({
    where: {
      organizationId,
      userId: context.userId
    },
    select: {
      role: true
    }
  })

  if (!membership) {
    throw new AppError(404, 'Organization not found')
  }

  if (!(membership.role === 'ADMIN' || membership.role === 'SUPER_ADMIN' || isAdmin(context.role))) {
    throw new AppError(403, 'Forbidden')
  }
}
