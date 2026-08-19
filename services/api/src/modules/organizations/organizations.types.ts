import type { Role } from '@repo/auth/roles'
import type { z } from 'zod'
import type {
  createMembershipSchema,
  createOrganizationSchema,
  listOrganizationsQuerySchema,
  updateMembershipSchema,
  updateOrganizationSchema
} from './organizations.validator'

export type RequestContext = {
  userId: string
  role: Role
}

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type ListOrganizationsQuery = z.infer<typeof listOrganizationsQuerySchema>
export type CreateMembershipInput = z.infer<typeof createMembershipSchema>
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>
