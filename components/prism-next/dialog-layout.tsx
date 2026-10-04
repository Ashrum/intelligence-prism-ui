"use client"

import { Children, useId, type ComponentProps, type ReactNode } from "react"
import { AlertCircle, ArrowRight, Check, Info, X, ZoomIn } from "lucide-react"
import { Button, buttonVariants } from "@/components/coss/button"
import { Dialog, DialogClose, DialogDescription, DialogPopup, DialogTitle } from "@/components/coss/dialog"
import { Radio, RadioGroup, RadioPrimitive } from "@/components/coss/radio-group"
import { Badge } from "./badge"
import { cn } from "@/lib/utils"
import "./dialog-layout.css"

export type DialogLayoutProps = {
  open: boolean
  onOpenChange: NonNullable<ComponentProps<typeof Dialog>["onOpenChange"]>
  title: string
  closeLabel: string
  eyebrow?: ReactNode
  description?: ReactNode
  media?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  footerStart?: ReactNode
  footerEnd?: ReactNode
  footerLayout?: "split" | "equal"
  size?: "sm" | "md" | "lg" | "xl"
  accent?: boolean
  initialFocus?: ComponentProps<typeof DialogPopup>["initialFocus"]
}

/** The host owns every business fact and selection. Only coss owns modal mechanics. */
export function DialogLayout({ open, onOpenChange, title, closeLabel, eyebrow, description, media, children, footer, footerStart, footerEnd, footerLayout = "split", size = "md", accent = true, initialFocus }: DialogLayoutProps) {
  const id = useId()
  if (!title?.trim()) throw new Error("DialogLayout requires a non-empty title")
  if (!closeLabel?.trim()) throw new Error("DialogLayout requires a non-empty closeLabel")
  const hasFooter = footer != null || footerStart != null || footerEnd != null
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogPopup showCloseButton={false} bottomStickOnMobile={false} initialFocus={initialFocus}
      aria-labelledby={`${id}-title`} aria-describedby={description != null ? `${id}-description` : undefined}
      className="dialog-layout overflow-hidden motion-reduce:transition-none" data-dialog-layout data-size={size}>
      {accent && <div data-dialog-accent aria-hidden="true" className="h-[3px] shrink-0 bg-[image:var(--brand-ai-gradient)]" />}
      <div className="dialog-layout-frame">
        {media != null && <aside data-dialog-media className="dialog-layout-media border-r bg-muted"
          style={{ backgroundImage: "radial-gradient(ellipse at 20% 12%,color-mix(in srgb,var(--brand-blue) 16%,transparent),transparent 55%),radial-gradient(ellipse at 90% 30%,color-mix(in srgb,var(--brand-magenta) 11%,transparent),transparent 50%),radial-gradient(ellipse at 60% 100%,color-mix(in srgb,var(--brand-green) 20%,transparent),transparent 50%)" }}>{media}</aside>}
        <div className="dialog-layout-main">
          <header className="flex shrink-0 items-start gap-3 px-6 pt-5 pb-4">
            <div className="min-w-0 flex-1 space-y-1 [overflow-wrap:anywhere]">
              {eyebrow != null && <p data-dialog-eyebrow className="text-component-label text-muted-foreground">{eyebrow}</p>}
              <DialogTitle id={`${id}-title`} className="text-section-title">{title}</DialogTitle>
              {description != null && <DialogDescription id={`${id}-description`} className="text-ui-hint">{description}</DialogDescription>}
            </div>
            <DialogClose aria-label={closeLabel} render={<Button variant="ghost" size="icon" />}><X aria-hidden="true" /></DialogClose>
          </header>
          <div data-dialog-body className="dialog-layout-body flex flex-col gap-4 px-6 pb-5 text-ui-body [overflow-wrap:anywhere]">{children}</div>
          {hasFooter && <footer data-dialog-footer data-layout={footerLayout} className="dialog-layout-footer border-t bg-muted/72 px-6 py-3">
            {footer != null ? footer : <>
              {footerStart != null && <div data-dialog-footer-start>{footerStart}</div>}
              {footerEnd != null && <div data-dialog-footer-end>{footerEnd}</div>}
            </>}
          </footer>}
        </div>
      </div>
    </DialogPopup>
  </Dialog>
}

