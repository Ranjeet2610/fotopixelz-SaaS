import { Router } from 'express'
import { requireAdmin, requireAuth } from '@repo/auth'
import {
  createAddonHandler,
  deleteAddonHandler,
  getAddonByIdHandler,
  listAddonsHandler,
  updateAddonHandler
} from './addons.controller'

const addonsRouter = Router()

addonsRouter.get('/', listAddonsHandler)
addonsRouter.get('/:id', getAddonByIdHandler)

addonsRouter.post('/', requireAuth, requireAdmin, createAddonHandler)
addonsRouter.patch('/:id', requireAuth, requireAdmin, updateAddonHandler)
addonsRouter.delete('/:id', requireAuth, requireAdmin, deleteAddonHandler)

export default addonsRouter
