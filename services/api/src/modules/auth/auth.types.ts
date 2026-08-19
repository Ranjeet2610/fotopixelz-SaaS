export type AuthRole = "CLIENT" | "EDITOR" | "QA" | "ADMIN" | "SUPER_ADMIN"

export interface RegisterInput {
  name?: string
  email: string
  password: string
  organizationName?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface ForgotPasswordInput {
  email: string
  app?: 'web' | 'admin'
}

export interface ResetPasswordInput {
  token: string
  password: string
}

export type AuthUserDTO = {
  id: string
  name: string | null
  email: string
  role: AuthRole
  emailVerifiedAt?: Date | null
}

export interface AuthOrganizationDTO {
  id: string
  name: string
  slug: string
  plan: "DEMO" | null
  subscriptionStatus: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED" | null
  trialEndsAt: Date | null
  freeImageCredits: number
  usedImageCredits: number
}

export interface AuthResponse {
  token: string
  user: AuthUserDTO
  organization?: AuthOrganizationDTO
}

// Registration intentionally never returns a token/user/organization: the
// account is created in an unverified state and must not be authenticated
// until the user completes email verification (see auth.service#register).
export interface RegisterResponse {
  message: string
}
