import { z } from 'zod'

export const adminHealthSchema = z.object({
  module: z.string(),
  status: z.literal('ok')
})

export const listAdminUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25)
})

export const adminUserIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const updateAdminUserSchema = z.object({
  name: z.string().trim().min(1).max(120)
})

export const updateAdminUserRoleSchema = z.object({
  role: z.enum(['CLIENT', 'EDITOR', 'QA', 'ADMIN', 'SUPER_ADMIN'])
})

export const updateAdminUserStatusSchema = z.object({
  isActive: z.boolean()
})

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'QA', 'CLIENT'])
})

export const createStaffUserSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'QA'])
})

export const createStaffUserSchemaAdmin = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['EDITOR', 'QA', 'CLIENT'])
})

export const updateAdminUserRoleSchemaAdmin = z.object({
  role: z.enum(['ADMIN', 'CLIENT', 'EDITOR', 'QA'])
})
