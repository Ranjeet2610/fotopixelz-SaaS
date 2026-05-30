import { Router } from 'express'
import { getEditingHealth } from './editing.controller'

const editingRouter = Router()
editingRouter.get('/health', getEditingHealth)

export default editingRouter

