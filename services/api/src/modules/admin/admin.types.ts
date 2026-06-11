import type { z } from 'zod'
import type {
  adminUserIdParamsSchema,
  createUserSchema,
  createStaffUserSchema,
  createStaffUserSchemaAdmin,
  listAdminUsersQuerySchema,
  updateAdminUserRoleSchema,
  updateAdminUserRoleSchemaAdmin,
  updateAdminUserSchema,
  updateAdminUserStatusSchema
} from './admin.validator'

export type AdminModuleStatus = 'ok'

export type AdminUserDTO = {
  id: string
  name: string | null
  email: string
  role: 'CLIENT' | 'EDITOR' | 'QA' | 'ADMIN' | 'SUPER_ADMIN'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>
export type AdminUserIdParams = z.infer<typeof adminUserIdParamsSchema>
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>
export type UpdateAdminUserRoleInput = z.infer<typeof updateAdminUserRoleSchema>
export type UpdateAdminUserStatusInput = z.infer<typeof updateAdminUserStatusSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>
export type CreateStaffUserInputAdmin = z.infer<typeof createStaffUserSchemaAdmin>
export type UpdateAdminUserRoleInputAdmin = z.infer<typeof updateAdminUserRoleSchemaAdmin>

