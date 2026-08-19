import { Resend } from 'resend'

let client: Resend | null = null

export function getResendClient(apiKey = process.env.RESEND_API_KEY) {
  if (client) {
    return client
  }

  if (!apiKey) {
    // Do not cache the failure: configuration may become available later
    // in the process lifetime (e.g. secrets injected shortly after boot).
    return null
  }

  client = new Resend(apiKey)
  return client
}

export function resetResendClientForTests() {
  client = null
}
