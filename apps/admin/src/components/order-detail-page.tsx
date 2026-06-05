"use client";

import Link from "next/link";
import { apiRequest } from "@/lib/api-client";
import { dateValue, getId, nestedText, textValue } from "@/lib/format";
import type { ApiRecord, OrderStatus } from "@/lib/types";
import { useApiList, useApiResource } from "./data-hooks";
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

export function OrderDetailPage({ orderId }: { orderId: string }) {
  const order = useApiResource<ApiRecord>(`/orders/${orderId}`);
  const uploads = useApiList<ApiRecord>(`/uploads/order/${orderId}`);
  const assets = useApiList<ApiRecord>("/assets", { orderId, limit: 100 });

  async function updateStatus(status: OrderStatus) {
    await apiRequest("/orders/status", { method: "PATCH", body: { orderId, status } });
    order.reload();
  }

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Order details"
        title={textValue(order.data?.title, "Order")}
        description={orderId}
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
        <section className="detail-grid">
          <Card>
            <h2 className="section-title">Overview</h2>
            <dl className="detail-list">
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
                <dd>{textValue(order.data?.assignedEditorId)}</dd>
              </div>
              <div>
                <dt>QA</dt>
                <dd>{textValue(order.data?.assignedQaId)}</dd>
              </div>
              <div>
                <dt>Due</dt>
                <dd>{dateValue(order.data?.dueDate ?? order.data?.dueAt)}</dd>
              </div>
            </dl>
            <SelectField label="Update status" value={textValue(order.data?.status, "DRAFT")} onChange={(event) => void updateStatus(event.target.value as OrderStatus)}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectField>
          </Card>

          <Card>
            <h2 className="section-title">Timeline</h2>
            <div className="timeline">
              <TimelineItem label="Created" value={dateValue(order.data?.createdAt)} />
              <TimelineItem label="Last updated" value={dateValue(order.data?.updatedAt)} />
              <TimelineItem label="Current status" value={textValue(order.data?.status)} />
              <TimelineItem label="Due date" value={dateValue(order.data?.dueDate ?? order.data?.dueAt)} />
            </div>
          </Card>
        </section>
      )}

      <Card>
        <h2 className="section-title">Uploads</h2>
        {uploads.loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={uploads.data.items}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No uploads for this order."
            columns={[
              { key: "file", label: "File", render: (row) => <strong>{textValue(row.originalName ?? row.fileName)}</strong> },
              { key: "provider", label: "Provider", render: (row) => textValue(row.storageProvider) },
              { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
              { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
            ]}
          />
        )}
      </Card>

      <Card>
        <h2 className="section-title">Assets</h2>
        {assets.loading ? (
          <LoadingBlock />
        ) : (
          <DataTable
            rows={assets.data.items}
            rowKey={(row, index) => getId(row) || String(index)}
            empty="No assets for this order."
            columns={[
              {
                key: "asset",
                label: "Asset",
                render: (row) => (
                  <Link className="table-link" href={`/admin/assets/${getId(row)}`}>
                    {textValue(row.name ?? row.fileName)}
                  </Link>
                ),
              },
              { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
              { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
            ]}
          />
        )}
      </Card>
    </div>
  );
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
