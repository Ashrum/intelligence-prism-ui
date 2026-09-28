"use client"

import { useId, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Badge } from "./badge"
import { Button } from "./button"
import { FilterBar, type FilterField } from "./data-display"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"
import type { AgentContextFact } from "./agent-context-summary"

export type AgentResourceSource = { id: string | null; label: string | null; location?: string | null }
export type AgentResourceLicense = { name: string | null } & (
  | { state: "available" }
  | { state: "restricted"; reason: string }
  | { state: "confirmation-required" | "unknown"; reason?: string }
)
export type AgentResourceActionType = "preview" | "read" | "unread" | "open-source" | "request-permission"
export type AgentResourceAction = { disabledReason?: string }
export type AgentResource = {
  id: string
  /** Opaque version is used only in requests; versionLabel is the readable value. */
  version: string | null
  title: string
  kind: "image" | "video" | "article" | "audio" | "lesson" | "textbook-page" | "other"
  summary?: ReactNode
  source: AgentResourceSource
  license: AgentResourceLicense
  versionLabel: string | null
  date: string | null
  applicability: string | null
  format: string | null
  duration: string | null
  size: string | null
  /** Independent, externally verified records, never a locally advanced progress chain. */
  facts: Record<"hit" | "preview" | "read" | "context" | "citation", AgentContextFact>
  /** Presence declares capability, including permission requests. License never grants it. */
  actions?: Partial<Record<AgentResourceActionType, AgentResourceAction>>
}
export type AgentResourceResult =
  | { state: "ready" }
  | { state: "loading"; message?: string }
  | { state: "empty" | "error"; message: string }
export type AgentResourcePage = {
  total: number | null
  label?: string
  more?: { cursor: string | null; state: "ready" | "loading" | "error"; message?: string; disabledReason?: string }
}
export type AgentResourcePreview = {
  resourceId: string
  resourceVersion: string | null
  /** The page may activate media only after an explicit user preview request. */
  requestedBy: "user"
  state: "loading" | "ready" | "error"
  message?: string
}
export type AgentResourceIntent = { resourceSetId: string; baseVersion: string } & (
  | { type: "query"; value: string }
  | { type: "filter"; value: Readonly<Record<string, string>> }
  | { type: "sort"; value: string }
  | { type: "load-more"; cursor: string | null }
  | { type: AgentResourceActionType; resourceId: string; resourceVersion: string | null; sourceId: string | null }
)
export type AgentResourceRetrieverProps = AgentRecordViewProps & {
  title: string
  resourceSet: { id: string; version: string }
  /** Exact authorized result list, including the inline shortlist. No local filtering/slicing. */
  resources: readonly AgentResource[]
  query: { value: string; label?: string; disabledReason?: string }
  scope: ReactNode
  filters?: { fields: FilterField[]; value: Record<string, string>; disabledReason?: string }
  sort?: { label: string; options: FilterField["options"]; value: string; description?: string; disabledReason?: string }
  result: AgentResourceResult
  page: AgentResourcePage
  sourceFailures?: readonly { source: AgentResourceSource; message: string }[]
  preview?: AgentResourcePreview | null
  renderPreview?: (resource: AgentResource, context: { view: "inline" | "workspace"; density: "default" | "compact" }) => ReactNode
  disabledReason?: string
  onIntent?: (intent: AgentResourceIntent) => void
  onBack?: () => void
  notice?: string
}

const known = (value: string | null | undefined) => value?.trim() ? value : "未知"
const kinds = { image: "图片", video: "视频", article: "文章", audio: "音频", lesson: "课例", "textbook-page": "教材页", other: "其他资源" }
const licenses = { available: "可用", restricted: "受限", "confirmation-required": "需确认", unknown: "未知" }
const actionLabels: Record<AgentResourceActionType, string> = {
  preview: "预览", read: "读取并引用到上下文", unread: "移出本次上下文", "open-source": "打开来源", "request-permission": "申请许可",
}
const channels = [
  { key: "hit", label: "命中", yes: "已命中", no: "未命中" },
  { key: "preview", label: "预览", yes: "已预览", no: "未预览" },
  { key: "read", label: "读取", yes: "已读取", no: "未读取" },
  { key: "context", label: "Agent 本次参考", yes: "已参考", no: "未参考" },
  { key: "citation", label: "成果引用", yes: "已引用", no: "未引用" },
] as const
const licenseReason = (license: AgentResourceLicense) => license.state === "available" ? undefined
  : license.state === "restricted" ? license.reason || "使用限制未说明。" : license.reason
