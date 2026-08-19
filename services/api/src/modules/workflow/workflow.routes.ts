import { Router } from 'express'
import { requireAuth } from '@repo/auth'
import { getWorkflowHealth, listOrderWorkflowEventsHandler } from './workflow.controller'

const workflowRouter = Router()

workflowRouter.get('/health', getWorkflowHealth)
workflowRouter.use(requireAuth)
workflowRouter.get('/orders/:orderId/events', listOrderWorkflowEventsHandler)

export default workflowRouter
