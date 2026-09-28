"use client"

import { useId, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Input } from "@/components/coss/input"
import { Textarea } from "@/components/coss/textarea"
import { Button } from "./button"
import { DraftMathPreview } from "./draft-math-preview"
import { RecordDetails } from "./agent-record-parts"
import { ScatterChart, type ScatterChartProps } from "./charts/scatter-chart"

export type AgentCalcMode = "evaluate" | "simplify" | "solve" | "plot" | "stats"
export type AgentCalcContext = { toolSessionId: string; version: string }
export type AgentCalcCapability = { supported: true; reason?: string } | { supported: false; reason: string }
export type AgentCalcCapabilities = Record<AgentCalcMode, AgentCalcCapability>
export type AgentCalcSource = { kind: "local-rule" | "external-tool" | "simulation"; label?: string }
export type AgentCalcComparison = { state: "consistent" | "inconsistent" | "unknown"; answer?: string; reason?: string }
export type AgentCalcStep = { text: string; formula?: string; source?: AgentCalcSource }
/** A supplied snapshot binds every result fact to the exact input and authority version. */
export type AgentCalcResult = AgentCalcContext & {
  expression: string
  mode: AgentCalcMode
  text: string
  formula?: string
  unit?: string
  source?: AgentCalcSource
  steps?: readonly AgentCalcStep[]
  comparison?: AgentCalcComparison
  plot?: Pick<ScatterChartProps, "data" | "label" | "xLabel" | "yLabel" | "unit" | "xUnit" | "xDomain" | "yDomain">
}
export type AgentCalcIntent = AgentCalcContext & (
  | { type: "change-input"; expression: string; mode: AgentCalcMode }
  | { type: "evaluate"; expression: string; mode: AgentCalcMode }
  | { type: "insert-result"; target: "answer" | "explanation"; expression: string; mode: AgentCalcMode }
  | { type: "compare-with-answer"; expression: string; mode: AgentCalcMode }
  | { type: "clear-history" }
)
export type AgentCalcToolProps = AgentCalcContext & {
  title?: string
  expression: string
  mode: AgentCalcMode
  capabilities: AgentCalcCapabilities
  result?: AgentCalcResult
  /** Only the current session's authorized snapshots. Missing history is unknown, [] is empty. */
  history?: readonly AgentCalcResult[]
  /** Optional MathContent / MathML composition, tied to this exact input. */
  inputPreview?: { expression: string; content: ReactNode }
  view?: "inline" | "workspace"
  density?: "default" | "compact"
  details?: ReactNode
  disabledReason?: string
  insertDisabledReason?: string
  compareDisabledReason?: string
  onIntent?: (intent: AgentCalcIntent) => void
  onExpand?: (trigger: HTMLButtonElement, context: AgentCalcContext) => void
  onBack?: (context: AgentCalcContext) => void
}

const modeLabels: Record<AgentCalcMode, string> = { evaluate: "求值与函数性质", simplify: "化简", solve: "解方程", plot: "函数绘图", stats: "简单统计" }
const modes = Object.keys(modeLabels) as AgentCalcMode[]
const sourceLabels = { "local-rule": "本机规则", "external-tool": "外部工具", simulation: "模拟" }
const sourceText = (source?: AgentCalcSource) => source ? `${sourceLabels[source.kind]}${source.label?.trim() ? ` · ${source.label}` : ""}` : "未知来源"
const comparisonLabels = { consistent: "一致", inconsistent: "不一致", unknown: "无法判断" }
const hasText = (value?: string) => !!value?.trim()

