import crypto from 'node:crypto'
import { getRedisClient } from '../../integrations/redis/client'
import type { AuthUserDTO } from './auth.types'

// Single-use, short-lived code exchanged for the real access token after an
// OAuth callback. Keeps the JWT out of the redirect URL (browser history,
// access logs, Referer headers) — see the Google OAuth exposure fix.
const CODE_TTL_SECONDS = 60
const KEY_PREFIX = 'oauth:handoff:'

export type OAuthHandoffPayload = {
  token: string
  user: AuthUserDTO
}

function buildKey(code: string) {
  return `${KEY_PREFIX}${code}`
}

export async function createOAuthHandoffCode(payload: OAuthHandoffPayload): Promise<string> {
  const code = crypto.randomBytes(32).toString('base64url')
  const redis = getRedisClient()
  await redis.set(buildKey(code), JSON.stringify(payload), 'EX', CODE_TTL_SECONDS)
  return code
}

export async function consumeOAuthHandoffCode(code: string): Promise<OAuthHandoffPayload | null> {
  const redis = getRedisClient()
  // GETDEL atomically reads and deletes so the code cannot be replayed even
  // under concurrent exchange requests.
  const value = await redis.getdel(buildKey(code))
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as OAuthHandoffPayload
  } catch {
    return null
  }
}
