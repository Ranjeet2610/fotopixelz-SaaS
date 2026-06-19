"use client";

import Link from "next/link";
import { useMemo } from "react";
import { apiRequest } from "@/lib/api-client";
import { isManagementRole, normalizeRole } from "@/lib/access-control";
import { countCurrentReadyDeliverables } from "@/lib/asset-gallery-adapter";
import { dateValue, getId, nestedText, numberValue, textValue } from "@/lib/format";
import type { ApiRecord, OrderStatus } from "@/lib/types";
import { workflowEventDescription } from "@/lib/workflow-events";
import { useAuth } from "./auth-provider";
import { useApiList, useApiResource } from "./data-hooks";
import { OrderCommentsPanel } from "./order-comments-panel";
import { OrderDetailTabs } from "./order-detail-tabs";
import { OrderProductionWorkspace } from "./order-production-workspace";
import { OrderTimelinePanel } from "./order-timeline-panel";
import {
  Button,
  Card,
  DataTable,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  SelectField,
  StatusBadge,
} from "./ui";

const statuses: OrderStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UPLOADED",
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "READY_FOR_QA",
  "REVISION_REQUIRED",
  "APPROVED",
  "DELIVERED",
  "CANCELLED",
];

const manualStatuses = statuses.filter((status) => status !== "REVISION_REQUIRED");

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const canManage = isManagementRole(user?.role);
  const order = useApiResource<ApiRecord>(`/orders/${orderId}`);
  const uploads = useApiList<ApiRecord>(`/uploads/order/${orderId}`);
  const assets = useApiList<ApiRecord>("/assets", { orderId, limit: 100 });
  const workflowEvents = useApiList<ApiRecord>(`/workflow/orders/${orderId}/events`);
  const editors = useApiList<ApiRecord>("/admin/users/editors", { limit: 100 }, canManage);
  const qaUsers = useApiList<ApiRecord>("/admin/users/qa", { limit: 100 }, canManage);
  const lineItems = Array.isArray(order.data?.items) ? order.data.items : [];
  const orderAddons = Array.isArray(order.data?.addons) ? order.data.addons : [];
  const servicesSubtotal = lineItems.reduce((sum, item) => sum + numberValue(item.subtotal), 0);
  const addonsSubtotal = orderAddons.reduce((sum, addon) => sum + numberValue(addon.subtotal), 0);

  const currentStatus = textValue(order.data?.status, "DRAFT") as OrderStatus;
  const organizationId = textValue(order.data?.organizationId, nestedText(order.data, ["organization", "id"]));
  const deliverableVersion = numberValue(order.data?.deliverableVersion);
  const reviewRound = numberValue(order.data?.reviewRound, 1);
  const readyDeliverableCount = useMemo(
    () => countCurrentReadyDeliverables(assets.data.items, { deliverableVersion, reviewRound }),
    [assets.data.items, deliverableVersion, reviewRound],
  );
  const assignedQaId = textValue(order.data?.assignedQaId, "");
  const hasAssignedQa = Boolean(assignedQaId && assignedQaId !== "-");
  const isDelivered = currentStatus === "DELIVERED";
  const canMarkReadyForQa = !isDelivered && readyDeliverableCount > 0 && hasAssignedQa;

  const showProductionWorkspace = role === "EDITOR" || role === "QA" || canManage;
  const allAssets = assets.data.items;

  async function updateStatus(status: OrderStatus) {
    await apiRequest("/orders/status", { method: "PATCH", body: { orderId, status } });
    await Promise.all([order.reload(), workflowEvents.reload(), assets.reload()]);
  }

  const overviewPanel = (
    <div className="stack-lg">
      <Card>
        <h2 className="section-title">Overview</h2>
        <dl className="detail-list">
          <div>
            <dt>Order number</dt>
            <dd>{textValue(order.data?.orderNumber) || orderId}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge value={textValue(order.data?.status)} />
            </dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd>{textValue(order.data?.priority)}</dd>
          </div>
          <div>
            <dt>Organization</dt>
            <dd>{nestedText(order.data, ["organization", "name"])}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>{nestedText(order.data, ["createdBy", "email"])}</dd>
          </div>
          <div>
            <dt>Editor</dt>
            <dd>{staffLabel(editors.data.items, textValue(order.data?.assignedEditorId))}</dd>
          </div>
          <div>
            <dt>QA</dt>
            <dd>{staffLabel(qaUsers.data.items, textValue(order.data?.assignedQaId))}</dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>{dateValue(order.data?.dueDate ?? order.data?.dueAt)}</dd>
          </div>
          <div>
            <dt>Total amount</dt>
            <dd>{numberValue(order.data?.totalAmount).toFixed(2)}</dd>
          </div>
        </dl>
        {canManage ? (
          <SelectField
            label="Update status"
            value={currentStatus}
            onChange={(event) => void updateStatus(event.target.value as OrderStatus)}
          >
            {currentStatus === "REVISION_REQUIRED" ? (
              <option value={currentStatus} disabled>
                {currentStatus}
              </option>
            ) : null}
            {manualStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectField>
        ) : null}
        {role === "EDITOR" && !isDelivered ? (
          <div className="button-row editor-workflow-actions">
            {currentStatus === "ASSIGNED" ? (
              <Button onClick={() => void updateStatus("IN_PROGRESS")}>Start work</Button>
            ) : null}
            {currentStatus === "IN_PROGRESS" || currentStatus === "REVISION_REQUIRED" ? (
              <div className="stack-sm">
                <Button onClick={() => void updateStatus("READY_FOR_QA")} disabled={!canMarkReadyForQa}>
                  Mark ready for QA
                </Button>
                {!hasAssignedQa ? (
                  <p className="form-error">A QA reviewer must be assigned before this order can enter the QA queue.</p>
                ) : null}
                {hasAssignedQa && readyDeliverableCount === 0 ? (
                  <p className="form-error">
                    {currentStatus === "REVISION_REQUIRED"
                      ? "Upload revised deliverables before submitting to QA."
                      : "Upload at least one deliverable before sending to QA."}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
        {isDelivered ? <p className="muted-copy">This order has been delivered and is read-only.</p> : null}
      </Card>

      <Card>
        <h2 className="section-title">Services</h2>
        <DataTable
          rows={lineItems}
          rowKey={(row, index) => getId(row) || String(index)}
          empty="No services on this order."
          columns={[
            { key: "service", label: "Service", render: (row) => <strong>{nestedText(row, ["service", "name"])}</strong> },
            { key: "quantity", label: "Images", render: (row) => String(numberValue(row.quantity)) },
            { key: "unitPrice", label: "Price / image", render: (row) => numberValue(row.unitPrice).toFixed(2) },
            { key: "subtotal", label: "Subtotal", render: (row) => numberValue(row.subtotal).toFixed(2) },
          ]}
        />
      </Card>

      <Card>
        <h2 className="section-title">Addons</h2>
        <DataTable
          rows={orderAddons}
          rowKey={(row, index) => getId(row) || String(index)}
          empty="No addons on this order."
          columns={[
            { key: "addon", label: "Addon", render: (row) => <strong>{nestedText(row, ["addon", "name"])}</strong> },
            { key: "pricingType", label: "Pricing", render: (row) => textValue(row.pricingType) },
            { key: "quantity", label: "Quantity", render: (row) => String(numberValue(row.quantity)) },
            { key: "subtotal", label: "Subtotal", render: (row) => numberValue(row.subtotal).toFixed(2) },
          ]}
        />
      </Card>
    </div>
  );

  const assetsPanel =
    showProductionWorkspace && organizationId ? (
      <OrderProductionWorkspace
        role={role}
        orderStatus={currentStatus}
        organizationId={organizationId}
        orderId={orderId}
        deliverableVersion={deliverableVersion}
        reviewRound={reviewRound}
        uploads={uploads.data.items}
        uploadsLoading={uploads.loading}
        assets={assets.data.items}
        assetsLoading={assets.loading}
        workflowEvents={workflowEvents.data.items}
        onAssetsReload={() => void assets.reload()}
        onWorkflowReload={() => void workflowEvents.reload()}
        onQaApprove={() => void updateStatus("DELIVERED")}
      />
    ) : (
      <p className="muted-copy">Production workspace is not available for your role.</p>
    );

  const commentsPanel = (
    <Card>
      <OrderCommentsPanel orderId={orderId} assets={allAssets} readOnly={isDelivered} />
    </Card>
  );

  const timelinePanel = (
    <Card>
      <h2 className="section-title">Unified timeline</h2>
      <OrderTimelinePanel orderId={orderId} />
    </Card>
  );

  const activityPanel = (
    <Card>
      <h2 className="section-title">Workflow activity</h2>
      {workflowEvents.loading ? (
        <LoadingBlock />
      ) : workflowEvents.data.items.length === 0 ? (
        <p className="muted-copy">No workflow events recorded yet.</p>
      ) : (
        <div className="timeline">
          {workflowEvents.data.items.map((event) => (
            <TimelineItem
              key={getId(event)}
              label={workflowEventDescription(event)}
              value={`${dateValue(event.createdAt)} · ${nestedText(event, ["actor", "email"]) || "System"}`}
            />
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Order details"
        title={textValue(order.data?.title, "Order")}
        description={textValue(order.data?.orderNumber, orderId)}
        actions={
          <Link className="admin-link-button" href="/admin/orders">
            Back to orders
          </Link>
        }
      />
      <ErrorBanner message={order.error ?? uploads.error ?? assets.error} />
      {order.loading ? (
        <LoadingBlock />
      ) : (
        <OrderDetailTabs
          overview={overviewPanel}
          assets={assetsPanel}
          comments={commentsPanel}
          timeline={timelinePanel}
          activity={activityPanel}
        />
      )}
    </div>
  );
}

function staffLabel(staff: ApiRecord[], staffId: string) {
  if (!staffId) {
    return "-";
  }

  const match = staff.find((entry) => getId(entry) === staffId);
  return match ? textValue(match.name ?? match.email) : staffId;
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span />
      <strong>{label}</strong>
      <p>{value}</p>
    </div>
  );
}
