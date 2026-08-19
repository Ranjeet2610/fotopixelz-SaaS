import { Router } from 'express'
import { requireAdmin, requireAuth } from '@repo/auth'
import {
  createServiceHandler,
  deleteServiceHandler,
  getServiceByIdHandler,
  getServicesHealth,
  listServicesHandler,
  updateServiceHandler
} from './services.controller'

const servicesRouter = Router()

servicesRouter.get('/health', getServicesHealth)
servicesRouter.get('/', listServicesHandler)
servicesRouter.get('/:id', getServiceByIdHandler)

servicesRouter.post('/', requireAuth, requireAdmin, createServiceHandler)
servicesRouter.patch('/:id', requireAuth, requireAdmin, updateServiceHandler)
servicesRouter.delete('/:id', requireAuth, requireAdmin, deleteServiceHandler)

export default servicesRouter
