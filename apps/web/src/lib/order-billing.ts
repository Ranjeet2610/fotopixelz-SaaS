import type { CreatedOrder } from "@/lib/catalog-types";

export type OrderBillingLine = {
  quantity: number;
  unitPrice: number;
};

export type OrderBillingResult = {
  expectedImages: number;
  uploadedImages: number;
  availableCredits: number;
  freeCreditsUsed: number;
  billableImages: number;
  pricePerImage: number;
  amountDue: number;
  imagesNotUploaded: number;
  paymentRequired: boolean;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function getOrderServiceLines(order: CreatedOrder): OrderBillingLine[] {
  return (order.items ?? []).map((item) => ({
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  }));
}

export function getExpectedImages(order: CreatedOrder) {
  const serviceLines = getOrderServiceLines(order);
  if (serviceLines.length === 0) {
    return order.totalImages;
  }

  return serviceLines.reduce((sum, line) => sum + line.quantity, 0);
}

function getWeightedServiceUnitPrice(serviceLines: OrderBillingLine[]) {
  const expectedImages =
    serviceLines.length > 0
      ? serviceLines.reduce((sum, line) => sum + line.quantity, 0)
      : 0;

  if (expectedImages <= 0) {
    return serviceLines[0]?.unitPrice ?? 0;
  }

  const weightedTotal = serviceLines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );

  return roundMoney(weightedTotal / expectedImages);
}

export function buildSubmittedOrderBilling(order: CreatedOrder): OrderBillingResult {
  const serviceLines = getOrderServiceLines(order);
  const expectedImages = getExpectedImages(order);
  const uploadedImages = order.totalImages;
  const freeCreditsUsed = order.creditsUsed;
  const billableImages = Math.max(uploadedImages - freeCreditsUsed, 0);
  const pricePerImage = getWeightedServiceUnitPrice(serviceLines);

  return {
    expectedImages,
    uploadedImages,
    availableCredits: freeCreditsUsed,
    freeCreditsUsed,
    billableImages,
    pricePerImage,
    amountDue: order.totalAmount,
    imagesNotUploaded: Math.max(expectedImages - uploadedImages, 0),
    paymentRequired: order.totalAmount > 0,
  };
}

export function calculateOrderBilling(
  order: CreatedOrder,
  uploadedImages: number,
  availableCredits: number,
): OrderBillingResult {
  const serviceLines = getOrderServiceLines(order);
  const expectedImages = getExpectedImages(order);
  const credits = Math.max(0, availableCredits);
  const freeCreditsUsed = Math.min(credits, uploadedImages);
  const billableImages = Math.max(uploadedImages - credits, 0);
  const pricePerImage = getWeightedServiceUnitPrice(serviceLines);
  const amountDue = roundMoney(billableImages * pricePerImage);
  const imagesNotUploaded = Math.max(expectedImages - uploadedImages, 0);

  return {
    expectedImages,
    uploadedImages,
    availableCredits: credits,
    freeCreditsUsed,
    billableImages,
    pricePerImage,
    amountDue,
    imagesNotUploaded,
    paymentRequired: amountDue > 0,
  };
}
