"use client"

import { useId, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/coss/table"
import { Button } from "./button"
import { RecordDetails } from "./agent-record-parts"
import { ScatterChart, type ScatterChartProps } from "./charts/scatter-chart"
import { SubjectCapabilities, SubjectNumberControl, SubjectValues, hasText, uniqueIds, validDefinition, validValue, type SubjectCapability, type SubjectNumber } from "./agent-subject-demo-parts"

export type AgentLabContext = { labId: string; version: string }
export type AgentLabVariable = SubjectNumber
export type AgentLabCapability = SubjectCapability
export type AgentLabCapabilities = Record<"run" | "step" | "record" | "export", AgentLabCapability>
export type AgentLabStep = { id: string; title: string; description?: string }
export type AgentLabResult = AgentLabContext & {
  summary: string
  inputs: readonly { label: string; value: number; unit?: string }[]
  values: readonly { label: string; value: string | number | null; unit?: string }[]
  source?: { kind: "simulation" | "external-tool"; label?: string }
  plot?: Pick<ScatterChartProps, "data" | "label" | "xLabel" | "yLabel" | "unit" | "xUnit" | "xDomain" | "yDomain">
}
export type AgentLabRecord = AgentLabContext & { label: string; text: string }
export type AgentLabIntent = AgentLabContext & (
  | { type: "set-variable"; variableId: string; value: number | null }
  | { type: "run-request"; variables: readonly { variableId: string; value: number }[] }
  | { type: "step"; stepId: string }
  | { type: "record-note"; text: string }
  | { type: "request-export" }
)
export type AgentSimulationLabProps = AgentLabContext & {
  title: string
  objective: string
  steps: readonly AgentLabStep[]
  currentStepId: string | null
  variables: readonly AgentLabVariable[]
  /** null explicitly means never run; undefined means no confirmed result state. */
  result?: AgentLabResult | null
  records?: readonly AgentLabRecord[]
  conclusionDraft: string
  capabilities: AgentLabCapabilities
  mobileSupport: SubjectCapability
  view?: "inline" | "workspace"
  density?: "default" | "compact"
  details?: ReactNode
  readOnlyReason?: string
  /** Host-owned leave protection; draft retention/discard stays with its owner. */
  backDisabledReason?: string
  onIntent?: (intent: AgentLabIntent) => void
  onExpand?: (trigger: HTMLButtonElement, context: AgentLabContext) => void
  onBack?: (context: AgentLabContext) => void
}
const labels = { run: "运行", step: "分步操作", record: "实验记录", export: "导出" }
export function AgentSimulationLab({ labId, version, title, objective, steps, currentStepId, variables, result, records, conclusionDraft, capabilities,
  mobileSupport, view = "inline", density = "default", details, readOnlyReason, backDisabledReason, onIntent, onExpand, onBack }: AgentSimulationLabProps) {
  const id = useId(), workspace = view === "workspace", context = { labId, version }
  const identity = hasText(labId) && hasText(version) && uniqueIds(variables) && uniqueIds(steps)
  const reason = readOnlyReason !== undefined ? readOnlyReason || "当前仅供查看。" : !identity ? "实验或版本信息未确认，暂不可操作。" : !onIntent ? "当前仅供查看。" : undefined
  const current = identity && result?.labId === labId && result.version === version && hasText(result.summary) ? result : undefined
  const knownSteps = steps.some(step => step.id === currentStepId)
  const inputsValid = variables.every(item => validDefinition(item) && validValue(item, item.value))
  const canRun = !reason && capabilities.run?.supported === true && inputsValid
  const unknown = [...variables.filter(item => item.value === null || !Number.isFinite(item.value)).map(item => item.label), !knownSteps && "当前步骤", result !== null && !current && "最近结果", !!current && !current.source && "结果来源", records === undefined && "记录列表",
    ...(current?.values.filter(item => item.value === null || typeof item.value === "number" && !Number.isFinite(item.value)).map(item => item.label) ?? [])].filter(Boolean)
  function run() {
    if (canRun) onIntent?.({ ...context, type: "run-request", variables: variables.map(item => ({ variableId: item.id, value: item.value as number })) })
  }
  return <Card data-agent-lab-view={view} data-density={density} className={`min-w-0 ${density === "compact" ? "gap-3 p-3" : "gap-4 p-4"}`}>
    <h3 className="text-block-title break-words">{title}</h3>
    <p className="text-read-body break-words">实验目标：{objective}</p>
    {unknown.length > 0 && <p className="text-ui-hint break-words">未知：{unknown.join("、")}。</p>}
    {reason && <p className="text-ui-hint break-words">{reason}</p>}
    <SubjectCapabilities id={`${id}-capabilities`} labels={labels} capabilities={capabilities} />
    <p className="text-ui-hint break-words">移动端：{mobileSupport.supported ? "支持" : "暂不支持"}{hasText(mobileSupport.reason) ? ` · ${mobileSupport.reason}` : ""}</p>
    {workspace && <section aria-label="实验步骤" className="space-y-2">
      <h4 className="text-ui-action">实验步骤</h4>
      <ol className="list-decimal space-y-3 pl-5">{steps.map((step, index) => <li key={index} aria-current={step.id === currentStepId ? "step" : undefined} className="min-w-0 space-y-1">
        {capabilities.step?.supported ? <Button type="button" size="navigation" variant="outline" disabled={!!reason} onClick={() => { if (!reason && capabilities.step?.supported) onIntent?.({ ...context, type: "step", stepId: step.id }) }}>{step.title}</Button> : <p className="text-ui-body break-words">{step.title}</p>}
        {step.id === currentStepId && <span className="text-ui-hint"> · 当前步骤</span>}
        {step.description && <p className="text-read-body break-words">{step.description}</p>}
      </li>)}</ol>
    </section>}
    <section aria-label="实验变量" className="min-w-0 space-y-3">
      <h4 className="text-ui-action">实验变量</h4>
      {workspace && !reason && capabilities.run?.supported ? variables.map((item, index) => <SubjectNumberControl key={index} item={item} disabled={!!reason} describedBy={`${id}-capabilities ${id}-boundary`}
        onChange={value => { if (!reason && capabilities.run?.supported && validDefinition(item) && (value === null || Number.isFinite(value))) onIntent?.({ ...context, type: "set-variable", variableId: item.id, value }) }} />) : <SubjectValues items={variables} />}
      {workspace && capabilities.run?.supported && <>
        {!inputsValid && <p className="text-ui-hint">请填写范围内且符合步长的变量后运行。</p>}
        <Button type="button" disabled={!canRun} onClick={run}>运行实验</Button>
      </>}
    </section>
    <section aria-label="最近一次结果" aria-live="polite" className="min-w-0 space-y-2">
      <h4 className="text-ui-action">最近一次结果</h4>
      <p className="text-read-body break-words">{current?.summary ?? (result === null ? "尚未运行" : "—")}</p>
      {current && <>
        <p className="text-ui-hint break-words">运行时变量：{current.inputs.map(item => `${item.label} ${item.value}${item.unit ? ` ${item.unit}` : ""}`).join("；") || "未提供"}</p>
        {current.source && <p className="text-ui-hint break-words">结果来源：{current.source.kind === "simulation" ? "模拟" : "外部工具"}{current.source.label ? ` · ${current.source.label}` : ""}</p>}
        {workspace && <>
          <Table><caption className="text-ui-hint">实验结果数据</caption><TableHeader><TableRow><TableHead scope="col">项目</TableHead><TableHead scope="col">数值</TableHead><TableHead scope="col">单位</TableHead></TableRow></TableHeader>
            <TableBody>{current.values.map((item, index) => <TableRow key={index}><TableCell className="whitespace-normal break-words">{item.label}</TableCell><TableCell className="whitespace-normal break-words">{item.value === null || typeof item.value === "number" && !Number.isFinite(item.value) ? "—" : item.value}</TableCell><TableCell>{item.unit ?? "—"}</TableCell></TableRow>)}</TableBody>
          </Table>
          {current.plot && <ScatterChart {...current.plot} />}
        </>}
      </>}
    </section>
    {workspace && <>
      <section aria-label="实验记录" className="space-y-2">
        <h4 className="text-ui-action">实验记录</h4>
        {records !== undefined && (records.some(record => record.labId === labId) ? <ol className="space-y-3">{records.filter(record => record.labId === labId).map((record, index) => <li key={index} className="text-read-body break-words">{record.label}：{record.text}</li>)}</ol> : <p className="text-ui-hint">暂无记录</p>)}
      </section>
      <Field className="min-w-0"><FieldLabel htmlFor={`${id}-conclusion`}>结论草稿</FieldLabel>
        <Textarea id={`${id}-conclusion`} value={conclusionDraft} rows={3} className="text-read-body" readOnly={!!reason || !capabilities.record?.supported} aria-describedby={`${id}-capabilities ${id}-boundary`}
          onChange={event => { if (!reason && capabilities.record?.supported) onIntent?.({ ...context, type: "record-note", text: event.target.value }) }} />
      </Field>
      {capabilities.export?.supported && <div><Button type="button" variant="outline" disabled={!!reason || !current} onClick={() => { if (!reason && current && capabilities.export?.supported) onIntent?.({ ...context, type: "request-export" }) }}>请求导出</Button></div>}
    </>}
    <p id={`${id}-boundary`} className="text-ui-hint break-words">运行请求不代表实验完成；结论为草稿，记录与导出以实际返回为准。</p>
    <RecordDetails>{details}</RecordDetails>
    {workspace ? onBack && <div className="space-y-2">
      {backDisabledReason !== undefined && <p className="text-ui-hint break-words">{backDisabledReason || "请先处理结论草稿再返回。"}</p>}
      <Button type="button" variant="outline" disabled={backDisabledReason !== undefined} onClick={() => { if (backDisabledReason === undefined) onBack(context) }}>返回原位置</Button>
    </div> : onExpand && <div><Button data-lab-expand type="button" variant="outline" onClick={event => onExpand(event.currentTarget, context)}>打开实验</Button></div>}
  </Card>
}
