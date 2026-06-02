import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import {
  completeUploadHandler,
  createBatchUploadsHandler,
  createPresignedUrlHandler,
  createUploadHandler,
  createZipUploadHandler,
  deleteUploadHandler,
  getUploadHandler,
  getUploadsHealth,
  listUploadsByOrderHandler,
  listUploadsHandler
} from './uploads.controller'

const uploadsRouter = Router()

uploadsRouter.use(requireAuth)

uploadsRouter.get('/health', getUploadsHealth)
uploadsRouter.post('/batch', createBatchUploadsHandler)
uploadsRouter.post('/zip', createZipUploadHandler)
uploadsRouter.post('/presigned-url', createPresignedUrlHandler)
uploadsRouter.post('/complete', completeUploadHandler)
uploadsRouter.post('/', createUploadHandler)
uploadsRouter.get('/', listUploadsHandler)
uploadsRouter.get('/order/:orderId', listUploadsByOrderHandler)
uploadsRouter.get('/:id', getUploadHandler)
uploadsRouter.delete('/:id', deleteUploadHandler)

export default uploadsRouter
