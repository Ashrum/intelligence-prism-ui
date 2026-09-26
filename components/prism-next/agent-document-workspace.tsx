"use client"

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { Badge } from "./badge"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentDocumentCapabilityKind = "view" | "edit" | "annotate" | "export"
export type AgentDocumentConversion = { state: "none" } | { state: "lossy" | "unknown"; description: string }
export type AgentDocumentCapability = { conversion: AgentDocumentConversion } & (
  | { status: "supported"; reason?: string }
  | { status: "limited" | "unsupported"; reason: string }
)
export type AgentDocumentCapabilities = Record<AgentDocumentCapabilityKind, AgentDocumentCapability>

/** A reference and permitted content scope, never a new authoritative asset or format AST. */
export type AgentDocument = {
  id: string
  title: string
  version: string
  format: string
  contentScope: string
  source?: string
  /** Presence marks this supplied version as historical, even if the label is empty. */
  snapshot?: string
  currentVersion?: string
}
export type AgentDocumentSection = {
  id: string
  title: string
  /** Plain strings are escaped and use reading typography; other content is host-rendered. */
  content: ReactNode
  children?: readonly AgentDocumentSection[]
}
export type AgentDocumentPreview = { kind: "summary" | "excerpt"; range: string; content: ReactNode }
export type AgentDocumentSaveState = "unsaved" | "saved-draft" | "submitted" | "conflict" | "unknown"
export type AgentDocumentSave = { state: AgentDocumentSaveState; description?: string }
export type AgentDocumentChange = { documentId: string; version: string; baseVersion: string; sectionId: string; value: string }
export type AgentDocumentDraft = {
  baseVersion: string
  values: Readonly<Record<string, string | undefined>>
  onChange: (change: AgentDocumentChange) => void
  readOnlyReason?: string
}
export type AgentDocumentAnnotation = {
  id: string
  version: string
  anchor: { sectionId: string; paragraph?: string }
  author: string
  time?: string
  state: "open" | "resolved" | "unknown"
  content: string
}
export type AgentDocumentAnnotationIntent = { documentId: string; version: string; sectionId: string }
export type AgentDocumentAction = { id: string; label: string; capability: AgentDocumentCapabilityKind; disabledReason?: string }
export type AgentDocumentActionIntent = { documentId: string; version: string; actionId: string; capability: AgentDocumentCapabilityKind }
export type AgentDocumentWorkspaceProps = AgentRecordViewProps & {
  document: AgentDocument
  capabilities: AgentDocumentCapabilities
  sections: readonly AgentDocumentSection[]
  activeSection: string | null
  onNavigate?: (sectionId: string, trigger: HTMLButtonElement) => void
  preview?: AgentDocumentPreview
  draft?: AgentDocumentDraft
  save?: AgentDocumentSave
  annotations?: readonly AgentDocumentAnnotation[]
  onAddAnnotation?: (intent: AgentDocumentAnnotationIntent) => void
  quickActions?: readonly AgentDocumentAction[]
  onAction?: (intent: AgentDocumentActionIntent) => void
  notice?: string
  /** Pure navigation. The host protects unsaved work and restores focus/reading position. */
  onBack?: () => void
}

const capabilityLabels: Record<AgentDocumentCapabilityKind, string> = { view: "查看", edit: "编辑", annotate: "批注", export: "导出" }
const capabilityKinds = Object.keys(capabilityLabels) as AgentDocumentCapabilityKind[]
const capabilityStatuses = { supported: "支持", limited: "有限支持", unsupported: "不支持" }
const saveLabels: Record<AgentDocumentSaveState, string> = { unsaved: "未保存", "saved-draft": "已保存草稿", submitted: "已提交", conflict: "冲突", unknown: "状态未确认" }
const annotationLabels = { open: "待处理", resolved: "已处理", unknown: "状态未确认" }

function supports(capability?: AgentDocumentCapability) {
  return capability?.status === "supported" || capability?.status === "limited"
}

function flattenSections(sections: readonly AgentDocumentSection[]): AgentDocumentSection[] {
  return sections.flatMap(section => [section, ...flattenSections(section.children ?? [])])
}

function DocumentContent({ children }: { children: ReactNode }) {
  return <div className="min-w-0 max-w-[40em] break-words text-read-body">
    {typeof children === "string" ? <p className="whitespace-pre-wrap">{children}</p> : children}
  </div>
}

