import { AppError } from '../../common/errors/app-error'
import type { AdminUserDTO } from './admin.types'

export type UserManagementActor = 'SUPER_ADMIN' | 'ADMIN'
export type AdminUserRole = AdminUserDTO['role']

const adminManageableRoles: AdminUserRole[] = ['ADMIN', 'EDITOR', 'QA', 'CLIENT']
const superAdminCreatableRoles: AdminUserRole[] = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'QA']
const adminCreatableRoles: AdminUserRole[] = ['EDITOR', 'QA', 'CLIENT']

export function isUserManagementActor(role: string | undefined): role is UserManagementActor {
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
}

export function listUsersVisibilityFilter(actorRole: UserManagementActor, actorUserId: string) {
  const excludeSelf = { id: { not: actorUserId } }

  if (actorRole === 'SUPER_ADMIN') {
    return excludeSelf
  }

  return {
    ...excludeSelf,
    role: { not: 'SUPER_ADMIN' as const }
  }
}

export function assertCanViewUser(
  actorRole: UserManagementActor,
  actorUserId: string,
  target: Pick<AdminUserDTO, 'id' | 'role'>
) {
  if (target.id === actorUserId) {
    throw new AppError(403, 'Forbidden')
  }

  if (actorRole === 'ADMIN' && target.role === 'SUPER_ADMIN') {
    throw new AppError(403, 'Forbidden')
  }
}

export function assertCanManageUser(
  actorRole: UserManagementActor,
  actorUserId: string,
  target: Pick<AdminUserDTO, 'id' | 'role'>
) {
  assertCanViewUser(actorRole, actorUserId, target)

  if (actorRole === 'ADMIN' && target.role === 'SUPER_ADMIN') {
    throw new AppError(403, 'Forbidden')
  }
}

export function assertNotSelfAction(actorUserId: string, targetUserId: string) {
  if (actorUserId === targetUserId) {
    throw new AppError(403, 'Forbidden')
  }
}

export function assertCanCreateStaffUser(actorRole: UserManagementActor, roleToCreate: AdminUserRole) {
  if (actorRole === 'SUPER_ADMIN') {
    if (!superAdminCreatableRoles.includes(roleToCreate)) {
      throw new AppError(403, 'Forbidden')
    }
    return
  }

  if (!adminCreatableRoles.includes(roleToCreate)) {
    throw new AppError(403, 'Forbidden')
  }
}

export function assertCanAssignRole(
  actorRole: UserManagementActor,
  actorUserId: string,
  target: Pick<AdminUserDTO, 'id' | 'role'>,
  newRole: AdminUserRole
) {
  assertCanManageUser(actorRole, actorUserId, target)
  assertNotSelfAction(actorUserId, target.id)

  if (actorRole === 'SUPER_ADMIN') {
    return
  }

  if (newRole === 'SUPER_ADMIN' || !adminManageableRoles.includes(newRole)) {
    throw new AppError(403, 'Forbidden')
  }
}
