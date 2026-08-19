export function IntakeSkeleton() {
  return (
    <div className="dash-intake-grid">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="dash-skeleton" style={{ height: 74 }} />
      ))}
    </div>
  );
}

export function ColumnSkeleton() {
  return (
    <div>
      <div className="dash-skeleton" style={{ height: 16, width: 80, marginBottom: 14 }} />
      <div className="dash-skeleton" style={{ height: 130, marginBottom: 12 }} />
      <div className="dash-skeleton" style={{ height: 130 }} />
    </div>
  );
}

export function PanelSkeleton() {
  return <div className="dash-skeleton" style={{ height: 96, marginBottom: 14 }} />;
}
