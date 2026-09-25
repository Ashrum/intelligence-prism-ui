"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "../button"
import { AgentMetricSummary, type AgentMetricDrilldownIntent, type AgentMetricSummaryProps } from "../agent-metric-summary"
import { AgentEvidenceDrilldown } from "../agent-evidence-drilldown"

type MetricFixture = Pick<AgentMetricSummaryProps, "title" | "record" | "scope" | "groups" | "anomalies" | "notice" | "details">
export const metricSummaryExamples: Record<"learning" | "grading", MetricFixture> = {
  learning: {
    title: "班级学情 · 示例",
    record: { id: "fixture-learning", version: "学情示例 v3", dataTime: "2026-09-25 10:00" },
    scope: { state: "available", summary: "高二三班 · 二次函数 · 9 月 18 日至 25 日作业", restricted: { count: "1 个班级", reason: "其他班级不在本次可见范围内。" } },
    groups: [
      { id: "learning", label: "学习表现", items: [
        { id: "accuracy", access: "available", label: "正确率", key: true, reading: { state: "available", value: "72.50", unit: "%" },
          denominator: "120 项有效作答", sampleSize: "36 名学生", method: "正确作答 87 项；仅纳入本次作业有效作答，不外推稳定能力。",
          trend: { label: "三次作业正确率", unit: "%", domain: [0, 100], series: [{ id: "accuracy", label: "正确率", data: [
            { id: "day-18", label: "9 月 18 日", value: 78 }, { id: "day-22", label: "9 月 22 日", value: null }, { id: "day-25", label: "9 月 25 日", value: 72.5 },
          ] }], note: "9 月 22 日缺测，图中保留空缺。" },
          statements: [{ kind: "explanation", text: "本次记录覆盖基础练习与综合应用两类作答。", source: "示例统计记录 · 学情示例 v3" }] },
        { id: "transfer", access: "available", label: "迁移应用正确率", reading: { state: "insufficient", reason: "有效样本仅 3 份，未达到本次分析要求的 12 份。" },
          denominator: "3 份有效答卷", sampleSize: "3 名学生", method: "本项暂不提供比例，保留样本不足标记。" },
        { id: "quadratic", access: "available", label: "结合二次函数图像与实际情境判断最值及变化范围的正确率", reading: { state: "available", value: "58.0", unit: "%" },
          denominator: "50 项有效作答", sampleSize: "30 名学生", method: "按示例评分记录统计；与前次相同题组比较。", baseline: "9 月 18 日同题组 · 76.0%",
          change: { text: "较上次减少 18 个百分点", direction: "decrease", significance: "significant", basis: { state: "available", id: "quadratic-change", label: "同题组对照记录 · 示例规则判定" } },
          statements: [{ kind: "recommendation", text: <>可先核对对称轴 <math className="prism-math" aria-label="x 等于负 b 除以二 a"><mi>x</mi><mo>=</mo><mo>−</mo><mfrac><mi>b</mi><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></math> 的相关作答。</>, source: "教师示例批注 · 2026-09-25" }] },
      ] },
      { id: "participation", label: "作业参与", items: [
        { id: "completion", access: "available", label: "完成率", key: true, reading: { state: "available", value: "90.0", unit: "%" },
          denominator: "应交 40 人", sampleSize: "已交 36 人", method: "以本次任务提交记录为准，不表示已批阅或已复核。" },
        { id: "duration", access: "available", label: "用时中位数", reading: { state: "missing", reason: "本次未采集作答用时。" },
          denominator: "未提供", sampleSize: "未提供", method: "未采集的数据不补零。" },
      ] },
    ],
    anomalies: [{ id: "decline", access: "available", text: "函数应用题组出现显著下降，建议核对作答记录。", basis: { state: "available", id: "decline-evidence", label: "教师提供的题组对照记录 · 示例" } }],
    notice: "指标用于描述本次记录，不等同于学习结论。",
    details: <p>数值、显著性与建议均为固定示例。正式分析需要核对样本范围与统计口径；本例没有连接学校学情服务。</p>,
  },
  grading: {
    title: "批阅进度 · 示例",
    record: { id: "fixture-grading", version: "批阅示例 v2", dataTime: "2026-09-25 11:30" },
    scope: { state: "available", summary: "高二三班 · 第一次函数练习 · 本次 26 份答卷" },
    groups: [
      { id: "review", label: "复核数量", items: [
        { id: "reviewed", access: "available", label: "已复核", key: true, reading: { state: "available", value: 18, unit: "份" },
          denominator: "26 份答卷", sampleSize: "26 份答卷", method: "仅包含具有对应版本复核记录的答卷。",
          trend: { label: "三次记录中的已复核数量", unit: "份", series: [{ id: "reviewed", label: "已复核", data: [
            { id: "9", label: "09:00", value: 5 }, { id: "10", label: "10:00", value: 12 }, { id: "11", label: "11:30", value: 18 },
          ] }] } },
        { id: "pending", access: "available", label: "待复核", key: true, reading: { state: "available", value: 6, unit: "份" },
          denominator: "26 份答卷", sampleSize: "26 份答卷", method: "待复核清单给出的数量，不从总数减去已复核数推算。" },
        { id: "abnormal", access: "available", label: "异常数", key: true, reading: { state: "available", value: 2, unit: "份" },
          denominator: "26 份答卷", sampleSize: "26 份答卷", method: "异常清单单独给出，分类是否重叠以任务口径为准。" },
      ] },
      { id: "receipts", label: "回执与可见范围", items: [
        { id: "last-batch", access: "available", label: "最近一批复核结果", reading: { state: "unknown", reason: "最近一批的回执尚未核对，当前不提供完成数量。" },
          denominator: "最近一批 2 份答卷", sampleSize: "2 份答卷", method: "等待核对原请求回执，不把点击确认计为已复核。" },
        { id: "restricted-metric", access: "restricted", disclosure: { count: "2 项", reason: "当前仅可查看批次计数，个别学生记录不可披露。" } },
      ] },
    ],
    anomalies: [
      { id: "review-conflict", access: "available", text: "2 份答卷的评分存在冲突，等待核对。", basis: { state: "available", id: "conflicts", label: "异常清单 · 批阅示例 v2" } },
      { id: "receipt-missing", access: "available", text: "最近一批复核状态未确认。", basis: { state: "unavailable", reason: "原请求回执暂不可用。" } },
    ],
    notice: "示例计数不代表真实批阅服务已完成。",
    details: <p>已复核、待复核和异常数分别来自示例记录；不自动计算占比，也不补造回执。</p>,
  },
}

