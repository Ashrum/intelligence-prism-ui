"use client"

import { useId } from "react"
import { ChevronDown, CircleAlert, History } from "lucide-react"
import { Alert, AlertDescription } from "@/components/coss/alert"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Badge } from "./badge"
import { AgentContextList } from "./agent-components"

/** Display facts supplied by a trusted host. This is not an evidence verifier. */
export type AgentContextFact =
  | { state: "confirmed"; description: string }
  | { state: "absent" | "unknown" | "unavailable"; description?: string }

export type AgentContextSource = {
  id: string
  title: string
  location: string
  selection: "selected" | "not-selected" | "unknown"
  read: AgentContextFact
  context: AgentContextFact
  citation: AgentContextFact
  details?: readonly { label: string; value: string }[]
  inspectable?: boolean
}

const channels = [
  { key: "read", label: "读取", absent: "未读取" },
  { key: "context", label: "本轮上下文", absent: "未进入" },
  { key: "citation", label: "成果引用", absent: "未引用" },
] as const

function Fact({ fact, absent }: { fact: AgentContextFact; absent: string }) {
  const text = fact.state === "confirmed" ? fact.description : fact.state === "absent" ? absent : fact.state === "unavailable" ? "记录暂不可用" : "状态未确认"
  return <>
    <span className={fact.state === "confirmed" ? "text-foreground" : "text-muted-foreground"}>{text}</span>
    {fact.state !== "confirmed" && fact.description && <span className="mt-1 block text-muted-foreground">{fact.description}</span>}
  </>
}

/** Controlled composition: identity, scope, independent evidence facts, optional detail. */
export function AgentContextSummary({
  title, scope, sources, expanded, onExpandedChange, onInspect, notice, snapshot,
}: {
  title: string
  scope: readonly { label: string; value: string }[]
  sources: readonly AgentContextSource[]
  expanded: boolean
  onExpandedChange?: (expanded: boolean) => void
  onInspect?: (id: string) => void
  notice?: { text: string; tone: "info" | "warning" | "error" }
  snapshot?: string
}) {
  const id = useId()
  const hasDetails = sources.some(source => source.details?.length)
  return <Card aria-labelledby={id} className="@container gap-5 p-5 sm:p-6">
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-ui-hint text-muted-foreground">{snapshot ? "历史依据" : "当前任务依据"}</p>
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
    <AgentContextList label="来源与使用记录" emptyText="当前没有来源记录。" inspectLabel="查看来源" onInspect={onInspect}
      items={sources.map(source => ({
        id: source.id, title: source.title, location: source.location, inspectable: source.inspectable,
        description: source.selection === "selected" ? "本次选用" : source.selection === "not-selected" ? "未选用" : "选用状态未确认",
        status: <dl className="grid min-w-0 gap-x-6 gap-y-3 @min-[540px]:grid-cols-3">
          {channels.map(channel => <div key={channel.key} className="min-w-0"><dt className="text-ui-hint text-muted-foreground">{channel.label}</dt><dd className="mt-1 break-words text-ui-body"><Fact fact={source[channel.key]} absent={channel.absent} /></dd></div>)}
        </dl>,
      }))} />
    {hasDetails && <Collapsible open={expanded} onOpenChange={onExpandedChange}>
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
    <p className="text-ui-hint text-muted-foreground">选用、读取、本轮上下文与成果引用分别记录。查看来源不会改变这些记录。</p>
  </Card>
}
