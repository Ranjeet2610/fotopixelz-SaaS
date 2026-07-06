import crypto from 'node:crypto'
import {
  sendVerifyEmail,
  sendWelcomeEmail,
  logEmailEvent
} from '@repo/email'
import { prisma } from '../../database/prisma'
import { buildVerifyEmailUrl, getAuthEmailContext } from '../../config/email'

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000

function hashVerificationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function createVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashVerificationToken(rawToken)
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS)
  return { rawToken, tokenHash, expiresAt }
}

export async function issueEmailVerificationToken(userId: string) {
  const { rawToken, tokenHash, expiresAt } = createVerificationToken()

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: tokenHash,
      emailVerificationExpiresAt: expiresAt
    }
  })

  return rawToken
}

export async function sendRegistrationEmails(user: {
  id: string
  email: string
  name: string | null
}) {
  const ctx = getAuthEmailContext()

  try {
    const rawToken = await issueEmailVerificationToken(user.id)
    const verifyUrl = buildVerifyEmailUrl(rawToken)

    await Promise.all([
      sendWelcomeEmail(ctx, {
        to: user.email,
        recipientName: user.name
      }),
      sendVerifyEmail(ctx, {
        to: user.email,
        recipientName: user.name,
        verifyUrl
      })
    ])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    logEmailEvent('error', 'Registration email dispatch failed', {
      userId: user.id,
      message
    })
  }
}

type ResendableUser = {
  id: string
  email: string
  name: string | null
  emailVerifiedAt: Date | null
}

async function resendVerificationForUser(user: ResendableUser) {
  if (user.emailVerifiedAt) {
    return
  }

  const ctx = getAuthEmailContext()

  try {
    const rawToken = await issueEmailVerificationToken(user.id)
    const verifyUrl = buildVerifyEmailUrl(rawToken)

    await sendVerifyEmail(ctx, {
      to: user.email,
      recipientName: user.name,
      verifyUrl
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    logEmailEvent('error', 'Resend verification email failed', {
      userId: user.id,
      message
    })
  }
}

export async function resendVerificationEmail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true
    }
  })

  if (!user) {
    return
  }

  await resendVerificationForUser(user)
}

// Unauthenticated lookup path (see resendVerificationByEmailHandler for why
// this exists). Deliberately silent on "not found" / "already verified" to
// avoid revealing account existence, matching forgotPassword's behavior.
export async function resendVerificationEmailByAddress(email: string) {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email.trim().toLowerCase(),
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true
    }
  })

  if (!user) {
    return
  }

  await resendVerificationForUser(user)
}

export async function verifyEmailByToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashVerificationToken(rawToken)

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: tokenHash,
      emailVerificationExpiresAt: {
        gt: new Date()
      }
    },
    select: { id: true }
  })

  if (!user) {
    return false
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null
    }
  })

  return true
}
