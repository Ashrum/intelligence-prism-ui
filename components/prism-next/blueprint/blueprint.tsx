"use client"

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useHorizontalChoiceScroll } from "../use-horizontal-choice-scroll"

export { BpTargetLock, BpDiagramCallout, BpEntryRow } from "./entry-annotations"
export type { BpTargetLockProps, BpDiagramCalloutProps, BpEntryRowProps } from "./entry-annotations"

/** Blueprint presentation components (bp-*). Page-level presentation only; forms and actions stay on coss.
 *  Styles live in app/(next)/next/blueprint.css and read tokens with core-theme fallbacks, so they render in any theme. */

const RULER_TOP = ["1", "2", "3", "4", "5", "6", "7", "8"]
const RULER_SIDE = ["A", "B", "C", "D"]

export interface BlueprintFolio {
  kind: "sheet" | "section" | "rev"
  value: string
}

/** Format supplied facts only; sequence/version selection belongs to the host. */
function folioValue(folio?: BlueprintFolio) {
  const value = folio?.value.trim() ?? ""
  if (!value) return ""
  const revision = folio?.kind === "rev" ? value.match(/^v?(\d+)$/i) : undefined
  if (revision) return revision[1].padStart(2, "0")
  if (/^\d+(\s*\/\s*\d+)?$/.test(value)) return value.split("/").map(part => part.trim().padStart(2, "0")).join(" / ")
  return value
}

export interface BlueprintSectionHeaderProps extends Omit<ComponentProps<"header">, "title"> {
  title: ReactNode
  description?: ReactNode
  /** Named native controls beside the heading, never inside its accessible name. */
  titleActions?: ReactNode
  /** Meaningful chapter index, read along with the visible heading. */
  code?: string
  folio?: BlueprintFolio
  /** Hide only when equivalent readable information exists in the title area. */
  folioAriaHidden?: boolean
  headingId?: string
  headingLevel?: 2 | 3
}
/** A chapter heading without a sheet frame or rulers. */
export function BlueprintSectionHeader({ title, description, titleActions, code, folio, folioAriaHidden = false, headingId, headingLevel = 2, className, ...props }: BlueprintSectionHeaderProps) {
  const generatedId = useId()
  const Heading = headingLevel === 2 ? "h2" : "h3"
  const value = folioValue(folio)
  const folioContent = folio && value && <p className="bp-section-folio" aria-hidden={folioAriaHidden || undefined}>{folio.kind.toUpperCase()} {value}</p>
  return <header {...props} className={cn("bp-section-header", className)} data-slot="bp-section-header" data-has-code={code ? "" : undefined}>
    {code && <span className="bp-section-code">{code}</span>}
    <div className="bp-section-main">
      <div className="bp-section-title-row">
        <Heading id={headingId ?? generatedId} className="bp-section-title text-section-title">{title}</Heading>
        {titleActions != null ? <>{folioContent}<div data-slot="bp-section-title-actions" className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{titleActions}</div></> : folioContent}
      </div>
      {description && <p className="bp-section-description text-ui-hint">{description}</p>}
    </div>
  </header>
}