const sourceText = (source: AgentResourceSource) => [known(source.label), source.location].filter(Boolean).join(" · ")

/** Strict metadata identity only; shared prose does not merge resource identities or permissions. */
function sharedFacts(resources: readonly AgentResource[], field: "source" | "license") {
  const groups = new Map<string, { indexes: number[]; id: number }>()
  resources.forEach((resource, index) => {
    const key = field === "source"
      ? JSON.stringify([resource.source.id, resource.source.label, resource.source.location ?? null])
      : JSON.stringify([resource.license.state, resource.license.name, licenseReason(resource.license) ?? null])
    const group = groups.get(key)
    if (group) group.indexes.push(index)
    else groups.set(key, { indexes: [index], id: groups.size })
  })
  return [...groups.values()].filter(group => group.indexes.length > 1)
}

function ResourceFacts({ facts }: { facts: AgentResource["facts"] }) {
  return <dl className="flex min-w-0 flex-wrap gap-x-5 gap-y-2">{channels.map(channel => {
    const fact = facts[channel.key]
    const state = fact?.state === "confirmed" ? channel.yes : fact?.state === "absent" ? channel.no : fact?.state === "unavailable" ? "记录暂不可用" : "状态未确认"
    return <div key={channel.key} className="min-w-0 text-ui-hint">
      <dt className="inline text-muted-foreground">{channel.label}：</dt><dd className="inline break-words">{state}{fact?.description && ` · ${fact.description}`}
        {(fact?.version || fact?.location) && <span className="block break-words">{[fact.version, fact.location].filter(Boolean).join(" · ")}</span>}
      </dd>
    </div>
  })}</dl>
}

function ResourceLicense({ license }: { license: AgentResourceLicense }) {
  return <>{licenses[license.state] ?? "未知"}{license.name && ` · ${license.name}`}{licenseReason(license) && ` · ${licenseReason(license)}`}</>
}

/** One explanation beside each set of affected controls, with shared metadata referenced by ID. */
function ResourceActions({ resource, reason, reasonId, licenseId, onAction }: {
  resource: AgentResource; reason?: string; reasonId?: string; licenseId: string; onAction: (type: AgentResourceActionType) => void
}) {
  const id = useId()
  const groups = new Map<string | undefined, AgentResourceActionType[]>()
  for (const type of Object.keys(actionLabels) as AgentResourceActionType[]) {
    const action = resource.actions?.[type]
    if (!action) continue
    const block = reason ?? (action.disabledReason !== undefined ? action.disabledReason || "当前不可操作。" : undefined)
    groups.set(block, [...(groups.get(block) ?? []), type])
  }
  return <div className="flex min-w-0 flex-wrap items-start gap-3">{[...groups].map(([block, types], index) => {
    const existingId = block !== undefined && block === reason ? reasonId
      : block !== undefined && block === licenseReason(resource.license) ? licenseId : undefined
    const descriptionId = block !== undefined ? existingId ?? `${id}-${index}` : undefined
    return <div key={index} className="min-w-0 space-y-1" role="group" aria-label={types.map(type => actionLabels[type]).join("、")}>
      <div className="flex flex-wrap gap-2">{types.map(type => <Button key={type} type="button" size="navigation" variant={type === "read" ? "default" : "outline"}
        className="max-w-full whitespace-normal" disabled={block !== undefined} aria-describedby={descriptionId}
        onClick={() => { if (block === undefined) onAction(type) }}>{actionLabels[type]}</Button>)}</div>
      {block !== undefined && !existingId && <p id={descriptionId} className="break-words text-ui-hint">{block}</p>}
    </div>
  })}</div>
}

