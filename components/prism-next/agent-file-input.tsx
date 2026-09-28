"use client"

import { useId, type ReactNode } from "react"
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpRight, ChevronDown, X } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Field, FieldLabel } from "@/components/coss/field"
import { Input } from "@/components/coss/input"
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/coss/progress"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentFileCapability =
  | { status: "supported"; reason?: string }
  | { status: "limited" | "unsupported"; reason: string }
export type AgentFileCapabilities = {
  select: { status: "supported"; reason?: string }
  upload: AgentFileCapability
  drop: AgentFileCapability
}
export type AgentFileLimits = { accept: string; acceptLabel: string; maxFileSize: number; maxFiles: number }
export type AgentFileAction = { disabledReason?: string }
export type AgentFileRequest = { id: string; label: string }
/** Independent input/upload facts. Reading and parsing never follow implicitly. */
export type AgentFileStatus =
  | { state: "selected" | "queued" | "removed" }
  | { state: "invalid"; validation: "type" | "size" | "count"; reason: string }
  | { state: "received"; request: AgentFileRequest }
  | { state: "uploading"; request: AgentFileRequest; progress?: number }
  | { state: "uploaded"; uploadedAt?: string }
  | { state: "failed"; reason: string; request?: AgentFileRequest; retry?: AgentFileAction }
  | { state: "unknown"; reason: string; request: AgentFileRequest; query?: AgentFileAction }
export type AgentFileItem = {
  id: string
  name: string
  type: string
  sizeBytes?: number
  source: { kind: "local" | "existing"; label?: string }
  version?: string
  status: AgentFileStatus
  processing?: { label: string; description?: string }
  actions?: { remove?: AgentFileAction; replace?: AgentFileAction; move?: AgentFileAction }
  /** Passive, already-authorized details. These slots do not read a File or grant actions. */
  details?: ReactNode
  preview?: ReactNode
}
type FileTarget = { fileId: string; version?: string }
export type AgentFileIntent = FileTarget & (
  | { kind: "remove" | "replace" }
  | { kind: "move"; direction: "up" | "down"; adjacentId: string }
  | { kind: "retry"; requestId?: string }
  | { kind: "query"; requestId: string }
)
export type AgentFileBatchAction = {
  id: string
  label: string
  kind: "remove" | "upload" | "retry"
  fileIds: readonly string[]
  disabledReason?: string
}
export type AgentFileBatchIntent = Pick<AgentFileBatchAction, "id" | "kind" | "fileIds">
export type AgentFileInputProps = AgentRecordViewProps & {
  title: string
  items: readonly AgentFileItem[]
  limits: AgentFileLimits
  capabilities: AgentFileCapabilities
  onSelect: (files: File[]) => void
  selectionDisabledReason?: string
  onAction?: (intent: AgentFileIntent) => void
  inlineLimit?: number
  groupBy?: "none" | "status"
  onGroupByChange?: (groupBy: "none" | "status") => void
  batchActions?: readonly AgentFileBatchAction[]
  onBatchAction?: (intent: AgentFileBatchIntent) => void
  onBack?: () => void
  notice?: string
}

const statusLabels: Record<AgentFileStatus["state"], string> = {
  selected: "已选择", invalid: "校验未通过", queued: "等待上传", received: "已接收",
  uploading: "上传中", uploaded: "已上传", failed: "上传失败", unknown: "状态未确认", removed: "已移除",
}
const validationLabels = { type: "类型不支持", size: "大小超限", count: "数量超限" }
const capabilityLabels = { supported: "支持", limited: "有限支持", unsupported: "未接入" }

function fileSize(bytes?: number) {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "大小未确认"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Number((bytes / 1024).toFixed(1))} KB`
  return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`
}

