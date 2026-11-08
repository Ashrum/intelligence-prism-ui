"use client"

import { useEffect, useState, type ComponentProps, type ReactElement, type ReactNode, type RefObject } from "react"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/coss/tabs"
import { Sheet, SheetBackdrop, SheetClose, SheetPortal, SheetPrimitive, SheetTitle, SheetTrigger, SheetViewport } from "@/components/coss/sheet"
import { cn } from "@/lib/utils"
import { usePrismPortalProps } from "../prism-scope"
import { BpButton, BpSteps, type BpButtonProps } from "./blueprint"

type WorkDestination = { href: string; onClick?: never } | { href?: never; onClick: () => void }
export interface BpWorkPosition {
  /** One-based position in the host's ordered list. */
  index: number
  total: number
  onPrev?: () => void
  onNext?: () => void
  prevLabel?: string
  nextLabel?: string
}

function WorkPosition({ index, total, onPrev, onNext, prevLabel = "上一项", nextLabel = "下一项" }: BpWorkPosition) {
  return <div className="bp-work-position">
    <span className="font-mono text-ui-meta">{index} / {total}</span>
    <BpButton size="sm" aria-label={prevLabel} disabled={!onPrev || index <= 1} onClick={onPrev}>‹</BpButton>
    <BpButton size="sm" aria-label={nextLabel} disabled={!onNext || index >= total} onClick={onNext}>›</BpButton>
  </div>
}

export interface BpWorkHeaderProps extends Omit<ComponentProps<"header">, "title" | "children"> {
  back: WorkDestination & { label: string }
  title: string
  meta?: ReactNode
  status?: ReactNode
  position?: BpWorkPosition
  steps?: { items: { id: string; label: string }[]; current: number; label?: string }
  notice?: ReactNode
  secondary?: readonly [ReactNode] | readonly [ReactNode, ReactNode]
  primary?: Omit<BpButtonProps, "variant">
  more?: ReactNode
  /** Defaults to stack. In compact mode at ≤ 700px, secondary actions are hidden;
   * more must include equivalent entries supplied by the host. No actions are moved automatically. */
  narrow?: "stack" | "compact"
}

export function BpWorkHeader({ back, title, meta, status, position, steps, notice, secondary, primary, more, narrow = "stack", className, ...props }: BpWorkHeaderProps) {
  const backText = <>← 返回 {back.label}</>
  const compact = narrow === "compact"
  return <header {...props} className={cn("bp-work-header", className)} data-narrow={compact ? "compact" : undefined}>
    <div className="bp-work-identity">
      {back.href !== undefined
        ? <a className="bp-work-back text-ui-body" href={back.href}>{backText}</a>
        : <button className="bp-work-back text-ui-body" type="button" onClick={back.onClick}>{backText}</button>}
      <h1 className="bp-work-title text-block-title" title={title}>{title}</h1>
    </div>
    {meta != null && <div className="bp-work-meta text-ui-meta">{meta}</div>}
    {status != null && <div className="bp-work-status text-ui-meta">{status}</div>}
    {steps && <div className="col-span-full flex min-w-0 flex-1 justify-center [@media(max-width:700px)]:basis-full [@container_bp-work-demo_(max-width:700px)]:basis-full">
      <div className="[@media(max-width:700px)]:hidden [@container_bp-work-demo_(max-width:700px)]:hidden">
        <BpSteps steps={steps.items} current={steps.current} label={steps.label} variant="chips" />
      </div>
      <div role="group" aria-label={steps.label ?? "流程步骤"} className="hidden whitespace-nowrap text-ui-meta [@media(max-width:700px)]:block [@container_bp-work-demo_(max-width:700px)]:block">
        第 {steps.current + 1} / {steps.items.length} 步 · {steps.items[steps.current]?.label}
      </div>
    </div>}
    <div className="bp-work-actions">
      {position && <WorkPosition {...position} />}
      {compact && notice != null ? <div className="bp-work-notice">{notice}</div> : notice}
      {compact && secondary != null ? <div className="bp-work-secondary">{secondary}</div> : secondary}
      {primary && <BpButton {...primary} variant="primary" />}
      {compact && more != null ? <div className="bp-work-more">{more}</div> : more}
    </div>
  </header>
}

export interface BpWorkBodyProps extends ComponentProps<"div"> { grid?: boolean }
export function BpWorkBody({ grid = false, className, ...props }: BpWorkBodyProps) {
  return <div {...props} className={cn("bp-work-body", className)} data-grid={grid || undefined} />
}

