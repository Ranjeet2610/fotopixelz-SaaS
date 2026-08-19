import { Router } from 'express'
import { getAiHealth } from './ai.controller'

const aiRouter = Router()
aiRouter.get('/health', getAiHealth)

export default aiRouter

