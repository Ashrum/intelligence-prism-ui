"use client"

import { useId } from "react"
import { Check, ChevronDown, Circle, CircleAlert, CircleHelp, FileText, History } from "lucide-react"
import { Alert, AlertDescription } from "@/components/coss/alert"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Badge } from "./badge"
import { AgentContextList } from "./agent-components"
import { RecordDetails, RecordExpand, type AgentRecordViewProps } from "./agent-record-parts"

/** Display facts supplied by a trusted host. This is not an evidence verifier. */
export type AgentContextFact = (
  | { state: "confirmed"; description: string }
  | { state: "absent" | "unknown" | "unavailable"; description?: string }
) & { version?: string; location?: string }

export type AgentContextSource = {
  id: string
  title: string
  location: string
  selection: "selected" | "not-selected" | "unknown" | "unavailable"
  version?: string
  selectionDetail?: { description?: string; version?: string; location?: string }
  read: AgentContextFact
  context: AgentContextFact
  citation: AgentContextFact
  details?: readonly { label: string; value: string }[]
  inspectable?: boolean
}

const channels = [
  { key: "read", label: "读取", absent: "未读取" },
  { key: "context", label: "Agent 本次参考", absent: "未参考" },
  { key: "citation", label: "成果引用", absent: "未引用" },
] as const

function Fact({ fact, absent, graphic = false }: { fact: AgentContextFact; absent: string; graphic?: boolean }) {
  const text = fact.state === "confirmed" ? fact.description : fact.state === "absent" ? absent : fact.state === "unavailable" ? "记录暂不可用" : "状态未确认"
  const Icon = fact.state === "confirmed" ? Check : fact.state === "absent" ? Circle : fact.state === "unavailable" ? CircleAlert : CircleHelp
  return <>
    {graphic && <Icon aria-hidden="true" className="mr-1 inline size-4 shrink-0" />}
    <span className={fact.state === "confirmed" ? "text-foreground" : "text-muted-foreground"}>{text}</span>
    {fact.state !== "confirmed" && fact.description && <span className="mt-1 block text-muted-foreground">{fact.description}</span>}
    {(fact.version || fact.location) && <span className="mt-1 block break-words text-ui-hint text-muted-foreground">{[fact.version, fact.location].filter(Boolean).join(" · ")}</span>}
  </>
}

export type AgentContextSummaryProps = AgentRecordViewProps & {
  title: string
  scope: readonly { label: string; value: string }[]
  sources: readonly AgentContextSource[]
  expanded: boolean
  onExpandedChange?: (expanded: boolean) => void
  onInspect?: (id: string) => void
  notice?: { text: string; tone: "info" | "warning" | "error" }
  snapshot?: string
}

function selectionText(source: AgentContextSource) {
  return source.selection === "selected" ? "本次选用" : source.selection === "not-selected" ? "未选用" : source.selection === "unavailable" ? "记录暂不可用" : "选用状态未确认"
}

function SelectionFact({ source, graphic = false }: { source: AgentContextSource; graphic?: boolean }) {
  const fact: AgentContextFact = source.selection === "selected"
    ? { ...source.selectionDetail, state: "confirmed", description: ["本次选用", source.selectionDetail?.description].filter(Boolean).join(" · ") }
    : { ...source.selectionDetail, state: source.selection === "not-selected" ? "absent" : source.selection }
  return <Fact graphic={graphic} absent="未选用" fact={fact} />
}

function SourceDetails({ source }: { source: AgentContextSource }) {
  return <dl className="grid gap-3 @min-[540px]:grid-cols-2">{source.details?.map(detail => <div key={detail.label} className="min-w-0"><dt className="text-ui-hint text-muted-foreground">{detail.label}</dt><dd className="mt-1 break-words text-ui-body">{detail.value}</dd></div>)}</dl>
}

