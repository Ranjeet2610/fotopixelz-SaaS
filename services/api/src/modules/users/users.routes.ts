import { Router } from 'express'
import { getUsersHealth } from './users.controller'

const usersRouter = Router()
usersRouter.get('/health', getUsersHealth)

export default usersRouter

