import { getId, textValue } from "@/lib/format";
import type { ApiRecord } from "@/lib/types";

type WorkloadEntry = { staff: ApiRecord; count: number };

// Raw open-order counts per editor/QA — real GROUP BY data, never a
// capacity/utilization percentage (no staff-capacity data exists to compute
// one against). docs/ADMIN-DASHBOARD.md §5.
export function WorkloadPanel({ entries }: { entries: WorkloadEntry[] }) {
  const max = Math.max(1, ...entries.map((entry) => entry.count));

  return (
    <div className="dash-sidebar-panel">
      <p className="dash-sidebar-panel-title">Workload · open orders</p>
      {entries.length === 0 ? (
        <p className="dash-intake-meta">No open orders assigned yet.</p>
      ) : (
        entries.map((entry) => (
          <div className="dash-workload-row" key={getId(entry.staff)}>
            <span className="dash-workload-name">{textValue(entry.staff.name ?? entry.staff.email)}</span>
            <div className="dash-workload-bar-track">
              <div className="dash-workload-bar-fill" style={{ width: `${(entry.count / max) * 100}%` }} />
            </div>
            <span className="dash-workload-count">{entry.count}</span>
          </div>
        ))
      )}
    </div>
  );
}
