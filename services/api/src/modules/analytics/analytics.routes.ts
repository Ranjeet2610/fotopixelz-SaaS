import { Router } from 'express'
import { getAnalyticsHealth } from './analytics.controller'

const analyticsRouter = Router()
analyticsRouter.get('/health', getAnalyticsHealth)

export default analyticsRouter