/** FilterBar remains the primitive; opaque field and option values stay outside the DOM. */
function ResourceFilters({ fields, value, onChange, reason, reasonId }: {
  fields: FilterField[]; value: Record<string, string>; onChange: (value: Record<string, string>) => void; reason?: string; reasonId?: string
}) {
  const id = useId()
  const invalid = new Set(fields.map(field => field.id)).size !== fields.length || fields.some(field => !field.id.trim() || new Set(field.options.map(option => option.value)).size !== field.options.length)
  const block = reason ?? (invalid ? "筛选选项信息未确认。" : undefined)
  const localFields = fields.map((field, index) => ({ id: String(index), label: field.label, options: [
    ...(field.options.some(option => option.value === value[field.id]) ? [] : [{ value: "", label: value[field.id] ? "当前选项未列出" : "未指定" }]),
    ...field.options.map((option, optionIndex) => ({ value: String(optionIndex), label: option.label })),
  ] }))
  const localValue = Object.fromEntries(fields.map((field, index) => {
    const selected = field.options.findIndex(option => option.value === value[field.id])
    return [String(index), selected < 0 ? "" : String(selected)]
  }))
  return <div className="min-w-0 space-y-1" role="group" aria-label={fields.map(field => field.label).join("、")} aria-describedby={block !== undefined ? reasonId ?? id : undefined}>
    {block === undefined ? <FilterBar fields={localFields} value={localValue} onChange={next => {
      if (block !== undefined) return
      const changed = Object.entries(next).filter(([key, entry]) => entry !== localValue[key])
      if (changed.length !== 1) return
      const [key, entry] = changed[0], field = fields.find((_, index) => String(index) === key)
      const option = field?.options.find((_, index) => String(index) === entry)
      if (field && option) onChange({ ...value, [field.id]: option.value })
    }} /> : <dl className="flex flex-wrap gap-3">{fields.map((field, index) => <div key={index} className="min-w-0 text-ui-body"><dt>{field.label}</dt><dd className="break-words">{field.options.find(option => option.value === value[field.id])?.label ?? (value[field.id] ? "当前选项未列出" : "未指定")}</dd></div>)}</dl>}
    {block !== undefined && !reasonId && <p id={id} className="break-words text-ui-hint">{block}</p>}
  </div>
}

