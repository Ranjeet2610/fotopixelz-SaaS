import { z } from 'zod'

export const orderItemInputSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().min(1).optional()
})

export const orderItemServiceSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  basePrice: z.number().nonnegative(),
  categoryId: z.string().min(1)
})

export const orderItemSchema = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  notes: z.string().nullable(),
  service: orderItemServiceSummarySchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const orderSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  createdById: z.string().min(1),
  categoryId: z.string().min(1).nullable(),
  title: z.string().min(2),
  instructions: z.string().nullable(),
  status: z.string(),
  priority: z.string(),
  totalImages: z.number().int().nonnegative(),
  creditsUsed: z.number().int().nonnegative(),
  totalAmount: z.number().nonnegative(),
  currency: z.string(),
  dueDate: z.coerce.date().nullable(),
  items: z.array(orderItemSchema).default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})
