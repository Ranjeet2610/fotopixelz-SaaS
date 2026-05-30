import { Router } from 'express'
import { getworkflowStatus } from './workflow.controller'

const workflowRouter = Router()
workflowRouter.get('/health', getworkflowStatus)

export default workflowRouter
