// Honest TARGET placeholder — names what's not built (SLA tracking, trend
// analytics) instead of faking a chart or number. docs/ADMIN-DASHBOARD.md §5.
export function InsightsPlaceholder() {
  return (
    <div className="dash-insights">
      <p className="dash-sidebar-panel-title" style={{ marginBottom: 7 }}>
        Insights
      </p>
      <p>Turnaround trends and SLA tracking are not available yet — coming in a future release.</p>
    </div>
  );
}
