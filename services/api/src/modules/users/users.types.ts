import type { z } from 'zod'
import type {
  updateMeSchema,
  updateMyBillingSchema
} from './users.validator'

export type UsersModuleStatus = 'ok'

export type UserMeDTO = {
  id: string
  name: string | null
  email: string
  role: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type BillingProfileDTO = {
  companyName: string | null
  address: string | null
  city: string | null
  country: string | null
  postalCode: string | null
  taxId: string | null
}

export type CreditsDTO = {
  balance: number
}

export type UpdateMeInput = z.infer<typeof updateMeSchema>
export type UpdateMyBillingInput = z.infer<typeof updateMyBillingSchema>

