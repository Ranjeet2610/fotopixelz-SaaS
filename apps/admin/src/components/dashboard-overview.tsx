"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { isManagementRole } from "@/lib/access-control";
import { asList, dateValue, getId, nestedText, numberValue, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { useApiList } from "./data-hooks";
import { Card, DataTable, ErrorBanner, LoadingBlock, PageHeader, StatusBadge } from "./ui";

const healthEndpoints = [
  { label: "Auth", path: "/auth/health" },
  { label: "Users", path: "/users/health" },
  { label: "Orders", path: "/orders/health" },
  { label: "Uploads", path: "/uploads/health" },
  { label: "Assets", path: "/assets/health" },
];

export function DashboardOverview() {
  const { user } = useAuth();
  const management = isManagementRole(user?.role);
  const orders = useApiList<ApiRecord>("/orders", { limit: 50 });
  const uploads = useApiList<ApiRecord>("/uploads", { limit: 50 });
  const assets = useApiList<ApiRecord>("/assets", { limit: 50 });
  const organizations = useApiList<ApiRecord>("/organizations", { includeInactive: true }, management);
  const [health, setHealth] = useState<{ label: string; ok: boolean }[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      const results = await Promise.allSettled(
        healthEndpoints.map(async (item) => {
          await apiRequest(item.path);
          return { label: item.label, ok: true };
        }),
      );

      if (!cancelled) {
        setHealth(
          results.map((result, index) =>
            result.status === "fulfilled" ? result.value : { label: healthEndpoints[index].label, ok: false },
          ),
        );
      }
    }

    void loadHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  const orderItems = orders.data.items;
  const uploadItems = uploads.data.items;
  const assetItems = assets.data.items;
  const organizationItems = asList<ApiRecord>(organizations.data).items;
  const pendingQa = orderItems.filter((order) => textValue(order.status) === "READY_FOR_QA").length;

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Operations"
        title="Dashboard"
        description="Live production view across orders, uploads, assets, and accounts."
      />

      <ErrorBanner message={orders.error ?? uploads.error ?? assets.error ?? organizations.error} />

      <section className="kpi-grid">
        <KpiCard label="Total Orders" value={orders.data.total ?? orderItems.length} />
        <KpiCard label="Pending Orders" value={countStatus(orderItems, ["DRAFT", "SUBMITTED", "UPLOADED", "PENDING"])} />
        <KpiCard label="In Progress" value={countStatus(orderItems, ["ASSIGNED", "IN_PROGRESS"])} />
        <KpiCard label="Pending QA" value={pendingQa} />
        <KpiCard label="Delivered" value={countStatus(orderItems, ["DELIVERED"])} />
        <KpiCard label="Total Uploads" value={uploads.data.total ?? uploadItems.length} />
        <KpiCard label="Total Assets" value={assets.data.total ?? assetItems.length} />
        <KpiCard label="Organizations" value={management ? organizations.data.total ?? organizationItems.length : "-"} />
      </section>

      <section className="dashboard-grid">
        <Card>
          <SectionTitle title="Recent Orders" loading={orders.loading} />
          {orders.loading ? (
            <LoadingBlock />
          ) : (
            <DataTable
              rows={orderItems.slice(0, 6)}
              rowKey={(row, index) => getId(row) || String(index)}
              empty="No orders yet."
              columns={[
                { key: "order", label: "Order", render: (row) => <strong>{textValue(row.title)}</strong> },
                { key: "client", label: "Client", render: (row) => nestedText(row, ["createdBy", "email"]) },
                { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
                { key: "due", label: "Due", render: (row) => dateValue(row.dueDate ?? row.dueAt) },
              ]}
            />
          )}
        </Card>

        <Card>
          <SectionTitle title="Recent Uploads" loading={uploads.loading} />
          {uploads.loading ? (
            <LoadingBlock />
          ) : (
            <DataTable
              rows={uploadItems.slice(0, 6)}
              rowKey={(row, index) => getId(row) || String(index)}
              empty="No uploads yet."
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
          <SectionTitle title="Recent Assets" loading={assets.loading} />
          {assets.loading ? (
            <LoadingBlock />
          ) : (
            <DataTable
              rows={assetItems.slice(0, 6)}
              rowKey={(row, index) => getId(row) || String(index)}
              empty="No assets yet."
              columns={[
                { key: "asset", label: "Asset", render: (row) => <strong>{textValue(row.name ?? row.fileName)}</strong> },
                { key: "order", label: "Order", render: (row) => nestedText(row, ["order", "title"]) },
                { key: "status", label: "Status", render: (row) => <StatusBadge value={textValue(row.status)} /> },
                { key: "created", label: "Created", render: (row) => dateValue(row.createdAt) },
              ]}
            />
          )}
        </Card>

        <Card>
          <h2 className="section-title">System Status</h2>
          <div className="status-list">
            {health.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <StatusBadge value={item.ok ? "ONLINE" : "CHECK_FAILED"} />
              </div>
            ))}
            {health.length === 0 ? <LoadingBlock label="Checking modules" /> : null}
          </div>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}

function SectionTitle({ title, loading }: { title: string; loading: boolean }) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      {loading ? <span>Refreshing</span> : null}
    </div>
  );
}

function countStatus(items: ApiRecord[], statuses: string[]) {
  return items.filter((item) => statuses.includes(textValue(item.status))).length;
}
