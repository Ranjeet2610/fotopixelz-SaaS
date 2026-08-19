"use client";

import { getId, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";
import { useAdminDashboardData } from "@/lib/admin-dashboard-data";
import { BoardColumn } from "./dashboard/board-column";
import { ColumnSkeleton, IntakeSkeleton, PanelSkeleton } from "./dashboard/dashboard-skeleton";
import { CustomerActivityPanel } from "./dashboard/customer-activity-panel";
import { InsightsPlaceholder } from "./dashboard/insights-placeholder";
import { IntakeCard } from "./dashboard/intake-card";
import { ProductionCard } from "./dashboard/production-card";
import { WorkloadPanel } from "./dashboard/workload-panel";
import { ErrorBanner, PageHeader } from "./ui";

function displayOrderNumber(row: ApiRecord) {
  const orderNumber = textValue(row.orderNumber);
  if (orderNumber !== "-") {
    return orderNumber;
  }
  return getId(row).slice(-8).toUpperCase();
}

function staffLabel(staff: ApiRecord[], staffId: string) {
  if (!staffId) {
    return "Unassigned";
  }
  const match = staff.find((entry) => getId(entry) === staffId);
  return match ? textValue(match.name ?? match.email) : staffId;
}

function assigneeLabel(order: ApiRecord, staff: ApiRecord[]) {
  const assigneeId = textValue(order.assignedEditorId, "") || getId(order.assignedEditor) || textValue(order.assignedQaId, "") || getId(order.assignedQa);
  return staffLabel(staff, assigneeId);
}

export function DashboardOverview() {
  const data = useAdminDashboardData();

  const errorMessage =
    data.intake.error ??
    data.inProgress.error ??
    data.readyForQa.error ??
    data.revisionRequired.error ??
    data.delivered.error;

  return (
    <div className="stack-xl">
      <PageHeader
        eyebrow="Production control center"
        title="Today's production board"
        description="Every order in motion, grouped by production stage, with real thumbnails wherever assets exist."
      />

      <ErrorBanner message={errorMessage} />

      <section>
        <p className="dash-sidebar-panel-title" style={{ marginBottom: 10 }}>
          Needs assignment ({data.intake.items.length})
        </p>
        {data.intake.loading ? (
          <IntakeSkeleton />
        ) : data.intake.items.length === 0 ? (
          <div className="dash-board-column-empty">Nothing waiting on assignment right now.</div>
        ) : (
          <div className="dash-intake-grid">
            {data.intake.items.map((order) => (
              <IntakeCard
                key={getId(order)}
                order={order}
                orderNumber={displayOrderNumber(order)}
                editors={data.editors.data.items}
                onAssigned={data.intake.reload}
              />
            ))}
          </div>
        )}
      </section>

      <section className="dash-board">
        <BoardColumn label="In progress" count={data.inProgress.data.items.length} accentColor="var(--ui-color-info)" emptyMessage="No orders in progress.">
          {data.inProgress.loading ? (
            <ColumnSkeleton />
          ) : (
            data.inProgress.data.items.map((order) => (
              <ProductionCard
                key={getId(order)}
                order={order}
                orderNumber={displayOrderNumber(order)}
                status={textValue(order.status)}
                assigneeLabel={assigneeLabel(order, data.editors.data.items)}
                thumbnailKind="upload"
              />
            ))
          )}
        </BoardColumn>

        <BoardColumn label="Ready for QA" count={data.readyForQa.data.items.length} accentColor="var(--ui-color-warning)" emptyMessage="Nothing waiting on QA.">
          {data.readyForQa.loading ? (
            <ColumnSkeleton />
          ) : (
            data.readyForQa.data.items.map((order) => (
              <ProductionCard
                key={getId(order)}
                order={order}
                orderNumber={displayOrderNumber(order)}
                status={textValue(order.status)}
                assigneeLabel={assigneeLabel(order, data.editors.data.items)}
                thumbnailKind="upload"
              />
            ))
          )}
        </BoardColumn>

        <BoardColumn label="Revision required" count={data.revisionRequired.data.items.length} accentColor="var(--ui-color-error)" emptyMessage="No revisions pending.">
          {data.revisionRequired.loading ? (
            <ColumnSkeleton />
          ) : (
            data.revisionRequired.data.items.map((order) => (
              <ProductionCard
                key={getId(order)}
                order={order}
                orderNumber={displayOrderNumber(order)}
                status={textValue(order.status)}
                assigneeLabel={assigneeLabel(order, data.editors.data.items)}
                thumbnailKind="upload"
              />
            ))
          )}
        </BoardColumn>

        <BoardColumn label="Delivered · last 7 days" count={data.delivered.items.length} accentColor="var(--ui-color-success)" emptyMessage="Nothing delivered in the last 7 days.">
          {data.delivered.loading ? (
            <ColumnSkeleton />
          ) : (
            data.delivered.items.map((order) => (
              <ProductionCard
                key={getId(order)}
                order={order}
                orderNumber={displayOrderNumber(order)}
                status={textValue(order.status)}
                assigneeLabel={assigneeLabel(order, data.editors.data.items)}
                thumbnailKind="asset"
              />
            ))
          )}
        </BoardColumn>

        <div>
          {data.editors.loading ? <PanelSkeleton /> : <WorkloadPanel entries={data.workload} />}
          <CustomerActivityPanel entries={data.customerActivity} />
          <InsightsPlaceholder />
        </div>
      </section>
    </div>
  );
}