export interface BpWorkTabsProps extends Omit<ComponentProps<typeof Tabs>, "children"> {
  label: string
  items: { value: string; label: string; count?: number; disabled?: boolean; content: ReactNode }[]
}
export function BpWorkTabs({ label, items, className, ...props }: BpWorkTabsProps) {
  return <Tabs {...props} className={cn("bp-work-tabs", className)}>
    <div className="bp-work-tabs-head">
      <TabsList variant="underline" aria-label={label} className="bp-work-tabs-list">
        {items.map(item => <TabsTab key={item.value} value={item.value} disabled={item.disabled} className="bp-work-tab text-ui-body">
          {item.label}{item.count !== undefined && <span className="font-mono text-ui-meta">{item.count}</span>}
        </TabsTab>)}
      </TabsList>
      <span className="bp-work-signature" aria-hidden="true"><span /><span /><span /></span>
    </div>
    {items.map(item => <TabsPanel key={item.value} value={item.value} className="bp-work-tab-panel">{item.content}</TabsPanel>)}
  </Tabs>
}

export function BpConclusion({ className, ...props }: ComponentProps<"p">) {
  return <p {...props} className={cn("bp-conclusion text-section-title", className)} />
}
export function BpMark({ className, ...props }: ComponentProps<"mark">) {
  return <mark {...props} className={cn("bp-mark", className)} />
}
export interface BpRefProps extends ComponentProps<"sup"> { href?: string }
export function BpRef({ href, children, className, ...props }: BpRefProps) {
  // WORD JOINER keeps the reference attached across inline element boundaries.
  return <>{"\u2060"}<sup {...props} className={cn("bp-ref font-mono text-ui-meta", className)}>{href ? <a href={href}>{children}</a> : children}</sup>{"\u2060"}</>
}

export interface BpProvenanceProps extends ComponentProps<"dl"> {
  items: { label: string; value: ReactNode }[]
}
export function BpProvenance({ items, className, ...props }: BpProvenanceProps) {
  return <dl {...props} className={cn("bp-provenance text-ui-meta", className)}>
    {items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
  </dl>
}

export interface BpAnswerLabelProps extends ComponentProps<"span"> {
  kind: "observe" | "explain" | "suggest"
}
const answerLabels = { observe: "观察", explain: "解释 · 待核对", suggest: "建议" }
export function BpAnswerLabel({ kind, children, className, ...props }: BpAnswerLabelProps) {
  return <span {...props} data-kind={kind} className={cn("bp-answer-label inline-block border px-1.5 py-px text-ui-meta font-semibold", kind === "explain" ? "border-dashed border-muted-foreground text-muted-foreground" : kind === "suggest" ? "border-foreground bg-foreground text-background" : "border-foreground text-foreground", className)}>{children ?? answerLabels[kind]}</span>
}

export interface BpProvenanceLineProps extends ComponentProps<"div"> {
  items: { label?: string; value: ReactNode }[]
  action?: ReactNode
}
export function BpProvenanceLine({ items, action, className, ...props }: BpProvenanceLineProps) {
  return <div {...props} className={cn("bp-provenance-line border-t border-border pt-2 text-ui-meta text-muted-foreground break-words", className)}>
    {items.map((item, index) => <span key={index}>{index > 0 && " ｜ "}{item.label && <>{item.label}：</>}{item.value}</span>)}
    {action != null && <span>{items.length > 0 && " ｜ "}{action}</span>}
  </div>
}

export interface BpSidePeekProps extends Pick<ComponentProps<typeof Sheet>, "open" | "onOpenChange" | "defaultOpen"> {
  title: string
  trigger: ReactElement
  position?: BpWorkPosition
  children: ReactNode
  footer?: ReactNode
  /** Attach to BpWorkHeader so wrapping and scrolling update the sheet's top edge. */
  headerRef?: RefObject<HTMLElement | null>
  portalProps?: ComponentProps<typeof SheetPortal>
}
export function BpSidePeek({ title, trigger, position, children, footer, headerRef, portalProps, ...props }: BpSidePeekProps) {
  const scopedPortalProps = usePrismPortalProps(portalProps)
  const [top, setTop] = useState(56)
  useEffect(() => {
    const header = headerRef?.current
    if (!header) return
    const measure = () => setTop(Math.max(0, Math.min(window.innerHeight, header.getBoundingClientRect().bottom)))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [headerRef])
  return <Sheet {...props}>
    <SheetTrigger render={trigger} />
    <SheetPortal {...scopedPortalProps}>
      <SheetBackdrop className="bp-peek-backdrop" style={{ top }} />
      <SheetViewport side="right" className="bp-peek-viewport" style={{ top }}>
        <SheetPrimitive.Popup className="bp-peek" aria-describedby={undefined}>
          <header className="bp-peek-head">
            <SheetTitle className="bp-peek-title text-block-title">{title}</SheetTitle>
            {position && <WorkPosition {...position} />}
            <SheetClose render={<BpButton size="sm" />} aria-label="关闭">×</SheetClose>
          </header>
          <div className="bp-peek-body text-ui-body">{children}</div>
          {footer != null && <footer className="bp-peek-footer">{footer}</footer>}
        </SheetPrimitive.Popup>
      </SheetViewport>
    </SheetPortal>
  </Sheet>
}
