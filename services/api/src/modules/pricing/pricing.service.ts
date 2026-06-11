import type { AddonPricingType } from '@prisma/client'
import { AppError } from '../../common/errors/app-error'
import { prisma } from '../../database/prisma'
import type { QuoteInput, QuoteResult, QuotedAddonLine, QuotedServiceLine } from './pricing.types'

export function getPricingStatus() {
  return { module: 'pricing', status: 'ok' as const }
}

export async function buildQuote(input: QuoteInput): Promise<QuoteResult> {
  const items = input.items ?? []
  const addons = input.addons ?? []
  const hasCatalogLines = items.length > 0 || addons.length > 0

  const serviceLines = await resolveServiceLines(items, input.organizationId)
  const totalImageCount = serviceLines.reduce((sum, line) => sum + line.quantity, 0)
  const addonLines = await resolveAddonLines(addons, totalImageCount)

  const servicesSubtotal = sumSubtotals(serviceLines)
  const addonsSubtotal = sumSubtotals(addonLines)
  const calculatedGrandTotal = roundMoney(servicesSubtotal + addonsSubtotal)
  const creditsUsed = addonLines.reduce((sum, line) => sum + line.credits, 0)

  const canUseManualTotal =
    input.allowManualPricing === true && input.manualTotalAmount !== undefined
  const grandTotal = canUseManualTotal
    ? roundMoney(input.manualTotalAmount!)
    : hasCatalogLines
      ? calculatedGrandTotal
      : input.allowManualPricing
        ? roundMoney(input.manualTotalAmount ?? 0)
        : 0

  return {
    organizationId: input.organizationId,
    currency: input.currency ?? 'USD',
    totalImageCount,
    items: serviceLines,
    addons: addonLines,
    servicesSubtotal: roundMoney(servicesSubtotal),
    addonsSubtotal: roundMoney(addonsSubtotal),
    grandTotal,
    creditsUsed,
    isManualTotal: canUseManualTotal
  }
}

async function resolveServiceLines(
  items: QuoteInput['items'],
  organizationId: string
): Promise<QuotedServiceLine[]> {
  if (!items || items.length === 0) {
    return []
  }

  const serviceIds = [...new Set(items.map((item) => item.serviceId))]
  const services = await prisma.service.findMany({
    where: {
      id: { in: serviceIds },
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }]
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true
    }
  })

  const serviceMap = new Map(services.map((service) => [service.id, service]))

  return items.map((item) => {
    const service = serviceMap.get(item.serviceId)
    if (!service) {
      throw new AppError(404, `Service not found: ${item.serviceId}`)
    }

    const unitPrice = item.unitPrice ?? service.basePrice
    const subtotal = roundMoney(unitPrice * item.quantity)

    return {
      serviceId: item.serviceId,
      serviceName: service.name,
      serviceSlug: service.slug,
      quantity: item.quantity,
      unitPrice,
      subtotal,
      notes: item.notes ?? null
    }
  })
}

async function resolveAddonLines(
  addons: QuoteInput['addons'],
  totalImageCount: number
): Promise<QuotedAddonLine[]> {
  if (!addons || addons.length === 0) {
    return []
  }

  const addonIds = [...new Set(addons.map((addon) => addon.addonId))]
  const catalogAddons = await prisma.addon.findMany({
    where: {
      id: { in: addonIds },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      pricingType: true,
      credits: true
    }
  })

  const addonMap = new Map(catalogAddons.map((addon) => [addon.id, addon]))

  return addons.map((input) => {
    const addon = addonMap.get(input.addonId)
    if (!addon) {
      throw new AppError(404, `Addon not found: ${input.addonId}`)
    }

    const quantity = resolveAddonQuantity(addon.pricingType, input.quantity, totalImageCount)
    const subtotal = roundMoney(calculateAddonSubtotal(addon.pricingType, addon.price, quantity))
    const credits = addon.pricingType === 'PER_IMAGE' ? addon.credits * quantity : addon.credits

    return {
      addonId: addon.id,
      addonName: addon.name,
      addonSlug: addon.slug,
      quantity,
      unitPrice: addon.price,
      pricingType: addon.pricingType,
      subtotal,
      credits
    }
  })
}

function resolveAddonQuantity(
  pricingType: AddonPricingType,
  requestedQuantity: number | undefined,
  totalImageCount: number
) {
  if (pricingType === 'PER_IMAGE') {
    if (requestedQuantity !== undefined) {
      return requestedQuantity
    }
    if (totalImageCount > 0) {
      return totalImageCount
    }
    throw new AppError(400, 'Per-image addons require service image quantities or an explicit addon quantity')
  }

  return requestedQuantity ?? 1
}

function calculateAddonSubtotal(pricingType: AddonPricingType, unitPrice: number, quantity: number) {
  if (pricingType === 'PER_IMAGE') {
    return unitPrice * quantity
  }

  return unitPrice
}

function sumSubtotals(lines: Array<{ subtotal: number }>) {
  return lines.reduce((sum, line) => sum + line.subtotal, 0)
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}
