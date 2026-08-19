import type { z } from 'zod'
import {
  categoryIdParamsSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema
} from './categories.validator'

export type CategoriesModuleStatus = 'ok'

export type CategoryDTO = {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>
export type CategoryIdParams = z.infer<typeof categoryIdParamsSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
