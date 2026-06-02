export const ROLES = ['CLIENT', 'EDITOR', 'QA', 'ADMIN', 'SUPER_ADMIN'] as const
export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && ROLES.includes(value as Role)
}

export function parseRole(value: string | undefined): Role | undefined {
  if (!value) return undefined

  const upper = value.toUpperCase()
  return isRole(upper) ? upper : undefined
}