export type DialogTone = "neutral" | "info" | "success" | "warning" | "error"
const badges = { neutral: "outline", info: "info", success: "success", warning: "warning", error: "error" } as const
const toneText = { neutral: "text-muted-foreground", info: "text-info-foreground", success: "text-success-foreground", warning: "text-warning-foreground", error: "text-destructive-foreground" } as const
export type DialogEvidenceProps = {
  thumbnail: ReactNode
  title: string
  facts?: readonly ReactNode[]
  status?: { label: string; tone?: DialogTone }
  onView?: () => void
  viewLabel?: string
}
export function DialogEvidence({ thumbnail, title, facts, status, onView, viewLabel = `查看大图：${title}` }: DialogEvidenceProps) {
  const face = <>{thumbnail}{onView && <span data-dialog-zoom aria-hidden="true" className="absolute right-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"><ZoomIn className="size-4" /></span>}</>
  return <div data-dialog-evidence className="flex min-w-0 flex-col items-center gap-3 text-center [overflow-wrap:anywhere]">
    {onView ? <button type="button" aria-label={viewLabel} onClick={onView} className="relative block aspect-[124/175] w-[124px] max-w-full rounded-sm border bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{face}</button>
      : <div className="relative aspect-[124/175] w-[124px] max-w-full rounded-sm border bg-card">{face}</div>}
    {status && <Badge variant={badges[status.tone ?? "neutral"]} className="max-w-full whitespace-normal">{status.label}</Badge>}
    <div className="w-full min-w-0 space-y-1"><h3 className="text-item-title">{title}</h3>
      {!!facts?.length && <ul data-dialog-facts className="space-y-1 text-ui-hint text-muted-foreground">{facts.map((fact, i) => <li key={i}>{fact}</li>)}</ul>}
    </div>
  </div>
}

export function DialogSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return <section aria-labelledby={id} className="min-w-0 space-y-2"><h3 id={id} className="text-item-title">{title}</h3>{children}</section>
}

