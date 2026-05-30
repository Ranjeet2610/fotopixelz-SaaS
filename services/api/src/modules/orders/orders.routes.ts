import { Router } from 'express'
import { getOrdersHealth } from './orders.controller'

const ordersRouter = Router()
ordersRouter.get('/health', getOrdersHealth)

export default ordersRouter