function FileActionButton({ label, name, action, reason, onClick, children }: {
  label: string; name: string; action: string; reason?: string; onClick: () => void; children?: ReactNode
}) {
  const id = useId()
  return <div className="min-w-0 space-y-1">
    <Button type="button" size="navigation" variant="outline" className="max-w-full whitespace-normal"
      aria-label={`${label}：${name}`} disabled={!!reason} aria-describedby={reason ? id : undefined}
      data-file-action={action} onClick={() => { if (!reason) onClick() }}>{children}{label}</Button>
    {reason && <p id={id} className="break-words text-ui-hint">{reason}</p>}
  </div>
}

function FileRow({ item, items, view, compact, groupBy, upload, onAction }: {
  item: AgentFileItem; items: readonly AgentFileItem[]; view: "inline" | "workspace"; compact: boolean;
  groupBy: "none" | "status"; upload: AgentFileCapability; onAction?: AgentFileInputProps["onAction"]
}) {
  const id = useId()
  const status = item.status
  const target = { fileId: item.id, version: item.version }
  const request = "request" in status ? status.request : undefined
  const progress = status.state === "uploading" && Number.isFinite(status.progress) && status.progress! >= 0 && status.progress! <= 100 ? status.progress : undefined
  const index = items.findIndex(value => value.id === item.id)
  const unavailable = !item.id.trim() ? "文件标识未确认。" : !onAction ? "此操作暂不可用。" : undefined
  const uploadReason = upload.status === "unsupported" ? `上传未接入：${upload.reason}` : undefined
  const attention = status.state === "invalid" || status.state === "failed" || status.state === "unknown"
  const compactInline = compact && view === "inline"
  const actions = <div className="flex min-w-0 flex-wrap items-start gap-2">
      {status.state === "unknown" ? status.query ? <FileActionButton label="查询原请求" name={item.name} action="query"
        reason={unavailable || status.query.disabledReason || (!status.request?.id?.trim() ? "原请求标识未确认，暂不能查询。" : undefined)}
        onClick={() => onAction?.({ ...target, kind: "query", requestId: status.request.id })} />
        : <p className="text-ui-hint">暂未提供原请求查询。</p>
        : status.state !== "removed" && <>
          {status.state === "failed" && status.retry && <FileActionButton label="重试上传" name={item.name} action="retry"
            reason={unavailable || status.retry.disabledReason || uploadReason}
            onClick={() => onAction?.({ ...target, kind: "retry", requestId: status.request?.id })} />}
          {(["remove", "replace"] as const).map(kind => (kind !== "remove" || !compactInline) && item.actions?.[kind] && <FileActionButton key={kind}
            label={kind === "remove" ? "移除" : "替换"} name={item.name} action={kind} reason={unavailable || item.actions[kind].disabledReason}
            onClick={() => onAction?.({ ...target, kind })} />)}
          {view === "workspace" && item.actions?.move && (["up", "down"] as const).map(direction => {
            const adjacent = items[index + (direction === "up" ? -1 : 1)]
            const reason = unavailable || item.actions?.move?.disabledReason || (groupBy === "status" ? "请切回文件顺序后调整。" : !adjacent ? direction === "up" ? "已是第一项。" : "已是最后一项。"
              : adjacent.status.state === "unknown" ? "相邻文件状态未确认，请先查询原请求。" : undefined)
            return <FileActionButton key={direction} label={direction === "up" ? "上移" : "下移"} name={item.name} action={`move-${direction}`} reason={reason}
              onClick={() => { if (adjacent) onAction?.({ ...target, kind: "move", direction, adjacentId: adjacent.id }) }}>{direction === "up" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}</FileActionButton>
          })}
        </>}
    </div>
  if (compactInline) {
    const name = item.name || "名称未确认"
    const reason = "reason" in status ? status.reason : undefined
    const removeReason = unavailable || item.actions?.remove?.disabledReason
    const removable = status.state !== "unknown" && status.state !== "removed" && item.actions?.remove
    return <li data-file-id={item.id} data-file-state={status.state} className="min-w-0">
      <Collapsible defaultOpen={false}>
        <div data-file-compact-row="" className="flex min-w-0 items-center gap-1">
          <CollapsibleTrigger aria-controls={`${id}-details`} render={<Button type="button" size="sm" variant="ghost" className="min-w-0 flex-1 justify-start"
            title={name} aria-label={`${reason ? "查看原因与文件详情" : "文件详情"}：${name}${reason ? `；${reason}` : ""}${removable && removeReason ? `；不可移除：${removeReason}` : ""}`} />}>
            <span className="min-w-0 truncate">{name}</span><ChevronDown aria-hidden="true" />
          </CollapsibleTrigger>
          <Badge className="shrink-0" variant={attention ? "warning" : "secondary"}>{status.state === "selected" ? item.source.kind === "local" ? "已选择（仅本机）" : "已选择（已有资料）" : statusLabels[status.state] ?? "状态未确认"}</Badge>
          {removable && <Button type="button" size="icon-sm" variant="ghost" aria-label={`移除：${name}`}
            disabled={!!removeReason} aria-describedby={removeReason ? `${id}-remove-reason` : undefined} data-file-action="remove"
            onClick={() => { if (!removeReason) onAction?.({ ...target, kind: "remove" }) }}><X aria-hidden="true" /></Button>}
        </div>
        <CollapsiblePanel id={`${id}-details`} keepMounted className="motion-reduce:transition-none">
          <div className="min-w-0 space-y-2 pt-2">
            <p className="break-words text-ui-hint [overflow-wrap:anywhere]">{name}</p>
            <p className="break-words text-ui-hint">{item.type || "类型未确认"} · {fileSize(item.sizeBytes)} · {item.source.kind === "local" ? "本机" : "已有资料"}{item.source.label && ` · ${item.source.label}`}</p>
            {status.state === "invalid" && <p className="break-words text-ui-hint">{validationLabels[status.validation]}：{status.reason}</p>}
            {(status.state === "failed" || status.state === "unknown") && <p className="break-words text-ui-hint">{status.reason}</p>}
            {request && <p className="break-words text-ui-hint">原请求：{request.label || "名称未确认"} · {request.id || "标识未确认"}</p>}
            {status.state === "uploading" && (progress === undefined ? <p className="text-ui-hint">进度未确认</p> : <div className="space-y-2">
              <p className="text-ui-hint tabular-nums">上传进度 {progress}%</p>
              <Progress value={progress} aria-label={`${item.name}上传进度`}><ProgressTrack><ProgressIndicator className="motion-reduce:transition-none" /></ProgressTrack></Progress>
            </div>)}
            {status.state === "uploaded" && <p className="break-words text-ui-hint">版本：{item.version || "未确认"} · 上传时间：{status.uploadedAt || "未确认"}</p>}
            {item.processing && <p className="break-words text-ui-hint">后续处理：{item.processing.label}{item.processing.description && ` · ${item.processing.description}`}</p>}
            {removable && removeReason && <p id={`${id}-remove-reason`} className="break-words text-ui-hint">不可移除：{removeReason}</p>}
            {actions}
            {item.details}
          </div>
        </CollapsiblePanel>
      </Collapsible>
    </li>
  }
  return <li data-file-id={item.id} data-file-state={status.state} className={`min-w-0 ${compact ? "space-y-2" : "space-y-3"}`}>
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
      <h4 id={`${id}-name`} className="min-w-0 break-words text-item-title [overflow-wrap:anywhere]">{item.name || "名称未确认"}</h4>
      <Badge variant={attention ? "warning" : "secondary"}>{status.state === "selected" ? item.source.kind === "local" ? "已选择（仅本机）" : "已选择（已有资料）" : statusLabels[status.state] ?? "状态未确认"}</Badge>
    </div>
    <p className="break-words text-ui-hint">{item.type || "类型未确认"} · {fileSize(item.sizeBytes)} · {item.source.kind === "local" ? "本机" : "已有资料"}{item.source.label && ` · ${item.source.label}`}</p>
    {status.state === "invalid" && <p className="break-words text-ui-hint">{validationLabels[status.validation]}：{status.reason}</p>}
    {(status.state === "failed" || status.state === "unknown") && <p className="break-words text-ui-hint">{status.reason}</p>}
    {request && <p className="break-words text-ui-hint">原请求：{request.label || "名称未确认"} · {request.id || "标识未确认"}</p>}
    {status.state === "uploading" && (progress === undefined ? <p className="text-ui-hint">进度未确认</p> : <div className="space-y-2">
      <p className="text-ui-hint tabular-nums">上传进度 {progress}%</p>
      <Progress value={progress} aria-label={`${item.name}上传进度`}><ProgressTrack><ProgressIndicator className="motion-reduce:transition-none" /></ProgressTrack></Progress>
    </div>)}
    {status.state === "uploaded" && <p className="break-words text-ui-hint">版本：{item.version || "未确认"} · 上传时间：{status.uploadedAt || "未确认"}</p>}
    {item.processing && <p className="break-words text-ui-hint">后续处理：{item.processing.label}{item.processing.description && ` · ${item.processing.description}`}</p>}
    {actions}
    {view === "workspace" && <Collapsible defaultOpen={false}>
      <CollapsibleTrigger render={<Button type="button" size="navigation" variant="ghost" aria-label={`文件详情：${item.name}`} />}><ChevronDown aria-hidden="true" />文件详情</CollapsibleTrigger>
      <CollapsiblePanel className="motion-reduce:transition-none"><div className="min-w-0 space-y-3 pt-3 text-ui-hint">
        <p className="break-words">文件：{item.id || "标识未确认"} · 版本：{item.version || "未确认"}</p>
        {item.details}
        {item.preview ?? <p>暂未提供预览。</p>}
      </div></CollapsiblePanel>
    </Collapsible>}
  </li>
}

