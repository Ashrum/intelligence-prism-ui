"use client"

import { useEffect, useId, useRef, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Badge } from "./badge"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"
import { AgentMetaLine, AgentStatus } from "./agent-visual-parts"

/** IDs are opaque references for callbacks, never teacher-facing labels or DOM attributes. */
export type AgentObjectIdentity = { id: string; type: string; name: string; displayId?: string }
export type AgentObjectVersion = {
  id: string
  label: string
  state: "current" | "historical"
  currentLabel?: string
  /** Only a supplied explanation is displayed; no version comparison or diff is inferred. */
  difference?: string
}
export type AgentObjectAccess =
  | { state: "available"; scope: string; readOnlyReason?: string }
  | { state: "restricted"; reason: string }
export type AgentObjectContentSection = {
  id: string
  title: string
  access?: "available"
  summary?: ReactNode
  /** Authorized, read-only domain content; viewing controls are allowed. */
  content: ReactNode
  /** No summary or content mounts before the explicitly labelled confirmation trigger. */
  sensitive?: { reason: string }
}
export type AgentObjectRestrictedSection = {
  id: string
  access: "restricted"
  disclosure: { label: string; reason: string }
}
export type AgentObjectSection = AgentObjectContentSection | AgentObjectRestrictedSection
export type AgentObjectVersionOption = Pick<AgentObjectVersion, "id" | "label" | "state"> & { disabledReason?: string }
export type AgentObjectTarget = { objectId: string; versionId: string }
export type AgentObjectVersionIntent = AgentObjectTarget & { targetVersionId: string }
export type AgentObjectActionKind = "add-to-collection" | "review" | "drilldown"
export type AgentObjectAction = { id: string; kind: AgentObjectActionKind; label: string; disabledReason?: string }
export type AgentObjectActionIntent = AgentObjectTarget & { actionId: string; kind: AgentObjectActionKind }
export type AgentObjectRelation = { id: string; relationship: string; name: string; openable?: boolean }
export type AgentObjectRelationIntent = AgentObjectTarget & { relatedObjectId: string }
export type AgentObjectViewerProps = AgentRecordViewProps & {
  /** Minimal framing only applies to workspace objects with exactly one section. */
  chrome?: "full" | "minimal"
  object: AgentObjectIdentity
  version: AgentObjectVersion
  access: AgentObjectAccess
  source?: string
  sections: readonly AgentObjectSection[]
  activeSection: string | null
  onNavigate?: (sectionId: string, trigger: HTMLButtonElement) => void
  versions?: readonly AgentObjectVersionOption[]
  onVersionChange?: (intent: AgentObjectVersionIntent, trigger: HTMLButtonElement) => void
  actions?: readonly AgentObjectAction[]
  onAction?: (intent: AgentObjectActionIntent, trigger: HTMLButtonElement) => void
  relations?: readonly AgentObjectRelation[]
  onOpenRelation?: (intent: AgentObjectRelationIntent, trigger: HTMLButtonElement) => void
  /** The first one or two non-sensitive supplied summaries are the inline key sections. */
  inlineLimit?: 1 | 2
  /** Host opens domain details elsewhere; inline only mounts the supplied summaries. */
  inlineDisclosure?: "local" | "host"
  notice?: string
  onBack?: () => void
}

function sectionTitle(section: AgentObjectSection) {
  return section.access === "restricted" ? section.disclosure.label : section.title
}

function ObjectContent({ children }: { children: ReactNode }) {
  return <div className="min-w-0 max-w-[40em] break-words text-read-body">
    {typeof children === "string" ? <p className="whitespace-pre-wrap">{children}</p> : children}
  </div>
}

