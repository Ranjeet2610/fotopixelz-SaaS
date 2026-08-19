import type { ApiRecord } from "@/lib/types";

export const WORKFLOW_EVENT_LABELS: Record<string, string> = {
  ORDER_CREATED: "Order created",
  IMAGES_UPLOADED: "Images uploaded",
  ORDER_SUBMITTED: "Order submitted",
  EDITOR_ASSIGNED: "Editor assigned",
  EDITOR_STARTED: "Editor started work",
  ASSET_UPLOADED: "Deliverable uploaded",
  DELIVERABLE_VERSION_UPLOADED: "Deliverable uploaded",
  REVISION_SUBMITTED: "Revision submitted",
  QA_ASSIGNED: "QA reviewer assigned",
  READY_FOR_QA: "Ready for QA",
  QA_APPROVED: "QA approved",
  QA_REVISION_REQUESTED: "Revision requested",
  REVISION_REQUESTED: "Revision requested",
  DELIVERY_SENT: "Order delivered",
  ORDER_STATUS_CHANGED: "Order status updated",
  QA_SUBMITTED: "Ready for QA",
  PAYMENT_CONFIRMED: "Order submitted",
  AI_JOB_STARTED: "AI job started",
  AI_JOB_COMPLETED: "AI job completed",
  COMMENT_CREATED: "Comment posted",
  COMMENT_RESOLVED: "Issue resolved",
};

function payloadText(payload: Record<string, unknown> | undefined, key: string) {
  const value = payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function resolveLegacyLabel(eventType: string, payload?: Record<string, unknown>) {
  if (eventType === "QA_SUBMITTED") {
    const action = payloadText(payload, "action");
    if (action === "QA_ASSIGNED") {
      return "QA reviewer assigned";
    }
    const toStatus = payloadText(payload, "toStatus");
    if (toStatus === "READY_FOR_QA") {
      return "Ready for QA";
    }
    return "Ready for QA";
  }

  return WORKFLOW_EVENT_LABELS[eventType];
}

export function describeWorkflowEvent(eventType: string, payload?: Record<string, unknown> | null) {
  const orderNumber = payloadText(payload ?? undefined, "orderNumber");
  const label = resolveLegacyLabel(eventType, payload ?? undefined) ?? eventType.replaceAll("_", " ");
  const baseLabel = orderNumber ? `${orderNumber}: ${label}` : label;
  const fromStatus = payloadText(payload ?? undefined, "fromStatus");
  const toStatus = payloadText(payload ?? undefined, "toStatus");
  const note = payloadText(payload ?? undefined, "note");
  const fileName = payloadText(payload ?? undefined, "fileName");
  const assetName = payloadText(payload ?? undefined, "assetName");

  if (eventType === "ORDER_STATUS_CHANGED" && fromStatus && toStatus) {
    return `${baseLabel}: ${fromStatus} → ${toStatus}`;
  }

  if (fromStatus && toStatus && fromStatus !== toStatus && eventType !== "REVISION_REQUESTED") {
    return `${baseLabel} (${fromStatus} → ${toStatus})`;
  }

  if (note) {
    return `${baseLabel} — ${note}`;
  }

  if (fileName) {
    return `${baseLabel}: ${fileName}`;
  }

  if (assetName) {
    return `${baseLabel}: ${assetName}`;
  }

  const version = payload?.version;
  const reviewRound = payload?.reviewRound;
  if (typeof version === "number") {
    return `${baseLabel} (v${version}${typeof reviewRound === "number" ? `, round ${reviewRound}` : ""})`;
  }

  const title = payloadText(payload ?? undefined, "title");
  const comment = payloadText(payload ?? undefined, "comment");
  if (title && comment) {
    return `${baseLabel}: ${title} — ${comment}`;
  }

  if (title) {
    return `${baseLabel}: ${title}`;
  }

  return baseLabel.charAt(0).toUpperCase() + baseLabel.slice(1);
}

export function workflowEventDescription(event: ApiRecord) {
  const payload =
    event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
      ? (event.payload as Record<string, unknown>)
      : undefined;

  return describeWorkflowEvent(String(event.eventType ?? ""), payload);
}