export function MetricSummaryExample({ purpose, narrow = false }: { purpose: "learning" | "grading"; narrow?: boolean }) {
  const example = metricSummaryExamples[purpose]
  const [snapshot, setSnapshot] = useState(false)
  const [selected, setSelected] = useState<AgentMetricDrilldownIntent | null>(null)
  const workspace = useRef<HTMLElement>(null)
  const evidence = useRef<HTMLElement>(null)
  const expandTrigger = useRef<HTMLButtonElement>(null)
  const evidenceTrigger = useRef<HTMLButtonElement>(null)
  const record = { ...example.record, snapshot }
  useEffect(() => {
    if (selected) { evidence.current?.focus({ preventScroll: true }); evidence.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) }
  }, [selected])
  const returnTo = (trigger: HTMLButtonElement | null) => { trigger?.focus(); trigger?.scrollIntoView({ block: "nearest", behavior: "instant" }) }
  const common: AgentMetricSummaryProps = { ...example, record,
    onExpand: trigger => { expandTrigger.current = trigger; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    onBack: () => returnTo(expandTrigger.current),
    onDrilldown: (intent, trigger) => { evidenceTrigger.current = trigger; setSelected(intent) },
  }
  const metric = selected && selected.kind !== "anomaly" ? example.groups.flatMap(group => group.items).find(item => item.id === selected.metricId) : undefined
  const anomaly = selected?.kind === "anomaly" ? example.anomalies?.find(item => item.id === selected.anomalyId) : undefined
  const selectedLabel = metric?.access === "available" ? metric.label : anomaly?.access === "available" ? anomaly.text : "指标依据"
  const selectedBasis = selected?.kind === "change" && metric?.access === "available" ? metric.change?.basis : anomaly?.access === "available" ? anomaly.basis : undefined
  const basisVersion = selected && selected.kind !== "anomaly" ? selected.metricVersion : selected?.version
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例 · 三处共用同一份数据；下钻打开示例依据，数值和状态保持不变。</p>
    <Button type="button" variant="outline" size="navigation" aria-pressed={snapshot} onClick={() => { setSnapshot(value => !value); setSelected(null) }}>切换当时数据示例</Button>
    {selected && <section ref={evidence} tabIndex={-1} aria-label="指标依据示例" className="min-w-0"><AgentEvidenceDrilldown view="workspace" conclusion={{ id: "metric-fixture-basis", statement: `指标依据 · ${selectedLabel}`, version: selected.version,
      snapshot: snapshot ? "当时依据 · 示例" : undefined, coverage: { state: "incomplete", description: "固定示例仅提供口径和来源说明，没有实际学生作答。" } }}
      nodes={[{ id: "fixture-basis", kind: "evidence", title: selectedBasis?.state === "available" ? selectedBasis.label : selectedLabel, type: "示例统计记录",
        source: { objectId: example.record.id, label: example.title, version: basisVersion, location: "示例指标说明" },
        relation: "pending", facts: [{ state: "incomplete", description: "当前仅展示示例口径，不作为真实学习或批阅证据。" }],
        summary: metric?.access === "available" ? metric.method : anomaly?.access === "available" ? anomaly.text : undefined }]}
      onBack={() => { setSelected(null); returnTo(evidenceTrigger.current) }} /></section>}
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "对话指标摘要"], ["workspace", "default", "完整指标体系"], ["inline", "compact", "紧凑指标摘要"],
    ] as const).map(([view, density, label]) => <section key={label} ref={view === "workspace" ? workspace : undefined}
      tabIndex={view === "workspace" ? -1 : undefined} aria-label={label} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentMetricSummary {...common} view={view} density={density} />
    </section>)}</div>
  </div>
}

export function AgentMetricSummaryDemo() {
  const [purpose, setPurpose] = useState<"learning" | "grading">("learning")
  const [narrow, setNarrow] = useState(false)
  return <section id="metric-summary" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">指标摘要 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["learning", "grading"] as const).map(value => <Button key={value} type="button" size="navigation"
      variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "learning" ? "班级学情示例" : "批阅进度示例"}</Button>)}
      <Button type="button" size="navigation" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <MetricSummaryExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
