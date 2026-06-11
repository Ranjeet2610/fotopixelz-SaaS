export interface ServiceDTO {
  id: string
  categoryId: string
  organizationId: string | null
  name: string
  slug: string
  description: string | null
  basePrice: number
  isActive: boolean
}
