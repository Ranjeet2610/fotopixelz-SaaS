import { Resend } from 'resend'

let client: Resend | null | undefined

export function getResendClient(apiKey = process.env.RESEND_API_KEY) {
  if (client !== undefined) {
    return client
  }

  if (!apiKey) {
    client = null
    return client
  }

  client = new Resend(apiKey)
  return client
}

export function resetResendClientForTests() {
  client = undefined
}
