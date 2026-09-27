"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Button } from "../button"
import { AgentInteractiveDemo, type AgentDemoCapabilities, type AgentDemoIntent, type AgentDemoParameter } from "../agent-interactive-demo"
import { AgentSimulationLab, type AgentLabCapabilities, type AgentLabIntent, type AgentLabResult, type AgentLabVariable } from "../agent-simulation-lab"

export const demoCapabilities: AgentDemoCapabilities = {
  interact: { supported: true }, fullscreen: { supported: false, reason: "本示例未提供全屏演示。" },
  record: { supported: false, reason: "本示例不保存或分享演示。" }, share: { supported: false, reason: "本示例不保存或分享演示。" },
}
export const labCapabilities: AgentLabCapabilities = {
  run: { supported: true, reason: "仅返回预置模拟结果。" }, step: { supported: true }, record: { supported: true, reason: "仅保留本页结论草稿。" },
  export: { supported: false, reason: "本示例未提供导出文件。" },
}
export const initialDemoParameters: readonly AgentDemoParameter[] = [
  { id: "coefficient", label: "开口系数 a", min: -3, max: 3, step: 0.5, value: 1 },
  { id: "horizontal", label: "水平平移 h", min: -3, max: 3, step: 0.5, value: 0 },
  { id: "vertical", label: "竖直平移 k", min: -3, max: 3, step: 0.5, value: 0 },
]
export const initialLabVariables: readonly AgentLabVariable[] = [{ id: "trials", label: "抛掷次数", min: 10, max: 1000, step: 10, value: 100, unit: "次" }]
export const labSteps = [
  { id: "prepare", title: "确定次数", description: "先预测正面频率，再选择抛掷次数。" },
  { id: "observe", title: "查看结果", description: "运行后查看固定模拟数据，与预测比较。" },
  { id: "conclude", title: "记录观察", description: "区分本次频率与理论概率，不将单次结果作为普遍结论。" },
]
/** Example host only: fixed mapping, no randomness or simulation engine. */
export function fixedCoinResult(count: number): AgentLabResult | undefined {
  const samples: Record<number, [number, number]> = { 10: [6, 0.6], 100: [52, 0.52], 1000: [503, 0.503] }
  const sample = samples[count]
  if (!sample) return undefined
  return { labId: "coin-example", version: "example-v1", summary: `${count} 次抛掷，正面 ${sample[0]} 次，正面频率 ${sample[1]}。`,
    inputs: [{ label: "抛掷次数", value: count, unit: "次" }], source: { kind: "simulation", label: "预置课堂样例" },
    values: [{ label: "正面次数", value: sample[0], unit: "次" }, { label: "反面次数", value: count - sample[0], unit: "次" }, { label: "正面频率", value: sample[1], unit: "比例" }],
    plot: { label: "本次正面频率（模拟）", xLabel: "抛掷次数", yLabel: "正面频率", xUnit: "次", yDomain: [0, 1], data: [{ id: "sample", label: "本次结果", x: count, y: sample[1] }] },
  }
}

function useExampleView(selector: string) {
  const [view, setView] = useState<"inline" | "workspace">("inline")
  const panel = useRef<HTMLDivElement>(null), entry = useRef<HTMLButtonElement | null>(null), pending = useRef(false)
  useLayoutEffect(() => {
    if (!pending.current) return
    pending.current = false
    if (view === "workspace") panel.current?.focus()
    else if (entry.current?.isConnected) entry.current.focus()
    else panel.current?.querySelector<HTMLButtonElement>(selector)?.focus()
  }, [view, selector])
  return { view, panel, onExpand: (trigger: HTMLButtonElement) => { entry.current = trigger; pending.current = true; setView("workspace") }, onBack: () => { pending.current = true; setView("inline") } }
}

