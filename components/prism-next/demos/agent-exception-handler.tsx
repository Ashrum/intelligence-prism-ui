"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/coss/button"
import { AgentExceptionHandler, type AgentExceptionAction, type AgentExceptionDisposition, type AgentExceptionItem, type AgentExceptionState } from "../agent-exception-handler"

const replace: AgentExceptionAction = { id: "replace", label: "替换清晰示例页", impact: "仅替换第 3 页；第 1、2 页及已校对内容保留。" }
const skip: AgentExceptionAction = { id: "skip", label: "跳过模糊区域", impact: "保留原页和待核对标记，继续处理其他内容。" }
const verify: AgentExceptionAction = { id: "verify", label: "按原稿核对", impact: "仅核对第 2 题的条件；人工改写保持原样。" }
const query: AgentExceptionAction = { id: "query-original", label: "查询原请求", impact: "核对原处置请求的结果，不再次提交。" }
const resume: AgentExceptionAction = { id: "resume", label: "继续校对", impact: "返回已保留的校对稿，仍需逐题核对。" }

/** Fixed examples only. Neither the data nor the manual state selector is a runtime. */
export const exceptionExamples: Record<"scan" | "questions", { label: string; title: string; items: readonly AgentExceptionItem[] }> = {
  scan: {
    label: "P04 扫描整理", title: "扫描材料局部问题 · 示例",
    items: [
      {
        id: "scan-page-3", title: "第 3 页模糊", kind: "low-confidence", critical: true,
        scope: "第 3 页右下角的题干与图形标注。", retained: "第 1、2 页及已经人工校对的内容。",
        basis: "固定示例的页面质量记录：第 3 页局部模糊，不能据此确认题干。未提供可信识别分数。",
        disposition: { state: "waiting-human", description: "请选择第 3 页的处理方式。", actions: [replace, skip] },
        evidence: [{ id: "scan-source", label: "数学扫描材料（示例节选）", location: "第 3 页 · 右下区域", version: "示例包 v1", preview: <figure className="min-w-0 space-y-2"><p className="text-read-body">依据图形求线段长度，并说明推理过程；右下角标注待核对。</p><figcaption className="text-ui-hint text-muted-foreground">固定文字节选，用于展示材料位置。</figcaption></figure> }],
        history: [{ id: "scan-first-check", state: "waiting-human", description: "首次检查发现第 3 页局部模糊，尚未提交处置。", scope: "第 3 页右下区域", basis: "示例包 v1 · 页面质量记录", time: "示例时间 2026-09-25 09:10" }],
      },
      {
        id: "scan-page-4", title: "第 4 页重复", kind: "conflict", scope: "第 4 页与第 2 页的重复内容。", retained: "第 2 页原材料与全部校对内容。",
        basis: "固定示例的人工确认记录：第 4 页重复，按确认范围跳过。",
        disposition: { state: "skipped", description: "已按示例范围跳过重复页。", resolution: { method: "保留第 2 页，跳过第 4 页", time: "示例时间 2026-09-25 09:12" } },
      },
      {
        id: "scan-appendix", title: "附页无法解析", kind: "unparseable", scope: "附页的文件内容。", retained: "主卷与人工备注。",
        basis: "示例校验记录：附页内容格式无法解析。",
        disposition: { state: "waiting-human", description: "附页暂未进入整理范围。", actions: [{ id: "replace-appendix", label: "替换附页", impact: "仅重新提供附页，保留主卷。", disabledReason: "当前未提供可用的替代文件。" }] },
        evidence: [{ id: "appendix", label: "附页（示例）", location: "文件末尾", unavailableReason: "附页内容暂不可用。" }],
      },
    ],
  },
  questions: {
    label: "题目识别与答案核对", title: "题目识别冲突与缺失答案 · 示例",
    items: [
      {
        id: "question-2", title: "第 2 题识别内容与人工改写冲突", kind: "conflict", critical: true,
        scope: "第 2 题的函数条件与定义域；本次只核对冲突字段，不覆盖教师已经补充的推理过程。",
        retained: "当前人工草稿 r3、其他题目的已核对内容与原稿。",
        basis: "识别候选依据 r2，当前人工草稿已为 r3；需核对原稿后再决定如何处理。",
        disposition: { state: "waiting-human", description: "原稿与人工改写均保留，请先核对条件。", actions: [verify, { id: "use-candidate", label: "采用识别内容", impact: "会替换第 2 题的条件，影响定义域和后续解答。", disabledReason: "候选依据 r2，当前草稿为 r3，请先核对版本。" }] },
        evidence: [{ id: "question-source", label: "原题材料（示例）", location: "第 1 页 · 第 2 题", version: "原稿 v1", preview: <div className="min-w-0 space-y-2 text-read-body"><p>已知函数如下，求定义域并说明理由。</p><div className="overflow-x-auto"><math className="prism-math" display="block" aria-label="f(x) 等于 x 加 1 除以 x 减 1"><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mfrac><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow><mrow><mi>x</mi><mo>−</mo><mn>1</mn></mrow></mfrac></math></div></div> }],
        history: [{ id: "question-old-attempt", state: "failed", description: "上一次核对未通过：原稿版本尚未确认。", scope: "第 2 题 · 条件", basis: "当时人工草稿 r2", method: "核对原稿", time: "示例时间 2026-09-25 08:50" }],
      },
      {
        id: "question-5", title: "第 5 题缺失参考答案", kind: "missing", scope: "第 5 题参考答案。", retained: "题干、选项及教师批注。",
        basis: "示例材料只包含题干与选项，未附参考答案；不能从已有题干推定答案已补齐。",
        disposition: { state: "waiting-human", description: "请补充答案来源后再核对。", actions: [{ id: "add-answer", label: "补充答案", impact: "仅补充第 5 题答案，保留原题与批注。" }] },
        evidence: [{ id: "answer-source", label: "答案页（示例）", location: "第 5 题答案位置", unavailableReason: "当前材料没有提供这一题的参考答案。" }],
      },
      {
        id: "question-6", title: "第 6 题公式无法解析", kind: "unparseable", scope: "第 6 题公式区域。", retained: "当前原文及其余题目。",
        basis: "示例转换记录报告公式格式错误，尚未形成可靠排版。",
        disposition: { state: "failed", description: "公式转换失败，原文已保留。", actions: [{ id: "review-formula", label: "核对公式原文", impact: "只检查第 6 题公式，保留其他题目。" }] },
      },
    ],
  },
}