/** Controlled composition: identity, scope, independent evidence facts, optional detail. */
export function AgentContextSummary({
  title, scope, sources, expanded, onExpandedChange, onInspect, notice, snapshot,
  view = "inline", density = "default", onExpand, details,
}: AgentContextSummaryProps) {
  const id = useId()
  const hasDetails = sources.some(source => source.details?.length)
  const compact = density === "compact", recordLayout = view === "workspace" || compact
  return <Card aria-labelledby={id} data-agent-record-view={recordLayout ? view : undefined} data-agent-record-density={recordLayout ? density : undefined} className={compact ? "@container min-w-0 gap-3 p-4" : "@container gap-5 p-5 sm:p-6"}>
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-ui-hint text-muted-foreground">{snapshot ? recordLayout ? "历史依据 · 当时记录" : "历史依据" : "当前任务依据"}</p>
          <h3 id={id} className="break-words text-block-title">{title}</h3>
        </div>
        <Badge variant="outline" className="max-w-full whitespace-normal">{snapshot ? <><History aria-hidden="true" />{snapshot}</> : "当前状态"}</Badge>
      </div>
      <dl className="grid min-w-0 gap-x-6 gap-y-3 @min-[480px]:grid-cols-2">
        {scope.map(field => <div key={field.label} className="min-w-0">
          <dt className="text-ui-hint text-muted-foreground">{field.label}</dt>
          <dd className="mt-1 break-words text-ui-body">{field.value}</dd>
        </div>)}
      </dl>
      {notice && <Alert variant={notice.tone} role="status"><CircleAlert aria-hidden="true" /><AlertDescription>{notice.text}</AlertDescription></Alert>}
    </div>
    {recordLayout ? <section className="min-w-0 space-y-3" aria-label="来源与使用记录"><h4 className="text-block-title">来源与使用记录</h4>
      {sources.length ? <ul className={compact ? "space-y-3" : "space-y-6"}>{sources.map(source => <li key={source.id} data-source-id={source.id} className="flex min-w-0 items-start gap-3">
        <FileText aria-hidden="true" className="mt-1 size-4 shrink-0" /><div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0 space-y-1"><h5 className="break-words text-item-title">{source.title}</h5><p className="break-words text-ui-hint text-muted-foreground">{source.version || "来源版本未确认"} · {source.location}</p></div>
            {onInspect && source.inspectable !== false && <Button variant="ghost" size="sm" aria-label={`查看材料：${source.title}`} onClick={() => onInspect(source.id)}>查看来源</Button>}
          </div>
          <dl className={compact ? "flex min-w-0 flex-wrap gap-x-5 gap-y-2" : "grid min-w-0 gap-x-6 gap-y-3 @min-[540px]:grid-cols-2"}>
            <div className="min-w-0"><dt className="text-ui-hint text-muted-foreground">选用</dt><dd className="break-words text-ui-body"><SelectionFact source={source} graphic /></dd></div>
            {channels.map(channel => <div key={channel.key} className="min-w-0"><dt className="text-ui-hint text-muted-foreground">{channel.label}</dt><dd className="break-words text-ui-body"><Fact fact={source[channel.key]} absent={channel.absent} graphic /></dd></div>)}
          </dl>
          {!!source.details?.length && <SourceDetails source={source} />}
        </div>
      </li>)}</ul> : <p className="text-ui-hint text-muted-foreground">当前没有来源记录。</p>}
    </section> : <AgentContextList label="来源与使用记录" emptyText="当前没有来源记录。" inspectLabel="查看来源" onInspect={onInspect}
      items={sources.map(source => ({
        id: source.id, title: source.title, location: [source.version, source.location].filter(Boolean).join(" · "), inspectable: source.inspectable,
        description: selectionText(source),
        status: <dl className="grid min-w-0 gap-x-6 gap-y-3 @min-[540px]:grid-cols-3">
          {source.selectionDetail && <div className="min-w-0"><dt className="text-ui-hint text-muted-foreground">选用记录</dt><dd className="mt-1 break-words text-ui-body"><SelectionFact source={source} /></dd></div>}
          {channels.map(channel => <div key={channel.key} className="min-w-0"><dt className="text-ui-hint text-muted-foreground">{channel.label}</dt><dd className="mt-1 break-words text-ui-body"><Fact fact={source[channel.key]} absent={channel.absent} /></dd></div>)}
        </dl>,
      }))} />}
    {!recordLayout && hasDetails && <Collapsible open={expanded} onOpenChange={onExpandedChange}>
      {onExpandedChange && <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}><ChevronDown aria-hidden="true" className={expanded ? "rotate-180" : undefined} />{expanded ? "收起版本与定位" : "展开版本与定位"}</CollapsibleTrigger>}
      <CollapsiblePanel className="motion-reduce:transition-none">
        <div className="space-y-5 pt-4">
          {sources.filter(source => source.details?.length).map(source => <section key={source.id} className="space-y-2" aria-label={`${source.title}的版本与定位`}>
            <h4 className="break-words text-item-title">{source.title}</h4>
            <dl className="grid gap-3 @min-[540px]:grid-cols-2">{source.details?.map(detail => <div key={detail.label} className="min-w-0"><dt className="text-ui-hint text-muted-foreground">{detail.label}</dt><dd className="mt-1 break-words text-ui-body">{detail.value}</dd></div>)}</dl>
          </section>)}
        </div>
      </CollapsiblePanel>
    </Collapsible>}
    <RecordExpand view={view} onExpand={onExpand} />
    <RecordDetails>{details}</RecordDetails>
  </Card>
}
