import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import {
  assignEditorHandler,
  assignQaHandler,
  createOrderHandler,
  deleteOrderHandler,
  getOrderHandler,
  getOrdersHealth,
  listOrdersHandler,
  updateOrderHandler,
  updateOrderStatusHandler
} from './orders.controller'

const ordersRouter = Router()

ordersRouter.use(requireAuth)

ordersRouter.get('/health', getOrdersHealth)
ordersRouter.post('/', createOrderHandler)
ordersRouter.get('/', listOrdersHandler)
ordersRouter.patch('/status', updateOrderStatusHandler)
ordersRouter.patch('/assign-editor', assignEditorHandler)
ordersRouter.patch('/assign-qa', assignQaHandler)
ordersRouter.get('/:id', getOrderHandler)
ordersRouter.patch('/:id', updateOrderHandler)
ordersRouter.delete('/:id', deleteOrderHandler)

export default ordersRouter
