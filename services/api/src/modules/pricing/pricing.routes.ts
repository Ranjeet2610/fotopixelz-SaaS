import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import { getPricingHealth, quoteHandler } from './pricing.controller'

const pricingRouter = Router()

pricingRouter.get('/health', getPricingHealth)
pricingRouter.post('/quote', requireAuth, quoteHandler)

export default pricingRouter
