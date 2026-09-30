"use client"

import { useId, useRef, useState } from "react"
import { Upload } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Skeleton } from "@/components/coss/skeleton"
import { AgentFileInput, formatAgentFileSize, type AgentFileInputProps, type AgentFileItem } from "./agent-file-input"
import { Attachment, type AttachmentIntent } from "./attachment"
import { AgentStatus, type AgentStatusTone } from "./agent-visual-parts"
import { Button } from "./button"
import { Stepper, type StepperProps } from "./stepper"

export type MaterialIntakeStation = {
  name?: string; connection: "connected" | "available" | "disconnected" | "offline" | "unknown"
  location?: string; mode?: string; receivedPages?: number | null
}
export type MaterialIntakeState =
  | { kind: "waiting" | "receiving" | "review" | "loading" | "unknown" }
  | { kind: "invalid" | "error"; reason: string }
export type MaterialIntakeMode = { kind: "all" } | { kind: "limited"; pageLimit: number } | { kind: "replace-page"; targetLabel: string }
export type MaterialIntakeRetryIntent = { kind: "receive" | "load" } | Extract<AttachmentIntent, { kind: "retry" }>
export type MaterialIntakeProps = {
  title: string; description: string; station: MaterialIntakeStation
  platform: "web" | "android" | "device"; platformHint?: string
  state: MaterialIntakeState; mode?: MaterialIntakeMode
  files: readonly AgentFileItem[]
  limits: AgentFileInputProps["limits"]; capabilities: AgentFileInputProps["capabilities"]
  steps: StepperProps["steps"]; currentStepId?: string
  sourceDescription?: string; selectionDisabledReason?: string; confirmDisabledReason?: string; retryDisabledReason?: string
  onFilesSelected?: (files: File[]) => void
  onRemove?: (intent: { kind: "remove"; fileId: string; version?: string }) => void
  onRetry?: (intent: MaterialIntakeRetryIntent) => void
  onChangeStation?: () => void; onCancel?: () => void; onConfirm?: () => void
}

const connections: Record<MaterialIntakeStation["connection"], { label: string; tone: AgentStatusTone }> = {
  connected: { label: "已连接", tone: "success" }, available: { label: "可用", tone: "info" },
  disconnected: { label: "未连接", tone: "warning" }, offline: { label: "离线", tone: "error" },
  unknown: { label: "连接状态未提供", tone: "neutral" },
}
const labels = { waiting: "等待接收", receiving: "接收中", review: "已接收待核对", invalid: "校验失败", loading: "正在加载接收信息", error: "接收信息加载失败", unknown: "接收状态未提供" }
const blocked = { waiting: "尚未接收资料，请先扫描或上传。", receiving: "正在接收资料，请等待接收完成。", invalid: "校验未通过，请重新接收后核对。", loading: "接收信息正在加载，请稍候。", error: "接收信息加载失败，请重试。", unknown: "接收状态未提供，请先核对接收结果。" }
const knownText = (value?: string) => value?.trim() || "未提供"
const positiveCount = (value: number) => Number.isInteger(value) && value > 0
const sourceCopy = "扫描与上传均可接收：两种方式汇入同一资料清单；接收完成后统一预览、核对并保存"

const fileTypes: Record<string, string> = {
  "application/pdf": "PDF", "image/png": "PNG 图片", "image/jpeg": "JPEG 图片", "image/webp": "WebP 图片",
  "image/gif": "GIF 图片", "image/tiff": "TIFF 图片", "image/bmp": "BMP 图片", "image/svg+xml": "SVG 图片",
  "application/msword": "Word", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
}
function readableFileType(type: string) {
  return fileTypes[type.toLowerCase()] ?? (type.startsWith("image/") ? "图片" : type.includes("/") ? "文件" : type || "类型未确认")
}

