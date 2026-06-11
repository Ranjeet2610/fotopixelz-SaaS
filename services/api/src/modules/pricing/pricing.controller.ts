import type { Request, Response } from 'express'
import type { Role } from '@repo/auth'
import { requireRole } from '@repo/auth'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import { buildQuote, getPricingStatus } from './pricing.service'
import { quoteSchema } from './pricing.validator'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const

export function getPricingHealth(_req: Request, res: Response) {
  res.status(200).json(getPricingStatus())
}

export async function quoteHandler(req: Request, res: Response) {
  const userId = req.user?.id ?? req.userId
  const role = req.role

  if (!userId || !role) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = quoteSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    await ensureOrganizationAccess(userId, role as Role, parsed.data.organizationId)

    const allowManualPricing = requireRole(role as Role, ADMIN_ROLES)
    const manualTotalAmount =
      allowManualPricing && typeof req.body?.manualTotalAmount === 'number'
        ? req.body.manualTotalAmount
        : undefined

    const data = await buildQuote({
      ...parsed.data,
      allowManualPricing,
      manualTotalAmount
    })

    return res.status(200).json({ success: true, data })
  } catch (error) {
    return sendError(res, error)
  }
}

async function ensureOrganizationAccess(userId: string, role: Role, organizationId: string) {
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      isActive: true
    },
    select: { id: true }
  })

  if (!organization) {
    throw new AppError(404, 'Organization not found')
  }

  if (requireRole(role, ADMIN_ROLES)) {
    return
  }

  if (role !== 'CLIENT') {
    throw new AppError(403, 'Forbidden')
  }

  const membership = await prisma.membership.findFirst({
    where: {
      organizationId,
      userId
    },
    select: { id: true }
  })

  if (!membership) {
    throw new AppError(403, 'Forbidden')
  }
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message })
  }

  const message = error instanceof Error ? error.message : 'Internal server error'
  return res.status(500).json({ success: false, message })
}