export interface BlueprintSheetProps extends Omit<ComponentProps<"section">, "title"> {
  /** Meaningful chapter index, e.g. "A". Omit when no index is available. */
  letter?: string
  /** Legacy sheet number, e.g. "01 / 05". Explicit folio takes precedence, even when empty. */
  sheetNo?: string
  folio?: BlueprintFolio
  folioAriaHidden?: boolean
  title: ReactNode
  description?: ReactNode
  titleActions?: ReactNode
  /** Coordinate rulers on the frame edges. Decorative; hidden below 760px and from assistive tech. */
  rulers?: boolean
  /** Keep the outer side borders below 760px; rulers and inner frame remain hidden. */
  narrowFrame?: "edge" | "keep"
  /** Fine-pointer feedback, unless rulerMark is supplied (including null). */
  rulerTracking?: boolean
  /** Zero-based column 0–7 / row 0–3. null explicitly clears the controlled mark. */
  rulerMark?: { column: number; row: number } | null
  headingLevel?: 2 | 3
}
export function BlueprintSheet({ letter, sheetNo, folio, folioAriaHidden, title, description, titleActions, rulers = true, narrowFrame = "edge", rulerTracking = false, rulerMark, headingLevel = 2, className, children, onPointerMove, onPointerLeave, ...props }: BlueprintSheetProps) {
  const id = useId()
  const [pointerMark, setPointerMark] = useState<{ column: number; row: number } | null>(null)
  const mark = rulerMark !== undefined ? rulerMark : rulerTracking ? pointerMark : null
  const validMark = mark && Number.isInteger(mark.column) && mark.column >= 0 && mark.column < 8 && Number.isInteger(mark.row) && mark.row >= 0 && mark.row < 4 ? mark : null
  return <section aria-labelledby={id} {...props} className={cn("bp-sheet", className)} data-slot="bp-sheet" data-narrow-frame={narrowFrame === "keep" ? "keep" : undefined}
    onPointerMove={event => {
      onPointerMove?.(event)
      if (!rulerTracking || rulerMark !== undefined || event.pointerType === "touch" || event.defaultPrevented) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const column = Math.min(7, Math.max(0, Math.floor((event.clientX - rect.left) / rect.width * 8)))
      const row = Math.min(3, Math.max(0, Math.floor((event.clientY - rect.top) / rect.height * 4)))
      setPointerMark(previous => previous?.column === column && previous.row === row ? previous : { column, row })
    }}
    onPointerLeave={event => { onPointerLeave?.(event); setPointerMark(null) }}>
    {rulers && <>
      <div aria-hidden="true" className="bp-ruler bp-ruler--top">{RULER_TOP.map((n, index) => <span key={n} data-active={validMark?.column === index ? "" : undefined}>{n}</span>)}</div>
      <div aria-hidden="true" className="bp-ruler bp-ruler--bottom">{RULER_TOP.map((n, index) => <span key={n} data-active={validMark?.column === index ? "" : undefined}>{n}</span>)}</div>
      <div aria-hidden="true" className="bp-ruler bp-ruler--left">{RULER_SIDE.map((n, index) => <span key={n} data-active={validMark?.row === index ? "" : undefined}>{n}</span>)}</div>
      <div aria-hidden="true" className="bp-ruler bp-ruler--right">{RULER_SIDE.map((n, index) => <span key={n} data-active={validMark?.row === index ? "" : undefined}>{n}</span>)}</div>
    </>}
    <BlueprintSectionHeader code={letter} folio={folio ?? (sheetNo ? { kind: "sheet", value: sheetNo } : undefined)} folioAriaHidden={folioAriaHidden} title={title} description={description} titleActions={titleActions} headingId={id} headingLevel={headingLevel} className="relative" />
    <div className="relative min-w-0">{children}</div>
  </section>
}

export interface BpMinorProps extends ComponentProps<"h3"> {
  code?: string
  label?: ReactNode
  headingLevel?: 2 | 3 | 4 | 5 | 6
}
export function BpMinor({ className, code, label, headingLevel = 3, children, ...props }: BpMinorProps) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6"
  return <Heading {...props} className={cn("bp-minor text-block-title", className)}>{code && <span className="bp-minor-code">{code}</span>}<span className="bp-minor-label">{label ?? children}</span></Heading>
}

export function BpFigCap({ label, children, className, ...props }: ComponentProps<"p"> & { label: string }) {
  return <p {...props} className={cn("bp-fig-cap", className)}><span>{label}</span><span>{children}</span></p>
}

export interface BpButtonProps extends ComponentProps<"button"> { variant?: "default" | "primary" | "danger"; size?: "default" | "sm" }
export function BpButton({ variant = "default", size = "default", type = "button", className, ...props }: BpButtonProps) {
  return <button type={type} {...props} data-variant={variant === "default" ? undefined : variant} data-size={size === "default" ? undefined : size} className={cn("bp-btn", className)} />
}

export interface BpToolProps extends ComponentProps<"button"> { iconOnly?: boolean; count?: ReactNode }
/** Square tool button for app bars. iconOnly requires aria-label. */
export function BpTool({ iconOnly, count, type = "button", className, children, ...props }: BpToolProps) {
  return <button type={type} {...props} data-icon={iconOnly ? "" : undefined} className={cn("bp-tool", className)}>{children}{count !== undefined && <span className="bp-tool-count">{count}</span>}</button>
}

