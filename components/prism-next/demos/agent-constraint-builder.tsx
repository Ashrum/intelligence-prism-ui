"use client"

import { useRef, useState } from "react"
import { Button } from "../button"
import { AgentConstraintBuilder, type AgentConstraintBuilderProps, type AgentConstraintChange, type AgentConstraintGroup, type AgentConstraintItem } from "../agent-constraint-builder"
import { AgentExecutionConfirmation, type AgentConfirmationState } from "../agent-semantic-components"

const difficultyTargets = ["基础题", "中等题", "较难题"].map((label, index) => ({ objectId: "paper-example", version: "条件 v2", label, location: "难度比例", anchor: `difficulty-${index}` }))
export const constraintExamples: Record<"p04" | "paper", { title: string; groups: readonly AgentConstraintGroup[] }> = {
  p04: {
    title: "P04 处理条件（示例）",
    groups: [{ id: "processing", label: "页面处理", items: [
      { id: "deduplicate", type: "toggle", label: "排除重复页", value: true, defaultValue: true, critical: true,
        impact: "排除第 4 页重复页。", validation: { state: "valid" } },
      { id: "blurry", type: "toggle", label: "模糊页先询问", value: false, defaultValue: true, critical: true,
        description: "遇到无法辨认的页面，先询问再继续。", impact: "当前跳过第 2 页模糊区域。", validation: { state: "valid" } },
    ] }],
  },
  paper: {
    title: "函数单元组卷条件（示例）",
    groups: [
      { id: "quantity", label: "题量与内容", items: [
        { id: "count", type: "bounds", label: "题量范围", value: { min: 12, max: 15 }, defaultValue: { min: 10, max: 15 }, unit: "题", critical: true, validation: { state: "valid" } },
        { id: "knowledge", type: "forbidden", label: "禁止重复知识点", value: true, defaultValue: true, critical: true, validation: { state: "valid" } },
        { id: "source", type: "required", label: "必须保留题目来源", value: true, defaultValue: true, critical: false, validation: { state: "valid" } },
      ] },
      { id: "difficulty", label: "难度比例", description: "按基础题、中等题、较难题分别设置。", items: [
        { id: "easy", type: "ratio", label: "基础题比例", value: 50, defaultValue: 50, critical: true,
          validation: { state: "conflict", reason: "难度比例合计不为 100%", targets: difficultyTargets } },
        { id: "medium", type: "ratio", label: "中等题比例", value: 40, defaultValue: 30, critical: true, validation: { state: "valid" } },
        { id: "hard", type: "ratio", label: "较难题比例", value: 20, defaultValue: 20, critical: true, validation: { state: "valid" } },
      ] },
      { id: "rules", label: "出题规则", items: [
        { id: "answer", type: "rule", control: "radio", label: "答案要求", value: "steps", defaultValue: "steps", critical: false,
          options: [{ value: "steps", label: "附解题过程" }, { value: "result", label: "仅附结果" }], validation: { state: "valid" } },
        { id: "context", type: "rule", label: "情境要求", value: "applied", defaultValue: "none", critical: false,
          options: [{ value: "none", label: "不限情境" }, { value: "applied", label: "结合图像与实际情境，保留条件、单位以及完整推理过程" }], validation: { state: "valid" } },
        { id: "ability", type: "rule", label: "能力层级规则", value: "balanced", defaultValue: "balanced", critical: false,
          options: [{ value: "balanced", label: "兼顾不同能力层级" }], validation: { state: "unavailable", reason: "能力标签尚未提供，暂不能按能力分层。" } },
      ] },
    ],
  },
}

type ExampleValues = Record<string, AgentConstraintItem["value"]>

