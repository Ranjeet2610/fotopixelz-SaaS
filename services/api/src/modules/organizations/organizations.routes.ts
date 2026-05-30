import { Router } from 'express'
import { requireAdmin } from '../../common/middleware/admin'
import { requireAuth } from '../../common/middleware/auth'
import {
  createMembershipHandler,
  createOrganizationHandler,
  deleteMembershipHandler,
  deleteOrganizationHandler,
  getOrganizationHandler,
  getOrganizationsHealth,
  listMembershipsHandler,
  listOrganizationsHandler,
  updateMembershipHandler,
  updateOrganizationHandler
} from './organizations.controller'

const organizationsRouter = Router()

organizationsRouter.get('/health', getOrganizationsHealth)

organizationsRouter.use(requireAuth)
organizationsRouter.get('/', listOrganizationsHandler)
organizationsRouter.post('/', requireAdmin, createOrganizationHandler)
organizationsRouter.get('/:organizationId', getOrganizationHandler)
organizationsRouter.patch('/:organizationId', requireAdmin, updateOrganizationHandler)
organizationsRouter.delete('/:organizationId', requireAdmin, deleteOrganizationHandler)

organizationsRouter.get('/:organizationId/memberships', requireAdmin, listMembershipsHandler)
organizationsRouter.post('/:organizationId/memberships', requireAdmin, createMembershipHandler)
organizationsRouter.patch(
  '/:organizationId/memberships/:membershipId',
  requireAdmin,
  updateMembershipHandler
)
organizationsRouter.delete(
  '/:organizationId/memberships/:membershipId',
  requireAdmin,
  deleteMembershipHandler
)

export default organizationsRouter
