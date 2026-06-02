import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import {
  getMeHandler,
  getMyBillingHandler,
  getMyCreditsHandler,
  getUsersHealth,
  updateMeHandler,
  updateMyBillingHandler
} from './users.controller'

const usersRouter = Router()
usersRouter.get('/health', getUsersHealth)
usersRouter.use(requireAuth)
usersRouter.get('/me', getMeHandler)
usersRouter.patch('/me', updateMeHandler)
usersRouter.get('/me/billing', getMyBillingHandler)
usersRouter.patch('/me/billing', updateMyBillingHandler)
usersRouter.get('/me/credits', getMyCreditsHandler)

export default usersRouter

