import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type {
  CategoryDTO,
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput
} from './categories.types'

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true,
  updatedAt: true
} as const

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueConstraintMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
    return fallback
  }
  return undefined
}

export function getCategoriesStatus() {
  return { module: 'categories', status: 'ok' as const }
}

export async function listCategories(query: ListCategoriesQuery) {
  const skip = (query.page - 1) * query.limit

  const [items, total] = await prisma.$transaction([
    prisma.serviceCategory.findMany({
      select: categorySelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit
    }),
    prisma.serviceCategory.count()
  ])

  return {
    items,
    page: query.page,
    limit: query.limit,
    total
  }
}

export async function getCategoryById(id: string): Promise<CategoryDTO> {
  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    select: categorySelect
  })

  if (!category) {
    throw new AppError(404, 'Category not found')
  }

  return category
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryDTO> {
  const slug = (input.slug?.trim() || slugify(input.name))

  try {
    return await prisma.serviceCategory.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        slug
      },
      select: categorySelect
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Category slug already exists')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryDTO> {
  const existing = await prisma.serviceCategory.findUnique({
    where: { id },
    select: { id: true, name: true }
  })

  if (!existing) {
    throw new AppError(404, 'Category not found')
  }

  const slug =
    input.slug !== undefined
      ? input.slug
      : (input.name ? slugify(input.name) : undefined)

  try {
    return await prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(slug !== undefined ? { slug } : {})
      },
      select: categorySelect
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Category slug already exists')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await prisma.serviceCategory.findUnique({
    where: { id },
    select: { id: true }
  })

  if (!existing) {
    throw new AppError(404, 'Category not found')
  }

  await prisma.serviceCategory.delete({
    where: { id }
  })
}
