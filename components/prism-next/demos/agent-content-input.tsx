"use client"

import { useId, useRef, useState } from "react"
import { Field, FieldLabel } from "@/components/coss/field"
import { Button } from "../button"
import { AgentContentInput, type AgentContentField, type AgentContentSaveState } from "../agent-content-input"
import { DraftMathPreview } from "../draft-math-preview"
import { QuestionSelect } from "../question-controls"

export const contentInputExamples: Record<"question" | "teaching", { title: string; fields: readonly AgentContentField[] }> = {
  question: {
    title: "题干与答案输入（示例）",
    fields: [
      { id: "stem", label: "题干", type: "text", value: String.raw`已知函数 f(x) = x² − 2x + 1。当 0 ≤ x ≤ 3 时，求最小值，并说明理由。
补充条件：比较 \(\frac{1}{\sqrt{x^2+1}}\) 在区间两端的取值。`, limits: { maxLength: 2000 }, source: { kind: "paste", label: "教师粘贴的练习材料（示例）" } },
      { id: "answer", label: "参考答案", type: "markdown", value: String.raw`最小值为 0。
补充条件的答案待核对：\(\frac{1}{x\)`, limits: { maxLength: 1000, format: "可使用段落、列表与公式标记；公式括号需要成对。" }, validation: { state: "invalid", message: "参考答案中的分式缺少右花括号，请补齐后重新检查。" } },
    ],
  },
  teaching: {
    title: "讲评要点结构化输入（示例）",
    fields: [
      { id: "goal", label: "目标", type: "text", value: "能辨认直角边与斜边，先判断适用条件，再用文字解释选择公式的依据。", limits: { maxLength: 300 } },
      { id: "activity", label: "活动", type: "markdown", value: "- 独立标出直角与斜边。\n- 旋转同一图形，比较判断是否改变。\n- 结合长篇讲评材料，保留学生的原有思路并逐项核对条件。", limits: { maxLength: 2000, format: "使用段落或列表；不包含图片、HTML 与嵌入内容。" } },
      { id: "check", label: "检查", type: "url-excerpt", value: "并列呈现直角三角形与非直角三角形，请学生说明能否使用勾股定理及理由。", limits: { maxLength: 1000 }, source: { kind: "url", label: "教研文章中的课堂检查片段（示例）", url: "https://example.com/teaching/review", fetch: { state: "not-fetched" } } },
    ],
  },
}

export function ContentInputExample({ purpose, narrow }: { purpose: keyof typeof contentInputExamples; narrow: boolean }) {
  const example = contentInputExamples[purpose], id = useId()
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(example.fields.map(field => [field.id, field.value])))
  const [saveState, setSaveState] = useState<AgentContentSaveState>("unsaved")
  const [invalid, setInvalid] = useState(purpose === "question")
  const [feedback, setFeedback] = useState("尚未提交内容。")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
  const fields = example.fields.map(field => ({ ...field, value: values[field.id],
    validation: invalid ? field.validation : undefined,
    onChange: (value: string) => { setValues(previous => ({ ...previous, [field.id]: value })); setSaveState("unsaved") },
  }))
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end gap-3">
      <Field><FieldLabel htmlFor={`${id}-save`}>保存状态示例</FieldLabel><QuestionSelect id={`${id}-save`} label="保存状态示例" value={saveState}
        onChange={value => setSaveState(value as AgentContentSaveState)} items={[
          { value: "unsaved", label: "未保存" }, { value: "saved-draft", label: "已保存草稿" }, { value: "submitted", label: "已提交" },
          { value: "conflict", label: "冲突" }, { value: "unknown", label: "状态未确认" },
        ]} /></Field>
      {purpose === "question" && <Button type="button" variant="outline" aria-pressed={invalid} onClick={() => setInvalid(value => !value)}>格式校验失败示例</Button>}
    </div>
    <p className="text-ui-hint">固定示例，刷新后还原。保存状态与格式检查结果可手动切换；点击提交仅显示请求反馈。</p>
    <p role="status" className="text-ui-hint">{feedback}</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "轻量输入"], ["workspace", "default", "长文本与结构化编辑"], ["inline", "compact", "紧凑输入"],
    ] as const).map(([view, density, label]) => <section key={`${view}-${density}`} aria-label={label}
      ref={view === "workspace" ? workspace : undefined} tabIndex={view === "workspace" ? -1 : undefined}
      className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3>
      <AgentContentInput title={example.title} inputId={purpose} baseVersion="材料 v1" draftVersion="草稿 v2"
        view={view} density={density} content={{ type: "structured", fields }} save={{ state: saveState }}
        conflict={saveState === "conflict" ? { baseVersion: "材料 v1", currentVersion: "材料 v3", description: "另有新版本，请核对后再提交；当前输入仍保留。" } : undefined}
        submitted={{ version: "材料 v1", fields: [{ label: example.fields[0].label, value: purpose === "question" ? "求函数在给定区间内的最小值。" : "辨认直角三角形的边。" }] }}
        renderPreview={purpose === "question" ? field => field.id === "answer" ? <DraftMathPreview value={`${values.stem}\n参考答案：${field.value}`} label="当前题干与答案预览" /> : null : undefined}
        submitDisabledReason={invalid ? "请先修正格式并重新检查。" : undefined}
        onSubmit={() => setFeedback("已请求提交内容；提交结果尚未确认。")}
        onExpand={button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) }}
        onBack={() => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) }}
        details={<p>这里填写题干、答案或讲评材料。给 Agent 的操作要求在对话输入区填写。展开和返回保留同一份输入，不会提交；此示例没有自动保存或网页抓取。</p>} />
    </section>)}</div>
  </div>
}

export function AgentContentInputDemo() {
  const [purpose, setPurpose] = useState<keyof typeof contentInputExamples>("question"), [narrow, setNarrow] = useState(false)
  return <section id="content-input" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">内容输入 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["question", "teaching"] as const).map(value => <Button key={value} type="button"
      variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "question" ? "题干与答案示例" : "讲评要点示例"}</Button>)}
      <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <ContentInputExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
