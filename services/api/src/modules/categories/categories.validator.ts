import { z } from 'zod'

export const categoriesHealthSchema = z.object({
  module: z.string(),
  status: z.literal('ok')
})

export const listCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25)
})

export const categoryIdParamsSchema = z.object({
  id: z.string().min(1)
})

export const createCategorySchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional()
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  slug: z.string().trim().min(1).optional()
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required'
})