function DocumentCapabilities({ capabilities, id }: { capabilities: AgentDocumentCapabilities; id: string }) {
  return <section id={id} aria-label="格式能力" className="min-w-0 space-y-2">
    <h4 className="text-ui-action">格式能力</h4>
    <dl className="grid min-w-0 gap-3 @min-[48rem]:grid-cols-2">{capabilityKinds.map(kind => {
      const capability = capabilities[kind]
      return <div key={kind} className="min-w-0 space-y-1" data-capability={kind}>
        <div className="flex flex-wrap items-center gap-2"><dt className="text-ui-action">{capabilityLabels[kind]}</dt><dd>
          <Badge variant={capability?.status === "supported" ? "secondary" : "warning"}>{capabilityStatuses[capability?.status] ?? "能力未确认"}</Badge>
        </dd></div>
        {capability?.reason && <dd className="break-words text-ui-hint">{capability.reason}</dd>}
        {capability?.conversion?.state !== "none" && <dd className="break-words text-ui-hint">{capability?.conversion?.state === "lossy" ? "转换风险" : "转换风险未确认"}：{capability?.conversion && "description" in capability.conversion ? capability.conversion.description : "暂未提供说明。"}</dd>}
      </div>
    })}</dl>
  </section>
}

/** Arrow keys only move focus. Enter/Space requests navigation; selection stays controlled. */
function directoryKeyDown(event: KeyboardEvent<HTMLElement>) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-section-target]"))
  const index = buttons.indexOf(event.target as HTMLButtonElement)
  if (index < 0) return
  const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
    : event.key === "ArrowDown" ? Math.min(index + 1, buttons.length - 1)
      : event.key === "ArrowUp" ? Math.max(index - 1, 0) : undefined
  if (next === undefined) return
  event.preventDefault()
  buttons[next]?.focus()
}

function DocumentDirectory({ sections, activeSection, onNavigate }: Pick<AgentDocumentWorkspaceProps, "sections" | "activeSection" | "onNavigate">) {
  function entries(items: readonly AgentDocumentSection[], nested = false): ReactNode {
    return <ol className={nested ? "min-w-0 space-y-1 pl-4" : "min-w-0 space-y-1"}>{items.map(section => <li key={section.id} className="min-w-0">
      {onNavigate ? <Button type="button" variant={activeSection === section.id ? "secondary" : "ghost"}
        className="h-auto min-h-9 w-full justify-start whitespace-normal py-2 text-left sm:h-auto" data-section-target={section.id}
        aria-current={activeSection === section.id ? "location" : undefined} onClick={event => onNavigate(section.id, event.currentTarget)}>{section.title}</Button>
        : <p className="break-words text-ui-body" aria-current={activeSection === section.id ? "location" : undefined}>{section.title}</p>}
      {!!section.children?.length && entries(section.children, true)}
    </li>)}</ol>
  }
  return <nav aria-label="章节目录" onKeyDown={directoryKeyDown}>{entries(sections)}</nav>
}

function DocumentSections({ sections, level = 4, activeSection, editor }: { sections: readonly AgentDocumentSection[]; level?: number; activeSection: string | null; editor?: ReactNode }) {
  const Heading = `h${Math.min(level, 6)}` as "h4" | "h5" | "h6"
  return sections.map(section => <section key={section.id} data-document-section={section.id} aria-label={section.title} className="min-w-0 space-y-3">
    <Heading className="break-words text-block-title">{section.title}</Heading>
    <DocumentContent>{section.content}</DocumentContent>
    {section.id === activeSection && editor}
    {!!section.children?.length && <div className="min-w-0 space-y-5"><DocumentSections sections={section.children} level={level + 1} activeSection={activeSection} editor={editor} /></div>}
  </section>)
}

function DocumentQuickAction({ action, document, describedBy, onAction }: {
  action: AgentDocumentAction; document: AgentDocument; describedBy: string; onAction: (intent: AgentDocumentActionIntent) => void
}) {
  const id = useId()
  return <li className="min-w-0 space-y-1">
    <Button type="button" variant="outline" className="h-auto max-w-full whitespace-normal py-2 sm:h-auto" disabled={!!action.disabledReason}
      aria-describedby={`${describedBy}${action.disabledReason ? ` ${id}-reason` : ""}`} data-document-action={action.id}
      onClick={() => { if (!action.disabledReason) onAction({ documentId: document.id, version: document.version, actionId: action.id, capability: action.capability }) }}>{action.label}</Button>
    {action.disabledReason && <p id={`${id}-reason`} className="break-words text-ui-hint">{action.disabledReason}</p>}
  </li>
}

