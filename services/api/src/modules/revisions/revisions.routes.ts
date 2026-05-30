import { Router } from 'express'
import { getRevisionsHealth } from './revisions.controller'

const revisionsRouter = Router()
revisionsRouter.get('/health', getRevisionsHealth)

export default revisionsRouter

