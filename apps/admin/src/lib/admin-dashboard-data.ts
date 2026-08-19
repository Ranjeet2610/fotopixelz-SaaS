import { useMemo } from "react";
import { useApiList } from "@/components/data-hooks";
import { getId, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Independent per-column fetches so one slow/failing status query never
// blocks the rest of the board — docs/ADMIN-DASHBOARD.md §10/§11.
export function useAdminDashboardData() {
  const intake = useApiList<ApiRecord>("/orders", { status: "PENDING", scope: "admin", limit: 20 });
  const inProgress = useApiList<ApiRecord>("/orders", { status: "IN_PROGRESS", scope: "admin", limit: 20 });
  const readyForQa = useApiList<ApiRecord>("/orders", { status: "READY_FOR_QA", scope: "admin", limit: 20 });
  const revisionRequired = useApiList<ApiRecord>("/orders", { status: "REVISION_REQUIRED", scope: "admin", limit: 20 });
  const delivered = useApiList<ApiRecord>("/orders", { status: "DELIVERED", scope: "admin", limit: 20 });

  const editors = useApiList<ApiRecord>("/admin/users/editors", { limit: 100 });
  const qa = useApiList<ApiRecord>("/admin/users/qa", { limit: 100 });
  const organizations = useApiList<ApiRecord>("/organizations", { limit: 10 });

  const intakeItems = useMemo(
    () => intake.data.items.filter((order) => !getId(order.assignedEditor) && !textValue(order.assignedEditorId, "")),
    [intake.data.items],
  );

  const deliveredRecent = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- filtering by a rolling 7-day window is an intentional, harmless read of the current time
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    return delivered.data.items.filter((order) => {
      const updatedAt = order.updatedAt ?? order.deliveredAt;
      if (!updatedAt) return true;
      const time = new Date(String(updatedAt)).getTime();
      return Number.isNaN(time) || time >= cutoff;
    });
  }, [delivered.data.items]);

  const staff = useMemo(() => [...editors.data.items, ...qa.data.items], [editors.data.items, qa.data.items]);

  const workload = useMemo(() => {
    const openOrders = [...inProgress.data.items, ...readyForQa.data.items, ...revisionRequired.data.items];
    const counts = new Map<string, number>();
    for (const order of openOrders) {
      const assigneeId = textValue(order.assignedEditorId, "") || getId(order.assignedEditor) || textValue(order.assignedQaId, "") || getId(order.assignedQa);
      if (assigneeId) counts.set(assigneeId, (counts.get(assigneeId) ?? 0) + 1);
    }
    return staff
      .map((person) => ({ staff: person, count: counts.get(getId(person)) ?? 0 }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [inProgress.data.items, readyForQa.data.items, revisionRequired.data.items, staff]);

  const customerActivity = useMemo(() => {
    const allOpen = [...intakeItems, ...inProgress.data.items, ...readyForQa.data.items, ...revisionRequired.data.items];
    const counts = new Map<string, number>();
    for (const order of allOpen) {
      const orgId = textValue(order.organizationId, "") || getId(order.organization);
      if (orgId) counts.set(orgId, (counts.get(orgId) ?? 0) + 1);
    }
    return organizations.data.items
      .map((org) => ({ id: getId(org), name: textValue(org.name, "Unnamed org"), count: counts.get(getId(org)) ?? 0 }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [intakeItems, inProgress.data.items, readyForQa.data.items, revisionRequired.data.items, organizations.data.items]);

  return {
    intake: { ...intake, items: intakeItems },
    inProgress,
    readyForQa,
    revisionRequired,
    delivered: { ...delivered, items: deliveredRecent },
    editors,
    workload,
    customerActivity,
  };
}
