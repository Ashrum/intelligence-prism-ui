"use client"

import { useId, useRef, useState } from "react"
import { Button } from "@/components/coss/button"
import { Field, FieldLabel } from "@/components/coss/field"
import { AgentDocumentWorkspace, type AgentDocumentCapabilities, type AgentDocumentSaveState, type AgentDocumentSection } from "../agent-document-workspace"
import { DraftMathPreview } from "../draft-math-preview"
import { RootFormula } from "../math-content"
import { QuestionSelect } from "../question-controls"

const noConversion = { state: "none" } as const
export const documentExamples = {
  outline: {
    id: "lesson-outline", title: "勾股定理复习课 · 备课提纲（示例）", format: "纯文本", version: "提纲 v2",
    scope: "全文 · 5 个教学环节", previewRange: "教学目标 · 第 1 段 / 共 5 个环节",
    sections: [
      { id: "goal", title: "一、教学目标", text: "识别不同摆放方向的直角三角形中的直角边和斜边，说明斜边位于直角的对面。\n先判断是否满足直角三角形条件，再选择合适的计算方法。" },
      { id: "recognize", title: "二、辨认图形", text: "让学生先独立标出直角与斜边，再旋转同一个直角三角形。比较旋转前后的判断，并用“直角的对边”解释依据。" },
      { id: "calculate", title: "三、列式练习与公式说明", text: "给出两条直角边分别为 3、4 和 5、12 的直角三角形。\n先标出边的角色，再列式 a² + b² = c² 求斜边，分别用 5 和 13 检查结果。" },
      { id: "check", title: "四、课堂检查与解释依据", text: "并列展示直角三角形与非直角三角形，要求先判断能否使用勾股定理，再说明理由。当前没有班级作答数据，不据此判断学生掌握程度。" },
      { id: "followup", title: "五、待补充的教材、课时与学习条件", text: "待教师补充教材版本、学生已学内容和课时安排。根据实际课堂检查调整下一次练习，保留未核实的问题。" },
    ],
    capabilities: {
      view: { status: "supported", conversion: noConversion },
      edit: { status: "supported", reason: "可逐章节修改纯文本。", conversion: noConversion },
      annotate: { status: "supported", conversion: noConversion },
      export: { status: "unsupported", reason: "此示例没有可下载文件。", conversion: noConversion },
    } satisfies AgentDocumentCapabilities,
  },
  pdf: {
    id: "review-pdf", title: "二次方程常见错误与求根过程 · PDF 讲评材料（示例）", format: "PDF", version: "讲评 v3",
    scope: "第 1—2 页文字摘录；第 3 页图表未提供", previewRange: "第 1 页 · 常见错误第 1 段 / 原文件共 3 页",
    sections: [
      { id: "errors", title: "第 1 页 · 常见错误", text: "配方时容易遗漏常数项的同步调整。讲评先保留学生原有思路，再逐步核对等式两边的变化；这份固定材料不含真实学生作答。" },
      { id: "formula", title: "第 2 页 · 求根过程", text: "先判断判别式是否非负，再代入求根公式。请同时检查分子整体与分母的对应关系。" },
    ],
    capabilities: {
      view: { status: "limited", reason: "仅提供第 1—2 页的文字与公式摘录。", conversion: { state: "lossy", description: "摘录不保留 PDF 原始版式，第 3 页图表未包含。" } },
      edit: { status: "unsupported", reason: "PDF 仅可阅读，不可编辑。", conversion: noConversion },
      annotate: { status: "limited", reason: "仅可对摘录章节批注，不能写回 PDF 页面。", conversion: noConversion },
      export: { status: "unsupported", reason: "未提供可下载的 PDF 文件。", conversion: noConversion },
    } satisfies AgentDocumentCapabilities,
  },
}