export function AgentResourceRetriever({ title, resourceSet, resources, query, scope, filters, sort, result, page, sourceFailures = [],
  preview, renderPreview, disabledReason, onIntent, onExpand, onBack, notice, details, view = "inline", density = "default" }: AgentResourceRetrieverProps) {
  const id = useId(), workspace = view === "workspace", compact = density === "compact"
  const channelReason = disabledReason !== undefined ? disabledReason || "当前仅可查看资源。"
    : !resourceSet.id.trim() || !resourceSet.version.trim() ? "检索记录版本未确认。" : !onIntent ? "当前仅可查看资源。" : undefined
  const envelope = { resourceSetId: resourceSet.id, baseVersion: resourceSet.version }
  const emit = (intent: AgentResourceIntent) => { if (channelReason === undefined) onIntent?.(intent) }
  const visible = result.state === "ready" ? resources : []
  const sourceGroups = sharedFacts(visible, "source"), licenseGroups = sharedFacts(visible, "license")
  const counts = new Map<string, number>()
  for (const resource of visible) counts.set(resource.id, (counts.get(resource.id) ?? 0) + 1)
  const identityReason = (resource: AgentResource) => !resource.id.trim() || counts.get(resource.id) !== 1 ? "资源身份未确认。" : undefined
  const actionReason = (resource: AgentResource, type: AgentResourceActionType) => channelReason ?? identityReason(resource)
    ?? (resource.actions?.[type] ? resource.actions[type]?.disabledReason : "未提供此操作。")
  const act = (resource: AgentResource, type: AgentResourceActionType) => {
    if (result.state !== "ready" || actionReason(resource, type) !== undefined) return
    emit({ ...envelope, type, resourceId: resource.id, resourceVersion: resource.version, sourceId: resource.source.id })
  }
  const queryReason = channelReason ?? (query.disabledReason !== undefined ? query.disabledReason || "当前不可修改检索词。" : undefined)
  const moreReason = channelReason ?? (page.more?.disabledReason !== undefined ? page.more.disabledReason || "当前不可加载更多。" : undefined)
    ?? (page.more?.state === "loading" ? "正在加载更多…" : result.state !== "ready" ? "请等待当前检索恢复。" : undefined)
  const total = Number.isInteger(page.total) && page.total !== null && page.total >= 0 ? `总数 ${page.total} 项` : "总数未知"
  const previewTarget = preview && visible.find(resource => resource.id === preview.resourceId && resource.version === preview.resourceVersion)
  const validPreview = preview?.requestedBy === "user" && previewTarget && actionReason(previewTarget, "preview") === undefined
  const resultMessage = result.state === "loading" ? result.message || "正在检索资源…" : result.state === "error" ? `检索失败：${result.message}` : result.state === "empty" ? result.message : undefined

  return <Card aria-labelledby={`${id}-title`} data-resource-retriever-view={view} data-resource-retriever-density={density} className={`@container min-w-0 ${compact ? "gap-3 p-3" : "gap-5 p-4"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h3 id={`${id}-title`} className="min-w-0 break-words text-block-title">{title}</h3>
      {workspace ? onBack && <Button type="button" size="navigation" variant="ghost" onClick={onBack}>返回原位置</Button>
        : onExpand && <Button type="button" size="navigation" variant="outline" onClick={event => onExpand(event.currentTarget)}>展开检索与来源</Button>}
    </div>
    <div className="min-w-0 space-y-2">
      <div className="break-words text-ui-hint"><span className="text-muted-foreground">检索范围：</span>{scope ?? "未知"}</div>
      {channelReason !== undefined && <p id={`${id}-channel`} className="break-words text-ui-hint">{channelReason}</p>}
      {workspace ? <div className="min-w-0 space-y-2"><Label htmlFor={`${id}-query`}>{query.label || "检索资源"}</Label>
        <Input id={`${id}-query`} value={query.value} readOnly={queryReason !== undefined} aria-describedby={queryReason !== undefined ? channelReason !== undefined ? `${id}-channel` : `${id}-query-reason` : undefined}
          onChange={event => { if (queryReason === undefined) emit({ ...envelope, type: "query", value: event.currentTarget.value }) }} />
        {queryReason !== undefined && channelReason === undefined && <p id={`${id}-query-reason`} className="break-words text-ui-hint">{queryReason}</p>}
      </div> : <p className="break-words text-ui-hint">检索词：{query.value || "未指定"}</p>}
      {workspace && filters && <ResourceFilters fields={filters.fields} value={filters.value} reason={channelReason ?? (filters.disabledReason !== undefined ? filters.disabledReason || "当前不可筛选。" : undefined)} reasonId={channelReason !== undefined ? `${id}-channel` : undefined}
        onChange={value => emit({ ...envelope, type: "filter", value })} />}
      {workspace && sort && <div className="space-y-1"><ResourceFilters fields={[{ id: "sort", label: sort.label, options: sort.options }]} value={{ sort: sort.value }}
        reason={channelReason ?? (sort.disabledReason !== undefined ? sort.disabledReason || "当前不可排序。" : undefined)} reasonId={channelReason !== undefined ? `${id}-channel` : undefined}
        onChange={value => emit({ ...envelope, type: "sort", value: value.sort })} />
        {sort.description && <p className="break-words text-ui-hint">{sort.description}</p>}
      </div>}
    </div>
    <p className="break-words text-ui-hint">{notice ?? "命中、预览、读取、Agent 本次参考与成果引用分别记录。"}</p>
    <p className="break-words text-ui-hint" role="status">当前显示 {visible.length} 项 · {total}{page.label && ` · ${page.label}`}</p>
    {resultMessage && <p role={result.state === "error" ? "alert" : "status"} className="break-words text-ui-hint">{resultMessage}</p>}
    {!!sourceFailures.length && <section aria-label="部分来源失败" className="space-y-2"><h4 className="text-item-title">部分来源失败</h4>
      <ul className="space-y-1">{sourceFailures.map((failure, index) => <li key={index} className="break-words text-ui-hint">{sourceText(failure.source)}：{failure.message}</li>)}</ul>
    </section>}
    {(sourceGroups.length > 0 || licenseGroups.length > 0) && <section aria-label="共用来源与许可" className="space-y-2">
      {sourceGroups.map(group => <p key={`source-${group.id}`} id={`${id}-source-${group.id}`} className="break-words text-ui-hint">来源 {group.id + 1}（资源 {group.indexes.map(index => index + 1).join("、")}）：{sourceText(visible[group.indexes[0]].source)}</p>)}
      {licenseGroups.map(group => <p key={`license-${group.id}`} id={`${id}-license-${group.id}`} className="break-words text-ui-hint">许可{group.indexes.length < visible.length && `（${group.indexes.map(index => visible[index].title || "未命名资源").join("、")}）`}：<ResourceLicense license={visible[group.indexes[0]].license} /></p>)}
    </section>}
    {result.state === "ready" && !visible.length && <p className="text-ui-hint">当前没有展示资源。</p>}
    {!!visible.length && <ol aria-label="资源结果" className={compact ? "min-w-0 space-y-4" : "min-w-0 space-y-6"}>{visible.map((resource, index) => {
      const sourceGroup = sourceGroups.find(group => group.indexes.includes(index)), licenseGroup = licenseGroups.find(group => group.indexes.includes(index))
      const licenseId = licenseGroup ? `${id}-license-${licenseGroup.id}` : `${id}-item-license-${index}`
      const rowReason = channelReason ?? identityReason(resource)
      const rowReasonId = channelReason !== undefined ? `${id}-channel` : rowReason !== undefined ? `${id}-identity-${index}` : undefined
      // Preserve named licenses and restriction reasons even when their state is unknown.
      const mergeLicense = !licenseGroup && resource.license.state === "unknown" && !resource.license.name && !licenseReason(resource.license)
      const metadata = [["版本", resource.versionLabel], ["日期", resource.date], ["适用范围", resource.applicability], ["格式", resource.format], ["时长", resource.duration], ["大小", resource.size]]
      const unknownLabels = [...(mergeLicense ? ["许可"] : []), ...metadata.filter(([, value]) => known(value) === "未知").map(([label]) => label)]
      return <li key={index} aria-labelledby={`${id}-item-${index}`} aria-describedby={licenseId} className={`min-w-0 ${compact ? "space-y-2" : "space-y-3"}`}>
        <div className="flex flex-wrap items-baseline gap-2"><h4 id={`${id}-item-${index}`} className="min-w-0 break-words text-item-title">{index + 1}. {resource.title || "未命名资源"}</h4><Badge variant="outline">{kinds[resource.kind] ?? "其他资源"}</Badge></div>
        {resource.summary != null && <div className="min-w-0 break-words text-read-body">{resource.summary}</div>}
        <div className="min-w-0 space-y-1 text-ui-hint">
          {sourceGroup ? <p aria-describedby={`${id}-source-${sourceGroup.id}`}>来源 {sourceGroup.id + 1}</p> : <p className="break-words">来源：{sourceText(resource.source)}</p>}
          {licenseGroup ? licenseGroup.indexes.length < visible.length && <p aria-describedby={licenseId} className="break-words">共用许可：{licenseGroup.indexes.map(i => visible[i].title || "未命名资源").join("、")}</p> : !mergeLicense && <p id={licenseId} className="break-words">许可：<ResourceLicense license={resource.license} /></p>}
          {metadata.filter(([, value]) => known(value) !== "未知").map(([label, value]) => <p key={label} className="break-words">{label}：{value}</p>)}
          {!!unknownLabels.length && <p id={mergeLicense ? licenseId : undefined} className="break-words">{unknownLabels.join("、")}：未知</p>}
        </div>
        <ResourceFacts facts={resource.facts} />
        {rowReason !== undefined && channelReason === undefined && <p id={rowReasonId} className="break-words text-ui-hint">{rowReason}</p>}
        <ResourceActions resource={resource} reason={rowReason} reasonId={rowReasonId} licenseId={licenseId} onAction={type => act(resource, type)} />
        {validPreview && previewTarget === resource && <section aria-label="资源预览" className="min-w-0 space-y-2">
          <h5 className="text-item-title">资源预览</h5>
          {preview?.state === "ready" ? renderPreview ? renderPreview(resource, { view, density }) : <p className="text-ui-hint">暂未提供预览内容。</p>
            : <p role={preview?.state === "error" ? "alert" : "status"} className="break-words text-ui-hint">{preview?.state === "error" ? `预览失败：${preview.message || "内容暂不可用。"}` : preview?.message || "正在加载预览…"}</p>}
        </section>}
      </li>
    })}</ol>}
    {preview && !validPreview && <p className="text-ui-hint">预览对应的资源、版本或可用能力已变化，请重新选择。</p>}
    {page.more && <div className="space-y-1"><Button type="button" size="navigation" variant="outline" disabled={moreReason !== undefined}
      aria-describedby={moreReason !== undefined ? channelReason !== undefined ? `${id}-channel` : `${id}-more-reason` : undefined}
      onClick={() => { if (moreReason === undefined && page.more) emit({ ...envelope, type: "load-more", cursor: page.more.cursor }) }}>{page.more.state === "error" ? "重试加载更多" : "加载更多"}</Button>
      {moreReason !== undefined && channelReason === undefined && <p id={`${id}-more-reason`} className="text-ui-hint">{moreReason}</p>}
      {page.more.message && page.more.message !== moreReason && <p role="status" className="break-words text-ui-hint">{page.more.message}</p>}
    </div>}
    <RecordDetails>{details}</RecordDetails>
  </Card>
}
