export interface DeltaValueProps {
  value?: number;
  unit?: string;
  prefix?: string;
  baseLabel?: string;
}

export function DeltaValue({ value, unit = "百分点", prefix, baseLabel = "基准次" }: DeltaValueProps) {
  if (value === undefined) return <span className="text-ui-meta text-muted-foreground">{baseLabel}</span>;

  const rounded = Number(value.toFixed(1));
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  const color = rounded > 0 ? "var(--chromatic-positive)"
    : rounded < 0 ? "var(--chromatic-pink-ink)" : "var(--chromatic-muted)";
  return <span className="text-ui-meta font-semibold tabular-nums" style={{ color }}>
    {prefix}{sign}{Math.abs(rounded).toFixed(1)}{unit && ` ${unit}`}
  </span>;
}
