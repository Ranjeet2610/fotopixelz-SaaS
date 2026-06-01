import { Router } from 'express'
import { requireAdmin } from '../../common/middleware/admin'
import { requireAuth } from '../../common/middleware/auth'
import {
  deleteUserHandler,
  getAdminHealth,
  getUserByIdHandler,
  listClientsHandler,
  listEditorsHandler,
  listQaHandler,
  listUsersHandler,
  updateUserHandler,
  updateUserRoleHandler,
  updateUserStatusHandler
} from './admin.controller'

const adminRouter = Router()
adminRouter.get('/health', getAdminHealth)

adminRouter.use(requireAuth)
adminRouter.use(requireAdmin)

adminRouter.get('/users', listUsersHandler)
adminRouter.get('/users/editors', listEditorsHandler)
adminRouter.get('/users/qa', listQaHandler)
adminRouter.get('/users/clients', listClientsHandler)

adminRouter.get('/users/:id', getUserByIdHandler)
adminRouter.patch('/users/:id', updateUserHandler)
adminRouter.delete('/users/:id', deleteUserHandler)
adminRouter.patch('/users/:id/role', updateUserRoleHandler)
adminRouter.patch('/users/:id/status', updateUserStatusHandler)

export default adminRouter

