"use client"

import { useRef, useState } from "react"
import { Button } from "../button"
import { AgentEvidenceDrilldown } from "../agent-evidence-drilldown"
import { AgentSuggestionSet, type AgentSuggestion, type AgentSuggestionEntry, type AgentSuggestionIntent, type AgentSuggestionReceipt, type AgentSuggestionSetProps } from "../agent-suggestion-set"

const basis = { summary: "固定示例：讲评摘录记录了配方时漏写常数补偿项的两处作答；未核对全班，不能据此判断普遍学情。", target: { conclusionId: "example-completing-square", version: "example-evidence-v1" } }
const source = "教师讲评摘录 · 固定示例 v1"
const first: AgentSuggestionEntry = {
  id: "example-explain", title: "用配方过程解释对称轴", content: <>先对照配方的每一步，再解释对称轴 <math className="prism-math" aria-label="x 等于负 b 除以二 a"><mi>x</mi><mo>=</mo><mo>−</mo><mfrac><mi>b</mi><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></math> 的来由。</>,
  reason: "让学生先说清等式变形，再使用结论。", evidence: basis, source, scope: "高二三班本次讲评参与者 · 示例", impact: "预计占用讲评 5 分钟；理解改善仍需新作答核对。", certainty: "有限：仅有两处示例摘录。", status: { state: "pending" }, task: { state: "not-created" }, adopt: {}, dismiss: { reason: "" },
  adjustment: { open: false, fields: [{ id: "example-duration", type: "number", label: "讲评时长", unit: "分钟", step: 1, value: 5 }, { id: "example-method", type: "textarea", label: "讲评安排", value: "先核对配方，再解释对称轴。" }] },
}
export const suggestionSetExamples: Record<"teaching" | "learning", { title: string; suggestions: readonly AgentSuggestion[] }> = {
  teaching: {
    title: "讲评后的教学建议 · 示例",
    suggestions: [
      first,
      { ...first, id: "example-question", title: "追问常数项为什么需要补偿，并让学生对照两种解法逐步说明相同与不同之处", content: "请学生指出配方前后相等的条件，再用一个具体数值检验。", reason: "通过解释检验概念理解，不能仅凭最终答案推定掌握。", impact: "预计 3 分钟；可能需要追加个别交流。", certainty: null,
        adjustment: { open: true, message: "本页调整草稿，尚未提交。", fields: [{ id: "example-prompt", type: "textarea", label: "追问内容", value: "配方时增加的常数项，为什么还需要减去？" }, { id: "example-format", type: "select", label: "交流方式", value: "example-pair", options: [{ value: "example-pair", label: "同桌交流" }, { value: "example-class", label: "全班交流" }] }] } },
      { ...first, id: "example-adopted", title: "保留一题作为退出练习", content: "在讲评结束时用一题检查配方过程。", reason: "保留后续核对理解的机会。", status: { state: "adopted" }, adopt: undefined, adjustment: undefined, dismiss: undefined, task: { state: "not-created", description: "示例采纳记录已提供，尚未创建练习任务。" } },
      { ...first, id: "example-dismissed", title: "课后统一追加十题", content: "原建议为统一追加练习量。", reason: "用于比较练习量与课堂负担。", impact: "额外 20 分钟，可能增加重复练习负担。", status: { state: "dismissed", reason: "教师示例记录：先核对个别需要，不统一加量。" }, adopt: undefined, adjustment: undefined, dismiss: undefined },
      { ...first, id: "example-expired", title: "沿用上周小组名单开展辅导", content: "旧建议按上周的小组范围安排交流。", reason: "历史安排供回看。", evidence: { summary: "固定示例：上周的课堂观察摘要。", unavailableReason: "名单与依据已过期，需核对当前范围。" }, source: "上周课堂记录 · 固定示例", status: { state: "expired", reason: "示例小组名单已更新，此建议已过期。" }, adopt: undefined, adjustment: undefined, dismiss: undefined },
      { id: "example-restricted", status: { state: "restricted" }, disclosure: { title: "个别支持建议", reason: "当前范围不允许查看该学生的支持记录。" } },
      { ...first, id: "example-unconfirmed", title: "核对个别交流的采纳结果", content: "保留原请求，等待核对采纳记录。", reason: "回执缺失不能解释为采纳失败。", evidence: null, source: null, certainty: null, status: { state: "unconfirmed", reason: "示例原请求的采纳回执未确认。" }, task: { state: "unconfirmed" }, adopt: {}, adjustment: undefined, dismiss: undefined },
    ],
  },
  learning: {
    title: "学生学习建议 · 通用示例",
    suggestions: [
      { id: "example-self-explain", title: "复述一道例题的解题理由", content: "选一题，用自己的话说明每一步为什么成立。", reason: "把模仿步骤变为能够解释的过程。", evidence: null, source: "固定通用学习示例；未使用个人学情", scope: "学生自主选择", impact: "约 10 分钟；效果需通过新的独立作答核对。", certainty: null, status: { state: "pending" }, task: { state: "not-created" }, adopt: {}, dismiss: { reason: "" }, adjustment: { open: true, message: "时间为本页示例草稿。", fields: [{ id: "example-minutes", type: "number", label: "练习时长", value: 10, unit: "分钟" }] } },
      { id: "example-rest", title: "把练习拆成两段并记录疑问", content: "每完成一小段，就记录仍然不确定的步骤，再决定是否继续。", reason: "为自我检查留出时间。", evidence: null, source: "固定通用学习示例；未使用个人学情", scope: "学生自行安排的练习", impact: "总时长约 15 分钟；需要留出休息间隔。", certainty: null, status: { state: "adjusted" }, task: { state: "not-created" }, adopt: {}, dismiss: { reason: "" }, adjustment: { open: false, fields: [{ id: "example-note", type: "text", label: "检查提示", value: "先写疑问，再决定下一步。" }] } },
    ],
  },
}

