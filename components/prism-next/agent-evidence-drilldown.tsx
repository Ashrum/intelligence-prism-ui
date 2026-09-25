"use client"

import { Fragment, useId, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/coss/breadcrumb"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { AgentContextList } from "./agent-components"
import { Badge } from "./badge"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

/** Independent host facts, never a progression inferred from UI interaction. */
export type AgentEvidenceFact = (
  | { state: "read"; description: string }
  | { state: "cited"; description: string; version: string; location: string }
  | { state: "not-read" | "not-cited" | "retrieval-only" | "preview-only" | "incomplete" | "unavailable" | "unknown"; description?: string }
) & { version?: string; location?: string }

export type AgentEvidenceCoverage = { state: "complete" | "incomplete" | "unavailable" | "unknown"; description?: string }
export type AgentEvidencePath = readonly string[]
export type AgentEvidenceSource = {
  objectId: string
  label: string
  version?: string
  location: string
  /** A host-supplied historical label; version always comes from this source. */
  snapshot?: string
}
export type AgentEvidenceConclusion = {
  id: string
  statement: string
  version?: string
  snapshot?: string
  summary?: string
  evidenceCount?: number
  coverage?: AgentEvidenceCoverage
}
export type AgentEvidenceItem = {
  kind: "evidence"
  access?: "available"
  id: string
  title: string
  type: string
  source: AgentEvidenceSource
  facts: readonly AgentEvidenceFact[]
  relation: "supports" | "counterexample" | "pending"
  summary?: string
  preview?: ReactNode
  previewUnavailableReason?: string
  openable?: boolean
}
export type AgentEvidenceObject = {
  kind: "object"
  access?: "available"
  id: string
  title: string
  type: string
  version?: string
  location?: string
  summary?: string
  children: readonly AgentEvidenceNode[]
  openable?: boolean
}
/** Only explicitly disclosable content belongs in a restricted record. */
export type AgentEvidenceRestrictedNode = {
  id: string
  kind: "object" | "evidence"
  access: "restricted"
  disclosure: { label: string; reason: string }
}
export type AgentEvidenceNode = AgentEvidenceObject | AgentEvidenceItem | AgentEvidenceRestrictedNode
export type AgentEvidenceOpenIntent = { kind: "object" | "evidence"; conclusionId: string; nodeId: string; path: AgentEvidencePath }
export type AgentEvidenceDrilldownProps = AgentRecordViewProps & {
  conclusion: AgentEvidenceConclusion
  nodes: readonly AgentEvidenceNode[]
  /** [] is the conclusion; each ID selects one child at the next level. */
  path?: AgentEvidencePath
  onNavigate?: (path: AgentEvidencePath, trigger: HTMLButtonElement) => void
  onOpen?: (intent: AgentEvidenceOpenIntent, trigger: HTMLButtonElement) => void
  onBack?: () => void
  notice?: string
}

const factLabels: Record<AgentEvidenceFact["state"], string> = {
  read: "已读取", cited: "已引用", "not-read": "未读取", "not-cited": "未引用",
  "retrieval-only": "仅检索命中", "preview-only": "仅预览", incomplete: "记录不完整", unavailable: "记录暂不可用", unknown: "状态未确认",
}
const coverageLabels: Record<AgentEvidenceCoverage["state"], string> = {
  complete: "记录覆盖完整", incomplete: "记录不完整", unavailable: "记录暂不可用", unknown: "覆盖状态未确认",
}
const relationLabels: Record<AgentEvidenceItem["relation"], string> = { supports: "支持", counterexample: "反例", pending: "待核" }
const isUncertain = (fact: AgentEvidenceFact) => fact.state === "incomplete" || fact.state === "unavailable" || fact.state === "unknown"
const labelOf = (node: AgentEvidenceNode) => node.access === "restricted" ? node.disclosure.label : node.title
type Entry = { node: AgentEvidenceNode; path: AgentEvidencePath }
const pathKey = (path: AgentEvidencePath) => JSON.stringify(path)

function sourceLocation(source: AgentEvidenceSource) {
  const version = source.snapshot ? `当时版本：${source.version || "未确认"}` : `来源版本：${source.version || "未确认"}`
  return [source.label, version, source.location, source.snapshot && `历史证据 · ${source.snapshot}`].filter(Boolean).join(" · ")
}

/** Traverse only the host's permitted tree; never enter a restricted branch. */
function evidenceEntries(nodes: readonly AgentEvidenceNode[], parent: AgentEvidencePath = []): Entry[] {
  return nodes.flatMap(node => {
    const path = [...parent, node.id]
    return node.access === "restricted" || node.kind === "evidence" ? [{ node, path }] : evidenceEntries(node.children, path)
  })
}

function EvidenceFacts({ facts }: { facts: readonly AgentEvidenceFact[] }) {
  return facts.length ? <ul aria-label="证据事实" className="space-y-2">{facts.map((fact, index) => <li key={index} data-evidence-fact={fact.state} className="min-w-0 space-y-1">
    <p className="break-words text-ui-body">{factLabels[fact.state]}{fact.description && <> · {fact.description}</>}</p>
    {(fact.version || fact.location) && <p className="break-words text-ui-hint text-muted-foreground">{fact.state === "cited" ? "引用位置：" : "记录定位："}{[fact.version, fact.location].filter(Boolean).join(" · ")}</p>}
  </li>)}</ul> : <p className="text-ui-hint text-muted-foreground">暂无证据事实记录。</p>
}

function EvidenceContent({ item, preview }: { item: AgentEvidenceItem; preview: boolean }) {
  return <div className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center gap-2"><span className="text-ui-hint">与结论的关系</span><Badge variant="outline">{relationLabels[item.relation]}</Badge></div>
    {item.summary && <p className="whitespace-pre-wrap break-words text-read-body">{item.summary}</p>}
    <EvidenceFacts facts={item.facts} />
    {item.previewUnavailableReason ? <p role="status" className="break-words text-ui-hint">{item.previewUnavailableReason}</p>
      : preview && (item.preview != null ? <div aria-label="证据预览" className="min-w-0 break-words">{item.preview}</div> : <p className="text-ui-hint text-muted-foreground">暂未提供证据预览。</p>)}
  </div>
}

function EvidenceRow({ entry, conclusionId, preview, onOpen, onNavigate }: {
  entry: Entry
  conclusionId: string
  preview: boolean
  onOpen?: AgentEvidenceDrilldownProps["onOpen"]
  onNavigate?: AgentEvidenceDrilldownProps["onNavigate"]
}) {
  const { node, path } = entry
  // Runtime guard also ignores content accidentally included by an untyped caller.
  if (node.access === "restricted") return <div data-evidence-restricted="true" className="min-w-0 space-y-2">
    <p className="break-words text-item-title">{node.disclosure.label}</p>
    <p role="status" className="break-words text-ui-hint">访问受限 · {node.disclosure.reason}</p>
  </div>
  return <div className="min-w-0 space-y-3">
    <p className="text-ui-hint text-muted-foreground">{node.type}</p>
    {node.kind === "evidence" ? <EvidenceContent item={node} preview={preview} /> : node.summary && <p className="break-words text-ui-body">{node.summary}</p>}
    <div className="flex flex-wrap gap-2">
      {onNavigate && <Button variant="outline" className="max-w-full whitespace-normal" aria-label={`查看${node.kind === "object" ? "对象证据" : "证据详情"}：${node.title}`} onClick={event => onNavigate([...path], event.currentTarget)}>{node.kind === "object" ? "查看对象证据" : "查看证据详情"}</Button>}
      {onOpen && node.openable && <Button variant="ghost" className="max-w-full whitespace-normal" aria-label={`打开${node.kind === "object" ? "对象" : "证据"}：${node.title}`} onClick={event => onOpen({ kind: node.kind, conclusionId, nodeId: node.id, path: [...path] }, event.currentTarget)}>打开{node.kind === "object" ? "对象" : "证据"}<ArrowUpRight aria-hidden="true" /></Button>}
    </div>
  </div>
}

function EvidenceRows({ entries, label, conclusionId, preview = false, compact, onOpen, onNavigate }: {
  entries: readonly Entry[]
  label: string
  conclusionId: string
  preview?: boolean
  compact: boolean
  onOpen?: AgentEvidenceDrilldownProps["onOpen"]
  onNavigate?: AgentEvidenceDrilldownProps["onNavigate"]
}) {
  const items = entries.map(entry => {
    const { node } = entry
    return {
      id: pathKey(entry.path), title: labelOf(node), inspectable: false,
      location: node.access === "restricted" ? "访问受限" : node.kind === "evidence" ? sourceLocation(node.source) : [node.version || "对象版本未确认", node.location].filter(Boolean).join(" · "),
      status: node.access === "restricted" ? <p role="status" className="break-words text-ui-hint">{node.disclosure.reason}</p> : <EvidenceRow entry={entry} conclusionId={conclusionId} preview={preview} onOpen={onOpen} onNavigate={onNavigate} />,
    }
  })
  return compact ? <section aria-label={label} className="min-w-0 space-y-3"><h4 className="text-block-title">{label}</h4>
    {items.length ? <ul className="space-y-4">{items.map(item => <li key={item.id} className="min-w-0 space-y-2">
      <p className="break-words text-item-title">{item.title}</p><p className="break-words text-ui-hint text-muted-foreground">{item.location}</p>{item.status}
    </li>)}</ul> : <p className="text-ui-hint text-muted-foreground">当前没有证据条目。</p>}
  </section> : <AgentContextList label={label} emptyText="当前没有证据条目。" items={items} />
}

/** Inline + dedicated workspace content; navigation and opening never mutate evidence. */
export function AgentEvidenceDrilldown({ conclusion, nodes, path = [], view = "inline", density = "default", onExpand, onNavigate, onOpen, onBack, notice, details }: AgentEvidenceDrilldownProps) {
  const id = useId(), full = view === "workspace", compact = density === "compact"
  const all = evidenceEntries(nodes)
  const trail: Entry[] = []
  let children = nodes
  for (const nodeId of path) {
    const node = children.find(candidate => candidate.id === nodeId)
    if (!node) break
    trail.push({ node, path: [...path.slice(0, trail.length), nodeId] })
    children = node.access !== "restricted" && node.kind === "object" ? node.children : []
  }
  const valid = trail.length === path.length
  const current = valid ? trail.at(-1) : undefined
  const inline = onExpand ? all.filter(entry => entry.node.access !== "restricted").slice(0, 2) : all
  const shown = !full ? inline : !valid ? [] : current?.node.kind === "evidence" || current?.node.access === "restricted" ? [current] : children.map(node => ({ node, path: [...path, node.id] }))
  const visibleKeys = new Set(shown.map(entry => pathKey(entry.path)))
  // Keep explicit limitations visible even when their evidence lives below another level.
  // This is presentation of supplied facts, never a calculation of record coverage.
  const limits = all.filter(entry => !visibleKeys.has(pathKey(entry.path)) && (entry.node.access === "restricted" || entry.node.kind === "evidence" && (entry.node.facts.some(isUncertain) || entry.node.previewUnavailableReason)))
  const crumbs = [{ label: "结论", path: [] as AgentEvidencePath }, ...trail.map(entry => ({ label: labelOf(entry.node), path: entry.path }))]
  const previous = valid ? path.slice(0, -1) : trail.at(-1)?.path ?? []
  return <Card aria-labelledby={id} data-agent-evidence-view={view} data-agent-evidence-density={density} className={compact ? "@container min-w-0 gap-3 p-4 [overflow-wrap:anywhere]" : "@container min-w-0 gap-5 p-5 sm:p-6 [overflow-wrap:anywhere]"}>
    <header className="min-w-0 space-y-2">
      <p className="text-ui-hint text-muted-foreground">{conclusion.snapshot ? `历史结论 · ${conclusion.snapshot}` : "当前状态"}</p>
      <h3 id={id} className="break-words text-block-title">{conclusion.statement}</h3>
      <p className="break-words text-ui-hint">{conclusion.snapshot ? "当时版本" : "结论版本"}：{conclusion.version || "未确认"}</p>
      {conclusion.summary && <p className="break-words text-ui-body">{conclusion.summary}</p>}
      {conclusion.evidenceCount !== undefined && <p className="text-ui-hint">证据数量：{conclusion.evidenceCount}</p>}
      {conclusion.coverage && <p role="status" className="break-words text-ui-hint">{coverageLabels[conclusion.coverage.state]}{conclusion.coverage.description && <> · {conclusion.coverage.description}</>}</p>}
    </header>
    {notice && <p role="status" className="break-words text-ui-hint text-muted-foreground">{notice}</p>}
    {full && <div className="min-w-0 space-y-3">
      <Breadcrumb aria-label="证据层级"><BreadcrumbList>{crumbs.map((crumb, index) => <Fragment key={pathKey(crumb.path)}>
        {index > 0 && <BreadcrumbSeparator />}
        <BreadcrumbItem className="min-w-0 max-w-full">{valid && index === crumbs.length - 1 ? <BreadcrumbPage className="break-words text-ui-body">{crumb.label}</BreadcrumbPage>
          : onNavigate ? <Button variant="ghost" size="sm" className="h-auto max-w-full whitespace-normal sm:h-auto" aria-label={`返回：${crumb.label}`} onClick={event => onNavigate([...crumb.path], event.currentTarget)}>{crumb.label}</Button> : <span className="break-words text-ui-body">{crumb.label}</span>}</BreadcrumbItem>
      </Fragment>)}{!valid && <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>位置未找到</BreadcrumbPage></BreadcrumbItem></>}</BreadcrumbList></Breadcrumb>
      <div className="flex flex-wrap gap-2">{path.length > 0 && onNavigate && <Button variant="outline" onClick={event => onNavigate([...previous], event.currentTarget)}><ArrowLeft aria-hidden="true" />返回上一层</Button>}{onBack && <Button variant="ghost" onClick={onBack}>返回原位置</Button>}</div>
    </div>}
    {full && !valid ? <p role="status" className="text-ui-hint">当前位置未提供，请返回已有层级重新选择。</p> : <>
      {full && current?.node.access !== "restricted" && current?.node.kind === "object" && <section className="min-w-0 space-y-2" aria-label="当前对象">
        <h4 className="break-words text-item-title">{current.node.title}</h4>
        <p className="break-words text-ui-hint">{current.node.version || "对象版本未确认"}{current.node.location && <> · {current.node.location}</>}</p>
        <EvidenceRow entry={current} conclusionId={conclusion.id} preview={false} onOpen={onOpen} />
      </section>}
      <EvidenceRows entries={shown} label={full ? current?.node.kind === "evidence" ? "证据详情" : "对象与证据" : "关键证据"} conclusionId={conclusion.id} compact={compact} preview={full && current?.node.kind === "evidence"} onOpen={onOpen} onNavigate={full && current?.node.kind !== "evidence" ? onNavigate : undefined} />
    </>}
    {limits.length > 0 && <section aria-label="其他记录限制" className="min-w-0 space-y-3"><h4 className="text-item-title">其他记录限制</h4><ul className={compact ? "space-y-2" : "space-y-4"}>{limits.map(({ node, path: limitPath }) => <li key={pathKey(limitPath)} className="min-w-0 space-y-1">
      <p className="break-words text-ui-hint">{labelOf(node)}</p>
      {node.access === "restricted" ? <p role="status" className="break-words text-ui-hint">访问受限 · {node.disclosure.reason}</p> : node.kind === "evidence" && <>
        <p className="break-words text-ui-hint text-muted-foreground">{sourceLocation(node.source)}</p>
        {node.facts.some(isUncertain) && <EvidenceFacts facts={node.facts.filter(isUncertain)} />}
        {node.previewUnavailableReason && <p role="status" className="break-words text-ui-hint">{node.previewUnavailableReason}</p>}
      </>}
    </li>)}</ul></section>}
    {!full && onExpand && <div><Button variant="outline" onClick={event => onExpand(event.currentTarget)}>查看证据链<ArrowUpRight aria-hidden="true" /></Button></div>}
    <RecordDetails>{details}</RecordDetails>
  </Card>
}