export function AgentCalcTool({ title = "计算与分析", toolSessionId, version, expression, mode, capabilities, result, history,
  inputPreview, view = "inline", density = "default", details, disabledReason, insertDisabledReason, compareDisabledReason,
  onIntent, onExpand, onBack }: AgentCalcToolProps) {
  const id = useId(), workspace = view === "workspace", compact = density === "compact"
  const context = { toolSessionId, version }
  const reason = disabledReason !== undefined ? disabledReason || "当前暂不可操作。"
    : !hasText(toolSessionId) || !hasText(version) ? "本次计算或版本未确认，暂不可操作。"
    : !onIntent ? "当前仅供查看。" : undefined
  const current = hasText(toolSessionId) && hasText(version) && result && result.toolSessionId === toolSessionId && result.version === version && result.expression === expression && result.mode === mode && hasText(result.text) ? result : undefined
  const comparison = current?.comparison
  const canEvaluate = !reason && hasText(expression) && capabilities[mode]?.supported === true
  const canInsert = !reason && !!current && insertDisabledReason === undefined
  const canCompare = !reason && !!current && compareDisabledReason === undefined
  const sessionHistory = history?.filter(item => item.toolSessionId === toolSessionId)
  // One visible explanation for identical capability restrictions; all five declarations remain visible.
  const groups = new Map<string, AgentCalcMode[]>()
  for (const name of modes) {
    const capability = capabilities[name]
    const label = capability?.supported ? `可用${hasText(capability.reason) ? `：${capability.reason}` : ""}` : `不支持：${capability?.reason?.trim() || "暂未提供可用能力。"}`
    groups.set(label, [...(groups.get(label) ?? []), name])
  }
  function evaluate() {
    if (canEvaluate) onIntent?.({ ...context, type: "evaluate", expression, mode })
  }
  function change(nextExpression: string, nextMode: AgentCalcMode) {
    if (!reason) onIntent?.({ ...context, type: "change-input", expression: nextExpression, mode: nextMode })
  }
  function formula(value: string, label: string) {
    return <DraftMathPreview value={value} formulaMode="inline" label={label} notice={null} showHelp={false} />
  }
  const inputProps = {
    id: `${id}-expression`, value: expression, readOnly: !!reason,
    "aria-describedby": `${id}-boundary${reason ? ` ${id}-restriction` : ""}`,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change(event.target.value, mode),
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || event.repeat || event.altKey || event.shiftKey) return
      // Inline Enter; both views Ctrl/Cmd+Enter. Prevent native form submission/duplicate evaluation.
      if (!workspace || event.ctrlKey || event.metaKey) { event.preventDefault(); evaluate() }
    },
  }
  return <Card data-agent-calc-view={view} data-density={density} className={`min-w-0 ${compact ? "gap-3 p-3" : "gap-4 p-4"}`}>
    <h3 className="break-words text-block-title">{title}</h3>
    {reason && <p id={`${id}-restriction`} className="text-ui-hint break-words">{reason}</p>}
    <div role="group" aria-label="计算方式" className="flex min-w-0 flex-wrap gap-2">
      {modes.map(name => <Button key={name} type="button" variant="outline" size="navigation" aria-pressed={mode === name}
        aria-describedby={`${id}-capabilities`} disabled={!!reason || !capabilities[name]?.supported}
        onClick={() => { if (capabilities[name]?.supported) change(expression, name) }}>{modeLabels[name]}</Button>)}
    </div>
    <ul id={`${id}-capabilities`} className="space-y-1 text-ui-hint break-words">
      {[...groups].map(([label, names]) => <li key={label}>{names.map(name => modeLabels[name]).join("、")} · {label}</li>)}
    </ul>
    <Field className="min-w-0">
      <FieldLabel htmlFor={`${id}-expression`}>表达式或数据</FieldLabel>
      {workspace ? <Textarea {...inputProps} rows={4} className="text-read-body" /> : <Input {...inputProps} nativeInput />}
    </Field>
    <div className="min-w-0 max-w-[40em]">
      {inputPreview?.expression === expression ? inputPreview.content : formula(expression, "输入预览")}
    </div>
    <div className="flex flex-wrap gap-2"><Button type="button" disabled={!canEvaluate} onClick={evaluate}>计算</Button></div>
    <section aria-labelledby={`${id}-result`} aria-live="polite" className="min-w-0 space-y-2">
      <h4 id={`${id}-result`} className="text-ui-action">结果摘要</h4>
      <p className="text-read-body break-words">{current?.text ?? "结果未知"}</p>
      {current?.formula && formula(current.formula, "结果公式")}
      {current && <p className="text-ui-hint break-words">单位：{hasText(current.unit) ? current.unit : "未知"}</p>}
      <p className="text-ui-hint">{current?.source ? current.source.kind === "simulation" ? "模拟结果" : "非模拟结果" : "是否模拟：未知"}</p>
      <p className="text-ui-body break-words">与题目答案对比：{comparisonLabels[comparison?.state ?? "unknown"]}</p>
      {hasText(comparison?.answer) && <p className="text-read-body break-words">题目答案：{comparison?.answer}</p>}
      {hasText(comparison?.reason) && <p className="text-ui-hint break-words">{comparison?.reason}</p>}
    </section>
    {compareDisabledReason !== undefined && <p className="text-ui-hint break-words">{compareDisabledReason || "暂不可对比。"}</p>}
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={!canCompare}
      onClick={() => { if (canCompare) onIntent?.({ ...context, type: "compare-with-answer", expression, mode }) }}>与题目答案对比</Button></div>
    {workspace && <>
      <section className="min-w-0 space-y-2" aria-label="计算步骤">
        <h4 className="text-ui-action">计算步骤</h4>
        {current?.steps?.length ? <ol className="list-decimal space-y-3 pl-5">{current.steps.map((step, index) => <li key={index} className="min-w-0 space-y-1">
          <p className="text-read-body break-words">{step.text}</p>{step.formula && formula(step.formula, `第 ${index + 1} 步公式`)}
          {step.source && <p className="text-ui-hint break-words">步骤来源：{sourceText(step.source)}</p>}
        </li>)}</ol> : <p className="text-ui-hint">步骤未提供</p>}
      </section>
      {current?.plot && <section className="min-w-0 space-y-2" aria-label="函数采样图">
        <h4 className="text-ui-action">函数采样图</h4>
        {current.plot.data.length ? <ScatterChart {...current.plot} /> : <p className="text-ui-hint">尚无数据点</p>}
      </section>}
      {insertDisabledReason !== undefined && <p className="text-ui-hint break-words">{insertDisabledReason || "暂不可插入。"}</p>}
      <div className="flex flex-wrap gap-2">{(["answer", "explanation"] as const).map(target => <Button key={target} type="button" variant="outline" disabled={!canInsert}
        onClick={() => { if (canInsert) onIntent?.({ ...context, type: "insert-result", target, expression, mode }) }}>插入到题目{target === "answer" ? "答案" : "解析"}</Button>)}</div>
      <section className="min-w-0 space-y-2" aria-label="本次会话历史">
        <h4 className="text-ui-action">本次会话历史</h4>
        {sessionHistory?.length ? <ol className="space-y-3">{sessionHistory.map((item, index) => <li key={index} className="space-y-1">
          <p className="text-read-body break-words">{item.expression} · {modeLabels[item.mode]}</p>
          <p className="text-read-body break-words">{item.text || "结果未知"}{item.unit && ` · ${item.unit}`}</p>
          <p className="text-ui-hint break-words">来源：{sourceText(item.source)}</p>
        </li>)}</ol> : <p className="text-ui-hint">{history === undefined ? "历史未提供" : "暂无本次会话记录"}</p>}
        <Button type="button" variant="outline" disabled={!!reason || !sessionHistory?.length}
          onClick={() => { if (!reason && sessionHistory?.length) onIntent?.({ ...context, type: "clear-history" }) }}>清空历史</Button>
      </section>
    </>}
    <p id={`${id}-boundary`} className="text-ui-hint break-words">计算结果来自{sourceText(current?.source)}，请核对后使用。</p>
    <RecordDetails>{details}</RecordDetails>
    {workspace ? onBack && <div><Button type="button" variant="outline" onClick={() => onBack(context)}>返回原位置</Button></div>
      : onExpand && <div><Button data-calc-expand type="button" variant="outline" onClick={event => onExpand(event.currentTarget, context)}>查看计算过程</Button></div>}
  </Card>
}
