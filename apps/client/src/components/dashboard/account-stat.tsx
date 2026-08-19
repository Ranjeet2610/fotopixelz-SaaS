export function AccountStat({
  value,
  unit,
  label,
}: {
  value: string | number;
  unit?: string;
  label: string;
}) {
  return (
    <div className="text-right">
      <p className="font-mono text-2xl leading-none font-bold sm:text-[28px]">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span> : null}
      </p>
      <p className="mt-1 text-[10.5px] font-bold tracking-wide text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
