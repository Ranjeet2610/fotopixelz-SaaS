import { Router } from 'express'
import { getservicesStatus } from './services.controller'

const servicesRouter = Router()
servicesRouter.get('/health', getservicesStatus)

export default servicesRouter
