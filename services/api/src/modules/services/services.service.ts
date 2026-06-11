import type { Prisma } from '@prisma/client'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type {
  CreateServiceInput,
  ListServicesQuery,
  ServiceDTO,
  UpdateServiceInput
} from './services.types'

const serviceSelect = {
  id: true,
  categoryId: true,
  organizationId: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  organization: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  }
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

export function getServicesStatus() {
  return { module: 'services', status: 'ok' as const }
}

function buildListWhere(query: ListServicesQuery, includeInactive: boolean): Prisma.ServiceWhereInput {
  const conditions: Prisma.ServiceWhereInput[] = []

  if (!includeInactive) {
    conditions.push({ isActive: true })
  }

  if (query.categoryId) {
    conditions.push({ categoryId: query.categoryId })
  }

  if (query.scope === 'global') {
    conditions.push({ organizationId: null })
  } else if (query.scope === 'organization') {
    if (query.organizationId) {
      conditions.push({ organizationId: query.organizationId })
    } else {
      conditions.push({ organizationId: { not: null } })
    }
  } else if (query.organizationId) {
    conditions.push({
      OR: [{ organizationId: null }, { organizationId: query.organizationId }]
    })
  }

  if (query.q) {
    conditions.push({
      OR: [
        { name: { contains: query.q, mode: 'insensitive' } },
        { slug: { contains: query.q, mode: 'insensitive' } }
      ]
    })
  }

  if (conditions.length === 0) {
    return {}
  }

  if (conditions.length === 1) {
    return conditions[0]
  }

  return { AND: conditions }
}

export async function listServices(query: ListServicesQuery, includeInactive = false) {
  const skip = (query.page - 1) * query.limit
  const where = buildListWhere(query, includeInactive)

  const [items, total] = await prisma.$transaction([
    prisma.service.findMany({
      where,
      select: serviceSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit
    }),
    prisma.service.count({ where })
  ])

  return {
    items,
    page: query.page,
    limit: query.limit,
    total
  }
}

export async function getServiceById(id: string, includeInactive = false): Promise<ServiceDTO> {
  const service = await prisma.service.findFirst({
    where: {
      id,
      ...(includeInactive ? {} : { isActive: true })
    },
    select: serviceSelect
  })

  if (!service) {
    throw new AppError(404, 'Service not found')
  }

  return service
}

async function ensureCategoryExists(categoryId: string) {
  const category = await prisma.serviceCategory.findUnique({
    where: { id: categoryId },
    select: { id: true }
  })

  if (!category) {
    throw new AppError(404, 'Category not found')
  }
}

async function ensureOrganizationExists(organizationId: string) {
  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      isActive: true
    },
    select: { id: true }
  })

  if (!organization) {
    throw new AppError(404, 'Organization not found')
  }
}

export async function createService(input: CreateServiceInput): Promise<ServiceDTO> {
  await ensureCategoryExists(input.categoryId)

  if (input.organizationId) {
    await ensureOrganizationExists(input.organizationId)
  }

  const slug = input.slug?.trim() || slugify(input.name)

  try {
    return await prisma.service.create({
      data: {
        categoryId: input.categoryId,
        organizationId: input.organizationId ?? null,
        name: input.name,
        description: input.description ?? null,
        slug,
        basePrice: input.basePrice ?? 0,
        isActive: input.isActive ?? true
      },
      select: serviceSelect
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Service slug already exists')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function updateService(id: string, input: UpdateServiceInput): Promise<ServiceDTO> {
  const existing = await prisma.service.findUnique({
    where: { id },
    select: { id: true, name: true }
  })

  if (!existing) {
    throw new AppError(404, 'Service not found')
  }

  if (input.categoryId) {
    await ensureCategoryExists(input.categoryId)
  }

  if (input.organizationId) {
    await ensureOrganizationExists(input.organizationId)
  }

  const slug =
    input.slug !== undefined ? input.slug : input.name ? slugify(input.name) : undefined

  try {
    return await prisma.service.update({
      where: { id },
      data: {
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(input.basePrice !== undefined ? { basePrice: input.basePrice } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
      },
      select: serviceSelect
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Service slug already exists')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function deleteService(id: string): Promise<void> {
  const existing = await prisma.service.findUnique({
    where: { id },
    select: { id: true, isActive: true }
  })

  if (!existing) {
    throw new AppError(404, 'Service not found')
  }

  if (!existing.isActive) {
    return
  }

  await prisma.service.update({
    where: { id },
    data: { isActive: false }
  })
}