/** Fixture state is outside the component. Loading a receipt is separate from requesting an action. */
export function SuggestionSetExample({ purpose, narrow = false }: { purpose: keyof typeof suggestionSetExamples; narrow?: boolean }) {
  const fixture = suggestionSetExamples[purpose]
  const [suggestions, setSuggestions] = useState(fixture.suggestions)
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([fixture.suggestions[0].id])
  const [comparison, setComparison] = useState({ selectedIds: fixture.suggestions.slice(0, 2).map(item => item.id), open: true })
  const [receipt, setReceipt] = useState<AgentSuggestionReceipt>({ state: "idle" })
  const [pending, setPending] = useState<AgentSuggestionIntent | null>(null)
  const [feedback, setFeedback] = useState("固定示例；采纳、调整和任务记录分别提供，未接执行服务。")
  const [evidence, setEvidence] = useState<Extract<AgentSuggestionIntent, { type: "open-evidence" }> | null>(null)
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement>(null)
  const suggestionSet = { id: `example-${purpose}`, version: "example-suggestions-v1", versionLabel: "建议示例 v1" }
  const changeItem = (itemId: string, update: (item: AgentSuggestionEntry) => AgentSuggestionEntry) => setSuggestions(previous => previous.map(item => item.id === itemId && "title" in item ? update(item) : item))
  function act(intent: AgentSuggestionIntent) {
    if (intent.suggestionSetId !== suggestionSet.id || intent.baseVersion !== suggestionSet.version) return
    if (intent.type === "select") { setSelectedIds(previous => [...new Set([...previous, ...intent.suggestionIds])]); return }
    if (intent.type === "deselect") { setSelectedIds(previous => previous.filter(value => !intent.suggestionIds.includes(value))); return }
    if (intent.type === "compare") { setComparison({ selectedIds: [...intent.suggestionIds], open: intent.phase === "select" ? comparison.open : intent.phase === "show" }); return }
    if (intent.type === "open-evidence") { setEvidence(intent); return }
    if (intent.type === "adjust" && intent.phase !== "submit") {
      changeItem(intent.suggestionId, item => ({ ...item, adjustment: item.adjustment && { ...item.adjustment, open: intent.phase !== "cancel", fields: item.adjustment.fields.map(field => ({ ...field, value: intent.values[field.id] }) as typeof field) } }))
      setFeedback("本页调整草稿已更新，采纳和任务记录保持原样。"); return
    }
    if (intent.type === "dismiss" && intent.phase === "reason") { changeItem(intent.suggestionId, item => ({ ...item, dismiss: { ...item.dismiss, reason: intent.reason } })); return }
    setPending(intent); setReceipt({ state: "pending", message: "本页已记录请求，等待独立载入回执。" }); setFeedback("已记录本页请求，请独立载入示例回执；尚不能确认采纳、调整或驳回结果。")
  }
  function loadReceipt() {
    if (!pending) return
    if (pending.type === "adopt") setSuggestions(previous => previous.map(item => "title" in item && pending.suggestionIds.includes(item.id) ? { ...item, status: { state: "adopted" } } : item))
    if (pending.type === "adjust") changeItem(pending.suggestionId, item => ({ ...item, status: { state: "adjusted" }, adjustment: item.adjustment && { ...item.adjustment, open: false, message: "已载入示例调整记录；任务状态未改变。" } }))
    if (pending.type === "dismiss") changeItem(pending.suggestionId, item => ({ ...item, status: { state: "dismissed", reason: pending.reason } }))
    setReceipt({ state: "received", message: "已载入本页示例回执；任务记录保持原样。" }); setPending(null)
  }
  const common: AgentSuggestionSetProps = { title: fixture.title, suggestionSet, suggestions, selectedIds, receipt, comparison, adopt: {}, confirm: {}, onIntent: act,
    onExpand: element => { trigger.current = element; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    details: <p>本页仅用固定示例核对选择、比较和调整。共用说明只合并完全相同的依据或来源；证据不足与回执未确认保持可见。刷新后还原。</p>,
  }
  const selectedEvidenceItem = evidence && suggestions.find(item => "evidence" in item && item.evidence?.target?.conclusionId === evidence.target.conclusionId) as AgentSuggestionEntry | undefined
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例 · 两态与紧凑用法共用一份选择及调整草稿。教学建议的完整状态在扩展区展示。</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="独立载入示例事实">
      <Button type="button" size="navigation" variant="outline" disabled={!pending} onClick={() => setReceipt({ state: "unconfirmed", message: "示例原请求的结果暂不可核对。" })}>载入未确认回执</Button>
      <Button type="button" size="navigation" variant="outline" disabled={!pending} onClick={loadReceipt}>载入操作回执（示例）</Button>
      <Button type="button" size="navigation" variant="outline" disabled={!pending} onClick={() => { setReceipt({ state: "failed", message: "示例记录确认操作失败，原建议与选择保留。" }); setPending(null) }}>载入失败记录</Button>
      <Button type="button" size="navigation" variant="outline" onClick={() => { setSuggestions(previous => previous.map(item => "title" in item && item.status.state === "adopted" ? { ...item, task: { state: "created", description: "固定任务记录示例；未建立真实教学任务。" } } : item)); setFeedback("已独立载入固定任务记录示例，未调用任务创建服务。") }}>载入任务记录（示例）</Button>
    </div>
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    {evidence && <section aria-label="建议依据示例" className="min-w-0 space-y-2"><AgentEvidenceDrilldown view="workspace"
      conclusion={{ id: evidence.target.conclusionId, statement: "讲评摘录依据 · 固定示例", version: "证据示例 v1", summary: selectedEvidenceItem?.evidence?.summary ?? "未提供", coverage: { state: "incomplete", description: "仅有人工编写的示例摘录，没有真实学生作答。" } }}
      nodes={[]} onBack={() => setEvidence(null)} /></section>}
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "推荐短列表"], ["workspace", "default", "比较、采纳与调整"], ["inline", "compact", "紧凑建议"],
    ] as const).map(([view, density, label]) => <section key={label} aria-label={label} ref={view === "workspace" ? workspace : undefined} tabIndex={view === "workspace" ? -1 : undefined}
      className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3>
      <AgentSuggestionSet {...common} view={view} density={density} suggestions={view === "workspace" ? suggestions : suggestions.filter((item, index) => index < 3 || selectedIds.includes(item.id))} />
    </section>)}</div>
  </div>
}

export function AgentSuggestionSetDemo() {
  const [purpose, setPurpose] = useState<keyof typeof suggestionSetExamples>("teaching"), [narrow, setNarrow] = useState(false)
  return <section id="suggestion-set" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">建议集 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["teaching", "learning"] as const).map(value => <Button key={value} type="button" size="navigation" variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "teaching" ? "讲评后的教学建议" : "学生学习建议（通用）"}</Button>)}
      <Button type="button" size="navigation" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div><SuggestionSetExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