const stateOptions: readonly [AgentExceptionState, string][] = [["waiting-human", "待处理"], ["waiting", "提交中"], ["unknown", "回执未确认"], ["resolved", "已处置"], ["failed", "失败"], ["ignored", "已忽略"], ["skipped", "已跳过"]]

export function AgentExceptionHandlerDemo() {
  const [purpose, setPurpose] = useState<keyof typeof exceptionExamples>("scan")
  const [state, setState] = useState<AgentExceptionState>("waiting-human")
  const [narrow, setNarrow] = useState(false)
  const [feedback, setFeedback] = useState("")
  const workspaceHeading = useRef<HTMLHeadingElement>(null)
  const inlineHeading = useRef<HTMLHeadingElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const example = exceptionExamples[purpose], first = example.items[0]
  const dispositions: Record<AgentExceptionState, AgentExceptionDisposition> = {
    "waiting-human": first.disposition,
    waiting: { state: "waiting", description: "处理方式已提交，等待示例回执。", request: { id: `${first.id}-request-1`, label: "首次处置请求（示例）" }, query },
    unknown: { state: "unknown", description: "原处置请求已保留，请查询原请求。", request: { id: `${first.id}-request-1`, label: "首次处置请求（示例）" }, query },
    failed: { state: "failed", description: "示例处置明确失败，已整理部分保留。", actions: purpose === "scan" ? [replace, skip] : [verify] },
    resolved: { state: "resolved", description: "示例处置记录已确认，仍待教师校对。", resolution: { method: purpose === "scan" ? "使用清晰示例页" : "按原稿核对冲突字段", time: "示例时间 2026-09-25 09:20" }, actions: [resume] },
    ignored: { state: "ignored", description: "已按示例记录忽略本项，不表示内容正确。", resolution: { method: "保留当前内容并标记忽略" } },
    skipped: { state: "skipped", description: "已跳过本项，待核对部分保留。", resolution: { method: "跳过当前区域", time: "示例时间 2026-09-25 09:20" }, actions: [resume] },
  }
  const items = example.items.map((item, index) => index === 0 ? { ...item, disposition: dispositions[state] } : item)
  return <section id="exception-handler" className="mb-12 space-y-5">
    <h2 className="text-section-title">异常处理器 v0.1 · 设计候选</h2>
    <p className="text-ui-hint text-muted-foreground">固定示例：三种用法共享同一组记录。下方按钮手动切换首项状态，处置按钮只记录选择。</p>
    <div className="flex flex-wrap gap-2" aria-label="异常示例用途">{Object.entries(exceptionExamples).map(([key, sample]) => <Button key={key} variant="outline" aria-pressed={purpose === key} onClick={() => { setPurpose(key as typeof purpose); setState("waiting-human"); setFeedback("") }}>{sample.label}</Button>)}</div>
    <div className="flex flex-wrap gap-2" aria-label="首项示例状态">{stateOptions.map(([value, label]) => <Button key={value} variant="outline" aria-pressed={state === value} onClick={() => { setState(value); setFeedback("") }}>{label}</Button>)}<Button variant="ghost" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 窄容器</Button></div>
    <p role="status" className="text-ui-hint">{feedback || "尚未选择处置操作。"}</p>
    <div className={narrow ? "grid max-w-80 gap-6" : "grid min-w-0 gap-6 xl:grid-cols-3"}>
      {([['inline', 'default', '对话摘要'], ['workspace', 'default', '完整处置'], ['inline', 'compact', '紧凑列表']] as const).map(([view, density, label], index) => <section key={label} className="min-w-0 space-y-3" aria-label={label}>
        <h3 ref={index === 1 ? workspaceHeading : index === 0 ? inlineHeading : undefined} tabIndex={-1} className="text-block-title">{label}</h3>
        <AgentExceptionHandler title={example.title} items={items} view={view} density={density} inlineLimit={1}
          notice="示例：尚未连接真实处理服务。"
          details={<p>查看材料不代表已核对；处理只针对当前异常，已保留的内容继续使用。历史记录保留当时事实。</p>}
          onAction={intent => { const item = items.find(value => value.id === intent.exceptionId); const action = intent.kind === "query" ? query : item && "actions" in item.disposition ? item.disposition.actions?.find(value => value.id === intent.actionId) : undefined; setFeedback(`示例：已选择“${action?.label ?? "处理"}”（${item?.title}）；记录保持原样。`) }}
          onExpand={button => { trigger.current = button; workspaceHeading.current?.focus(); workspaceHeading.current?.scrollIntoView({ block: "nearest" }) }}
          onBack={() => { const target = trigger.current?.isConnected ? trigger.current : inlineHeading.current; target?.focus(); target?.scrollIntoView({ block: "nearest" }) }} />
      </section>)}
    </div>
  </section>
}
