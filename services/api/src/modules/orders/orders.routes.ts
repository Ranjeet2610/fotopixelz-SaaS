import { Router } from 'express'
import { requireAdmin } from '../../common/middleware/admin'
import { requireAuth } from '../../common/middleware/auth'
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
ordersRouter.patch('/:orderId', requireAdmin, updateOrderHandler)
ordersRouter.delete('/:orderId', requireAdmin, deleteOrderHandler)

export default ordersRouter
