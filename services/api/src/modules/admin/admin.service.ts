import bcrypt from 'bcryptjs'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import {
  assertCanAssignRole,
  assertCanCreateStaffUser,
  assertCanManageUser,
  assertCanViewUser,
  assertNotSelfAction,
  listUsersVisibilityFilter,
  type UserManagementActor
} from './admin.permissions'
import type {
  AdminUserDTO,
  CreateUserInput,
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

function uniqueConstraintMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
    return fallback
  }
  return undefined
}

export async function listUsers(
  query: ListAdminUsersQuery,
  actorRole: UserManagementActor,
  actorUserId: string,
  role?: AdminUserDTO['role']
) {
  const skip = (query.page - 1) * query.limit
  const where = {
    ...listUsersVisibilityFilter(actorRole, actorUserId),
    ...(role ? { role } : {}),
    ...(role === 'EDITOR' || role === 'QA' ? { isActive: true } : {})
  }

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

export async function createStaffUser(
  input: CreateUserInput,
  actorRole: UserManagementActor
): Promise<AdminUserDTO> {
  assertCanCreateStaffUser(actorRole, input.role)

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true }
  })

  if (existing) {
    throw new AppError(409, 'Email already registered')
  }

  const password = await bcrypt.hash(input.password, 10)

  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password,
        role: input.role,
        isActive: true,
        // Staff accounts are provisioned by a trusted admin, not
        // self-registered — there is no separate email-ownership proof step
        // for this flow, so mark verified at creation rather than leaving
        // emailVerifiedAt null (which would permanently block login once
        // email verification is enforced).
        emailVerifiedAt: new Date()
      },
      select: adminUserSelect
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Email already registered')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function getUserById(
  id: string,
  actorRole: UserManagementActor,
  actorUserId: string
): Promise<AdminUserDTO> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: adminUserSelect
  })

  if (!user) {
    throw new AppError(404, 'User not found')
  }

  assertCanViewUser(actorRole, actorUserId, user)

  return user
}

async function getManagedUserById(
  id: string,
  actorRole: UserManagementActor,
  actorUserId: string
): Promise<AdminUserDTO> {
  const user = await getUserById(id, actorRole, actorUserId)
  assertCanManageUser(actorRole, actorUserId, user)
  return user
}

export async function updateUserById(
  id: string,
  input: UpdateAdminUserInput,
  actorRole: UserManagementActor,
  actorUserId: string
): Promise<AdminUserDTO> {
  assertNotSelfAction(actorUserId, id)
  await getManagedUserById(id, actorRole, actorUserId)

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

export async function updateUserRole(
  id: string,
  input: UpdateAdminUserRoleInput,
  actorRole: UserManagementActor,
  actorUserId: string
): Promise<AdminUserDTO> {
  assertNotSelfAction(actorUserId, id)
  const target = await getManagedUserById(id, actorRole, actorUserId)
  assertCanAssignRole(actorRole, actorUserId, target, input.role)

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

export async function updateUserStatus(
  id: string,
  input: UpdateAdminUserStatusInput,
  actorRole: UserManagementActor,
  actorUserId: string
): Promise<AdminUserDTO> {
  assertNotSelfAction(actorUserId, id)
  await getManagedUserById(id, actorRole, actorUserId)

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

export async function softDeleteUser(
  id: string,
  actorRole: UserManagementActor,
  actorUserId: string
): Promise<AdminUserDTO> {
  assertNotSelfAction(actorUserId, id)
  await getManagedUserById(id, actorRole, actorUserId)

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
