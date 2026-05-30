import type { Role } from './roles'

export const PERMISSION_GROUPS = {
  orders: ['orders:create', 'orders:read', 'orders:update', 'orders:assign'],
  uploads: ['uploads:create', 'uploads:read', 'uploads:update'],
  assets: ['assets:read', 'assets:update', 'assets:deliver'],
  editing: ['editing:assign', 'editing:update'],
  qa: ['qa:review', 'qa:approve', 'qa:reject'],
  payments: ['payments:create', 'payments:read', 'payments:refund'],
  admin: ['admin:access', 'admin:manage'],
  analytics: ['analytics:read'],
  settings: ['settings:read', 'settings:update']
} as const

export type PermissionGroup = keyof typeof PERMISSION_GROUPS
export type Permission = (typeof PERMISSION_GROUPS)[PermissionGroup][number]

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  CLIENT: [
    'orders:create', 'orders:read', 'uploads:create', 'uploads:read', 'assets:read', 'payments:read', 'settings:read'
  ],
  EDITOR: [
    'orders:read', 'assets:read', 'assets:update', 'editing:update'
  ],
  QA: [
    'orders:read', 'assets:read', 'qa:review', 'qa:approve', 'qa:reject'
  ],
  ADMIN: [
    'orders:create', 'orders:read', 'orders:update', 'orders:assign',
    'uploads:create', 'uploads:read', 'uploads:update',
    'assets:read', 'assets:update', 'assets:deliver',
    'editing:assign', 'editing:update',
    'qa:review', 'qa:approve', 'qa:reject',
    'payments:create', 'payments:read', 'payments:refund',
    'admin:access', 'analytics:read', 'settings:read', 'settings:update'
  ],
  SUPER_ADMIN: [
    ...PERMISSION_GROUPS.orders,
    ...PERMISSION_GROUPS.uploads,
    ...PERMISSION_GROUPS.assets,
    ...PERMISSION_GROUPS.editing,
    ...PERMISSION_GROUPS.qa,
    ...PERMISSION_GROUPS.payments,
    ...PERMISSION_GROUPS.admin,
    ...PERMISSION_GROUPS.analytics,
    ...PERMISSION_GROUPS.settings
  ]
}
