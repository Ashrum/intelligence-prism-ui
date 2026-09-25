"use client"

import { useId, type ReactNode } from "react"
import { ArrowLeft, ArrowUpRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"
import { Badge } from "./badge"
import { MetricSummary } from "./data-display"
import { TrendChart, type ChartSeries } from "./charts/basic-charts"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

/** Opaque IDs bind view intents; labels and all supplied content must already be authorized. */
export type AgentMetricRecord = { id: string; version: string; dataTime?: string; snapshot?: boolean }
export type AgentMetricDisclosure = { count?: string; reason: string }
export type AgentMetricScope =
  | { state: "available"; summary: string; restricted?: AgentMetricDisclosure }
  | { state: "restricted"; disclosure: AgentMetricDisclosure }
export type AgentMetricReading =
  | { state: "available"; value: string | number; unit?: string }
  | { state: "missing" | "insufficient" | "unknown"; reason: string; value?: never; unit?: never }
export type AgentMetricBasis =
  | { state: "available"; id: string; label: string }
  | { state: "unavailable"; reason: string }
export type AgentMetricChange = {
  text: string
  direction?: "increase" | "decrease" | "unchanged" | "unknown"
  significance?: "significant" | "not-significant" | "unknown"
  basis: AgentMetricBasis
}
export type AgentMetricStatement = { kind: "explanation" | "conclusion" | "recommendation"; text: ReactNode; source: string }
export type AgentMetricTrend = {
  label: string
  series: ChartSeries[]
  unit?: string
  domain?: [number, number]
  /** Host-supplied coverage/missing-data facts, never inferred from series length. */
  note?: string
}
export type AgentMetricAvailableItem = {
  id: string
  access: "available"
  label: string
  /** Host-selected key KPI; does not imply significance or a conclusion. */
  key?: boolean
  reading: AgentMetricReading
  denominator?: string
  sampleSize?: string
  method: string
  dataTime?: string
  version?: string
  baseline?: string
  change?: AgentMetricChange
  trend?: AgentMetricTrend
  statements?: readonly AgentMetricStatement[]
}
export type AgentMetricItem = AgentMetricAvailableItem | { id: string; access: "restricted"; disclosure: AgentMetricDisclosure }
export type AgentMetricGroup = { id: string; label: string; items: readonly AgentMetricItem[] }
export type AgentMetricAnomaly =
  | { id: string; access: "available"; text: string; basis: AgentMetricBasis }
  | { id: string; access: "restricted"; disclosure: AgentMetricDisclosure }
export type AgentMetricDrilldownIntent = { recordId: string; version: string } & (
  | { kind: "metric"; metricId: string; metricVersion: string }
  | { kind: "change"; metricId: string; metricVersion: string; basisId: string }
  | { kind: "anomaly"; anomalyId: string; basisId: string }
)
export type AgentMetricSummaryProps = AgentRecordViewProps & {
  title: string
  record: AgentMetricRecord
  scope: AgentMetricScope
  groups: readonly AgentMetricGroup[]
  anomalies?: readonly AgentMetricAnomaly[]
  onDrilldown?: (intent: AgentMetricDrilldownIntent, trigger: HTMLButtonElement) => void
  onBack?: () => void
  notice?: string
}

const readingLabels = { missing: "缺测", insufficient: "样本不足", unknown: "状态未确认" }
const directionLabels = { increase: "上升", decrease: "下降", unchanged: "持平", unknown: "方向未确认" }
const significanceLabels = { significant: "显著变化", "not-significant": "未达显著", unknown: "显著性未确认" }
const statementLabels = { explanation: "解释", conclusion: "结论", recommendation: "建议" }

function MetricRestriction({ disclosure }: { disclosure: AgentMetricDisclosure }) {
  return <div className="space-y-1 text-ui-hint"><Badge variant="warning">访问受限</Badge>
    {disclosure.count !== undefined && <p>受限数量：{disclosure.count}</p>}
    <p className="break-words">{disclosure.reason}</p>
  </div>
}

function MetricStatements({ statements = [] }: { statements?: readonly AgentMetricStatement[] }) {
  return <>{statements.map((statement, index) => <div key={index} className="space-y-1">
    <p className="text-ui-action">{statementLabels[statement.kind]}</p>
    {statement.source?.trim() ? <>
      <div className="max-w-[40em] whitespace-pre-wrap break-words text-read-body">{statement.text}</div>
      <p className="break-words text-ui-hint">来源：{statement.source}</p>
    </> : <p className="text-ui-hint">来源未提供，暂不展示。</p>}
  </div>)}</>
}

function MetricBasis({ basis, label, onInspect }: { basis: AgentMetricBasis; label: string; onInspect?: (basisId: string, trigger: HTMLButtonElement) => void }) {
  if (basis.state === "unavailable") return <p className="break-words text-ui-hint">依据暂不可查看：{basis.reason}</p>
  return <div className="space-y-1">
    <p className="break-words text-ui-hint">依据：{basis.label}</p>
    {onInspect && basis.id.trim() ? <Button type="button" variant="ghost" size="sm" className="h-auto max-w-full whitespace-normal"
      aria-label={`查看${label}的依据`} onClick={event => onInspect(basis.id, event.currentTarget)}>查看依据<ArrowUpRight aria-hidden="true" /></Button>
      : <p className="text-ui-hint">依据暂不可查看</p>}
  </div>
}

function MetricMethod({ item, workspace }: { item: AgentMetricAvailableItem; workspace: boolean }) {
  const content = <div className="min-w-0 space-y-3">
    <p className="whitespace-pre-wrap break-words text-ui-hint">统计口径：{item.method.trim() || "未提供"}</p>
    <MetricStatements statements={item.statements} />
  </div>
  return workspace ? content : <Collapsible defaultOpen={false}>
    <CollapsibleTrigger aria-label={`${item.label}：口径与解释`} render={<Button type="button" variant="ghost" size="sm" />}><ChevronDown aria-hidden="true" />口径与解释</CollapsibleTrigger>
    <CollapsiblePanel className="motion-reduce:transition-none"><div className="min-w-0 pt-3">{content}</div></CollapsiblePanel>
  </Collapsible>
}

function MetricFacts({ item, record, workspace, onDrilldown }: {
  item: AgentMetricAvailableItem; record: AgentMetricRecord; workspace: boolean; onDrilldown?: AgentMetricSummaryProps["onDrilldown"]
}) {
  const target = { recordId: record.id, version: record.version, metricVersion: item.version ?? record.version }
  const inspect = onDrilldown && record.id.trim() && target.version.trim() && target.metricVersion.trim() && item.id.trim() ? onDrilldown : undefined
  return <div className="min-w-0 space-y-2">
    {item.reading.state !== "available" && <div className="space-y-1"><Badge variant="warning">{readingLabels[item.reading.state]}</Badge><p className="break-words text-ui-hint">{item.reading.reason}</p></div>}
    <p className="break-words text-ui-hint">样本量：{item.sampleSize ?? "未提供"} · 分母：{item.denominator ?? "未提供"}</p>
    <p className="break-words text-ui-hint">数据时间：{item.dataTime ?? record.dataTime ?? "未确认"} · 数据版本：{target.metricVersion || "未确认"}</p>
    {item.baseline && <p className="break-words text-ui-hint">比较基准：{item.baseline}</p>}
    {item.reading.state === "available" && item.change && <div className="min-w-0 space-y-1">
      <p className="break-words text-ui-hint">变化：{item.change.text}</p>
      {(item.change.direction || item.change.significance) && <p className="flex flex-wrap gap-2 text-ui-hint">
        {item.change.direction && <span>{directionLabels[item.change.direction]}</span>}
        {item.change.significance && <Badge variant={item.change.significance === "significant" ? "warning" : "outline"}>{significanceLabels[item.change.significance]}</Badge>}
      </p>}
      <MetricBasis basis={item.change.basis} label={`${item.label}变化`} onInspect={inspect ? (basisId, trigger) => inspect({ ...target, kind: "change", metricId: item.id, basisId }, trigger) : undefined} />
    </div>}
    <MetricMethod item={item} workspace={workspace} />
    {workspace && item.reading.state === "available" && item.trend && <section aria-label={item.trend.label} className="min-w-0 space-y-2">
      <h5 className="break-words text-item-title">{item.trend.label}</h5>
      {item.trend.note && <p className="break-words text-ui-hint">{item.trend.note}</p>}
      <TrendChart label={item.trend.label} series={item.trend.series} unit={item.trend.unit} domain={item.trend.domain} />
    </section>}
    {inspect && <Button type="button" variant="outline" size="sm" className="h-auto max-w-full whitespace-normal"
      onClick={event => inspect({ ...target, kind: "metric", metricId: item.id }, event.currentTarget)}>查看{item.label}明细<ArrowUpRight aria-hidden="true" /></Button>}
  </div>
}

function metricValue(reading: AgentMetricReading) {
  if (reading.state !== "available") return "—"
  return <span className="inline-flex max-w-full flex-wrap items-baseline gap-x-1 break-words tabular-nums">
    <span>{reading.value}{reading.unit === "%" ? "%" : null}</span>
    {reading.unit && reading.unit !== "%" && <span className="text-ui-body">{reading.unit}</span>}
  </span>
}

/** Semantic 19: host facts only. No statistics, diagnosis, permission checks or execution. */
export function AgentMetricSummary({ title, record, scope, groups, anomalies = [], view = "inline", density = "default", onExpand, onBack, onDrilldown, notice, details }: AgentMetricSummaryProps) {
  const id = useId()
  const workspace = view === "workspace"
  const compact = density === "compact"
  const available = scope.state === "available"
  const items = available ? groups.flatMap(group => group.items) : []
  const target = { recordId: record.id, version: record.version }
  const inspect = onDrilldown && record.id.trim() && record.version.trim() ? onDrilldown : undefined
  // Visibility is presentation only. Never derive a count, percentage, direction or significance.
  const visible = items.filter(item => workspace || !onExpand || item.access === "restricted" || item.key
    || item.reading.state !== "available" || item.change?.significance === "significant"
    || item.change?.significance === "unknown" || item.change?.direction === "unknown" || item.change?.basis.state === "unavailable")
  const kpi = (item: AgentMetricItem) => item.access === "restricted"
    ? { id: item.id, label: "受限指标", value: "—", detail: <MetricRestriction disclosure={item.disclosure} /> }
    : { id: item.id, label: item.label, value: metricValue(item.reading), detail: <MetricFacts item={item} record={record} workspace={workspace} onDrilldown={onDrilldown} /> }
  return <Card aria-labelledby={`${id}-title`} data-agent-metric-view={view} data-density={density} data-snapshot={available && record.snapshot || undefined}
    className={`@container min-w-0 break-words ${compact ? "gap-3 p-4" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <h3 id={`${id}-title`} className="text-block-title">{available ? title : "指标摘要"}</h3>
      {available ? <>
        <p className="text-ui-hint">{record.snapshot ? "当时数据" : "当前状态"} · 数据版本：{record.version || "未确认"}</p>
        <p className="text-ui-hint">数据范围：{scope.summary.trim() || "未指定"}</p>
        {scope.restricted && <MetricRestriction disclosure={scope.restricted} />}
      </> : <MetricRestriction disclosure={scope.disclosure} />}
    </header>
    {available && <>
      {workspace ? <div className="min-w-0 space-y-5">{groups.map(group => <section key={group.id} className="min-w-0 space-y-3" aria-label={group.label}>
        <h4 className="text-block-title">{group.label}</h4>
        <div className="grid min-w-0 gap-5 @3xl:grid-cols-2">{group.items.map(item => <div key={item.id} className="min-w-0 [&>dl]:grid-cols-1 [&>dl>div]:min-w-0">
          <MetricSummary density="compact" items={[kpi(item)]} />
        </div>)}</div>
      </section>)}</div> : <div className="min-w-0 [&>dl]:grid-cols-1 @sm:[&>dl]:grid-cols-2 [&>dl>div]:min-w-0">
        <MetricSummary density="compact" items={visible.map(kpi)} />
      </div>}
      {!items.length && <p className="text-ui-hint">暂未提供指标。</p>}
      {!!items.length && !visible.length && <p className="text-ui-hint">暂未指定关键指标，可查看指标详情。</p>}
      {!!anomalies.length && <section aria-label="异常提示" className="min-w-0 space-y-3">
        <h4 className="text-block-title">异常提示</h4><ul className="min-w-0 space-y-3">{anomalies.map(anomaly => <li key={anomaly.id} className="min-w-0 space-y-1">
          {anomaly.access === "restricted" ? <MetricRestriction disclosure={anomaly.disclosure} /> : <>
            <p className="whitespace-pre-wrap break-words text-ui-hint">{anomaly.text}</p>
            <MetricBasis basis={anomaly.basis} label={anomaly.text} onInspect={inspect && anomaly.id.trim() ? (basisId, trigger) => inspect({ ...target, kind: "anomaly", anomalyId: anomaly.id, basisId }, trigger) : undefined} />
          </>}
        </li>)}</ul>
      </section>}
      {notice && <p className="text-ui-hint text-muted-foreground">{notice}</p>}
      <RecordDetails>{details}</RecordDetails>
      {!workspace && onExpand && <div><Button type="button" variant="outline" onClick={event => onExpand(event.currentTarget)}>查看指标详情<ArrowUpRight aria-hidden="true" /></Button></div>}
    </>}
    {workspace && onBack && <div><Button type="button" variant="outline" onClick={onBack}><ArrowLeft aria-hidden="true" />返回原位置</Button></div>}
  </Card>
}
