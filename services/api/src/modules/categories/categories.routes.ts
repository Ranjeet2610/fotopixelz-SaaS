import { Router } from 'express'
import { requireAdmin } from '../../common/middleware/admin'
import { requireAuth } from '../../common/middleware/auth'
import {
  createCategoryHandler,
  deleteCategoryHandler,
  getCategoriesHealth,
  getCategoryByIdHandler,
  listCategoriesHandler,
  updateCategoryHandler
} from './categories.controller'

const categoriesRouter = Router()

categoriesRouter.get('/health', getCategoriesHealth)
categoriesRouter.get('/', listCategoriesHandler)
categoriesRouter.get('/:id', getCategoryByIdHandler)

categoriesRouter.post('/', requireAuth, requireAdmin, createCategoryHandler)
categoriesRouter.patch('/:id', requireAuth, requireAdmin, updateCategoryHandler)
categoriesRouter.delete('/:id', requireAuth, requireAdmin, deleteCategoryHandler)

export default categoriesRouter
