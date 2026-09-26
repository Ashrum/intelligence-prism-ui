"use client"

import { useId, useRef, useState } from "react"
import { Label } from "@/components/coss/label"
import { AgentCandidatePicker, type AgentCandidate, type AgentCandidateIntent, type AgentCandidatePickerProps, type AgentCandidateResult, type AgentCandidateSubmission } from "../agent-candidate-picker"
import { Button } from "../button"
import { QuestionCard } from "../question-card"
import { QuestionSelect } from "../question-controls"
import { questionSamples } from "../fixtures/question-samples"

export const candidatePickerExamples: Record<"questions" | "learners", { title: string; candidates: readonly AgentCandidate[] }> = {
  questions: {
    title: "挑选练习题 · 示例",
    candidates: [
      { id: questionSamples[0].id, title: questionSamples[0].title, type: "题目", status: "available", summary: "含分式与根式，供核对计算过程。", rationale: "示例：为本次讲评补充一道共轭式化简练习。", source: "示例题库 · 计算练习",
        alternatives: [{ candidateId: questionSamples[1].id, reason: "示例：也可改用函数性质辨析，供老师比较本次练习的侧重点；不表示知识点等价。" }] },
      { id: questionSamples[1].id, title: questionSamples[1].title, type: "题目", status: "available", summary: "候选替代题，需老师判断是否符合教学目标。", rationale: "示例：补充对称轴、值域与零点的综合判断。", source: "示例校本练习 · 函数单元" },
      { id: questionSamples[3].id, title: "动点与矩形面积 · 旧版候选", type: "题目", status: "invalid", reason: "示例题目已下架，不能继续选用。", rationale: "示例：曾按函数建模主题列为候选。", source: "示例题库 · 旧版记录" },
      { id: "example-restricted-question", status: "restricted", disclosure: { title: "受限题目", reason: "来源许可不包含当前使用范围，题面不可查看。" } },
      { id: questionSamples[2].id, title: questionSamples[2].title, type: "题目", status: "in-collection", rationale: "示例：已由老师选入本页示例题篮。", source: "示例题篮记录" },
      { id: "example-extra-question", title: "补充候选：根式计算巩固", type: "题目", status: "available", summary: "用于演示加载更多后的结果，题面复用本页示例。", rationale: "示例：补充练习数量，仍需老师核对适用性。", source: "示例补充结果" },
    ],
  },
  learners: {
    title: "挑选学生与知识点 · 示例",
    candidates: [
      { id: "example-learner-lin", title: "林同学", type: "学生", status: "available", summary: "高二三班 · 本次小组交流候选。", rationale: "示例：教师提供的交流名单中有此同学，不代表已诊断学习困难。", source: "教师提供的示例名单" },
      { id: "example-knowledge-fraction", title: "结合分式有意义的条件、根式运算与二次函数图像进行跨知识点辨析和错因复核", type: "知识点", status: "available", summary: "长中文知识点名称，用于核对窄容器排版与选择依据。", rationale: "示例：当前练习涉及这些知识点，供老师决定是否纳入讲评范围。", source: "示例教材目录" },
      { id: "example-learner-unknown", title: "待核对学生", type: "学生", status: "unknown", reason: "名单的可用状态尚未确认。", rationale: null, source: null },
      { id: "example-knowledge-invalid", title: "旧版知识点条目", type: "知识点", status: "invalid", reason: "示例目录已更新，请使用当前条目。", rationale: "示例：来自旧版讲评范围。", source: "旧版示例目录" },
      { id: "example-learner-restricted", status: "restricted", disclosure: { title: "其他班级学生", reason: "不在当前任教范围，不能披露学生资料。" } },
      { id: "example-learner-chen", title: "陈同学", type: "学生", status: "available", rationale: "示例：教师追加的交流名单候选。", source: "示例补充名单" },
    ],
  },
}

