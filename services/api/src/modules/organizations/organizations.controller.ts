import type { Request, Response } from 'express'
import type { Role } from '@repo/auth/roles'
import { AppError } from '../../common/errors/app-error'
import {
  createMembershipSchema,
  createOrganizationSchema,
  listOrganizationsQuerySchema,
  membershipIdParamsSchema,
  organizationIdParamsSchema,
  updateMembershipSchema,
  updateOrganizationSchema
} from './organizations.validator'
import {
  createMembership,
  createOrganization,
  deleteMembership,
  deleteOrganization,
  getOrganization,
  getOrganizationsStatus,
  listMemberships,
  listOrganizations,
  updateMembership,
  updateOrganization
} from './organizations.service'
import type { RequestContext } from './organizations.types'

export function getOrganizationsHealth(_req: Request, res: Response) {
  res.status(200).json(getOrganizationsStatus())
}

export async function listOrganizationsHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const parsed = listOrganizationsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const organizations = await listOrganizations(context, parsed.data)
    return res.status(200).json({ success: true, data: organizations })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function getOrganizationHandler(req: Request, res: Response) {
  const context = requestContext(req)
  if (!context) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  const params = organizationIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const organization = await getOrganization(context, params.data.organizationId)
    return res.status(200).json({ success: true, data: organization })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createOrganizationHandler(req: Request, res: Response) {
  const parsed = createOrganizationSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const organization = await createOrganization(parsed.data)
    return res.status(201).json({ success: true, data: organization })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateOrganizationHandler(req: Request, res: Response) {
  const params = organizationIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const parsed = updateOrganizationSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const organization = await updateOrganization(params.data.organizationId, parsed.data)
    return res.status(200).json({ success: true, data: organization })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteOrganizationHandler(req: Request, res: Response) {
  const params = organizationIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const organization = await deleteOrganization(params.data.organizationId)
    return res.status(200).json({ success: true, data: organization })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function listMembershipsHandler(req: Request, res: Response) {
  const params = organizationIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const memberships = await listMemberships(params.data.organizationId)
    return res.status(200).json({ success: true, data: memberships })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createMembershipHandler(req: Request, res: Response) {
  const params = organizationIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const parsed = createMembershipSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const membership = await createMembership(params.data.organizationId, parsed.data)
    return res.status(201).json({ success: true, data: membership })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateMembershipHandler(req: Request, res: Response) {
  const params = membershipIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const parsed = updateMembershipSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const membership = await updateMembership(
      params.data.organizationId,
      params.data.membershipId,
      parsed.data
    )
    return res.status(200).json({ success: true, data: membership })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteMembershipHandler(req: Request, res: Response) {
  const params = membershipIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    await deleteMembership(params.data.organizationId, params.data.membershipId)
    return res.status(204).send()
  } catch (error) {
    return sendError(res, error)
  }
}

function requestContext(req: Request): RequestContext | undefined {
  if (!req.userId || !req.role) {
    return undefined
  }

  return {
    userId: req.userId,
    role: req.role as Role
  }
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message })
  }

  const message = error instanceof Error ? error.message : 'Internal server error'
  return res.status(500).json({ success: false, message })
}
