"use client";

/** One row inside a chart tooltip: colour key, series name, formatted value. */
export function ChartTooltipRow({
  label,
  value,
  colorVar,
}: {
  label: string;
  value: string;
  colorVar: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-2">
      <span
        className="h-3 w-1 shrink-0 rounded-[2px]"
        style={{ backgroundColor: `var(${colorVar})` }}
        aria-hidden="true"
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}
