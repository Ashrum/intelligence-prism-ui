import type { ReactNode } from "react"
import "./cockpit-strip.css"

export function CockpitStrip({ children }: { children: ReactNode }) {
  return <div className="prism-cockpit"><dl className="prism-cockpit-grid">{children}</dl></div>
}

export type CockpitCellProps = {
  label: ReactNode
  value: ReactNode
  unit: ReactNode
  aside?: ReactNode
  footer?: ReactNode
  emphasis?: boolean
}

export function CockpitCell({ label, value, unit, aside, footer, emphasis }: CockpitCellProps) {
  return <div className="prism-cockpit-cell" data-emphasis={emphasis || undefined}>
    <dt className="prism-cockpit-label text-ui-body">{label}</dt>
    <dd className="prism-cockpit-value-row">
      <div className="prism-cockpit-value text-metric-display tabular-nums">{value}</div>
      {unit != null && <span className="prism-cockpit-unit text-ui-body">{unit}</span>}
    </dd>
    {aside != null && <dd className="prism-cockpit-aside text-ui-meta">{aside}</dd>}
    {footer != null && <dd className="prism-cockpit-footer">{footer}</dd>}
  </div>
}

const iconPaths = {
  alert: "M8 5.2V8.5M8 10.8H8.01",
  plus: "M3.5 8H12.5M8 3.5V12.5",
  check: "M4.5 8.5L6.8 10.8L11.5 5.5",
  clock: "M8 4.75V8L10.2 9.3",
}

export type CockpitTagProps = {
  icon: keyof typeof iconPaths
  label: string
  count: number
}

export function CockpitTag({ icon, label, count }: CockpitTagProps) {
  return <span className="prism-cockpit-tag text-ui-meta tabular-nums">
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.35" opacity=".7" />
      <path d={iconPaths[icon]} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span>{label} <strong>{count}</strong></span>
  </span>
}