export function InteractiveDemoExample({ compact = false, narrow = false }: { compact?: boolean; narrow?: boolean }) {
  const [parameters, setParameters] = useState(initialDemoParameters)
  const navigation = useExampleView("[data-demo-expand]")
  const [a, h, k] = parameters.map(item => item.value)
  const valid = parameters.every(item => item.value !== null && Number.isFinite(item.value) && item.value >= item.min && item.value <= item.max)
  const description = valid ? `y = ${a}(x − ${h})² + ${k}。${a === 0 ? `a 为 0 时退化为水平直线 y = ${k}，不是二次函数。` : `顶点为 (${h}, ${k})，开口${a! > 0 ? "向上" : "向下"}。`}图中横轴范围为 −5 至 5，纵轴范围为 −5 至 5，超出部分不显示。` : "请补全范围内的参数后查看图像。"
  // Domain rendering belongs solely to this explicitly simulated example host.
  const points = valid ? Array.from({ length: 201 }, (_, index) => {
    const x = index / 20 - 5, y = a! * (x - h!) ** 2 + k!
    return `${(x + 5) * 30},${(5 - y) * 20}`
  }).join(" ") : ""
  const visual = valid ? <svg role="img" aria-label="二次函数参数图像示意" viewBox="0 0 300 200" className="block w-full" overflow="hidden">
    <title>二次函数参数图像示意</title><desc>{description}</desc>
    <path d="M0 100H300 M150 0V200" fill="none" stroke="currentColor" />
    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
  </svg> : null
  function receive(intent: AgentDemoIntent) {
    if (intent.demoId !== "quadratic-example" || intent.version !== "example-v1") return
    if (intent.type === "param-change") setParameters(items => items.map(item => item.id === intent.parameterId ? { ...item, value: intent.value } : item))
    if (intent.type === "reset") setParameters(initialDemoParameters)
  }
  return <div ref={navigation.panel} tabIndex={-1} className={`min-w-0 ${narrow ? "max-w-[320px]" : ""}`}>
    <AgentInteractiveDemo demoId="quadratic-example" version="example-v1" title="二次函数参数演示（模拟）" subject="数学" grade="九年级"
      parameters={parameters} preview={visual} content={visual} description={description}
      teachingTips={["保持 h、k 不变，比较 a 的正负与绝对值如何影响开口。", "保持 a 不变，观察 h、k 与顶点位置的关系；先预测，再调整并用完整中文说明观察依据。"]}
      capabilities={demoCapabilities} mobileSupport={{ supported: true, reason: "可查看图像、用数值输入或滑块调整参数；触屏可靠性待验证。" }}
      source={{ label: "课堂参数示意（模拟）", openable: false }} view={navigation.view} density={compact ? "compact" : "default"}
      onIntent={receive} onExpand={navigation.onExpand} onBack={navigation.onBack} details="图像由本页示例生成，仅用于观察参数变化，刷新后恢复初始值。" />
  </div>
}
export function SimulationLabExample({ compact = false, narrow = false }: { compact?: boolean; narrow?: boolean }) {
  const navigation = useExampleView("[data-lab-expand]")
  const [variables, setVariables] = useState(initialLabVariables), [result, setResult] = useState<AgentLabResult | null | undefined>(null)
  const [currentStepId, setStep] = useState("prepare"), [conclusionDraft, setNote] = useState("")
  function receive(intent: AgentLabIntent) {
    if (intent.labId !== "coin-example" || intent.version !== "example-v1") return
    if (intent.type === "set-variable") setVariables(items => items.map(item => item.id === intent.variableId ? { ...item, value: intent.value } : item))
    if (intent.type === "run-request") setResult(fixedCoinResult(intent.variables[0].value))
    if (intent.type === "step") setStep(intent.stepId)
    if (intent.type === "record-note") setNote(intent.text)
  }
  return <div ref={navigation.panel} tabIndex={-1} className={`min-w-0 space-y-2 ${narrow ? "max-w-[320px]" : ""}`}>
    <p className="text-ui-hint">模拟样例仅提供 10、100、1000 次的固定结果；其他次数结果未知。结论仅保留在本页，刷新重置。</p>
    <AgentSimulationLab labId="coin-example" version="example-v1" title="抛硬币频率实验（模拟）" objective="比较不同次数下的正面频率，辨别频率与概率。"
      steps={labSteps} currentStepId={currentStepId} variables={variables} result={result} records={[]}
      conclusionDraft={conclusionDraft} capabilities={labCapabilities} mobileSupport={{ supported: true, reason: "提供数值输入与结果表格；真实移动设备待验证。" }}
      view={navigation.view} density={compact ? "compact" : "default"} onIntent={receive} onExpand={navigation.onExpand} onBack={navigation.onBack}
      details="没有真实随机抛掷；运行只展示预置模拟数据，调整变量后仍保留最近结果的运行时次数。" />
  </div>
}
export function AgentInteractiveDemoDemo() {
  const [compact, setCompact] = useState(false), [narrow, setNarrow] = useState(false)
  return <section id="interactive-demo" className="min-w-0 space-y-5 py-6">
    <h2 className="text-section-title">交互演示器</h2>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" aria-pressed={compact} onClick={() => setCompact(value => !value)}>紧凑密度</Button><Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button></div>
    <InteractiveDemoExample compact={compact} narrow={narrow} />
  </section>
}
export function AgentSimulationLabDemo() {
  const [compact, setCompact] = useState(false), [narrow, setNarrow] = useState(false)
  return <section id="simulation-lab" className="min-w-0 space-y-5 py-6">
    <h2 className="text-section-title">模拟器 / 虚拟实验</h2>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" aria-pressed={compact} onClick={() => setCompact(value => !value)}>紧凑密度</Button><Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button></div>
    <SimulationLabExample compact={compact} narrow={narrow} />
  </section>
}
