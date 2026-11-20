import "./hatch-meter.css"

export type HatchMeterProps = {
  value: number
  tone: "sky" | "pink"
  size: "sm" | "md"
  label?: string
}

export function HatchMeter({ value, tone, size, label }: HatchMeterProps) {
  const percent = Math.min(100, Math.max(0, value))
  const known = !Number.isNaN(percent)

  return <div
    className="prism-hatch-meter"
    data-tone={tone}
    data-size={size}
    role="img"
    aria-label={label ?? (known ? `得分率 ${percent.toFixed(1)}%` : "得分率未知")}
  >
    <div className="prism-hatch-meter-fill" style={{ width: known ? `${percent}%` : "0%" }} />
  </div>
}
