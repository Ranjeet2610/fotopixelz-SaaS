import type { Permission } from './permissions'
import { ROLE_PERMISSIONS } from './permissions'
import type { Role } from './roles'

export function hasRole(role: Role, allowed: readonly Role[]) {
  return allowed.includes(role)
}

export function hasPermission(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission)
}
