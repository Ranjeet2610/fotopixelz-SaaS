import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import {
  createOrderHandler,
  deleteOrderHandler,
  getOrderHandler,
  getOrdersHealth,
  listOrdersHandler,
  updateOrderHandler
} from './orders.controller'

const ordersRouter = Router()

ordersRouter.get('/health', getOrdersHealth)

ordersRouter.use(requireAuth)
ordersRouter.get('/', listOrdersHandler)
ordersRouter.post('/', createOrderHandler)
ordersRouter.get('/:orderId', getOrderHandler)
ordersRouter.patch('/:orderId', updateOrderHandler)
ordersRouter.delete('/:orderId', deleteOrderHandler)

export default ordersRouter
