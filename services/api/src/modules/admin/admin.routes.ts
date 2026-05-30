import { Router } from 'express'
import { getAdminHealth } from './admin.controller'

const adminRouter = Router()
adminRouter.get('/health', getAdminHealth)

export default adminRouter

