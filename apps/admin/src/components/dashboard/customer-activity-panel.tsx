type CustomerEntry = { id: string; name: string; count: number };

// Real order counts grouped by organization — never a derived "engagement
// score." docs/ADMIN-DASHBOARD.md §5.
export function CustomerActivityPanel({ entries }: { entries: CustomerEntry[] }) {
  return (
    <div className="dash-sidebar-panel">
      <p className="dash-sidebar-panel-title">Customer activity</p>
      {entries.length === 0 ? (
        <p className="dash-intake-meta">No active customer orders right now.</p>
      ) : (
        entries.map((entry) => (
          <div className="dash-customer-row" key={entry.id}>
            <span>{entry.name}</span>
            <span className="dash-customer-count">{entry.count}</span>
          </div>
        ))
      )}
    </div>
  );
}
