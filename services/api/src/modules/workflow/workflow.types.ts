import type { Role } from '@repo/auth'

export type RequestContext = {
  userId: string
  role: Role
}
