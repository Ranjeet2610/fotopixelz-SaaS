import { Router } from 'express'
import { getNotificationsHealth } from './notifications.controller'

const notificationsRouter = Router()
notificationsRouter.get('/health', getNotificationsHealth)

export default notificationsRouter

