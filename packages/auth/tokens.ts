import jwt, { type SignOptions } from 'jsonwebtoken'
import { parseRole, type Role } from './roles'

export interface AuthUser {
  id: string
  email?: string
  role: Role
}

export interface AccessTokenPayload {
  sub: string
  email?: string
  role?: Role
}

interface SignAccessTokenOptions {
  secret?: string
  expiresIn?: SignOptions['expiresIn']
}

export type AccessTokenExpiresIn = SignOptions['expiresIn']

function requireSecret(secret: string | undefined, name: string) {
  if (!secret) {
    throw new Error(`${name} is missing`)
  }

  return secret
}

export function signAccessToken(user: AuthUser, options: SignAccessTokenOptions = {}) {
  const secret = requireSecret(options.secret ?? process.env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET')
  const expiresIn =
    options.expiresIn ??
    (process.env.JWT_ACCESS_TTL as SignOptions['expiresIn'] | undefined) ??
    '15m'

  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    secret,
    { expiresIn }
  )
}

export function verifyAccessToken(token: string, secret = process.env.JWT_ACCESS_SECRET) {
  const decoded = jwt.verify(token, requireSecret(secret, 'JWT_ACCESS_SECRET')) as AccessTokenPayload

  return {
    sub: decoded.sub,
    email: typeof decoded.email === 'string' ? decoded.email : undefined,
    role: parseRole(typeof decoded.role === 'string' ? decoded.role : undefined)
  }
}
