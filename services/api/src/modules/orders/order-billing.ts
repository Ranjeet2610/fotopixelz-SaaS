export type OrderBillingLine = {
  quantity: number
  unitPrice: number
}

export type OrderBillingInput = {
  uploadedImages: number
  availableCredits: number
  serviceLines: OrderBillingLine[]
  fallbackExpectedImages?: number
}

export type OrderBillingResult = {
  expectedImages: number
  uploadedImages: number
  availableCredits: number
  freeCreditsUsed: number
  billableImages: number
  pricePerImage: number
  amountDue: number
  imagesNotUploaded: number
  paymentRequired: boolean
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function getExpectedImages(
  serviceLines: OrderBillingLine[],
  fallbackExpectedImages = 0
) {
  if (serviceLines.length === 0) {
    return fallbackExpectedImages
  }

  return serviceLines.reduce((sum, line) => sum + line.quantity, 0)
}

export function getWeightedServiceUnitPrice(serviceLines: OrderBillingLine[]) {
  const expectedImages = getExpectedImages(serviceLines)
  if (expectedImages <= 0) {
    return serviceLines[0]?.unitPrice ?? 0
  }

  const weightedTotal = serviceLines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  )

  return roundMoney(weightedTotal / expectedImages)
}

export function calculateOrderBilling(input: OrderBillingInput): OrderBillingResult {
  const expectedImages = getExpectedImages(input.serviceLines, input.fallbackExpectedImages)
  const uploadedImages = input.uploadedImages
  const availableCredits = Math.max(0, input.availableCredits)
  const freeCreditsUsed = Math.min(availableCredits, uploadedImages)
  const billableImages = Math.max(uploadedImages - availableCredits, 0)
  const pricePerImage = getWeightedServiceUnitPrice(input.serviceLines)
  const amountDue = roundMoney(billableImages * pricePerImage)
  const imagesNotUploaded = Math.max(expectedImages - uploadedImages, 0)

  return {
    expectedImages,
    uploadedImages,
    availableCredits,
    freeCreditsUsed,
    billableImages,
    pricePerImage,
    amountDue,
    imagesNotUploaded,
    paymentRequired: amountDue > 0
  }
}
