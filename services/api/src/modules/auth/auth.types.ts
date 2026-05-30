export type AuthRole = "CLIENT" | "EDITOR" | "QA" | "ADMIN" | "SUPER_ADMIN"

export interface RegisterInput {
  name?: string
  email: string
  password: string
  role?: AuthRole
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthUserDTO {
  id: string
  name: string | null
  email: string
  role: AuthRole
}

export interface AuthResponse {
  token: string
  user: AuthUserDTO
}

