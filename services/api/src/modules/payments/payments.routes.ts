import { Router } from 'express'
import { getPaymentsHealth } from './payments.controller'

const paymentsRouter = Router()
paymentsRouter.get('/health', getPaymentsHealth)

export default paymentsRouter

