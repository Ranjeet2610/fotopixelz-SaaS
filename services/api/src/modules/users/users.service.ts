import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type {
  BillingProfileDTO,
  CreditsDTO,
  UpdateMeInput,
  UpdateMyBillingInput,
  UserMeDTO
} from './users.types'

export function getUsersStatus() {
  return { module: 'users', status: 'ok' as const }
}

export async function getMe(userId: string): Promise<UserMeDTO> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  return user
}

export async function updateMe(userId: string, input: UpdateMeInput): Promise<UserMeDTO> {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { name: input.name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })
  } catch {
    throw new AppError(404, 'User not found')
  }
}

export async function getMyBilling(userId: string): Promise<BillingProfileDTO> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      billingProfile: {
        select: {
          companyName: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
          taxId: true
        }
      }
    }
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  return user.billingProfile ?? {
    companyName: null,
    address: null,
    city: null,
    country: null,
    postalCode: null,
    taxId: null
  }
}

export async function updateMyBilling(
  userId: string,
  input: UpdateMyBillingInput
): Promise<BillingProfileDTO> {
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  })

  if (!userExists) {
    throw new AppError(404, 'User not found')
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      billingProfile: {
        upsert: {
          create: {
            companyName: input.companyName ?? null,
            address: input.address ?? null,
            city: input.city ?? null,
            country: input.country ?? null,
            postalCode: input.postalCode ?? null,
            taxId: input.taxId ?? null
          },
          update: {
            ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
            ...(input.address !== undefined ? { address: input.address } : {}),
            ...(input.city !== undefined ? { city: input.city } : {}),
            ...(input.country !== undefined ? { country: input.country } : {}),
            ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
            ...(input.taxId !== undefined ? { taxId: input.taxId } : {})
          }
        }
      }
    },
    select: {
      billingProfile: {
        select: {
          companyName: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
          taxId: true
        }
      }
    },
  })

  return user.billingProfile ?? {
    companyName: null,
    address: null,
    city: null,
    country: null,
    postalCode: null,
    taxId: null
  }
}

export async function getMyCredits(userId: string): Promise<CreditsDTO> {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    select: {
      organization: {
        select: {
          freeImageCredits: true,
          usedImageCredits: true
        }
      }
    }
  })

  if (memberships.length === 0) {
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!userExists) {
      throw new AppError(404, 'User not found')
    }

    return { balance: 0 }
  }

  const balance = memberships.reduce((total, membership) => {
    const remaining =
      membership.organization.freeImageCredits - membership.organization.usedImageCredits
    return total + Math.max(0, remaining)
  }, 0)

  return { balance }
}