export interface BpSegItem { value: string; label: ReactNode; description?: ReactNode; disabled?: boolean }
export interface BpSegTabsProps { items: BpSegItem[]; value: string; onValueChange: (value: string) => void; label: string; orientation?: "horizontal" | "vertical"; className?: string }
/** Single choice as a segmented control (radiogroup). Arrow keys move and select; Home/End jump. For tab panels use coss Tabs. */
export function BpSegTabs({ items, value, onValueChange, label, orientation = "horizontal", className }: BpSegTabsProps) {
  const scroll = useHorizontalChoiceScroll(value, orientation === "horizontal")
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const enabled = items.map((item, i) => item.disabled ? -1 : i).filter(i => i >= 0)
  const selected = items.findIndex(item => item.value === value && !item.disabled)
  const current = selected >= 0 ? selected : enabled[0]
  const move = (event: KeyboardEvent, index: number) => {
    const keys = orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"]
    let next: number | undefined
    const at = enabled.indexOf(index)
    if (event.key === keys[0] || event.key === "ArrowUp" || event.key === "ArrowLeft") next = enabled[(at - 1 + enabled.length) % enabled.length]
    else if (event.key === keys[1] || event.key === "ArrowDown" || event.key === "ArrowRight") next = enabled[(at + 1) % enabled.length]
    else if (event.key === "Home") next = enabled[0]
    else if (event.key === "End") next = enabled[enabled.length - 1]
    if (next === undefined) return
    event.preventDefault(); refs.current[next]?.focus(); onValueChange(items[next].value)
  }
  return <div {...scroll} role="radiogroup" aria-label={label} aria-orientation={orientation} data-orientation={orientation} className={cn("bp-seg-tabs", className)}>
    {items.map((item, i) => <button key={item.value} ref={node => { refs.current[i] = node }} type="button" role="radio" aria-checked={item.value === value} tabIndex={i === current ? 0 : -1} disabled={item.disabled} onClick={() => onValueChange(item.value)} onKeyDown={event => move(event, i)}>
      {orientation === "vertical" ? <><b className="font-mono text-item-title">{item.label}</b>{item.description && <span className="text-ui-hint opacity-80">{item.description}</span>}</> : item.label}
    </button>)}
  </div>
}

export interface BpStepsProps { steps: { id: string; label: ReactNode }[]; current: number; label?: string; status?: ReactNode; className?: string; children?: ReactNode }
/** Read-only position in a short linear flow. Steps before `current` are done. */
export function BpSteps({ steps, current, label = "流程步骤", status, className, children }: BpStepsProps) {
  return <div className={cn("bp-steps", className)}>
    <ol aria-label={label} className="flex flex-wrap items-center gap-2.5">
      {steps.map((step, i) => <li key={step.id} className="flex items-center gap-2.5">
        <span className="bp-step" data-state={i < current ? "done" : i === current ? "current" : "todo"} aria-current={i === current ? "step" : undefined}><b aria-hidden="true">{String(i + 1).padStart(2, "0")}</b>{step.label}<span className="sr-only">{i < current ? "（已完成）" : i === current ? "（当前）" : "（未开始）"}</span></span>
        {i < steps.length - 1 && <span aria-hidden="true" className="text-border">→</span>}
      </li>)}
    </ol>
    {status && <span className="ml-auto text-ui-meta text-(--link)" aria-live="polite">{status}</span>}
    {children}
  </div>
}

export interface BpCardProps { name: string; description: ReactNode; thumb?: ReactNode; href?: string; onSelect?: () => void; className?: string }
/** Card that lifts on hover when interactive. Renders <a> with href, <button> with onSelect, otherwise <div>. */
export function BpCard({ name, description, thumb, href, onSelect, className }: BpCardProps) {
  const body = <><span className="bp-card-thumb block">{thumb}</span><span className="bp-card-meta"><code className="bp-card-name">{name}</code><span className="text-ui-body text-muted-foreground">{description}</span></span></>
  if (href) return <a href={href} className={cn("bp-card", className)}>{body}</a>
  if (onSelect) return <button type="button" onClick={onSelect} className={cn("bp-card", className)}>{body}</button>
  return <div className={cn("bp-card", className)}>{body}</div>
}
export function BpCardNote({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cn("bp-card-note", className)} />
}

export function BpPaneHead({ title, action, className, ...props }: Omit<ComponentProps<"div">, "title"> & { title: ReactNode; action?: ReactNode }) {
  return <div {...props} className={cn("bp-pane-head", className)}><span>{title}</span>{action}</div>
}

