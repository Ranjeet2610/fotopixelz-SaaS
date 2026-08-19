import { Router } from 'express'
import { getQaHealth } from './qa.controller'

const qaRouter = Router()
qaRouter.get('/health', getQaHealth)

export default qaRouter