export type DialogOptionTileProps = Omit<ComponentProps<"button">, "title" | "children"> & {
  title: string; description: string; icon?: ReactNode; emphasis?: "primary" | "default"; disabledReason?: string
}
export function DialogOptionTile({ title, description, icon, emphasis = "default", disabled, disabledReason, className, ...props }: DialogOptionTileProps) {
  const id = useId(), blocked = disabled || !!disabledReason
  return <button {...props} type="button" disabled={blocked} data-dialog-option-tile data-emphasis={emphasis}
    aria-labelledby={`${id}-title`} aria-describedby={[props["aria-describedby"], `${id}-description`, blocked && disabledReason ? `${id}-reason` : null].filter(Boolean).join(" ")}
    className={cn(buttonVariants({ variant: emphasis === "primary" ? "default" : "outline" }), "h-auto min-w-0 justify-start gap-3 whitespace-normal px-4 py-3 text-left sm:h-auto", className)}>
    {icon && <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center">{icon}</span>}
    <span className="min-w-0 space-y-1 [overflow-wrap:anywhere]"><span id={`${id}-title`} className="block text-item-title">{title}</span>
      <span id={`${id}-description`} className={cn("block text-ui-hint", emphasis !== "primary" && "text-muted-foreground")}>{description}</span>
      {blocked && disabledReason && <span id={`${id}-reason`} className="block text-ui-hint">{disabledReason}</span>}
    </span>
  </button>
}

export function DialogQuietActions({ children }: { children: ReactNode }) {
  return <div data-dialog-quiet-actions className="divide-y overflow-hidden rounded-xl border">{children}</div>
}
export function DialogQuietAction({ title, description, className, ...props }: Omit<DialogOptionTileProps, "icon" | "emphasis" | "disabledReason">) {
  const id = useId()
  return <Button {...props} type="button" variant="ghost" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    className={cn("h-auto w-full min-w-0 justify-start whitespace-normal px-3 py-2.5 text-left sm:h-auto", className)}>
    <span className="min-w-0 flex-1 space-y-1 [overflow-wrap:anywhere]"><span id={`${id}-title`} className="block text-ui-action">{title}</span><span id={`${id}-description`} className="block text-ui-hint text-muted-foreground">{description}</span></span><ArrowRight aria-hidden="true" />
  </Button>
}

type ControlledSelection = { label: string; value: string | null; onValueChange: (value: string) => void; disabled?: boolean; children?: ReactNode }
export type DialogOptionGridProps = ControlledSelection & {
  columns?: 2 | 3 | 4
  groups?: readonly { id: string; title: string; description?: string; children: ReactNode }[]
  emptyText?: string
}
export function DialogOptionGrid({ label, value, onValueChange, disabled, children, groups, columns = 3, emptyText }: DialogOptionGridProps) {
  const id = useId()
  const populated = groups?.filter(group => Children.toArray(group.children).length > 0)
  const hasItems = groups ? !!populated?.length : Children.toArray(children).length > 0
  return <RadioGroup aria-label={label} value={value} onValueChange={onValueChange} disabled={disabled} data-dialog-option-grid data-columns={columns} className="gap-4">
    {hasItems ? groups ? populated?.map((group, index) => <div role="group" key={group.id} aria-labelledby={`${id}-${index}`} aria-describedby={group.description ? `${id}-${index}-note` : undefined} className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><h3 id={`${id}-${index}`} className="text-item-title">{group.title}</h3>
        {group.description && <p id={`${id}-${index}-note`} className="text-ui-hint text-muted-foreground">{group.description}</p>}</div>
      <div className="dialog-option-grid-items">{group.children}</div>
    </div>) : <div className="dialog-option-grid-items">{children}</div> : emptyText && <p data-dialog-grid-empty className="text-ui-hint text-muted-foreground">{emptyText}</p>}
  </RadioGroup>
}

export type DialogOptionGridItemProps = { value: string; title: string; description?: string; status?: { label: string; tone?: DialogTone }; disabled?: boolean; disabledReason?: string }
export function DialogOptionGridItem({ value, title, description, status, disabled, disabledReason }: DialogOptionGridItemProps) {
  const id = useId()
  return <RadioPrimitive.Root value={value} disabled={disabled || !!disabledReason} data-dialog-grid-item
    style={state => state.checked ? { backgroundImage: "linear-gradient(120deg,color-mix(in srgb,var(--brand-blue) 12%,transparent),color-mix(in srgb,var(--brand-magenta) 8%,transparent))" } : {}}
    aria-labelledby={`${id}-title`} aria-describedby={[description ? `${id}-description` : null, status ? `${id}-status` : null, disabledReason ? `${id}-reason` : null].filter(Boolean).join(" ") || undefined}
    className="relative flex min-w-0 cursor-pointer flex-col gap-1 rounded-xl border bg-popover px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring data-disabled:cursor-not-allowed data-disabled:opacity-64 data-checked:border-ring data-checked:bg-accent">
    <span className="flex w-full min-w-0 items-start gap-2"><span id={`${id}-title`} className="min-w-0 flex-1 break-words text-item-title">{title}</span><RadioPrimitive.Indicator className="shrink-0 text-info-foreground"><Check aria-hidden="true" className="size-4" /></RadioPrimitive.Indicator></span>
    {description && <span id={`${id}-description`} className="text-ui-hint text-muted-foreground [overflow-wrap:anywhere]">{description}</span>}
    {status && <span id={`${id}-status`} className={cn("flex items-center gap-1 text-ui-hint", toneText[status.tone ?? "neutral"])}><span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />{status.label}</span>}
    {disabledReason && <span id={`${id}-reason`} className="text-ui-hint">{disabledReason}</span>}
  </RadioPrimitive.Root>
}

export type DialogChoiceListProps = ControlledSelection & { other?: ReactNode }
export function DialogChoiceList({ label, value, onValueChange, disabled, children, other }: DialogChoiceListProps) {
  return <div data-dialog-choice-list className="space-y-3"><RadioGroup aria-label={label} value={value} onValueChange={onValueChange} disabled={disabled} className="gap-2">{children}</RadioGroup>{other != null && <div data-dialog-choice-other>{other}</div>}</div>
}
export function DialogChoice({ value, title, description, disabled, disabledReason }: Omit<DialogOptionGridItemProps, "status">) {
  const id = useId()
  return <label className="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border bg-popover px-3.5 py-3 has-[[data-checked]]:border-ring has-[[data-checked]]:bg-accent has-[[data-disabled]]:cursor-not-allowed">
    <Radio value={value} disabled={disabled || !!disabledReason} aria-labelledby={`${id}-title`} aria-describedby={[description ? `${id}-description` : null, disabledReason ? `${id}-reason` : null].filter(Boolean).join(" ") || undefined} className="mt-0.5" />
    <span className="min-w-0 space-y-1 [overflow-wrap:anywhere]"><span id={`${id}-title`} className="block text-ui-body">{title}</span>{description && <span id={`${id}-description`} className="block text-ui-hint text-muted-foreground">{description}</span>}{disabledReason && <span id={`${id}-reason`} className="block text-ui-hint text-muted-foreground">{disabledReason}</span>}</span>
  </label>
}

export function DialogRecord({ rows }: { rows: readonly { label: string; value: ReactNode }[] }) {
  return <dl data-dialog-record className="divide-y overflow-hidden rounded-xl border">{rows.map((row, index) => <div key={index} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 px-3.5 py-2.5 [overflow-wrap:anywhere]"><dt className="text-ui-hint text-muted-foreground">{row.label}</dt><dd className="text-ui-body">{row.value}</dd></div>)}</dl>
}
export function DialogNotice({ tone = "info", children }: { tone?: "warning" | "info" | "error"; children: ReactNode }) {
  const Icon = tone === "info" ? Info : AlertCircle
  return <div data-dialog-notice={tone} className={cn("flex items-start gap-2 rounded-lg px-3 py-2 text-ui-hint", toneText[tone], tone === "info" ? "bg-info/10" : tone === "warning" ? "bg-warning/10" : "bg-destructive/10")}><Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><div className="min-w-0 [overflow-wrap:anywhere]">{children}</div></div>
}