function FileBatchButton({ action, items, upload, onBatchAction }: {
  action: AgentFileBatchAction; items: readonly AgentFileItem[]; upload: AgentFileCapability; onBatchAction?: AgentFileInputProps["onBatchAction"]
}) {
  const targets = action.fileIds.map(id => items.find(item => item.id === id))
  const reason = action.disabledReason || (!onBatchAction ? "此操作暂不可用。" : !action.id.trim() ? "操作标识未确认。"
    : !targets.length || targets.some(item => !item) ? "操作范围未确认。"
      : new Set(action.fileIds).size !== action.fileIds.length ? "操作范围包含重复文件。"
        : targets.some(item => item?.status.state === "unknown") ? "包含状态未确认的文件，请先查询原请求。"
          : targets.some(item => item?.status.state === "removed") ? "操作范围包含已移除文件。"
            : action.kind !== "remove" && upload.status === "unsupported" ? `上传未接入：${upload.reason}`
              : action.kind === "upload" && targets.some(item => item?.status.state !== "selected" && item?.status.state !== "queued") ? "仅能上传已选择或等待上传的文件。"
                : action.kind === "retry" && targets.some(item => item?.status.state !== "failed") ? "仅能重试已确认上传失败的文件。"
                  : action.kind === "retry" && targets.some(item => item?.status.state === "failed" && (!item.status.retry || item.status.retry.disabledReason)) ? "部分文件暂不可重试，请查看对应文件说明。"
                    : action.kind === "remove" && targets.some(item => item?.actions?.remove?.disabledReason) ? "部分文件暂不可移除，请查看对应文件说明。" : undefined)
  return <FileActionButton label={action.label} name={`${action.fileIds.length} 个文件`} action={`batch-${action.id}`} reason={reason}
    onClick={() => onBatchAction?.({ id: action.id, kind: action.kind, fileIds: [...action.fileIds] })} />
}

