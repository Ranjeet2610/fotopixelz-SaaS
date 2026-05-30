import { Router } from 'express'
import { getOrganizationsHealth } from './organizations.controller'

const organizationsRouter = Router()
organizationsRouter.get('/health', getOrganizationsHealth)

export default organizationsRouter

