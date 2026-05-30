export const ROLES = ['CLIENT', 'EDITOR', 'QA', 'ADMIN', 'SUPER_ADMIN'] as const
export type Role = (typeof ROLES)[number]

