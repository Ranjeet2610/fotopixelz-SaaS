import { z } from 'zod'

const roleSchema = z.enum(['CLIENT', 'EDITOR', 'QA', 'ADMIN', 'SUPER_ADMIN'])

export const organizationIdParamsSchema = z.object({
  organizationId: z.string().min(1)
})

export const membershipIdParamsSchema = organizationIdParamsSchema.extend({
  membershipId: z.string().min(1)
})

export const listOrganizationsQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional()
})

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  isActive: z.boolean().optional()
})

export const updateOrganizationSchema = createOrganizationSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required' }
)

export const createMembershipSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema.default('CLIENT')
})

export const updateMembershipSchema = z.object({
  role: roleSchema
})