function ObjectSection({ section, anchor, view, showSummary, inlineDisclosure, minimal = false }: {
  section: AgentObjectSection; anchor: string; view: "inline" | "workspace"; showSummary: boolean; inlineDisclosure?: "local" | "host"; minimal?: boolean
}) {
  const title = sectionTitle(section)
  return <section id={anchor} aria-labelledby={minimal ? undefined : `${anchor}-title`} aria-label={minimal ? title : undefined} className="min-w-0 space-y-2" data-object-section="">
    {!minimal && <h4 id={`${anchor}-title`} className="break-words text-block-title">{title}</h4>}
    {section.access === "restricted" ? <div className="space-y-2">
      <AgentStatus tone="warning">访问受限</AgentStatus><p className="break-words text-ui-hint">{section.disclosure.reason}</p>
    </div> : <>
      {section.sensitive && <p id={`${anchor}-reason`} className="break-words text-ui-hint">需确认查看：{section.sensitive.reason}</p>}
      {showSummary && !section.sensitive && <ObjectContent>{section.summary}</ObjectContent>}
      {view === "inline" && inlineDisclosure === "host" ? null : view === "workspace" && !section.sensitive ? <ObjectContent>{section.content}</ObjectContent> :
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger aria-describedby={section.sensitive ? `${anchor}-reason` : undefined}
            render={(props, state) => <Button {...props} type="button" variant="outline" className="h-auto max-w-full whitespace-normal py-2 sm:h-auto">
              <ChevronDown aria-hidden="true" />{state.open ? `收起${title}` : `${section.sensitive ? "确认查看" : "展开"}${title}`}
            </Button>} />
          <CollapsiblePanel keepMounted={false} hiddenUntilFound={false} className="motion-reduce:transition-none">
            <div className="min-w-0 pt-3"><ObjectContent>{section.content}</ObjectContent></div>
          </CollapsiblePanel>
        </Collapsible>}
    </>}
  </section>
}

function ObjectAction({ action, target, onAction }: {
  action: AgentObjectAction; target: AgentObjectTarget; onAction: NonNullable<AgentObjectViewerProps["onAction"]>
}) {
  const id = useId()
  return <li className="min-w-0 space-y-1">
    <Button type="button" variant="outline" className="h-auto max-w-full whitespace-normal py-2 sm:h-auto"
      disabled={!!action.disabledReason} aria-describedby={action.disabledReason ? id : undefined}
      onClick={event => { if (!action.disabledReason) onAction({ ...target, kind: action.kind, actionId: action.id }, event.currentTarget) }}>{action.label}</Button>
    {action.disabledReason && <p id={id} className="break-words text-ui-hint">{action.disabledReason}</p>}
  </li>
}

function ObjectVersionChoice({ option, version, target, onVersionChange }: {
  option: AgentObjectVersionOption; version: AgentObjectVersion; target: AgentObjectTarget; onVersionChange: NonNullable<AgentObjectViewerProps["onVersionChange"]>
}) {
  const id = useId()
  const selected = version.id === option.id
  return <li className="min-w-0 space-y-1">
    <Button type="button" variant={selected ? "secondary" : "outline"} aria-pressed={selected}
      className="h-auto max-w-full whitespace-normal py-2 sm:h-auto" disabled={!!option.disabledReason}
      aria-describedby={option.disabledReason ? id : undefined} onClick={event => {
        if (!selected && !option.disabledReason) onVersionChange({ ...target, targetVersionId: option.id }, event.currentTarget)
      }}>{option.state === "historical" ? "当时版本" : "当前版本"} · {option.label}</Button>
    {option.disabledReason && <p id={id} className="break-words text-ui-hint">{option.disabledReason}</p>}
  </li>
}