export interface BpFrameCardProps extends Omit<ComponentProps<"section">, "title"> {
  title: ReactNode
  /** Host-supplied fact, always accompanied by readable text. Never infer a live/execution state. */
  status?: { tone: "success" | "warning" | "danger" | "info" | "neutral"; label: ReactNode }
  actions?: ReactNode
  headingLevel?: 2 | 3 | 4 | 5 | 6
}
/** An independently identifiable object, such as an original document or export preview. */
export function BpFrameCard({ title, status, actions, headingLevel = 3, children, className, ...props }: BpFrameCardProps) {
  const id = useId()
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6"
  return <section aria-labelledby={id} {...props} className={cn("bp-frame-card", className)} data-slot="bp-frame-card">
    <header className="bp-frame-card-head">
      <Heading id={id} className="bp-frame-card-title text-ui-action">{title}</Heading>
      {status && <div className="bp-frame-card-status text-ui-hint" data-tone={status.tone}>
        <span className="bp-frame-card-dot" aria-hidden="true" />
        <span className="bp-frame-card-status-label">{status.label}</span>
      </div>}
      {actions != null && <div className="bp-card-actions">{actions}</div>}
    </header>
    <div className="bp-card-body">{children}</div>
  </section>
}

export interface BpSectionCardProps extends Omit<ComponentProps<"section">, "title"> {
  /** Supply only a meaningful section sequence; omit otherwise. */
  letter?: string
  title: ReactNode
  /** Real identifiers only: filename, page, count. */
  meta?: ReactNode
  /** Host provides the icon button and its accessible name. */
  action?: ReactNode
  headingLevel?: 2 | 3 | 4 | 5 | 6
  density?: "default" | "compact"
}
/** A numbered/ordered subdivision within a result, without sheet rulers. */
export function BpSectionCard({ letter, title, meta, action, headingLevel = 3, density = "default", children, className, ...props }: BpSectionCardProps) {
  const id = useId()
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6"
  const code = letter?.trim()
  return <section aria-labelledby={id} {...props} className={cn("bp-section-card", density === "compact" && "bp-section-card-compact", className)} data-slot="bp-section-card">
    <header className="bp-section-card-head">
      <Heading id={id} className={cn("bp-section-card-title", density === "compact" ? "text-item-title" : "text-block-title")}>
        {code && <span className={cn("bp-section-card-letter font-mono", density === "compact" ? "text-ui-hint" : "text-stat-display")}>{code}</span>}
        <span className="bp-section-card-label">{title}</span>
      </Heading>
      {meta != null && <div className="bp-section-card-meta font-mono text-ui-meta">{meta}</div>}
      {action != null && <div className="bp-card-actions">{action}</div>}
    </header>
    <div className="bp-card-body">{children}</div>
  </section>
}