function IntakeSelection({ select, canDrop, selectionReason, label, hint, limits, capabilities }: Parameters<NonNullable<AgentFileInputProps["renderSelection"]>>[0] & {
  label: string; hint: string; limits: MaterialIntakeProps["limits"]; capabilities: MaterialIntakeProps["capabilities"]
}) {
  const id = useId(), input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const describedBy = `${id}-limits ${id}-hint ${id}-capabilities ${id}-drop${selectionReason ? ` ${id}-disabled` : ""}`
  const upload = capabilities.upload
  return <section aria-label="文件选择与拖放" className="min-w-0 space-y-2" data-file-drop={canDrop ? "enabled" : "disabled"}
    onDragOver={event => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = canDrop ? "copy" : "none"; setDragging(canDrop) } }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false) }}
    onDrop={event => { event.preventDefault(); event.stopPropagation(); setDragging(false); if (canDrop) select(Array.from(event.dataTransfer.files)) }}>
    <input ref={input} id={`${id}-input`} type="file" className="sr-only" tabIndex={-1} aria-label={label} aria-describedby={describedBy}
      accept={limits.accept} multiple={limits.maxFiles > 1} disabled={!!selectionReason}
      onChange={event => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; select(files) }} />
    <Button type="button" variant="outline" size={null} className="min-h-40 w-full min-w-0 flex-col gap-3 border-dashed px-4 py-6 whitespace-normal motion-reduce:transition-none"
      data-intake-select data-pressed={dragging && canDrop ? "" : undefined} disabled={!!selectionReason} aria-describedby={describedBy}
      onClick={() => { if (!selectionReason) input.current?.click() }}>
      <Upload aria-hidden="true" className="size-6" />
      <span className="break-words text-ui-action [overflow-wrap:anywhere]">{label}</span>
      <span id={`${id}-hint`} className="break-words text-ui-hint [overflow-wrap:anywhere]">{hint}</span>
    </Button>
    <p id={`${id}-capabilities`} className="break-words text-ui-hint">{[upload.reason, capabilities.select.reason].filter(Boolean).join("；")}</p>
    <p id={`${id}-limits`} className="break-words text-ui-hint">{limits.acceptLabel} · 单个文件不超过 {formatAgentFileSize(limits.maxFileSize)} · 最多 {limits.maxFiles} 个文件</p>
    <p id={`${id}-drop`} className="break-words text-ui-hint">{canDrop ? "可拖入此处，也可点击上传。" : "请点击选择文件。"}{capabilities.drop.reason && ` ${capabilities.drop.reason}`}</p>
    {selectionReason && <p id={`${id}-disabled`} className="break-words text-ui-hint">{selectionReason}</p>}
  </section>
}