/** A labelled, in-memory fixture page. Search/order/pages and receipts never live in the component. */
export function CandidatePickerExample({ purpose, narrow = false }: { purpose: keyof typeof candidatePickerExamples; narrow?: boolean }) {
  const fixture = candidatePickerExamples[purpose], stateId = useId()
  const [items, setItems] = useState<readonly AgentCandidate[]>(fixture.candidates)
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([fixture.candidates[0].id])
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({ type: "all" })
  const [sort, setSort] = useState("provided")
  const [count, setCount] = useState(5)
  const [knownTotal, setKnownTotal] = useState(false)
  const [state, setState] = useState<AgentCandidateResult["state"]>("ready")
  const [moreState, setMoreState] = useState<"ready" | "loading" | "error">("ready")
  const [submission, setSubmission] = useState<AgentCandidateSubmission>({ state: "idle" })
  const [pending, setPending] = useState<readonly string[] | null>(null)
  const [feedback, setFeedback] = useState("固定示例；推荐依据、来源与记录均不来自真实服务。")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement>(null)
  const candidateSet = { id: `example-${purpose}`, version: "example-candidates-v1" }
  const matched = items.filter(item => {
    const title = item.status === "restricted" ? item.disclosure.title : item.title
    return title.includes(query) && (filters.type === "all" || item.status !== "restricted" && item.type === filters.type)
  })
  // This is deliberately a fixture-only ordering rule, labelled next to the sort control.
  const ordered = sort === "reverse" ? [...matched].reverse() : matched
  const candidates = ordered.slice(0, count)
  const result: AgentCandidateResult = state === "error" ? { state, message: "示例检索暂不可用，原有选择保留。" }
    : state === "empty" || state === "ready" && !candidates.length ? { state: "empty", message: "当前没有匹配的示例候选。" } : { state }

  function act(intent: AgentCandidateIntent) {
    if (intent.candidateSetId !== candidateSet.id || intent.baseVersion !== candidateSet.version) return
    if (intent.type === "query") { setQuery(intent.value); return }
    if (intent.type === "filter") { setFilters({ ...intent.value }); return }
    if (intent.type === "sort") { setSort(intent.value); return }
    if (intent.type === "load-more") { setMoreState("loading"); setFeedback("已请求更多示例候选，请用上方按钮载入结果或失败记录。"); return }
    if (intent.type === "confirm") { setPending([...intent.candidateIds]); setSubmission({ state: "submitting", message: "示例请求已发出，等待独立载入回执。" }); return }
    if (intent.type === "select") setSelectedIds(previous => [...new Set([...previous, ...intent.candidateIds])])
    if (intent.type === "deselect") setSelectedIds(previous => previous.filter(value => !intent.candidateIds.includes(value)))
    if (intent.type === "replace") setSelectedIds(previous => previous.map(value => value === intent.candidateId ? intent.replacementId : value))
    setSubmission({ state: "idle" }); setPending(null)
    setFeedback("本页选择已调整；尚未提交或加入集合。")
  }

  const common: AgentCandidatePickerProps = {
    title: fixture.title, candidateSet, candidates, relatedCandidates: items, selectedIds, result, submission,
    page: { total: knownTotal ? matched.length : null, label: "示例检索结果", more: count < ordered.length ? {
      cursor: "example-next-page", state: moreState,
      message: moreState === "loading" ? "等待载入更多示例结果。" : moreState === "error" ? "示例追加结果加载失败，已有候选保留。" : undefined,
    } : undefined },
    query: { value: query },
    filters: { fields: [{ id: "type", label: "候选类型", options: [{ value: "all", label: "全部示例类型" }, ... (purpose === "questions" ? ["题目"] : ["学生", "知识点"]).map(value => ({ value, label: value }))] }], value: filters },
    sort: { label: "排列方式", value: sort, options: [{ value: "provided", label: "示例给定顺序" }, { value: "reverse", label: "示例倒序" }], description: "排序口径：仅演示固定示例顺序，不表示相关度或推荐分数。" },
    confirm: {}, onIntent: act,
    onExpand: element => { trigger.current = element; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    itemTitleOwner: purpose === "questions" ? "slot" : "picker",
    renderItem: purpose === "questions" ? (item, context) => {
      const question = questionSamples.find(question => question.id === item.id) ?? (item.id === "example-extra-question" ? questionSamples[0] : undefined)
      // Use a readable fixture reference in QuestionCard's metadata, never an opaque business ID.
      return question ? <div className="min-w-0 space-y-1">
        <QuestionCard question={{ ...question, title: item.title, id: `示例题-${questionSamples.indexOf(question) + 1}`, ...(context.view === "inline" ? { options: undefined, parts: undefined, figure: undefined } : {}) }} showPoints={false} />
      </div> : null
    } : undefined,
    details: <p>仅为本页演示。搜索、筛选、排序和追加结果来自固定数据；选择不代表已提交，回执与集合记录分别载入。公式与题目内容由既有题卡提供，刷新后还原。</p>,
  }
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例 · 三处共享本页选择。提交、回执和加入记录分别演示。</p>
    {purpose === "questions" && <p className="text-ui-hint">题面节选 · 示例：下方简要候选展示节选，展开后显示完整题面。</p>}
    <div className="space-y-2"><Label htmlFor={stateId}>结果状态示例</Label><QuestionSelect id={stateId} label="结果状态示例" value={state} onChange={value => setState(value as AgentCandidateResult["state"])}
      items={[{ value: "ready", label: "可用" }, { value: "loading", label: "加载中" }, { value: "empty", label: "空结果" }, { value: "error", label: "错误" }]} /></div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="载入示例事实">
      <Button type="button" size="navigation" variant="outline" aria-pressed={knownTotal} onClick={() => setKnownTotal(value => !value)}>切换已知总数</Button>
      <Button type="button" size="navigation" variant="outline" disabled={moreState !== "loading"} onClick={() => { setCount(items.length); setMoreState("ready"); setFeedback("已载入更多示例候选。"); }}>载入更多示例候选</Button>
      <Button type="button" size="navigation" variant="outline" disabled={moreState !== "loading"} onClick={() => setMoreState("error")}>载入更多失败示例</Button>
      <Button type="button" size="navigation" variant="outline" disabled={!pending || submission.state === "submitted"} onClick={() => setSubmission({ state: "unconfirmed", message: "示例原请求的结果暂不可核对，不能重复提交。" })}>载入未确认回执</Button>
      <Button type="button" size="navigation" variant="outline" disabled={!pending || submission.state === "submitted"} onClick={() => setSubmission({ state: "submitted", message: "已取得示例提交回执，尚无新的加入集合记录。" })}>载入提交回执（示例）</Button>
      <Button type="button" size="navigation" variant="outline" disabled={!pending || submission.state === "submitted"} onClick={() => { setSubmission({ state: "error", message: "示例记录确认本次提交失败，选择保留。" }); setPending(null) }}>载入提交失败记录</Button>
      <Button type="button" size="navigation" variant="outline" disabled={!pending || submission.state !== "submitted"} onClick={() => {
        setItems(previous => previous.map(item => item.status === "available" && pending?.includes(item.id) ? { ...item, status: "in-collection" } : item))
        setSelectedIds([]); setSubmission({ state: "idle" }); setPending(null); setFeedback("已载入示例加入记录，并清空本次选择；未写入真实题篮或学生名单。")
      }}>载入加入记录（示例）</Button>
    </div>
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "少量候选快速选择"], ["workspace", "default", "筛选、排序与批量选择"], ["inline", "compact", "紧凑候选选择"],
    ] as const).map(([view, density, label]) => <section key={label} aria-label={label} ref={view === "workspace" ? workspace : undefined}
      tabIndex={view === "workspace" ? -1 : undefined} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentCandidatePicker {...common} view={view} density={density} />
    </section>)}</div>
  </div>
}

export function AgentCandidatePickerDemo() {
  const [purpose, setPurpose] = useState<keyof typeof candidatePickerExamples>("questions"), [narrow, setNarrow] = useState(false)
  return <section id="candidate-picker" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">候选选择器 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["questions", "learners"] as const).map(value => <Button key={value} type="button" size="navigation"
      variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "questions" ? "候选题示例" : "候选学生与知识点示例"}</Button>)}
      <Button type="button" size="navigation" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <CandidatePickerExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
