import type { z } from 'zod'
import type {
  createServiceSchema,
  listServicesQuerySchema,
  serviceIdParamsSchema,
  updateServiceSchema
} from './services.validator'

export type ServiceCategorySummary = {
  id: string
  name: string
  slug: string
}

export type ServiceOrganizationSummary = {
  id: string
  name: string
  slug: string
} | null

export type ServiceDTO = {
  id: string
  categoryId: string
  organizationId: string | null
  name: string
  slug: string
  description: string | null
  basePrice: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  category: ServiceCategorySummary
  organization: ServiceOrganizationSummary
}

export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>
export type ServiceIdParams = z.infer<typeof serviceIdParamsSchema>
export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