/** Reception facts and intents only. Selection does not imply upload, recognition or saved data. */
export function MaterialIntake({ title, description, station, platform, platformHint, state, mode = { kind: "all" },
  files, limits, capabilities, steps, currentStepId, sourceDescription = sourceCopy, selectionDisabledReason,
  confirmDisabledReason, retryDisabledReason, onFilesSelected, onRemove, onRetry, onChangeStation, onCancel, onConfirm,
}: MaterialIntakeProps) {
  const id = useId()
  const pages = typeof station.receivedPages === "number" && Number.isInteger(station.receivedPages) && station.receivedPages >= 0 ? `${station.receivedPages} 页` : "未提供"
  const connection = connections[station.connection]
  const failed = state.kind === "invalid" || state.kind === "error"
  const limited = mode.kind === "limited" || mode.kind === "replace-page"
  const modeReason = mode.kind === "limited" && !positiveCount(mode.pageLimit) ? "接收页数限制未提供，请先核对。"
    : mode.kind === "replace-page" && !mode.targetLabel.trim() ? "待替换页面未提供，请先核对。" : undefined
  const limit = mode.kind === "replace-page" ? "1" : mode.kind === "limited" && positiveCount(mode.pageLimit) ? String(mode.pageLimit) : "未提供"
  const selectReason = selectionDisabledReason || modeReason || (state.kind === "unknown" ? "请先核对原接收结果，再选择文件。" : undefined)
    || (!onFilesSelected ? "文件选择暂不可用。" : undefined)
  const confirmReason = confirmDisabledReason || modeReason || (state.kind !== "review" ? blocked[state.kind] : !onConfirm ? "保存操作暂不可用。" : undefined)
  const retryReason = retryDisabledReason || (!onRetry ? "重新接收操作暂不可用。" : undefined)
  const cancelReason = !onCancel ? "取消操作暂不可用。" : undefined
  const loading = state.kind === "loading"

  function renderFile(item: AgentFileItem) {
    // Keep per-file restrictions, including independent callback and upload capabilities.
    const removeReason = item.actions?.remove?.disabledReason || (!onRemove ? "移除操作暂不可用。" : undefined)
    const fileRetryReason = retryDisabledReason || (!onRetry ? "重试操作暂不可用。" : undefined)
      || (capabilities.upload.status === "unsupported" ? `上传未接入：${capabilities.upload.reason}` : undefined)
    const status = item.status.state === "failed" && item.status.retry
      ? { ...item.status, retry: { ...item.status.retry, disabledReason: item.status.retry.disabledReason || fileRetryReason } } : item.status
    return <Attachment item={{ ...item, type: readableFileType(item.type), status, actions: { ...item.actions,
      remove: item.actions?.remove ? { ...item.actions.remove, disabledReason: removeReason } : undefined,
    } }} mediaKind={/^image\//i.test(item.type) ? "image" : undefined} size="sm" onAction={intent => {
      if (intent.kind === "remove" && !removeReason) onRemove?.({ ...intent, kind: "remove" })
      if (intent.kind === "retry" && !fileRetryReason) onRetry?.(intent)
    }} />
  }

  return <Card render={<section />} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    data-material-intake data-state={state.kind} className="min-w-0 w-full gap-5 p-4 sm:p-5">
    <header className="min-w-0 space-y-2">
      <h2 id={`${id}-title`} className="break-words text-block-title [overflow-wrap:anywhere]">{title}</h2>
      <p id={`${id}-description`} className="break-words text-ui-hint">{description}</p>
    </header>
    <div role="status" aria-live="polite" className="min-w-0 space-y-2">
      <AgentStatus tone={failed ? "error" : state.kind === "review" ? "success" : state.kind === "receiving" ? "info" : "neutral"}>{labels[state.kind]}</AgentStatus>
      {state.kind === "receiving" && <p className="text-ui-hint">已接收 {pages}</p>}
    </div>
    {loading ? <div aria-busy="true" className="space-y-3"><Skeleton className="h-24 w-full motion-reduce:animate-none" /><Skeleton className="h-36 w-full motion-reduce:animate-none" /></div>
      : state.kind !== "error" && <>
        <Card className="min-w-0 gap-3 p-4" aria-label="数据站状态" aria-busy={state.kind === "receiving"}>
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h3 className="break-words text-item-title [overflow-wrap:anywhere]">{knownText(station.name)}</h3>
            <AgentStatus tone={connection.tone}>{connection.label}</AgentStatus>
          </div>
          <dl className="grid min-w-0 gap-2 text-ui-hint">{[["位置", knownText(station.location)], ["接收模式", knownText(station.mode)], ["已接收页数", pages]].map(([label, value]) =>
            <div key={label} className="flex min-w-0 flex-wrap gap-x-2"><dt>{label}</dt><dd className="min-w-0 break-words [overflow-wrap:anywhere]">{value}</dd></div>)}</dl>
          {onChangeStation && <div><Button type="button" variant="outline" size="sm" data-intake-action="station" onClick={onChangeStation}>更换数据站</Button></div>}
        </Card>
        {limited && <Card className="min-w-0 gap-2 p-4" aria-label="接收范围">
          <h3 className="text-item-title">{limit === "未提供" ? "接收页数限制未提供" : `只收 ${limit} 页`}</h3>
          {mode.kind === "replace-page" && <><p className="break-words text-ui-body">{knownText(mode.targetLabel)}</p><p className="text-ui-hint">仅替换当前缺失页，不新增试卷或覆盖其他正常页面</p></>}
        </Card>}
        <AgentFileInput title="接收资料清单" items={files} limits={limits} capabilities={capabilities} density="compact"
          renderSelection={selection => <IntakeSelection {...selection} limits={limits} capabilities={capabilities}
            label={mode.kind === "replace-page" ? `放入${mode.targetLabel.match(/第\s*\d+\s*页/)?.[0] ?? knownText(mode.targetLabel)}，或点击上传` : "点击上传文件，或放入数据站扫描"}
            hint={platformHint ?? (platform === "web" ? `Web：选择或拖入 ${limits.acceptLabel}，也可通过数据站扫描接收。` : `优先连接数据站扫描；也可选择 ${limits.acceptLabel} 上传。`)} />}
          selectionDisabledReason={selectReason} onSelect={selected => { if (!selectReason) onFilesSelected?.(selected) }} renderItem={renderFile} />
        <Card className="min-w-0 gap-2 p-4" aria-label="接收说明"><p className="break-words text-ui-hint">{sourceDescription}</p></Card>
      </>}
    {failed && <div className="min-w-0 space-y-2"><p role="alert" className="break-words text-ui-hint [overflow-wrap:anywhere]">{state.reason.trim() || "原因未提供"}</p>
      <Button type="button" variant="outline" data-intake-action="retry" disabled={!!retryReason} aria-describedby={retryReason ? `${id}-retry-reason` : undefined}
        onClick={() => { if (!retryReason) onRetry?.({ kind: state.kind === "error" ? "load" : "receive" }) }}>{state.kind === "error" ? "重新加载" : "重新接收"}</Button>
      {retryReason && <p id={`${id}-retry-reason`} className="text-ui-hint">{retryReason}</p>}
    </div>}
    <Stepper steps={steps} currentStepId={currentStepId} aria-label="资料接收流程" />
    <footer className="min-w-0 space-y-2">
      {confirmReason && <p id={`${id}-confirm-reason`} className="break-words text-ui-hint">{confirmReason}</p>}
      {cancelReason && <p id={`${id}-cancel-reason`} className="text-ui-hint">{cancelReason}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" data-intake-action="cancel" disabled={!!cancelReason} aria-describedby={cancelReason ? `${id}-cancel-reason` : undefined} onClick={() => onCancel?.()}>取消</Button>
        <Button type="button" data-intake-action="confirm" disabled={!!confirmReason} aria-describedby={confirmReason ? `${id}-confirm-reason` : undefined}
          onClick={() => { if (!confirmReason) onConfirm?.() }}>{state.kind === "waiting" ? "等待接收" : "完成并保存"}</Button>
      </div>
    </footer>
  </Card>
}