export type BpFill = "ink" | "hatch" | "accent" | "quiet" | "warn"
export interface BpSizeSegment { id: string; label: string; value: number; fill: BpFill }
export interface BpSizeBarProps {
  rows: { id: string; label: string; total?: number; unit?: string; display?: string; segments: BpSizeSegment[] }[]
  legend?: boolean
  /** Defaults to true for one row; opt in for a separately labelled legend per row. */
  legendValues?: boolean
  framed?: boolean
  size?: "default" | "sm" | "xs"
  /** Target in the same units as each row total; included in the accessible name. */
  marker?: { value: number; label: string }
  /** Hide the visual row heading; it remains in the bar accessible name. */
  hideRowLabel?: boolean
  className?: string
}
const sizeNumber = new Intl.NumberFormat("zh-CN", { maximumSignificantDigits: 21 })
/** Composition bars. Fills differ by pattern, not only colour; every value is written out in the accessible name and legend. */
export function BpSizeBar({ rows, legend = true, legendValues = rows.length === 1, framed = true, size = "default", hideRowLabel = false, marker, className }: BpSizeBarProps) {
  const compact = size === "xs"
  const hideLabel = compact || hideRowLabel
  const legendItems = Array.from(new Map(rows.flatMap(row => row.segments).map(s => [s.id, s])).values())
  const renderLegend = (segments: BpSizeSegment[], label: string, unit = "") => <ul aria-label={label} className="bp-size-legend flex flex-wrap gap-x-5 gap-y-2 text-ui-meta text-muted-foreground">
    {segments.map(s => <li key={s.id} className="flex min-w-0 max-w-full items-start gap-1.5"><span aria-hidden="true" className={`mt-0.5 size-3 shrink-0 border border-(--line) bp-fill-${s.fill}`} /><span className="min-w-0 [overflow-wrap:anywhere]">{s.label}{legendValues && <> <b className="text-foreground tabular-nums">{sizeNumber.format(s.value)}</b>{unit && ` ${unit}`}</>}</span></li>)}
    {marker && <li className="flex items-center gap-1.5"><span aria-hidden="true" className="bp-size-marker-key" />{marker.label}</li>}
  </ul>
  return <div className={cn("space-y-3", framed && "border-(length:--line-width) border-(--line) p-4.5 pb-3.5", size === "sm" && "bp-size-sm", compact && "bp-size-xs", className)}>
    {rows.map(row => {
      const sum = row.segments.reduce((n, s) => n + Math.max(0, s.value), 0)
      const total = row.total ?? sum
      return <div key={row.id} className="space-y-3">
        <div className={cn("bp-size-row", hideLabel && "bp-size-row-unlabelled")} data-display={row.display !== undefined ? "" : undefined}>
        {!hideLabel && <span className="text-item-title">{row.label}</span>}
        <span role="img" aria-label={`${row.label}：${row.segments.map(s => `${s.label} ${sizeNumber.format(s.value)}${row.unit ?? ""}`).join("，")}${marker ? `，${marker.label} ${sizeNumber.format(marker.value)}${row.unit ?? ""}` : ""}`} className="bp-size-bar">
          {row.segments.filter(s => s.value > 0).map(s => <span key={s.id} className={`bp-fill-${s.fill}`} style={{ width: `${total ? (s.value / total) * 100 : 0}%` }} />)}
          {marker && Number.isFinite(marker.value) && <i aria-hidden="true" className="bp-size-marker" style={{ left: `${total > 0 ? Math.min(100, Math.max(0, marker.value / total * 100)) : 0}%` }} />}
        </span>
        <span hidden={compact || row.display === "" || undefined} className="min-w-0 text-right text-ui-meta text-muted-foreground [overflow-wrap:anywhere]"><b className="text-ui-action text-foreground tabular-nums">{row.display ?? sizeNumber.format(sum)}</b>{row.display === undefined && <> {row.unit}</>}</span>
        </div>
        {legend && legendValues && rows.length > 1 && renderLegend(row.segments, `${row.label}：图例`, row.unit)}
      </div>
    })}
    {legend && (!legendValues || rows.length <= 1) && renderLegend(legendItems, "分段图例")}
  </div>
}

export interface BpStatProps {
  label: ReactNode
  code?: string
  value: number | string
  unit?: ReactNode
  layout?: "stack" | "inline"
  readout?: { text: ReactNode; tone?: "accent" | "warn" | "error" | "muted" }
  delta?: { text: ReactNode; tone?: "accent" | "warn" | "error" | "muted" }
  caption?: ReactNode
  children?: ReactNode
  /** Host-supplied named help control. */
  help?: ReactNode
  state?: "available" | "insufficient" | "unknown"
  className?: string
}
/** Blueprint-only vocabulary, not a second general MetricSummary. Place inside BpStatStrip. */
export function BpStat({ label, code, value, unit, delta, caption, children, help, state = "available", layout = "stack", readout, className }: BpStatProps) {
  const available = state === "available"
  // Never present a numeric placeholder as an observation when the host says it is unavailable.
  const display = available || typeof value === "string" && value.trim() ? value : state === "insufficient" ? "数据不足" : "未知"
  return <div className={cn("bp-stat", layout === "inline" && "bp-stat-inline", className)} data-state={state}>
    <dt className="bp-stat-label text-ui-meta">
      <span>{label}</span>{code && <span className="bp-stat-code">{code}</span>}{help != null && <span className="bp-stat-help">{help}</span>}
    </dt>
    <dd className="bp-stat-content">
      {layout === "inline" ? <div className="bp-stat-reading-row">
        <div className="bp-stat-reading"><span className={cn("bp-stat-value", available ? "text-page-title" : "text-block-title")}>{display}</span>{available && unit != null && <span className="bp-stat-unit text-ui-body">{unit}</span>}</div>
        {available && readout && <span className="bp-stat-readout text-ui-meta" data-tone={readout.tone}>{readout.text}</span>}
      </div> : <>
        <div className="bp-stat-reading"><span className={cn("bp-stat-value", available ? "text-score-display" : "text-block-title")}>{display}</span>{available && unit != null && <span className="bp-stat-unit text-ui-body">{unit}</span>}</div>
        {available && readout && <div className="bp-stat-readout text-ui-meta" data-tone={readout.tone}>{readout.text}</div>}
      </>}
      {layout === "inline" ? <div className="bp-stat-detail">
        {available && delta && <div className="bp-stat-delta text-ui-hint" data-tone={delta.tone ?? "accent"}>{delta.text}</div>}
        {available && children}
        {caption != null && <div className="bp-stat-caption text-ui-meta">{caption}</div>}
      </div> : <>
        {available && delta && <div className="bp-stat-delta text-ui-hint" data-tone={delta.tone ?? "accent"}>{delta.text}</div>}
        {caption != null && <div className="bp-stat-caption text-ui-hint">{caption}</div>}
        {available && children != null && <div className="bp-stat-detail">{children}</div>}
      </>}
    </dd>
  </div>
}
/** Container-width 4 / 2 / 1 grid; final rows fill all columns. Children are BpStat items. */
export function BpStatStrip({ children, className, ...props }: ComponentProps<"dl">) {
  return <div className="bp-stat-container"><dl {...props} className={cn("bp-stat-strip", className)}>{children}</dl></div>
}

