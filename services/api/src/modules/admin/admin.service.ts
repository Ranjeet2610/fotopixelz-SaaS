import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type {
  AdminUserDTO,
  ListAdminUsersQuery,
  UpdateAdminUserInput,
  UpdateAdminUserRoleInput,
  UpdateAdminUserStatusInput
} from './admin.types'

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} as const

export function getAdminStatus() {
  return { module: 'admin', status: 'ok' as const }
}

export async function listUsers(query: ListAdminUsersQuery, role?: AdminUserDTO['role']) {
  const skip = (query.page - 1) * query.limit
  const where = role ? { role } : {}

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit
    }),
    prisma.user.count({ where })
  ])

  return {
    items,
    page: query.page,
    limit: query.limit,
    total
  }
}

export async function getUserById(id: string): Promise<AdminUserDTO> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: adminUserSelect
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  return user
}

export async function updateUserById(id: string, input: UpdateAdminUserInput): Promise<AdminUserDTO> {
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        name: input.name
      },
      select: adminUserSelect
    })
  } catch {
    throw new AppError(404, 'User not found')
  }
}

export async function updateUserRole(id: string, input: UpdateAdminUserRoleInput): Promise<AdminUserDTO> {
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        role: input.role
      },
      select: adminUserSelect
    })
  } catch {
    throw new AppError(404, 'User not found')
  }
}

export async function updateUserStatus(id: string, input: UpdateAdminUserStatusInput): Promise<AdminUserDTO> {
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        isActive: input.isActive
      },
      select: adminUserSelect
    })
  } catch {
    throw new AppError(404, 'User not found')
  }
}

export async function softDeleteUser(id: string): Promise<AdminUserDTO> {
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        isActive: false
      },
      select: adminUserSelect
    })
  } catch {
    throw new AppError(404, 'User not found')
  }
}

