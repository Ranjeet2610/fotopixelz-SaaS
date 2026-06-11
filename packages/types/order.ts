export interface OrderItemServiceSummary {
  id: string
  name: string
  slug: string
  basePrice: number
  categoryId: string
}

export interface OrderItemDTO {
  id: string
  serviceId: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes: string | null
  service: OrderItemServiceSummary
  createdAt: Date
  updatedAt: Date
}

export interface OrderAddonSummary {
  id: string
  name: string
  slug: string
  price: number
  pricingType: 'FIXED' | 'PER_IMAGE'
  credits: number
}

export interface OrderAddonDTO {
  id: string
  addonId: string
  quantity: number
  unitPrice: number
  pricingType: 'FIXED' | 'PER_IMAGE'
  subtotal: number
  credits: number
  addon: OrderAddonSummary
  createdAt: Date
  updatedAt: Date
}

export interface OrderDTO {
  id: string
  organizationId: string
  createdById: string
  categoryId: string | null
  title: string
  instructions: string | null
  status: string
  priority: string
  totalImages: number
  creditsUsed: number
  totalAmount: number
  currency: string
  dueDate: Date | null
  items: OrderItemDTO[]
  addons: OrderAddonDTO[]
  createdAt: Date
  updatedAt: Date
}
