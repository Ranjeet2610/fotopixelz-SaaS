export function formatRecipientName(name: string | null | undefined, fallback = 'there') {
  const trimmed = name?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

export function normalizeEmailAddress(email: string) {
  return email.trim().toLowerCase()
}

export function logEmailEvent(
  level: 'info' | 'error',
  message: string,
  meta?: Record<string, unknown>
) {
  const payload = meta ? `${message} ${JSON.stringify(meta)}` : message
  if (level === 'error') {
    console.error(`[email] ${payload}`)
    return
  }
  console.info(`[email] ${payload}`)
}