/** Fixture host policy, outside the reusable component. No execution or receipt is inferred. */
export function constraintExampleConfirmation({ version, confirmedVersion, preparedVersion, hasIssues, onPrepare, onConfirm }: {
  version: string; confirmedVersion?: string; preparedVersion?: string; hasIssues: boolean; onPrepare: () => void; onConfirm: () => void
}): AgentConfirmationState {
  if (hasIssues) return { state: "blocked", description: "请先处理冲突与不可用条件，再核对执行要求。" }
  if (confirmedVersion === version) return { state: "recorded", description: "已载入本次条件的示例确认记录。" }
  if (preparedVersion === version) return { state: "ready", confirm: { label: "确认本次处理条件", onAction: onConfirm } }
  return { state: "blocked", description: "上次确认不再适用于当前条件。", review: { label: "核对本次条件", onAction: onPrepare } }
}

export function ConstraintBuilderExample({ purpose, narrow }: { purpose: keyof typeof constraintExamples; narrow: boolean }) {
  const example = constraintExamples[purpose], originals = example.groups.flatMap(group => group.items)
  const [values, setValues] = useState<ExampleValues>(() => Object.fromEntries(originals.map(item => [item.id, item.value])))
  const [revision, setRevision] = useState(2)
  const [confirmed, setConfirmed] = useState<{ version: string; values: ExampleValues }>(() => ({ version: "条件 v1", values: {
    ...Object.fromEntries(originals.map(item => [item.id, item.defaultValue])),
  } }))
  const [preparedVersion, setPreparedVersion] = useState<string>(), [requestedVersion, setRequestedVersion] = useState<string>()
  const [frozen, setFrozen] = useState(false), [defaultsRequested, setDefaultsRequested] = useState(false)
  const [showConflict, setShowConflict] = useState(true), [showUnavailable, setShowUnavailable] = useState(true)
  const [feedback, setFeedback] = useState("尚未发起处理请求。")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
  const version = `条件 v${revision}`
  // This illustrative host supplies all business texts, comparisons and validation results.
  const groups = example.groups.map(group => ({ ...group, items: group.items.map(item => ({ ...item, value: values[item.id],
    impact: purpose === "p04" ? item.id === "deduplicate" ? values.deduplicate ? "排除第 4 页重复页。" : "保留第 4 页重复页。"
      : values.blurry ? "第 2 页模糊区域先等待询问。" : "当前跳过第 2 页模糊区域。" : item.impact,
    validation: (item.id === "easy" && !showConflict) || (item.id === "ability" && !showUnavailable) ? { state: "valid" } : item.validation,
  }) as AgentConstraintItem) }))
  const hasIssues = groups.some(group => group.items.some(item => item.validation.state !== "valid"))
  const changedItems = originals.filter(item => JSON.stringify(values[item.id]) !== JSON.stringify(confirmed.values[item.id]))
  const changedCritical = changedItems.some(item => item.critical)
  const describe = (item: AgentConstraintItem, value: AgentConstraintItem["value"]) => {
    if (typeof value === "boolean") return value ? "开启" : "关闭"
    if (value === null) return "未指定"
    if (typeof value === "object") return `${value.min ?? "未指定"}–${value.max ?? "未指定"}${item.type === "bounds" ? item.unit ?? "" : ""}`
    return item.type === "rule" ? item.options.find(option => option.value === value)?.label ?? "未指定" : `${value}%`
  }
  const update = (change: AgentConstraintChange) => {
    if (frozen || change.objectId !== purpose || change.version !== version) return
    setValues(previous => ({ ...previous, [change.constraintId]: change.value })); setRevision(value => value + 1)
    setPreparedVersion(undefined); setRequestedVersion(undefined); setDefaultsRequested(false)
    setFeedback("条件已调整；请核对本次要求。")
  }
  const common: AgentConstraintBuilderProps = {
    title: example.title, basis: { objectId: purpose, version }, groups,
    reconfirmation: changedCritical ? { required: true, reason: "关键处理条件与上次确认不同。" } : { required: false },
    changes: changedItems.map(item => ({ id: item.id, label: item.label, description: `${describe(item, confirmed.values[item.id])} → ${describe(item, values[item.id])}` })),
    disabledReason: frozen ? "本次条件已确认，当前仅可查看。" : undefined,
    onValueChange: update,
    onRestoreDefaults: () => { setDefaultsRequested(true); setFeedback("已请求恢复默认；条件尚未替换。") },
    onLocateConflict: request => setFeedback(`已请求定位：${request.target.label} · ${request.target.location}。`),
    onExpand: button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) },
    details: <p>展开和返回保留同一份条件。此处不处理真实材料；恢复默认和确认结果可分别载入示例记录。</p>,
  }
  const confirmation = constraintExampleConfirmation({ version, confirmedVersion: confirmed.version, preparedVersion, hasIssues,
    onPrepare: () => setPreparedVersion(version),
    onConfirm: () => { setRequestedVersion(version); setFeedback("已请求确认本次条件；确认结果尚未收到。") },
  })
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例，刷新后还原。三个视图共用当前条件；校验和确认记录单独载入。</p>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" disabled={requestedVersion !== version || hasIssues} onClick={() => {
        if (requestedVersion !== version || hasIssues) return
        setConfirmed({ version, values: { ...values } }); setFrozen(true); setRequestedVersion(undefined)
        setFeedback("已载入示例确认记录，当前条件仅可查看。")
      }}>载入示例确认记录</Button>
      <Button type="button" variant="outline" disabled={!frozen} onClick={() => setFrozen(false)}>调整已确认条件（示例）</Button>
      <Button type="button" variant="outline" disabled={!defaultsRequested || frozen} onClick={() => {
        if (!defaultsRequested || frozen) return
        setValues(Object.fromEntries(originals.map(item => [item.id, item.defaultValue]))); setRevision(value => value + 1)
        setPreparedVersion(undefined); setRequestedVersion(undefined); setDefaultsRequested(false)
        setFeedback("已载入默认条件示例；请核对后确认。")
      }}>载入默认条件示例</Button>
      {purpose === "paper" && <>
        <Button type="button" variant="outline" aria-pressed={showConflict} onClick={() => { setShowConflict(value => !value); setPreparedVersion(undefined); setRequestedVersion(undefined) }}>比例冲突结果（示例）</Button>
        <Button type="button" variant="outline" aria-pressed={showUnavailable} onClick={() => { setShowUnavailable(value => !value); setPreparedVersion(undefined); setRequestedVersion(undefined) }}>规则不可用结果（示例）</Button>
      </>}
    </div>
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    {purpose === "paper" && <div className="space-y-2">
      <p className="text-ui-hint">修改比例不改变此处的示例冲突结果；可用上方按钮切换检查结果。</p>
      <p className="text-ui-hint">示例知识点：二次函数的对称轴 <math className="prism-math" aria-label="x 等于负 b 除以二 a"><mi>x</mi><mo>=</mo><mo>−</mo><mfrac><mi>b</mi><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></math>。</p>
    </div>}
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "主要条件与执行确认"], ["workspace", "default", "全部条件与冲突定位"], ["inline", "compact", "紧凑条件"],
    ] as const).map(([view, density, label]) => <section key={`${view}-${density}`} aria-label={label} ref={view === "workspace" ? workspace : undefined}
      tabIndex={view === "workspace" ? -1 : undefined} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3>
      {view === "inline" && density === "default" ? <AgentExecutionConfirmation title={purpose === "p04" ? "确认处理范围（示例）" : "确认组卷条件（示例）"}
        target={purpose === "p04" ? "扫描材料 · 4 页" : "函数单元练习"} version={version}
        effects={[purpose === "p04" ? "按本次条件整理材料，生成后仍需人工核对。" : "按本次条件准备候选试题，尚未生成或发布。"]}
        conditions={<AgentConstraintBuilder {...common} presentation="inline" />} confirmation={confirmation} />
        : <AgentConstraintBuilder {...common} view={view} density={density} />}
    </section>)}</div>
  </div>
}

export function AgentConstraintBuilderDemo() {
  const [purpose, setPurpose] = useState<keyof typeof constraintExamples>("p04"), [narrow, setNarrow] = useState(false)
  return <section id="constraint-builder" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">约束构建器 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["p04", "paper"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"}
      aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "p04" ? "P04 处理条件示例" : "组卷约束示例"}</Button>)}
      <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <ConstraintBuilderExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
