import { Router } from 'express'
import { getAuditLogsStatus } from './audit-logs.controller'

const auditLogsRouter = Router()
auditLogsRouter.get('/health', getAuditLogsStatus)

export default auditLogsRouter
