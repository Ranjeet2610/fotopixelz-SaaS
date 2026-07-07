type OrderNumberSource = string | { orderNumber?: string | null; id: string };

export function formatOrderNumber(source: OrderNumberSource) {
  if (typeof source === "object") {
    if (source.orderNumber) {
      return source.orderNumber;
    }
    return source.id.slice(-8).toUpperCase();
  }

  if (source.startsWith("FP-")) {
    return source;
  }

  return source.slice(-8).toUpperCase();
}

export function getClientOrderStatusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
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

export function isPreUploadOrderStatus(status: string) {
  return status === "DRAFT" || status === "SUBMITTED";
}