/** Semantic 14: opened-object presentation. No reads, citations, versions or permissions are inferred. */
export function AgentObjectViewer({ object, version, access, source, sections, activeSection, onNavigate, versions = [], onVersionChange,
  actions = [], onAction, relations = [], onOpenRelation, inlineLimit = 2, inlineDisclosure = "local", view = "inline", density = "default", chrome = "full", onExpand, onBack, notice, details,
}: AgentObjectViewerProps) {
  const id = useId()
  const reader = useRef<HTMLDivElement>(null)
  const previousSection = useRef(activeSection)
  const compact = density === "compact"
  const minimal = chrome === "minimal" && view === "workspace" && sections.length === 1
  const Surface = minimal ? "section" : Card
  const available = access.state === "available"
  const historical = version.state === "historical"
  const identified = !!object.id.trim() && !!version.id.trim()
  const readOnly = historical || (available && !!access.readOnlyReason)
  const target: AgentObjectTarget = { objectId: object.id, versionId: version.id }
  const visibleActions = available && identified && onAction ? actions.filter(action => !!action.id.trim()
    && ["add-to-collection", "review", "drilldown"].includes(action.kind) && (!readOnly || action.kind === "drilldown")) : []
  const previewIds = sections.filter(section => section.access !== "restricted" && !section.sensitive && section.summary != null)
    .slice(0, inlineLimit === 1 ? 1 : 2).map(section => section.id)
  const active = sections.find(section => section.id === activeSection)
  // Remount local disclosure on object/version changes. Permission revocation unmounts all content.
  const contentKey = JSON.stringify([object.id, version.id, version.state, available ? access.scope : null])

  // Only a host selection update scrolls; mounting or clicking never marks anything read.
  useEffect(() => {
    if (previousSection.current === activeSection) return
    previousSection.current = activeSection
    if (view !== "workspace" || !available) return
    const index = sections.findIndex(section => section.id === activeSection)
    if (index >= 0) reader.current?.querySelectorAll<HTMLElement>("[data-object-section]")[index]?.scrollIntoView({ block: "nearest", behavior: "instant" })
  }, [activeSection, available, sections, view])

  return <Surface aria-labelledby={minimal ? undefined : `${id}-title`} aria-label={minimal ? object.name : undefined} data-agent-object-view={view} data-density={density}
    data-historical={historical || undefined} className={minimal ? `@container flex min-w-0 flex-col ${compact ? "gap-3" : "gap-5"}` : `@container min-w-0 ${compact ? "gap-3 p-4" : "gap-5 p-5"}`}>
    {minimal ? <header className="min-w-0 space-y-2">
      <AgentMetaLine data-object-facts="">
        <span className="inline-block whitespace-nowrap"><AgentStatus tone={historical ? "warning" : "neutral"}>{historical ? "历史版本（只读）" : "当前状态"}</AgentStatus></span>
        <span className="inline-block whitespace-nowrap">{` · ${historical ? "当时版本" : "当前版本"}：${version.label || "版本未确认"}`}</span>
        {historical && version.currentLabel && <span className="inline-block whitespace-nowrap">{` · 当前版本：${version.currentLabel}`}</span>}
        {object.displayId && <span className="inline-block whitespace-nowrap">{` · 编号：${object.displayId}`}</span>}
        {available && <>
          <span className="inline-block whitespace-nowrap">{` · 可见范围：${access.scope || "范围未确认"}`}</span>
          <span className="inline-block whitespace-nowrap">{` · 来源：${source || "来源未确认"}`}</span>
        </>}
      </AgentMetaLine>
      {!identified && <p role="status"><AgentStatus unknown>对象或版本尚未确认。</AgentStatus></p>}
      {available ? <>
        {access.readOnlyReason && <p className="break-words text-ui-meta"><AgentStatus>只读</AgentStatus> {access.readOnlyReason}</p>}
        {version.difference && <p role="status" className="break-words text-ui-meta">版本差异：{version.difference}</p>}
      </> : <div className="space-y-2"><AgentStatus tone="warning">访问受限</AgentStatus><p className="break-words text-ui-meta">{access.reason}</p></div>}
    </header> : <header className="min-w-0 space-y-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2"><Badge variant="secondary">{object.type}</Badge>
        <h3 id={`${id}-title`} className="break-words text-block-title">{object.name}</h3></div>
      {object.displayId && <p className="break-words text-ui-hint">编号：{object.displayId}</p>}
      <p className="break-words text-ui-hint">{historical ? "历史版本（只读） · 当时版本" : "当前状态 · 当前版本"}：{version.label || "版本未确认"}</p>
      {historical && version.currentLabel && <p className="break-words text-ui-hint">当前版本：{version.currentLabel}</p>}
      {!identified && <p role="status" className="text-ui-hint">对象或版本尚未确认。</p>}
      {available ? <>
        <p className="break-words text-ui-hint">可见范围：{access.scope || "范围未确认"}</p>
        {access.readOnlyReason && <p className="break-words text-ui-hint">只读：{access.readOnlyReason}</p>}
        <p className="break-words text-ui-hint">来源：{source || "来源未确认"}</p>
        {version.difference && <p role="status" className="break-words text-ui-hint">版本差异：{version.difference}</p>}
      </> : <div className="space-y-2"><AgentStatus tone="warning">访问受限</AgentStatus><p className="break-words text-ui-hint">{access.reason}</p></div>}
    </header>}
    {available && <>
      {view === "workspace" && identified && onVersionChange && !!versions.length && <div className="min-w-0 space-y-2">
        <h4 className="text-ui-action">对象版本</h4><ul aria-label="对象版本" className="flex min-w-0 flex-wrap gap-3">{versions.filter(option => !!option.id.trim()).map(option =>
          <ObjectVersionChoice key={option.id} option={option} version={version} target={target} onVersionChange={onVersionChange} />)}</ul>
      </div>}
      {view === "workspace" && !minimal && sections.length > 0 && <nav aria-label="对象分区目录" className="min-w-0 space-y-2">
        <h4 className="text-ui-action">分区目录</h4><ol className="flex min-w-0 flex-wrap gap-2">{sections.map((section, index) => <li key={section.id} className="min-w-0">
          {onNavigate ? <Button type="button" variant={activeSection === section.id ? "secondary" : "ghost"}
            className="h-auto max-w-full whitespace-normal py-2 sm:h-auto" aria-current={activeSection === section.id ? "location" : undefined}
            aria-controls={`${id}-section-${index}`} onClick={event => onNavigate(section.id, event.currentTarget)}>{sectionTitle(section)}</Button>
            : <span className="break-words text-ui-body" aria-current={activeSection === section.id ? "location" : undefined}>{sectionTitle(section)}</span>}
        </li>)}</ol>
      </nav>}
      {view === "workspace" && activeSection !== null && !active && <p role="status" className="text-ui-hint">{minimal ? "当前分区暂不可定位。" : "当前分区暂不可定位，请从目录重新选择。"}</p>}
      <div key={contentKey} ref={reader} className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-5"}>
        {sections.length ? sections.map((section, index) => <ObjectSection
          key={JSON.stringify([section.id, section.access, section.access !== "restricted" ? section.sensitive ?? null : null])}
          minimal={minimal} inlineDisclosure={inlineDisclosure} section={section} anchor={`${id}-section-${index}`} view={view} showSummary={view === "inline" && previewIds.includes(section.id)} />)
          : <p className="text-ui-hint text-muted-foreground">暂未提供对象内容。</p>}
      </div>
      {view === "workspace" && !!relations.length && <section aria-label="关联对象" className="min-w-0 space-y-2">
        <h4 className="text-block-title">关联对象</h4><ul className="min-w-0 space-y-3">{relations.map(relation => <li key={relation.id} className="min-w-0 space-y-1">
          <p className="break-words text-ui-hint">{relation.relationship}：{relation.name}</p>
          {identified && relation.id.trim() && relation.openable && onOpenRelation && <Button type="button" variant="outline"
            className="h-auto max-w-full whitespace-normal py-2 sm:h-auto" onClick={event => onOpenRelation({ ...target, relatedObjectId: relation.id }, event.currentTarget)}>查看{relation.name}<ArrowUpRight aria-hidden="true" /></Button>}
        </li>)}</ul>
      </section>}
      {!!visibleActions.length && onAction && <ul aria-label="对象操作" className="flex min-w-0 flex-wrap gap-3">{visibleActions.map(action => <ObjectAction key={action.id} action={action} target={target} onAction={onAction} />)}</ul>}
      {notice && (minimal ? <AgentMetaLine>{notice}</AgentMetaLine> : <p className="break-words text-ui-hint text-muted-foreground">{notice}</p>)}
      <RecordDetails>{details}</RecordDetails>
      {view === "inline" && identified && onExpand && <div><Button type="button" variant="outline" onClick={event => onExpand(event.currentTarget)}>查看完整<ArrowUpRight aria-hidden="true" /></Button></div>}
    </>}
    {view === "workspace" && onBack && <div><Button type="button" variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button></div>}
  </Surface>
}
