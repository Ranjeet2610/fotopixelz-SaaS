import crypto from 'node:crypto'

export type OAuthStatePayload = {
  nonce: string
  codeVerifier: string
  next: string
  exp: number
}

const DEFAULT_TTL_MS = 10 * 60 * 1000

export function generatePkcePair() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  return { codeVerifier, codeChallenge }
}

export function createSignedOAuthState(
  input: { codeVerifier: string; next: string },
  secret: string,
  ttlMs = DEFAULT_TTL_MS
) {
  const payload: OAuthStatePayload = {
    nonce: crypto.randomBytes(16).toString('hex'),
    codeVerifier: input.codeVerifier,
    next: input.next,
    exp: Date.now() + ttlMs
  }

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export function verifySignedOAuthState(state: string, secret: string): OAuthStatePayload {
  const [encoded, signature] = state.split('.')
  if (!encoded || !signature) {
    throw new Error('Invalid OAuth state')
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  const provided = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new Error('Invalid OAuth state')
  }

  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as OAuthStatePayload

  if (!payload.codeVerifier || typeof payload.next !== 'string') {
    throw new Error('Invalid OAuth state')
  }

  if (payload.exp < Date.now()) {
    throw new Error('OAuth state expired')
  }

  return payload
}

export function sanitizeOAuthNextPath(next: string | undefined) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/dashboard'
  }

  return next
}