/** Semantic 28. All content, drafts, annotations, versions and saved facts belong to the host. */
export function AgentDocumentWorkspace({ document, capabilities, sections, activeSection, onNavigate, preview, draft, save,
  annotations, onAddAnnotation, quickActions = [], onAction, view = "inline", density = "default", onExpand, onBack, notice, details,
}: AgentDocumentWorkspaceProps) {
  const id = useId()
  const reader = useRef<HTMLElement>(null)
  const previousSection = useRef(activeSection)
  const compact = density === "compact"
  const historical = document.snapshot !== undefined
  const canView = supports(capabilities.view)
  const identified = !!document.id.trim() && !!document.version.trim()
  const allSections = flattenSections(sections)
  const active = allSections.find(section => section.id === activeSection)
  const state = save?.state ?? "unknown"
  const canEdit = canView && !historical && identified && supports(capabilities.edit)
  const editable = canEdit && draft && !!draft.baseVersion.trim() && !draft.readOnlyReason
  const draftValue = active && draft?.values[active.id]
  const actions = canView && identified && onAction ? quickActions.filter(action =>
    capabilityKinds.includes(action.capability) && supports(capabilities[action.capability]) && !!action.id.trim()
    && (!historical || action.capability === "view" || action.capability === "export")) : []

  const editor = canEdit && active && <section aria-label="章节编辑" className="min-w-0 space-y-2">
    <p className="text-ui-action">编辑当前章节</p>
    {draft && typeof draftValue === "string" ? <>
      <p id={`${id}-draft`} className="break-words text-ui-hint">草稿基于：{draft.baseVersion || "版本未确认"}{draft.readOnlyReason && ` · ${draft.readOnlyReason}`}</p>
      <Field className="w-full"><FieldLabel htmlFor={`${id}-editor`}>{active.title}</FieldLabel>
        <Textarea id={`${id}-editor`} value={draftValue} readOnly={!editable} aria-describedby={`${id}-save ${id}-capabilities ${id}-draft`}
          onChange={event => { if (editable) draft.onChange({ documentId: document.id, version: document.version, baseVersion: draft.baseVersion, sectionId: active.id, value: event.target.value }) }} />
      </Field>
    </> : <p className="text-ui-hint text-muted-foreground">本章节暂未提供可编辑文本。</p>}
  </section>

  // Only a host-confirmed selection update scrolls. Scrolling never emits reading/citation facts.
  useEffect(() => {
    if (previousSection.current === activeSection) return
    previousSection.current = activeSection
    const target = Array.from(reader.current?.querySelectorAll<HTMLElement>("[data-document-section]") ?? []).find(node => node.dataset.documentSection === activeSection)
    target?.scrollIntoView({ block: "nearest" })
  }, [activeSection])

  return <Card aria-labelledby={`${id}-title`} data-agent-document-view={view} data-density={density}
    data-document-version={document.version} data-historical={historical || undefined} className={`@container min-w-0 ${compact ? "gap-3 p-4" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <h3 id={`${id}-title`} className="break-words text-block-title">{document.title}</h3>
      <p className="break-words text-ui-hint">{historical ? "历史版本（只读）" : "当前状态"} · {historical ? "当时版本" : "当前版本"}：{document.version || "版本未确认"} · {document.format || "格式未确认"}</p>
      <p className="break-words text-ui-hint">{!document.id.trim() && "文档身份未确认 · "}内容范围：{document.contentScope || "范围未确认"}</p>
      {document.source && <p className="break-words text-ui-hint">来源：{document.source}</p>}
      {historical && document.snapshot && <p className="break-words text-ui-hint">{document.snapshot}</p>}
      {historical && document.currentVersion && <p className="break-words text-ui-hint">当前版本：{document.currentVersion}</p>}
      <div id={`${id}-save`} role="status" className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2"><span className="text-ui-hint">{historical ? "当时保存状态" : "保存状态"}</span><Badge variant={state === "unknown" || state === "conflict" || state === "unsaved" ? "warning" : "secondary"}>{saveLabels[state]}</Badge></div>
        {save?.description && <p className="break-words text-ui-hint">{save.description}</p>}
      </div>
    </header>
    <DocumentCapabilities id={`${id}-capabilities`} capabilities={capabilities} />
    {canView && view === "inline" && <section aria-label="文档摘要或节选" className="min-w-0 space-y-2">
      {preview ? <><p className="break-words text-ui-hint">{preview.kind === "summary" ? "摘要范围" : "节选范围"}：{preview.range || "范围未确认"}</p><DocumentContent>{preview.content}</DocumentContent></>
        : <p className="text-ui-hint text-muted-foreground">暂未提供摘要或节选。</p>}
    </section>}
    {canView && view === "workspace" && <>
      {!active && <p role="status" className="text-ui-hint">{activeSection === null ? "尚未选择章节。" : "当前章节暂不可定位，请从目录重新选择。"}</p>}
      {sections.length ? <div className="grid min-w-0 items-start gap-5 @min-[48rem]:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <aside className="min-w-0">
          <div className="hidden space-y-2 @min-[48rem]:block"><h4 className="text-ui-action">章节目录</h4><DocumentDirectory sections={sections} activeSection={activeSection} onNavigate={onNavigate} /></div>
          <Collapsible defaultOpen={false} className="@min-[48rem]:hidden">
            <CollapsibleTrigger render={<Button type="button" variant="outline" className="h-auto max-w-full whitespace-normal sm:h-auto" />}><ChevronDown aria-hidden="true" />目录{active && ` · ${active.title}`}</CollapsibleTrigger>
            <CollapsiblePanel className="motion-reduce:transition-none"><div className="pt-3"><DocumentDirectory sections={sections} activeSection={activeSection} onNavigate={onNavigate} /></div></CollapsiblePanel>
          </Collapsible>
        </aside>
        <article ref={reader} aria-label="文档阅读区" className={compact ? "min-w-0 space-y-4" : "min-w-0 space-y-6"}><DocumentSections sections={sections} activeSection={activeSection} editor={editor} /></article>
      </div> : <p className="text-ui-hint text-muted-foreground">暂未提供章节内容。</p>}

      <section aria-label="文档批注" className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-block-title">{historical ? "当时批注" : "批注"}</h4>
          {!historical && identified && active && supports(capabilities.annotate) && onAddAnnotation && <Button type="button" variant="outline" className="h-auto max-w-full whitespace-normal py-2 sm:h-auto"
            aria-describedby={`${id}-capabilities`} aria-label={`新增批注：${active.title}`} onClick={() => onAddAnnotation({ documentId: document.id, version: document.version, sectionId: active.id })}>批注当前章节</Button>}
        </div>
        {annotations?.length ? <ol className={compact ? "space-y-3" : "space-y-5"}>{annotations.map(annotation => {
          const section = annotation.version === document.version ? allSections.find(item => item.id === annotation.anchor.sectionId) : undefined
          return <li key={annotation.id} data-document-annotation={annotation.id} className="min-w-0 space-y-2">
            <p className="break-words text-ui-hint">{annotation.author || "作者未确认"} · {annotation.time || "时间未确认"} · {annotationLabels[annotation.state]}</p>
            <p className="break-words text-ui-hint">批注版本：{annotation.version || "版本未确认"} · 章节：{section?.title ?? annotation.anchor.sectionId}{annotation.anchor.paragraph && ` · 段落：${annotation.anchor.paragraph}`}</p>
            <DocumentContent>{annotation.content}</DocumentContent>
            {section && onNavigate && <Button type="button" variant="ghost" aria-label={`定位批注：${section.title}`} onClick={event => onNavigate(section.id, event.currentTarget)}>定位章节</Button>}
          </li>
        })}</ol> : <p className="text-ui-hint text-muted-foreground">{annotations ? "暂无批注。" : "暂未提供批注记录。"}</p>}
      </section>
    </>}
    {!!actions.length && onAction && <ul aria-label="文档快速操作" className="flex min-w-0 flex-wrap gap-3">{actions.map(action => <DocumentQuickAction key={action.id} action={action} document={document} describedBy={`${id}-capabilities`} onAction={onAction} />)}</ul>}
    {notice && <p className="break-words text-ui-hint text-muted-foreground">{notice}</p>}
    <RecordDetails>{details}</RecordDetails>
    {canView && identified && view === "inline" && onExpand && <div><Button type="button" variant="outline" onClick={event => onExpand(event.currentTarget)}>打开文档<ArrowUpRight aria-hidden="true" /></Button></div>}
    {view === "workspace" && onBack && <div><Button type="button" variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button></div>}
  </Card>
}
