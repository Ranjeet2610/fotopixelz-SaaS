import type { z } from 'zod'
import {
  addonIdParamsSchema,
  createAddonSchema,
  listAddonsQuerySchema,
  updateAddonSchema
} from './addons.validator'

export type AddonDTO = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  credits: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type ListAddonsQuery = z.infer<typeof listAddonsQuerySchema>
export type AddonIdParams = z.infer<typeof addonIdParamsSchema>
export type CreateAddonInput = z.infer<typeof createAddonSchema>
export type UpdateAddonInput = z.infer<typeof updateAddonSchema>
