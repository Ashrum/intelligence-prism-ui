"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { AgentSubjectEditor, type AgentSubjectEditorIntent, type SubjectFormulaMode } from "../agent-subject-editor"
import { Button } from "../button"

export const subjectEditorExamples = [
  { id: "pythagoras", title: "勾股定理（示例）", location: "第 1 题题干 · 第 2 个公式", value: "a² + b² = c²", mode: "inline" as SubjectFormulaMode },
  { id: "fraction", title: "分式与根式（示例）", location: "复习提纲 · 比较分式与根式在不同取值下的表示方法 · 第 1 个公式", value: String.raw`\frac{1}{\sqrt{x^2+1}}`, mode: "block" as SubjectFormulaMode },
  { id: "invalid", title: "解析失败（示例）", location: "第 3 题题干 · 第 1 个公式", value: String.raw`\frac{1}{x`, mode: "inline" as SubjectFormulaMode },
] as const

export function SubjectEditorExample({ sample, narrow = false, initialView = "inline", density = "default" }: {
  sample: typeof subjectEditorExamples[number]; narrow?: boolean; initialView?: "inline" | "workspace"; density?: "default" | "compact"
}) {
  const [value, setValue] = useState<string>(sample.value), [applied, setApplied] = useState<string>(sample.value)
  const [view, setView] = useState(initialView), [readonly, setReadonly] = useState(false)
  const [feedback, setFeedback] = useState("固定示例，刷新后还原；原内容尚未修改。")
  const region = useRef<HTMLDivElement>(null), restore = useRef(false)
  useLayoutEffect(() => {
    if (restore.current) {
      restore.current = false
      if (view === "inline") region.current?.querySelector<HTMLButtonElement>("footer button:last-child")?.focus()
      else region.current?.querySelector<HTMLTextAreaElement>("textarea")?.focus()
    }
  }, [view])
  function receive(intent: AgentSubjectEditorIntent) {
    if (intent.formulaId !== sample.id || intent.baseVersion !== "example-base-v1") return
    if (intent.type === "cancel") { setValue(applied); setFeedback("已取消本次示例编辑，原内容保留。") }
    else if (!readonly && intent.type === "change") { setValue(intent.value); setFeedback("正在编辑公式，尚未替换原内容。") }
    else if (!readonly && intent.type === "apply") { setApplied(intent.value); setFeedback("已替换本页示例内容，尚未保存。") }
  }
  const formula = sample.mode === "block" ? `\\[${applied}\\]` : `\\(${applied}\\)`
  return <div className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
    <Button type="button" variant="outline" aria-pressed={readonly} onClick={() => setReadonly(value => !value)}>只读示例</Button>
    <div ref={region}>
      <AgentSubjectEditor title={sample.title} formulaId={sample.id} location={sample.location} value={value} formulaMode={sample.mode}
        baseVersion="example-base-v1" baseVersionLabel="示例 v1" view={view} density={density}
        readOnlyReason={readonly ? "历史版本只读，当前公式原文仍可查看。" : undefined} onIntent={receive}
        onExpand={() => { restore.current = true; setView("workspace") }} onBack={() => { restore.current = true; setView("inline") }}
        details={<p>先将光标放在公式原文中，再选择插入；选中文字可放入结构的参数位置。工具栏支持方向键、Home 和 End，Tab 切换分组。撤销与重做只处理本次公式编辑；展开和返回保留输入，不会确认替换。</p>} />
    </div>
    <p role="status" className="text-ui-hint break-words">{feedback}</p>
    <p className="text-ui-action">原内容（本页示例）</p>
    <p className="text-read-body whitespace-pre-wrap break-words">{formula}</p>
  </div>
}

export function AgentSubjectEditorDemo() {
  const [narrow, setNarrow] = useState(false)
  return <section id="subject-editor" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">学科专用编辑器 v0.1 · 数学公式 · 设计候选</h2>
    <p className="text-ui-hint">每组编辑一个公式片段；确认替换只更新本页示例，不代表保存。下列示例可展开或返回同一份公式。</p>
    <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    <div className="grid min-w-0 gap-6">{subjectEditorExamples.map((sample, index) => <SubjectEditorExample key={sample.id} sample={sample}
      initialView={index === 1 ? "workspace" : "inline"} density={index === 2 ? "compact" : "default"} narrow={narrow} />)}</div>
  </section>
}
