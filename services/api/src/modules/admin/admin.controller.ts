import type { Request, Response } from 'express'
import { AppError } from '../../common/errors/app-error'
import { assertCanCreateStaffUser, isUserManagementActor } from './admin.permissions'
import {
  adminUserIdParamsSchema,
  createUserSchema,
  listAdminUsersQuerySchema,
  updateAdminUserRoleSchema,
  updateAdminUserRoleSchemaAdmin,
  updateAdminUserSchema,
  updateAdminUserStatusSchema
} from './admin.validator'
import {
  createStaffUser,
  getAdminStatus,
  getUserById,
  listUsers,
  softDeleteUser,
  updateUserById,
  updateUserRole,
  updateUserStatus
} from './admin.service'

export function getAdminHealth(_req: Request, res: Response) {
  res.status(200).json(getAdminStatus())
}

export async function createStaffUserHandler(req: Request, res: Response) {
  const actorRole = req.role
  if (!isUserManagementActor(actorRole)) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    assertCanCreateStaffUser(actorRole, parsed.data.role)
    const data = await createStaffUser(parsed.data, actorRole)
    return res.status(201).json({ success: true, data })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function listUsersHandler(req: Request, res: Response) {
  const actorRole = req.role
  const actorUserId = req.userId
  if (!isUserManagementActor(actorRole) || !actorUserId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const parsed = listAdminUsersQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const data = await listUsers(parsed.data, actorRole, actorUserId)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function listEditorsHandler(req: Request, res: Response) {
  return listUsersByRole(req, res, 'EDITOR')
}

export async function listQaHandler(req: Request, res: Response) {
  return listUsersByRole(req, res, 'QA')
}

export async function listClientsHandler(req: Request, res: Response) {
  return listUsersByRole(req, res, 'CLIENT')
}

export async function getUserByIdHandler(req: Request, res: Response) {
  const actorRole = req.role
  const actorUserId = req.userId
  if (!isUserManagementActor(actorRole) || !actorUserId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const params = adminUserIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const data = await getUserById(params.data.id, actorRole, actorUserId)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateUserHandler(req: Request, res: Response) {
  const actorRole = req.role
  const actorUserId = req.userId
  if (!isUserManagementActor(actorRole) || !actorUserId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const params = adminUserIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const parsed = updateAdminUserSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const data = await updateUserById(params.data.id, parsed.data, actorRole, actorUserId)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateUserRoleHandler(req: Request, res: Response) {
  const actorRole = req.role
  const actorUserId = req.userId
  if (!isUserManagementActor(actorRole) || !actorUserId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const params = adminUserIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const schema = actorRole === 'SUPER_ADMIN' ? updateAdminUserRoleSchema : updateAdminUserRoleSchemaAdmin
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const data = await updateUserRole(params.data.id, parsed.data, actorRole, actorUserId)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateUserStatusHandler(req: Request, res: Response) {
  const actorRole = req.role
  const actorUserId = req.userId
  if (!isUserManagementActor(actorRole) || !actorUserId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const params = adminUserIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  const parsed = updateAdminUserStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const data = await updateUserStatus(params.data.id, parsed.data, actorRole, actorUserId)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteUserHandler(req: Request, res: Response) {
  const actorRole = req.role
  const actorUserId = req.userId
  if (!isUserManagementActor(actorRole) || !actorUserId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const params = adminUserIdParamsSchema.safeParse(req.params)
  if (!params.success) {
    return res.status(400).json({ success: false, errors: params.error.flatten() })
  }

  try {
    const data = await softDeleteUser(params.data.id, actorRole, actorUserId)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return sendError(res, error)
  }
}

async function listUsersByRole(
  req: Request,
  res: Response,
  role: 'EDITOR' | 'QA' | 'CLIENT'
) {
  const actorRole = req.role
  const actorUserId = req.userId
  if (!isUserManagementActor(actorRole) || !actorUserId) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const parsed = listAdminUsersQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const data = await listUsers(parsed.data, actorRole, actorUserId, role)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return sendError(res, error)
  }
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message })
  }

  const message = error instanceof Error ? error.message : 'Internal server error'
  return res.status(500).json({ success: false, message })
}