export interface BpMetricProps { name: ReactNode; max: number; baseline: { label: string; value: number; display?: ReactNode }; current: { label: string; value: number; display?: ReactNode }; gain: ReactNode; gainUnit?: ReactNode; className?: string }
export function BpMetric({ name, max, baseline, current, gain, gainUnit, className }: BpMetricProps) {
  const pct = (v: number) => `${max > 0 ? Math.min(100, Math.max(0, (v / max) * 100)) : 0}%`
  return <div className={cn("bp-metric", className)}>
    <span className="text-block-title">{name}</span>
    <span className="flex min-w-0 flex-col gap-1.5">
      <span className="bp-metric-bar" data-series="baseline"><i aria-hidden="true" style={{ width: pct(baseline.value) }} /><span className="text-ui-meta text-muted-foreground"><span className="sr-only">{baseline.label} </span>{baseline.display ?? baseline.value}</span></span>
      <span className="bp-metric-bar" data-series="current"><i aria-hidden="true" style={{ width: pct(current.value) }} /><span className="text-ui-meta font-semibold text-(--link)"><span className="sr-only">{current.label} </span>{current.display ?? current.value}</span></span>
    </span>
    <span className="flex flex-col items-end text-right"><b className="text-stat-display tracking-[-0.03em]">{gain}</b>{gainUnit && <span className="mt-1 font-mono text-ui-meta uppercase tracking-[0.08em] text-muted-foreground">{gainUnit}</span>}</span>
  </div>
}
export function BpMetricLegend({ baseline, current }: { baseline: string; current: string }) {
  return <div className="mb-4 flex flex-wrap gap-6 text-ui-meta text-muted-foreground">
    <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-3 w-5.5 border border-(--line)" style={{ background: "repeating-linear-gradient(135deg,var(--disabled-foreground) 0 1.5px,transparent 1.5px 6px),var(--secondary)" }} />{baseline}</span>
    <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-3 w-5.5 border border-(--line) bg-(--link)" />{current}</span>
  </div>
}

export function BpFacts({ items, className }: { items: { id: string; value: ReactNode; label: ReactNode }[]; className?: string }) {
  return <div className="bp-fact-container"><dl className={cn("bp-facts", className)}>{items.map(item => <div key={item.id}><dt>{item.value}</dt><dd>{item.label}</dd></div>)}</dl></div>
}
export interface BpTitleBlockItem { id: string; label: ReactNode; value: ReactNode; tone?: "default" | "warn" | "muted"; numeric?: boolean }
export function BpTitleBlock({ items, density = "default", note, className }: { items: BpTitleBlockItem[]; density?: "default" | "compact"; note?: ReactNode; className?: string }) {
  return <div className="bp-fact-container"><dl className={cn("bp-titleblock", density === "compact" && "bp-titleblock-compact", className)}>{items.map(item => <div key={item.id}><dt>{item.label}</dt><dd data-tone={item.tone === "default" ? undefined : item.tone} className={item.numeric ? "bp-titleblock-numeric" : undefined}>{item.value}</dd></div>)}</dl>{note != null && <div className="bp-titleblock-note text-ui-meta text-muted-foreground">{note}</div>}</div>
}

