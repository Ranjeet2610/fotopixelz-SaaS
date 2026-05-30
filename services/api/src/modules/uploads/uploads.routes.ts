import { Router } from 'express'
import { requireAdmin } from '../../common/middleware/admin'
import { requireAuth } from '../../common/middleware/auth'
import {
  createUploadHandler,
  deleteUploadHandler,
  getUploadHandler,
  getUploadsHealth,
  listUploadsHandler,
  updateUploadHandler
} from './uploads.controller'

const uploadsRouter = Router()

uploadsRouter.get('/health', getUploadsHealth)

uploadsRouter.use(requireAuth)
uploadsRouter.get('/', listUploadsHandler)
uploadsRouter.post('/', createUploadHandler)
uploadsRouter.get('/:uploadId', getUploadHandler)
uploadsRouter.patch('/:uploadId', requireAdmin, updateUploadHandler)
uploadsRouter.delete('/:uploadId', requireAdmin, deleteUploadHandler)

export default uploadsRouter
