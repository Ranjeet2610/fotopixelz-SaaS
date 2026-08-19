import type { Request, Response } from 'express'
import { AppError } from '../../common/errors/app-error'
import {
  createCategory,
  deleteCategory,
  getCategoriesStatus,
  getCategoryById,
  listCategories,
  updateCategory
} from './categories.service'
import {
  categoryIdParamsSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema
} from './categories.validator'

export function getCategoriesHealth(_req: Request, res: Response) {
  return res.status(200).json(getCategoriesStatus())
}

export async function listCategoriesHandler(req: Request, res: Response) {
  const parsed = listCategoriesQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await listCategories(parsed.data)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function getCategoryByIdHandler(req: Request, res: Response) {
  const parsed = categoryIdParamsSchema.safeParse(req.params)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await getCategoryById(parsed.data.id)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function createCategoryHandler(req: Request, res: Response) {
  const parsed = createCategorySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    const result = await createCategory(parsed.data)
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function updateCategoryHandler(req: Request, res: Response) {
  const parsedParams = categoryIdParamsSchema.safeParse(req.params)
  if (!parsedParams.success) {
    return res.status(400).json({ success: false, errors: parsedParams.error.flatten() })
  }

  const parsedBody = updateCategorySchema.safeParse(req.body)
  if (!parsedBody.success) {
    return res.status(400).json({ success: false, errors: parsedBody.error.flatten() })
  }

  try {
    const result = await updateCategory(parsedParams.data.id, parsedBody.data)
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return sendError(res, error)
  }
}

export async function deleteCategoryHandler(req: Request, res: Response) {
  const parsed = categoryIdParamsSchema.safeParse(req.params)
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.flatten() })
  }

  try {
    await deleteCategory(parsed.data.id)
    return res.status(200).json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    return sendError(res, error)
  }
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message })
  }

  const message = error instanceof Error ? error.message : 'Internal server error'
  return res.status(500).json({ success: false, message })
}
