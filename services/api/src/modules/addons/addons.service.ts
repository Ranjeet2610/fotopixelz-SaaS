import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type {
  AddonDTO,
  CreateAddonInput,
  ListAddonsQuery,
  UpdateAddonInput
} from './addons.types'

const addonSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  credits: true,
  isActive: true,
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

export async function listAddons(query: ListAddonsQuery) {
  const skip = (query.page - 1) * query.limit
  const where = { isActive: true }

  const [items, total] = await prisma.$transaction([
    prisma.addon.findMany({
      where,
      select: addonSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.limit
    }),
    prisma.addon.count({ where })
  ])

  return {
    items,
    page: query.page,
    limit: query.limit,
    total
  }
}

export async function getAddonById(id: string): Promise<AddonDTO> {
  const addon = await prisma.addon.findFirst({
    where: {
      id,
      isActive: true
    },
    select: addonSelect
  })

  if (!addon) {
    throw new AppError(404, 'Addon not found')
  }

  return addon
}

export async function createAddon(input: CreateAddonInput): Promise<AddonDTO> {
  const slug = input.slug?.trim() || slugify(input.name)

  try {
    return await prisma.addon.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        slug,
        price: input.price ?? 0,
        credits: input.credits ?? 0
      },
      select: addonSelect
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Addon slug already exists')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function updateAddon(id: string, input: UpdateAddonInput): Promise<AddonDTO> {
  const existing = await prisma.addon.findFirst({
    where: {
      id,
      isActive: true
    },
    select: { id: true }
  })

  if (!existing) {
    throw new AppError(404, 'Addon not found')
  }

  const slug =
    input.slug !== undefined
      ? input.slug
      : (input.name ? slugify(input.name) : undefined)

  try {
    return await prisma.addon.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.credits !== undefined ? { credits: input.credits } : {})
      },
      select: addonSelect
    })
  } catch (error) {
    const message = uniqueConstraintMessage(error, 'Addon slug already exists')
    if (message) {
      throw new AppError(409, message)
    }
    throw error
  }
}

export async function deleteAddon(id: string): Promise<void> {
  const existing = await prisma.addon.findFirst({
    where: {
      id,
      isActive: true
    },
    select: { id: true }
  })

  if (!existing) {
    throw new AppError(404, 'Addon not found')
  }

  await prisma.addon.update({
    where: { id },
    data: { isActive: false }
  })
}
