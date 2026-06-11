export function formatOrderNumber(orderId: string) {
  return orderId.slice(-8).toUpperCase();
}

export function getClientOrderStatusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "UPLOADED":
      return "Ready to submit";
    case "PENDING":
      return "Submitted";
    case "ASSIGNED":
    case "IN_PROGRESS":
      return "In production";
    case "READY_FOR_QA":
    case "REVISION_REQUIRED":
      return "Quality review";
    case "APPROVED":
      return "Approved";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "In progress";
  }
}

export function formatOrderDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
