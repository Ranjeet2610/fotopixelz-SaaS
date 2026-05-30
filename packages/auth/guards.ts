import type { Permission } from "./permissions"
import { hasPermission, hasRole } from "./auth"
import type { Role } from "./roles"

export function requireRole(role: Role, allowed: readonly Role[]) {
  return hasRole(role, allowed)
}

export function requirePermission(role: Role, permission: Permission) {
  return hasPermission(role, permission)
}
