"use client"

import { Children, useId, useState, type ReactNode, type CSSProperties } from "react"
import { Check, FileText, FileImage, File } from "lucide-react"
import { Card } from "@/components/coss/card"
import { ScrollArea } from "@/components/coss/scroll-area"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/coss/progress"
import { Empty } from "@/components/coss/empty"
import { Skeleton } from "@/components/coss/skeleton"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Badge } from "./badge"
import { AgentStatus, type AgentStatusTone } from "./agent-visual-parts"
import { agentFileStatusLabels, formatAgentFileSize, type AgentFileItem, type AgentFileAction, type AgentFileIntent } from "./agent-file-input"
import { PaperThumbnail, paperDimensions } from "./paper-preview"

export type AttachmentIntent = Extract<AgentFileIntent, { kind: "retry" }> | { fileId: string; version?: string; kind: "remove" | "view" }
export type AttachmentProps = {
  item: Pick<AgentFileItem, "id" | "name" | "type" | "sizeBytes" | "status" | "version" | "actions"> & {
    processing?: NonNullable<AgentFileItem["processing"]> & { tone?: AgentStatusTone; retry?: AgentFileAction & { requestId?: string } }
  }
  size?: "sm" | "md" | "lg"; thumbnailUrl?: string; mediaKind?: "pdf" | "image" | "document"
  view?: AgentFileAction; onAction?: (intent: AttachmentIntent) => void; className?: string
}

function AttachmentMedia({ src, kind }: { src?: string; kind: "pdf" | "image" | "document" }) {
  const [failed, setFailed] = useState(false)
  const Icon = kind === "pdf" ? FileText : kind === "image" ? FileImage : File
  return src && !failed ? <img src={src} alt="" className="h-full w-full object-contain" onError={() => setFailed(true)} />
    : <span role="img" aria-label={`${kind === "pdf" ? "PDF" : kind === "image" ? "图片" : "文档"}${failed ? "缩略图加载失败" : "文件"}`} className="flex h-full items-center justify-center"><Icon aria-hidden="true" className="size-6" /></span>
}

