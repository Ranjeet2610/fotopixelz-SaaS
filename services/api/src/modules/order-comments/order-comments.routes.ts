import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import {
  createCommentAttachmentPresignedHandler,
  createOrderCommentHandler,
  deleteOrderCommentHandler,
  getCommentAttachmentDownloadHandler,
  getOrderCommentsHealth,
  listOrderCommentsHandler,
  listOrderTimelineHandler,
  updateOrderCommentHandler
} from './order-comments.controller'

const orderCommentsRouter = Router()

orderCommentsRouter.get('/health', getOrderCommentsHealth)
orderCommentsRouter.use(requireAuth)
orderCommentsRouter.get('/orders/:orderId', listOrderCommentsHandler)
orderCommentsRouter.get('/orders/:orderId/timeline', listOrderTimelineHandler)
orderCommentsRouter.post('/', createOrderCommentHandler)
orderCommentsRouter.post('/attachment/presigned-url', createCommentAttachmentPresignedHandler)
orderCommentsRouter.get('/:commentId/attachment/download-url', getCommentAttachmentDownloadHandler)
orderCommentsRouter.patch('/:commentId', updateOrderCommentHandler)
orderCommentsRouter.delete('/:commentId', deleteOrderCommentHandler)

export default orderCommentsRouter