export function DocumentWorkspaceExample({ purpose, narrow }: { purpose: keyof typeof documentExamples; narrow: boolean }) {
  const example = documentExamples[purpose]
  const controlId = useId()
  const workspace = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(example.sections.map(section => [section.id, section.text])))
  const [activeSection, setActiveSection] = useState<string | null>(example.sections[0].id)
  const [state, setState] = useState<AgentDocumentSaveState>(purpose === "outline" ? "unsaved" : "unknown")
  const [historical, setHistorical] = useState(false)
  const [feedback, setFeedback] = useState("尚未请求操作。")
  const version = historical ? "历史 v1" : example.version
  const sections: AgentDocumentSection[] = example.sections.map(section => ({
    id: section.id, title: section.title,
    content: purpose === "outline" ? <DraftMathPreview value={historical ? section.text : values[section.id]} label={`${section.title} · 公式排版`} />
      : <div className="space-y-3"><p>{section.text}</p>{section.id === "formula" && <div className="overflow-x-auto"><RootFormula /></div>}</div>,
  }))
  function expand(button: HTMLButtonElement) {
    trigger.current = button
    workspace.current?.focus({ preventScroll: true })
    workspace.current?.scrollIntoView({ block: "nearest" })
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end gap-3">
      <Field><FieldLabel htmlFor={`${controlId}-save`}>保存状态示例</FieldLabel><QuestionSelect id={`${controlId}-save`} label="保存状态示例" value={state} onChange={value => setState(value as AgentDocumentSaveState)} items={[
        { value: "unsaved", label: "未保存" }, { value: "saved-draft", label: "已保存草稿" }, { value: "submitted", label: "已提交" }, { value: "conflict", label: "冲突" }, { value: "unknown", label: "状态未确认" },
      ]} /></Field>
      <Button type="button" variant="outline" aria-pressed={historical} onClick={() => setHistorical(value => !value)}>历史版本示例</Button>
    </div>
    <p className="text-ui-hint">固定示例。保存状态可手动切换；新增批注和快速操作仅显示请求反馈。</p>
    <p role="status" className="text-ui-hint">{feedback}</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "对话摘要"], ["workspace", "default", "完整阅读与章节编辑"], ["inline", "compact", "紧凑摘要"],
    ] as const).map(([view, density, label]) => <section key={`${view}-${density}`} ref={view === "workspace" ? workspace : undefined} tabIndex={view === "workspace" ? -1 : undefined}
      aria-label={label} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3>
      <AgentDocumentWorkspace view={view} density={density}
        document={{ id: example.id, title: example.title, version, format: example.format, contentScope: example.scope,
          source: purpose === "outline" ? "教师提供的教学主题（示例）" : "教研材料（固定示例）", snapshot: historical ? "2026-09-24 的固定快照" : undefined, currentVersion: historical ? example.version : undefined }}
        capabilities={example.capabilities} sections={sections} activeSection={activeSection} onNavigate={sectionId => setActiveSection(sectionId)}
        preview={{ kind: "excerpt", range: example.previewRange, content: historical ? example.sections[0].text : values[example.sections[0].id] }}
        draft={purpose === "outline" ? { baseVersion: example.version, values, onChange: change => { setValues(previous => ({ ...previous, [change.sectionId]: change.value })); setState("unsaved") } } : undefined}
        save={historical ? undefined : { state, description: state === "conflict" ? "另有新版本，当前草稿保留，尚未覆盖原稿。" : undefined }}
        annotations={[{ id: "note-1", version, anchor: { sectionId: example.sections[0].id, paragraph: "第 1 段" }, author: "教师甲（示例）", time: "2026-09-24 10:30", state: "open", content: purpose === "outline" ? "补充学生说明判断依据的时间。" : "讲评时请补充常数项变化的中间步骤。" }]}
        onAddAnnotation={intent => setFeedback(`已请求批注「${example.sections.find(section => section.id === intent.sectionId)?.title}」；示例未新增记录。`)}
        quickActions={purpose === "outline" ? [{ id: "save-request", label: "请求保存草稿", capability: "edit" }] : []}
        onAction={() => setFeedback("已请求保存；保存结果尚未确认。")}
        onExpand={expand} onBack={() => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) }}
        notice="固定示例；修改刷新后还原。" details={<p>打开和滚动不代表材料已被读取或引用。历史示例显示当时内容，保存情况缺少记录时保持未确认。</p>} />
    </section>)}</div>
  </div>
}

export function AgentDocumentWorkspaceDemo() {
  const [purpose, setPurpose] = useState<keyof typeof documentExamples>("outline")
  const [narrow, setNarrow] = useState(false)
  return <section id="document-workspace" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">文档工作区 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["outline", "pdf"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "outline" ? "备课提纲示例" : "PDF 讲评材料示例"}</Button>)}
      <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <DocumentWorkspaceExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