/** Upload and processing facts remain independent and controlled by the host. */
export function Attachment({ item, size = "md", thumbnailUrl, mediaKind, view, onAction, className }: AttachmentProps) {
  const id = useId(), status = item.status, name = item.name || "名称未确认"
  const progress = status.state === "uploading" && Number.isFinite(status.progress) && status.progress! >= 0 && status.progress! <= 100 ? status.progress : undefined
  const reason = "reason" in status ? status.reason : undefined
  const kind = mediaKind ?? (/pdf/i.test(item.type) || /\.pdf$/i.test(name) ? "pdf" : /^image\//i.test(item.type) || /\.(png|jpe?g|webp|gif)$/i.test(name) ? "image" : "document")
  const target = { fileId: item.id, version: item.version }
  const unavailable = !item.id.trim() ? "文件标识未确认" : !onAction ? "操作暂不可用" : undefined
  const processing = item.processing
  const retry = processing ? processing.retry : status.state === "failed" ? status.retry : undefined
  const retryRequestId = processing ? processing.retry?.requestId : status.state === "failed" ? status.request?.id : undefined
  const actions: { kind: "remove" | "retry" | "view"; label: string; config: AgentFileAction }[] = []
  if (view) actions.push({ kind: "view", label: "查看", config: view })
  if (status.state !== "unknown" && status.state !== "removed" && retry) actions.push({ kind: "retry", label: "重试", config: retry })
  if (status.state !== "unknown" && status.state !== "removed" && item.actions?.remove) actions.push({ kind: "remove", label: "移除", config: item.actions.remove })
  return <Card render={<article />} aria-labelledby={`${id}-name`} data-attachment data-size={size} data-file-state={status.state}
    className={cn("min-w-0 w-full", size === "sm" ? "gap-2 p-3" : size === "lg" ? "gap-4 p-5" : "gap-3 p-4", className)}>
    <div className="flex min-w-0 items-center gap-3">
      <div className={cn("shrink-0", size === "sm" ? "size-8" : size === "lg" ? "size-20" : "size-12")}><AttachmentMedia key={thumbnailUrl ?? "missing"} src={thumbnailUrl} kind={kind} /></div>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 id={`${id}-name`} title={name} aria-label={name} className="flex min-w-0 text-item-title"><span className="min-w-0 truncate" aria-hidden="true">{name.length > 24 ? name.slice(0, -12) : name}</span>{name.length > 24 && <span aria-hidden="true" className="shrink-0">{name.slice(-12)}</span>}</h3>
        <p className="break-words text-ui-hint">{item.type || "类型未确认"} · {formatAgentFileSize(item.sizeBytes)}</p>
      </div>
    </div>
    <AgentStatus tone={processing ? processing.tone ?? "neutral" : status.state === "failed" || status.state === "invalid" ? "error" : status.state === "unknown" ? "warning" : "neutral"}>{processing ? processing.label : agentFileStatusLabels[status.state]}</AgentStatus>
    {reason && <p className="break-words text-ui-hint [overflow-wrap:anywhere]">{reason}</p>}
    {status.state === "uploading" && <div className="space-y-2">
      <p className="text-ui-hint tabular-nums">{progress === undefined ? "进度未确认" : `上传进度 ${progress}%`}</p>
      <Progress value={progress ?? null} aria-label={`${name}上传进度`}><ProgressTrack><ProgressIndicator className="motion-reduce:transition-none" /></ProgressTrack></Progress>
    </div>}
    {processing?.description && <p className="break-words text-ui-hint [overflow-wrap:anywhere]">{processing.description}</p>}
    {actions.length > 0 && <div className="flex flex-wrap items-start gap-2">{actions.map(action => {
      const disabledReason = unavailable || action.config.disabledReason
      return <div key={action.kind} className="min-w-0 space-y-1">
        <Button type="button" variant="outline" size="sm" data-attachment-action={action.kind} aria-label={`${action.label}：${name}`} disabled={!!disabledReason} aria-describedby={disabledReason ? `${id}-${action.kind}` : undefined}
          onClick={() => { if (!disabledReason) onAction?.(action.kind === "retry" ? { ...target, kind: "retry", requestId: retryRequestId } : { ...target, kind: action.kind }) }}>{action.label}</Button>
        {disabledReason && <p id={`${id}-${action.kind}`} className="text-ui-hint [overflow-wrap:anywhere]">{disabledReason}</p>}
      </div>
    })}</div>}
  </Card>
}

export type PaperCardProps = {
  id: string; studentName: string; examNumber?: string; pageCount?: number; thumbnailUrl?: string
  variant?: "card" | "sheet"; compact?: boolean; placeholder?: boolean
  /** Labels and resolution eligibility are supplied by the host, never inferred from status. */
  viewLabel?: string; resolveLabel?: string; onResolve?: (id: string) => void
  paperSize?: "A4" | "A3"; orientation?: "portrait" | "landscape"
  status: { label: string; tone?: AgentStatusTone }; reason?: string; selected?: boolean; onView?: (id: string) => void
}
const badgeTones = { neutral: "outline", info: "info", success: "success", warning: "warning", error: "error" } as const
export function PaperCard({ id, studentName, examNumber, pageCount, thumbnailUrl, paperSize = "A4", orientation, status, reason, selected, onView, variant = "card", compact = false, placeholder = false, viewLabel = "查看", resolveLabel = "处理", onResolve }: PaperCardProps) {
  const labelId = useId(), dimensions = paperDimensions(paperSize, orientation)
  const count = Number.isInteger(pageCount) && pageCount! > 0 ? pageCount : undefined
  const exam = examNumber?.trim(), name = studentName || "姓名未提供"
  const metadata = compact ? [exam && `考号 ${exam}`, count !== undefined && `${count} 页`].filter(Boolean).join(" · ")
    : !exam && count === undefined ? "考号、页数未提供" : `${exam ? `考号 ${exam}` : "考号未提供"} · ${count === undefined ? "页数未提供" : `${count} 页`}`
  const view = () => { if (id.trim()) onView?.(id) }
  const ratio = { aspectRatio: `${dimensions.width} / ${dimensions.height}` }
  const thumbnail = <PaperThumbnail page={{ id, thumbnailUrl, paperSize, orientation }} label={`${name}试卷缩略图`} />
  if (variant === "sheet") {
    const error = !placeholder && status.tone === "error"
    const pending = !placeholder && status.tone === "warning" && !!onResolve
    const showReason = error || (pending && !!reason)
    const information = placeholder ? status.label : showReason ? reason : [exam && `考号 ${exam}`, count !== undefined && `${count} 页`].filter(Boolean).join(" · ")
    const statusLabel = status.label || "状态未提供"
    const faceClass = cn("relative block h-full w-full rounded-sm border", placeholder ? "border-dashed border-muted-foreground" : "border-border bg-card shadow-md", error && "border-destructive-foreground", pending && "border-dashed border-warning-foreground", selected && "ring-2 ring-ring ring-offset-2 ring-offset-background")
    const face = <>
      {!placeholder && count !== undefined && count > 1 && <span aria-hidden="true" data-paper-stack className="absolute inset-0 translate-x-1 translate-y-1 rounded-sm border border-border bg-card" />}
      <span className={faceClass}>{!placeholder && <span className="absolute inset-0 overflow-hidden rounded-sm">{thumbnail}</span>}</span>
      {!placeholder && status.tone === "success" && <span aria-hidden="true" data-paper-success className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-success-foreground text-background ring-2 ring-background"><Check className="size-3" /></span>}
      {pending && <span aria-hidden="true" data-paper-pending className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-warning-foreground text-background text-ui-hint ring-2 ring-background">?</span>}
      {!placeholder && status.tone && status.tone !== "success" && <Badge variant={badgeTones[status.tone]} title={statusLabel}
        className={cn("absolute top-1.5 -left-1.5 max-w-[calc(100%-0.5rem)] px-0.5 duration-150 motion-reduce:transition-none", error && "bg-destructive-foreground text-background dark:bg-destructive-foreground", pending && "bg-warning-foreground text-background dark:bg-warning-foreground")}><span className="truncate">{statusLabel}</span></Badge>}
    </>
    return <article data-paper-card={id} data-paper-variant="sheet" data-placeholder={placeholder || undefined} aria-labelledby={labelId} aria-current={selected ? "true" : undefined}
      className={cn("flex min-w-0 flex-col items-center gap-2 border border-transparent px-2 pt-3.5 pb-2.5", error && "rounded-2xl border-destructive-foreground bg-card text-card-foreground", pending && "rounded-2xl border-dashed border-warning-foreground bg-card text-card-foreground")}>
      <span data-paper-sheet-media className="relative block w-[108px] max-w-full shrink-0" style={ratio}>
        {placeholder && !onResolve ? <span role="img" aria-label={`${name}：${statusLabel}`} className="block h-full w-full">{face}</span>
          : <button type="button" data-paper-action={placeholder ? "resolve" : "thumbnail"} aria-label={placeholder ? `${resolveLabel}：${name}` : `查看/放大：${name}的试卷`}
            aria-describedby={`${labelId}-status${showReason && reason ? ` ${labelId}-information` : ""}`} aria-current={selected ? "true" : undefined}
            disabled={!id.trim() || (!placeholder && !onView)} onClick={placeholder ? () => { if (id.trim()) onResolve?.(id) } : view}
            className="relative block h-full w-full cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default">{face}</button>}
      </span>
      <span id={`${labelId}-status`} className="sr-only">{statusLabel}</span>
      <div className="flex w-full min-w-0 flex-col items-center gap-px">
        <h3 id={labelId} title={name} className={cn("max-w-full truncate text-item-title", placeholder && "text-muted-foreground")}>{name}</h3>
        {information && <p id={`${labelId}-information`} title={information} className={cn("max-w-full truncate text-ui-hint", error ? "text-destructive-foreground" : pending ? "text-warning-foreground" : "text-muted-foreground")}>
          {!placeholder && !showReason && exam ? <><span data-paper-exam-prefix>考号 </span>{[exam, count !== undefined && `${count} 页`].filter(Boolean).join(" · ")}</> : information}
        </p>}
      </div>
      {(error || pending) && onResolve && <Button type="button" variant="outline" size="sm" data-paper-action="resolve" className="max-w-full duration-150 motion-reduce:transition-none" aria-label={`${resolveLabel}：${name}`} aria-describedby={pending ? `${labelId}-status${reason ? ` ${labelId}-information` : ""}` : undefined} disabled={!id.trim()} onClick={() => { if (id.trim()) onResolve(id) }}><span className="truncate" title={resolveLabel}>{resolveLabel}</span></Button>}
    </article>
  }
  const media = compact ? <Button type="button" variant="outline" data-paper-action="thumbnail"
    className="relative h-auto min-h-11 w-20 min-w-11 shrink-0 overflow-hidden p-0 sm:h-auto" style={ratio}
    aria-label={`查看/放大：${name}的试卷`} disabled={!onView || !id.trim()} onClick={view}>
    <span className="absolute inset-0">{thumbnail}</span>
  </Button> : <Card className="relative w-full min-w-0 gap-0 overflow-hidden p-0" style={ratio}>
    {thumbnail}{count !== undefined && <Badge className="absolute right-1 bottom-1" variant="outline">{count} 页</Badge>}
  </Card>
  const identity = <div className="min-w-0 space-y-1">
    <h3 id={labelId} className="truncate text-item-title" title={studentName}>{name}</h3>
    {metadata && <p className="truncate text-ui-hint" title={metadata}>{metadata}</p>}
  </div>
  const badges = <div className="flex flex-wrap items-start gap-1"><Badge variant={badgeTones[status.tone ?? "neutral"]} className="h-auto whitespace-normal [overflow-wrap:anywhere]">{status.label || "状态未提供"}</Badge>{selected && <Badge variant="info">当前预览</Badge>}</div>
  return <Card render={<article />} data-paper-card={id} data-compact={compact || undefined} data-placeholder={placeholder || undefined} aria-labelledby={labelId} aria-current={selected ? "true" : undefined}
    className={cn("min-w-0 gap-3 p-3", compact && "gap-2 p-2", placeholder && "border-dashed bg-muted")}>
    {compact ? <div className="flex min-w-0 items-start gap-2">{media}<div className="min-w-0 flex-1 space-y-1">{identity}{badges}</div></div> : <>{media}{identity}{badges}</>}
    {reason && <p className="line-clamp-2 text-ui-hint [overflow-wrap:anywhere]" title={reason}>{reason}</p>}
    <div className="mt-auto flex flex-wrap gap-1">
      {onResolve && <Button type="button" variant="outline" data-paper-action="resolve" className="h-auto min-h-12 min-w-11 max-w-full whitespace-normal [overflow-wrap:anywhere] sm:h-auto" aria-label={`${resolveLabel}：${name}`} disabled={!id.trim()} onClick={() => { if (id.trim()) onResolve(id) }}>{resolveLabel}</Button>}
      <Button type="button" variant="outline" size="sm" data-paper-action="view" className={cn("h-auto min-h-11 min-w-11 max-w-full flex-1 whitespace-normal [overflow-wrap:anywhere] sm:h-auto", compact && "min-h-12")} aria-label={`${viewLabel}：${name}的试卷`} disabled={!onView || !id.trim()} onClick={view}>{viewLabel}</Button>
    </div>
  </Card>
}

export type PaperCardGridProps = {
  variant?: "card" | "sheet"; density?: "comfortable" | "dense"
  compact?: boolean; className?: string; children?: ReactNode; maxHeight?: CSSProperties["maxHeight"]; state?: "ready" | "loading" | "empty" | "error"
  emptyMessage?: string; errorMessage?: string; onRetry?: () => void; "aria-label"?: string
}
export function PaperCardGrid({ variant = "card", density = "comfortable", compact = false, className, children, maxHeight, state = "ready", emptyMessage = "尚未接收学生试卷", errorMessage = "学生试卷加载失败", onRetry, "aria-label": label = "学生试卷" }: PaperCardGridProps) {
  const sheet = variant === "sheet", dense = sheet && density === "dense"
  const content = state === "loading" ? <div role="status" aria-busy="true" className="space-y-3"><p className="text-ui-hint">正在加载学生试卷…</p><Skeleton className="h-48 w-full motion-reduce:animate-none" /></div>
      : state === "error" ? <Empty><p role="alert" className="text-ui-body">{errorMessage}</p>{onRetry && <Button type="button" variant="outline" onClick={onRetry}>重试</Button>}</Empty>
        : state === "empty" || Children.toArray(children).filter(child => child !== "").length === 0 ? <Empty><p className="text-ui-body">{emptyMessage}</p></Empty>
          : <div className={cn("grid items-stretch", sheet ? dense ? "gap-x-2 gap-y-1 [&>[data-paper-variant=sheet]]:px-0.5 [&>[data-paper-variant=sheet]]:pt-2.5 [&>[data-paper-variant=sheet]]:pb-2 [&>[data-paper-variant=sheet]>[data-paper-sheet-media]]:w-[84px] [&>[data-paper-variant=sheet]_[data-paper-exam-prefix]]:sr-only" : "gap-x-3 gap-y-2" : "gap-3")} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${sheet ? dense ? 112 : 160 : compact ? 172 : 168}px, 100%), 1fr))` }}>{children}</div>
  return maxHeight !== undefined
    ? <ScrollArea render={<section />} data-paper-card-grid data-state={state} aria-label={label} scrollFade overscrollContain style={{ maxHeight }} className={cn("h-auto min-w-0 [&>[data-slot=scroll-area-viewport]]:max-h-[inherit] motion-reduce:[&_[data-slot=scroll-area-viewport]]:transition-none motion-reduce:[&_[data-slot=scroll-area-scrollbar]]:transition-none", className)}><div className="p-1">{content}</div></ScrollArea>
    : <section data-paper-card-grid data-state={state} aria-label={label} className={cn("min-h-0 min-w-0 overflow-y-auto overscroll-contain p-1", className)}>{content}</section>
}
