import { Router } from 'express'
import { getUploadsHealth } from './uploads.controller'

const uploadsRouter = Router()
uploadsRouter.get('/health', getUploadsHealth)

export default uploadsRouter

