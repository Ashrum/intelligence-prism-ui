"use client"

import { useId, useRef, type ComponentProps, type KeyboardEvent, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useHorizontalChoiceScroll } from "../use-horizontal-choice-scroll"

/** Blueprint presentation components (bp-*). Page-level presentation only; forms and actions stay on coss.
 *  Styles live in app/(next)/next/blueprint.css and read tokens with core-theme fallbacks, so they render in any theme. */

const RULER_TOP = ["1", "2", "3", "4", "5", "6", "7", "8"]
const RULER_SIDE = ["A", "B", "C", "D"]

export interface BlueprintSheetProps extends Omit<ComponentProps<"section">, "title"> {
  /** Letter block, e.g. "A". Omit to hide the block. */
  letter?: string
  /** Sheet number shown top-right, e.g. "01 / 05". */
  sheetNo?: string
  title: ReactNode
  description?: ReactNode
  /** Coordinate rulers on the frame edges. Decorative; hidden below 760px and from assistive tech. */
  rulers?: boolean
  headingLevel?: 2 | 3
}
export function BlueprintSheet({ letter, sheetNo, title, description, rulers = true, headingLevel = 2, className, children, ...props }: BlueprintSheetProps) {
  const id = useId()
  const Heading = headingLevel === 2 ? "h2" : "h3"
  return <section aria-labelledby={id} {...props} className={cn("bp-sheet", className)} data-slot="bp-sheet">
    {rulers && <>
      <div aria-hidden="true" className="bp-ruler bp-ruler--top">{RULER_TOP.map(n => <span key={n}>{n}</span>)}</div>
      <div aria-hidden="true" className="bp-ruler bp-ruler--bottom">{RULER_TOP.map(n => <span key={n}>{n}</span>)}</div>
      <div aria-hidden="true" className="bp-ruler bp-ruler--left">{RULER_SIDE.map(n => <span key={n}>{n}</span>)}</div>
      <div aria-hidden="true" className="bp-ruler bp-ruler--right">{RULER_SIDE.map(n => <span key={n}>{n}</span>)}</div>
    </>}
    <header className="bp-sheet-head relative">
      {letter && <span aria-hidden="true" className="bp-sheet-id">{letter}</span>}
      <div className="min-w-0 flex-1">
        <Heading id={id} className="text-section-title text-(--heading)">{title}</Heading>
        {description && <p className="mt-1 text-ui-hint text-muted-foreground">{description}</p>}
      </div>
      {sheetNo && <span className="bp-sheet-no">SHEET {sheetNo}</span>}
    </header>
    <div className="relative min-w-0">{children}</div>
  </section>
}

export function BpMinor({ className, ...props }: ComponentProps<"h3">) {
  return <h3 {...props} className={cn("bp-minor", className)} />
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

export type BpFill = "ink" | "hatch" | "accent" | "quiet"
export interface BpSizeSegment { id: string; label: string; value: number; fill: BpFill }
export interface BpSizeBarProps { rows: { id: string; label: string; total?: number; unit?: string; segments: BpSizeSegment[] }[]; legend?: boolean; className?: string }
/** Composition bars. Fills differ by pattern, not only colour; every value is written out in the accessible name and legend. */
export function BpSizeBar({ rows, legend = true, className }: BpSizeBarProps) {
  const legendItems = Array.from(new Map(rows.flatMap(row => row.segments).map(s => [s.id, s])).values())
  return <div className={cn("space-y-3 border-(length:--line-width) border-(--line) p-4.5 pb-3.5", className)}>
    {rows.map(row => {
      const sum = row.segments.reduce((n, s) => n + Math.max(0, s.value), 0)
      const total = row.total ?? sum
      return <div key={row.id} className="bp-size-row">
        <span className="text-item-title">{row.label}</span>
        <span role="img" aria-label={`${row.label}：${row.segments.map(s => `${s.label} ${s.value}${row.unit ?? ""}`).join("，")}`} className="bp-size-bar">
          {row.segments.filter(s => s.value > 0).map(s => <span key={s.id} className={`bp-fill-${s.fill}`} style={{ width: `${total ? (s.value / total) * 100 : 0}%` }} />)}
        </span>
        <span className="text-right text-ui-meta text-muted-foreground"><b className="text-ui-action text-foreground tabular-nums">{sum}</b> {row.unit}</span>
      </div>
    })}
    {legend && <ul className="bp-size-legend flex flex-wrap gap-x-5 gap-y-2 text-ui-meta text-muted-foreground">
      {legendItems.map(s => <li key={s.id} className="flex items-center gap-1.5"><span aria-hidden="true" className={`size-3 border border-(--line) bp-fill-${s.fill}`} />{s.label}<b className="text-foreground tabular-nums">{rows.length === 1 ? s.value : ""}</b></li>)}
    </ul>}
  </div>
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
  return <dl className={cn("bp-facts", className)}>{items.map(item => <div key={item.id}><dt>{item.value}</dt><dd>{item.label}</dd></div>)}</dl>
}
export function BpTitleBlock({ items, className }: { items: { id: string; label: ReactNode; value: ReactNode }[]; className?: string }) {
  return <dl className={cn("bp-titleblock", className)}>{items.map(item => <div key={item.id}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
}

export function BpCallout({ title, action, children, className }: { title: ReactNode; action?: ReactNode; children?: ReactNode; className?: string }) {
  return <div role="note" className={cn("bp-callout", className)}><b className="block text-block-title text-foreground">{title}</b>{children && <div className="mt-1.5 mb-2.5 text-ui-body text-muted-foreground">{children}</div>}{action}</div>
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