/** Semantic 04. The host owns validation, the queue, upload requests and every execution fact. */
export function AgentFileInput({ title, items, limits, capabilities, onSelect, selectionDisabledReason, onAction,
  view = "inline", density = "default", inlineLimit = 3, onExpand, groupBy = "none", onGroupByChange,
  batchActions = [], onBatchAction, onBack, notice, details,
}: AgentFileInputProps) {
  const id = useId()
  const compact = density === "compact"
  const compactInline = compact && view === "inline"
  const selectionReason = selectionDisabledReason || (capabilities.select?.status !== "supported" || !onSelect ? "文件选择暂不可用。" : undefined)
  const canDrop = !selectionReason && (capabilities.drop.status === "supported" || capabilities.drop.status === "limited")
  const limit = Number.isFinite(inlineLimit) ? Math.max(1, Math.floor(inlineLimit)) : 3
  const visible = view === "inline" && onExpand ? items.filter((item, index) => index < limit || ["invalid", "failed", "unknown"].includes(item.status.state)) : items
  const groups = view === "workspace" && groupBy === "status"
    ? Object.entries(statusLabels).map(([state, label]) => ({ label, items: visible.filter(item => item.status.state === state) })).filter(group => group.items.length)
    : [{ label: "文件顺序", items: visible }]

  function select(files: File[]) {
    if (!selectionReason && files.length) onSelect(files)
  }

  return <Card aria-labelledby={`${id}-title`} data-agent-file-view={view} data-density={density}
    className={`@container min-w-0 w-full ${compact ? "gap-3 p-4" : "gap-5 p-5"}`}>
    <header className={compactInline ? "flex min-w-0 items-center justify-between gap-2" : "min-w-0 space-y-2"}>
      <h3 id={`${id}-title`} className="break-words text-block-title">{title}</h3>
      <p className={compactInline ? "shrink-0 text-ui-hint" : "text-ui-hint"}>共 {items.length} 项{visible.length < items.length && ` · 当前显示 ${visible.length} 项`}</p>
      {!compactInline && <p id={`${id}-capabilities`} className="break-words text-ui-hint">选择：{capabilities.select.status === "supported" ? "支持" : "未确认"}{capabilities.select.reason && ` · ${capabilities.select.reason}`}；上传：{capabilityLabels[capabilities.upload.status]}{capabilities.upload.reason && ` · ${capabilities.upload.reason}`}</p>}
    </header>
    <section aria-label="文件选择与拖放" data-file-drop={canDrop ? "enabled" : "disabled"} className="min-w-0 space-y-2"
      onDragOver={event => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = canDrop ? "copy" : "none" } }}
      onDrop={event => { event.preventDefault(); event.stopPropagation(); if (canDrop) select(Array.from(event.dataTransfer.files)) }}>
      <Field className={compactInline ? "w-full flex-row items-center gap-2" : "w-full"}><FieldLabel className={compactInline ? "shrink-0" : undefined} htmlFor={`${id}-input`}>选择文件</FieldLabel>
        <Input nativeInput size={compactInline ? "sm" : "default"} className={compactInline ? "min-w-0 flex-1" : undefined} id={`${id}-input`} type="file" accept={limits.accept} multiple={limits.maxFiles > 1} disabled={!!selectionReason}
          aria-describedby={`${id}-limits ${id}-capabilities ${id}-drop${selectionReason ? ` ${id}-disabled` : ""}`}
          onChange={event => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; select(files) }} />
      </Field>
      {compactInline ? <Collapsible defaultOpen={false}>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p id={selectionReason ? `${id}-disabled` : undefined} className="break-words text-ui-hint">{selectionReason || (capabilities.upload.status === "unsupported" ? "上传未接入" : `上传${capabilityLabels[capabilities.upload.status]}`)}</p>
          <CollapsibleTrigger render={<Button type="button" size="sm" variant="ghost" />}><ChevronDown aria-hidden="true" />说明</CollapsibleTrigger>
        </div>
        <CollapsiblePanel keepMounted className="motion-reduce:transition-none"><div className="min-w-0 space-y-2 pt-2 text-ui-hint">
          <p id={`${id}-capabilities`} className="break-words">选择：{capabilities.select.status === "supported" ? "支持" : "未确认"}{capabilities.select.reason && ` · ${capabilities.select.reason}`}；上传：{capabilityLabels[capabilities.upload.status]}{capabilities.upload.reason && ` · ${capabilities.upload.reason}`}</p>
          <p id={`${id}-limits`} className="break-words text-ui-hint">{limits.acceptLabel} · 单个文件不超过 {fileSize(limits.maxFileSize)} · 最多 {limits.maxFiles} 个文件</p>
          <p id={`${id}-drop`} className="break-words text-ui-hint">{canDrop ? "可拖入此处，也可选择文件。" : "请使用“选择文件”。"}{capabilities.drop.reason && ` ${capabilities.drop.reason}`}</p>
          {notice && <p className="break-words">{notice}</p>}
          {details}
        </div></CollapsiblePanel>
      </Collapsible> : <p id={`${id}-limits`} className="break-words text-ui-hint">{limits.acceptLabel} · 单个文件不超过 {fileSize(limits.maxFileSize)} · 最多 {limits.maxFiles} 个文件</p>}
      {!compactInline && <p id={`${id}-drop`} className="break-words text-ui-hint">{canDrop ? "可拖入此处，也可选择文件。" : "请使用“选择文件”。"}{capabilities.drop.reason && ` ${capabilities.drop.reason}`}</p>}
      {!compactInline && selectionReason && <p id={`${id}-disabled`} className="break-words text-ui-hint">{selectionReason}</p>}
    </section>
    {view === "workspace" && <div className="min-w-0 space-y-3">
      {onGroupByChange && <div aria-label="文件排列方式" className="flex flex-wrap gap-2">{(["none", "status"] as const).map(value => <Button key={value} type="button" size="navigation"
        variant="outline" aria-pressed={groupBy === value} onClick={() => onGroupByChange(value)}>{value === "none" ? "文件顺序" : "按状态分组"}</Button>)}</div>}
      {!!batchActions.length && <section aria-label="批量操作" className="min-w-0 space-y-2"><h4 className="text-ui-action">批量操作</h4>
        <div className="flex min-w-0 flex-wrap items-start gap-3">{batchActions.filter(action => ["remove", "upload", "retry"].includes(action.kind)).map(action => <FileBatchButton key={action.id} action={action} items={items} upload={capabilities.upload} onBatchAction={onBatchAction} />)}</div>
      </section>}
    </div>}
    {items.length ? groups.map(group => <section key={group.label} aria-label={group.label} className="min-w-0 space-y-3">
      {view === "workspace" && groupBy === "status" && <h4 className="text-ui-action">{group.label} · {group.items.length} 项</h4>}
      <ol className={compactInline ? "min-w-0 space-y-1" : compact ? "min-w-0 space-y-4" : "min-w-0 space-y-6"}>{group.items.map(item => <FileRow key={item.id} item={item} items={items} view={view} compact={compact} groupBy={groupBy} upload={capabilities.upload} onAction={onAction} />)}</ol>
    </section>) : <p className="text-ui-hint text-muted-foreground">尚未选择文件。</p>}
    {!compactInline && notice && <p className="break-words text-ui-hint text-muted-foreground">{notice}</p>}
    <RecordDetails>{compactInline ? undefined : details}</RecordDetails>
    {view === "inline" && items.length > limit && onExpand && <div><Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>管理全部（{items.length}）<ArrowUpRight aria-hidden="true" /></Button></div>}
    {view === "workspace" && onBack && <div><Button type="button" size="navigation" variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button></div>}
  </Card>
}
