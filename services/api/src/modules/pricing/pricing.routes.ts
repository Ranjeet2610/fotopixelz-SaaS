import { Router } from 'express'
import { getPricingHealth } from './pricing.controller'

const pricingRouter = Router()
pricingRouter.get('/health', getPricingHealth)

export default pricingRouter