export function BpCallout({ title, action, emphasis = false, tone = "warning", layout = "stack", children, className }: { title: ReactNode; action?: ReactNode; emphasis?: boolean; tone?: "neutral" | "warning"; layout?: "stack" | "inline"; children?: ReactNode; className?: string }) {
  return <div role="note" className={cn("bp-callout", emphasis && "bp-callout-emphasis", tone === "neutral" && "bp-callout-neutral", layout === "inline" && "bp-callout-inline", className)}><b className={cn(layout === "stack" && "block", "text-block-title text-foreground")}>{title}</b>{children && <div className={cn(layout === "stack" && "mt-1.5 mb-2.5", "text-ui-body text-muted-foreground")}>{children}</div>}{action}</div>
}

export interface BpErrorProps { location: ReactNode; message: ReactNode; example?: ReactNode; exampleLabel?: string; action?: ReactNode; className?: string }
/** Points at a specific place and gives a correct example the user can follow. */
export function BpError({ location, message, example, exampleLabel = "正确示例", action, className }: BpErrorProps) {
  return <div role="alert" className={cn("bp-error", className)}>
    <div className="flex items-center justify-between gap-3"><span className="bg-(--destructive-foreground) px-2 py-1 text-ui-meta font-semibold text-card">{location}</span>{action}</div>
    <p className="mt-2.5 mb-3 text-block-title">{message}</p>
    {example && <div className="border border-border bg-(--code-bg)"><div className="border-b border-border px-3 py-1.5 text-ui-meta uppercase tracking-[0.08em] text-success-foreground">✓ {exampleLabel}</div><pre className="overflow-x-auto px-3 py-2.5 font-mono text-ui-body">{example}</pre></div>}
  </div>
}

export type BpAnnotTone = "error" | "warn"
export type BpAnnotPart = string | { text: string; n: number; tone?: BpAnnotTone }
export function BpAnnotatedText({ parts, className }: { parts: BpAnnotPart[]; className?: string }) {
  return <p className={cn("bp-annot border-(length:--line-width) border-(--line) bg-card px-4.5 pt-4 pb-4.5 text-read-body leading-[2.3] wrap-anywhere", className)}>
    {parts.map((part, i) => typeof part === "string" ? <span key={i}>{part}</span> : <span key={i}><mark data-tone={part.tone === "warn" ? "warn" : undefined}>{part.text}</mark><sup data-tone={part.tone === "warn" ? "warn" : undefined}><span className="sr-only">批注 </span>{part.n}</sup></span>)}
  </p>
}
export function BpAnnotationList({ items, className }: { items: { n: number; tone?: BpAnnotTone; rule: ReactNode; message: ReactNode; suggestion?: ReactNode }[]; className?: string }) {
  return <ol className={cn("border-(length:--line-width) border-t-0 border-(--line)", className)}>
    {items.map((item, i) => <li key={item.n} className={cn("grid grid-cols-[28px_92px_minmax(0,1fr)] items-baseline gap-2.5 px-3 py-2.5 text-ui-body max-sm:grid-cols-[24px_minmax(0,1fr)]", i === 0 ? "border-t-(length:--line-width) border-t-(--line)" : "border-t border-border")}>
      <span className={cn("py-0.5 text-center font-mono text-ui-meta font-semibold text-card", item.tone === "warn" ? "bg-(--warning-foreground)" : "bg-(--destructive-foreground)")}>{item.n}</span>
      <span className="font-mono text-ui-meta font-semibold uppercase tracking-[0.06em] text-muted-foreground max-sm:col-start-2">{item.rule}</span>
      <span className="max-sm:col-start-2">{item.message}{item.suggestion && <span className="block font-semibold text-(--link)">→ {item.suggestion}</span>}</span>
    </li>)}
  </ol>
}

export function BpCodebox({ file, meta, children, className }: { file: ReactNode; meta?: ReactNode; children: ReactNode; className?: string }) {
  return <figure className={cn("bp-codebox m-0", className)}><figcaption className="bp-codebox-head"><span className="font-semibold text-foreground">{file}</span>{meta && <span>{meta}</span>}</figcaption><pre>{children}</pre></figure>
}

/** Presentational toast surface; announce via coss ToastProvider in real flows. */
export function BpToast({ className, ...props }: ComponentProps<"div">) {
  return <div role="status" {...props} className={cn("bp-toast", className)} />
}
