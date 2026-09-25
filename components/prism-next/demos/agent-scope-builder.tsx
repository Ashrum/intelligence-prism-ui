"use client"

import { useRef, useState } from "react"
import type { DateRange } from "@daypicker/react"
import { zhCN } from "@daypicker/react/locale"
import { Calendar } from "@/components/coss/calendar"
import { Label } from "@/components/coss/label"
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/coss/popover"
import { Button } from "../button"
import { FilterBar } from "../data-display"
import { TextbookRangePicker } from "../textbook-range-picker"
import { TextbookDirectory, type DirectorySelections, type TextbookDefinition } from "../textbook-directory"
import { createDirectory } from "@/lib/prism-next/textbook-directory"
import { AgentScopeBuilder, type AgentScopeBuilderProps, type AgentScopeDimension, type AgentScopeEditor, type AgentScopeTarget } from "../agent-scope-builder"

// These are authorized fixture options, not a directory service or real textbook contents.
const books: TextbookDefinition[] = ["甲", "乙"].map((edition, index) => {
  const id = `example-book-${index}`
  return { id, title: `数学教材 · 示例${edition}版`, directories: {
    course: createDirectory(`${id}:course`, [{ id: "chapter-2", title: "第二章 二次函数", children: [
      { id: "graph", title: "二次函数的图像与性质" },
      { id: "application", title: "结合图像与实际情境分析二次函数的最值及其变化范围" },
    ] }]),
    knowledge: createDirectory(`${id}:knowledge`, [{ id: "quadratic", title: "二次函数", children: [
      { id: "axis", title: "对称轴" }, { id: "vertex", title: "顶点与最值" },
    ] }]),
  } }
})
const groups = [{ value: "class-3", label: "高二三班" }, { value: "class-3-group-a", label: "高二三班 · 函数巩固小组" }]
const presets = [{ value: "two-weeks", label: "近两周作业" }, { value: "week", label: "近一周作业" }, { value: "custom", label: "自选日期" }]
const resources = [{ value: "article", label: "文章" }, { value: "image", label: "图片" }, { value: "video", label: "视频" }]
type TimeValue = { preset: string; range?: DateRange }
type ExampleValues = { group: string; edition: string; chapters: DirectorySelections; time: TimeValue; resources: string }
const initialValues = (): ExampleValues => ({ group: "class-3", edition: books[0].id,
  chapters: { [`${books[0].id}:course`]: [...books[0].directories.course.leafIds] }, time: { preset: "two-weeks" }, resources: "article" })
const dateText = (date: Date) => `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
const timeText = (time: TimeValue) => time.preset === "custom"
  ? time.range?.from ? `${dateText(time.range.from)} — ${time.range.to ? dateText(time.range.to) : "待选结束日期"}` : "尚未指定时间"
  : presets.find(item => item.value === time.preset)?.label ?? "尚未指定时间"

function ChoiceEditor({ editor, label }: { editor: AgentScopeEditor; label: string }) {
  return <FilterBar fields={[{ id: "choice", label, options: editor.options as { value: string; label: string }[] }]}
    value={{ choice: editor.value as string }} onChange={value => editor.onChange(value.choice)} />
}
function TimeEditor({ editor, inline = false }: { editor: AgentScopeEditor; inline?: boolean }) {
  const value = editor.value as TimeValue
  return <div className="min-w-0 space-y-3">
    <FilterBar fields={[{ id: "period", label: "时间快捷选择", options: (editor.options as typeof presets).filter(item => !inline || item.value !== "custom" || value.preset === "custom") }]}
      value={{ period: value.preset }} onChange={next => editor.onChange({ ...value, preset: next.period })} />
    {!inline && <div className="min-w-0 space-y-2"><Label htmlFor={editor.controlId}>起止日期</Label>
      <Popover><PopoverTrigger id={editor.controlId} aria-describedby={editor.describedBy} render={<Button type="button" variant="outline" size="navigation" className="h-auto max-w-full whitespace-normal" />}>
        {value.preset === "custom" ? timeText(value) : "选择开始与结束日期"}
      </PopoverTrigger><PopoverPopup className="w-auto"><Calendar mode="range" locale={zhCN} selected={value.range}
        defaultMonth={value.range?.from ?? new Date(2026, 8, 1)} onSelect={range => editor.onChange({ preset: "custom", range })} /></PopoverPopup></Popover>
    </div>}
  </div>
}
function ChapterEditor({ editor, tree }: { editor: AgentScopeEditor; tree: boolean }) {
  const value = editor.value as DirectorySelections
  const props = { textbooks: editor.options as TextbookDefinition[], selections: value,
    onSelectionsChange: (next: DirectorySelections | ((previous: DirectorySelections) => DirectorySelections)) => editor.onChange(typeof next === "function" ? next(value) : next) }
  return <div className="min-w-0 space-y-3">
    {tree ? <div className="min-w-0 [&>div]:grid-cols-1"><TextbookDirectory {...props} /></div> : <TextbookRangePicker {...props} compactTrigger triggerLabel="调整章节与知识点" />}
    <p className="break-words text-ui-hint">示例知识点：二次函数的对称轴 <math className="prism-math" aria-label="x 等于负 b 除以二 a"><mi>x</mi><mo>=</mo><mo>−</mo><mfrac><mi>b</mi><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></math>。</p>
  </div>
}

export function ScopeBuilderExample({ purpose, narrow = false }: { purpose: "analysis" | "preparation"; narrow?: boolean }) {
  const [values, setValues] = useState<ExampleValues>(initialValues)
  const [issue, setIssue] = useState(true)
  const [revision, setRevision] = useState(1)
  const [confirmedVersion, setConfirmedVersion] = useState<string | null>(null)
  const [requested, setRequested] = useState<AgentScopeTarget | null>(null)
  const [resetRequest, setResetRequest] = useState<"reset" | "defaults" | null>(null)
  const [feedback, setFeedback] = useState("尚未请求确认范围。")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
  const target = { scopeId: `scope-example-${purpose}`, version: `r${revision}` }
  const book = purpose === "analysis" ? books[0] : books.find(item => item.id === values.edition)
  const selectedNames = book ? (["course", "knowledge"] as const).flatMap(kind => {
    const data = book.directories[kind], ids = values.chapters[`${book.id}:${kind}`] ?? []
    return ids.filter(id => data.leafIds.includes(id)).map(id => data.nodes[id].title)
  }) : []
  const fullChapter = book && book.directories.course.leafIds.every(id => (values.chapters[`${book.id}:course`] ?? []).includes(id))
  const knowledgeNames = book ? (values.chapters[`${book.id}:knowledge`] ?? []).filter(id => book.directories.knowledge.leafIds.includes(id)).map(id => book.directories.knowledge.nodes[id].title) : []
  const chapterSummary = fullChapter ? ["第二章 二次函数", ...knowledgeNames].join(" · ") : selectedNames.join("、") || null
  const groupLabel = groups.find(item => item.value === values.group)?.label
  const resourceLabel = resources.find(item => item.value === values.resources)?.label
  const validTime = values.time.preset === "custom" ? !!values.time.range?.from && !!values.time.range.to : ["week", "two-weeks"].includes(values.time.preset)
  const dimensionIssue = !chapterSummary || (purpose === "analysis" ? !groupLabel || !validTime : !book || !resourceLabel)
  const dimensions: AgentScopeDimension[] = [
    purpose === "analysis"
      ? { id: "group", access: "available", label: "班级与学生群体", required: true, core: true,
        source: { label: "当前任教班级（示例）", options: groups }, value: values.group, summary: groupLabel ?? null,
        validation: groupLabel ? { state: "valid", reason: "仅选择当前可用的学生群体。" } : { state: "conflict", reason: "请指定学生群体。" },
        renderEditor: editor => <ChoiceEditor editor={editor} label="选择学生群体" /> }
      : { id: "edition", access: "available", label: "教材版本", required: true, core: true,
        source: { label: "可用教材版本（示例）", options: books.map(item => ({ value: item.id, label: item.title })) }, value: values.edition, summary: book?.title ?? null,
        validation: book ? { state: "valid", reason: "本次使用所选版本。" } : { state: "conflict", reason: "请选择教材版本。" },
        renderEditor: editor => <ChoiceEditor editor={editor} label="选择教材版本" /> },
    { id: "chapters", access: "available", label: "章节与知识点", required: true, core: true,
      source: { label: "示例教材目录", options: book ? [book] : [] }, value: values.chapters, summary: chapterSummary,
      validation: chapterSummary ? { state: "valid", reason: "范围按所选章节与知识点确定。" } : { state: "conflict", reason: "当前教材尚未选择章节或知识点。" },
      renderEditor: editor => <ChapterEditor key={book?.id ?? "no-book"} editor={editor} tree={purpose === "preparation"} /> },
    purpose === "analysis"
      ? { id: "time", access: "available", label: "时间范围", required: true, core: true,
        source: { label: "作业时间选项（示例）", options: presets }, value: values.time, summary: timeText(values.time),
        validation: validTime ? { state: "valid", reason: "仅纳入所选时间内的作业。" } : { state: "conflict", reason: "请选择完整的起止日期。" },
        renderEditor: editor => <TimeEditor editor={editor} />, renderInlineEditor: editor => <TimeEditor editor={editor} inline /> }
      : { id: "resources", access: "available", label: "资源类型", required: true, core: true,
        source: { label: "备课资料目录（示例）", options: issue ? [] : resources }, value: values.resources, summary: resourceLabel ?? null,
        validation: issue ? { state: "unavailable", reason: "资料目录暂不可用，暂不能核对资源类型。" }
          : resourceLabel ? { state: "valid", reason: "仅检索所选类型的资料。" } : { state: "conflict", reason: "请选择资源类型。" },
        renderEditor: editor => <ChoiceEditor editor={editor} label="选择资源类型" />, renderInlineEditor: editor => <ChoiceEditor editor={editor} label="选择资源类型" /> },
    ...(purpose === "analysis" && issue ? [{ id: "restricted-group", access: "restricted" as const, label: "额外班级", required: false,
      validation: { state: "out-of-scope" as const, reason: "另一个班级不在当前任教范围内，请重新核对选择。", count: 1 } }] : []),
  ]
  const summary = purpose === "analysis" ? [groupLabel, chapterSummary, validTime ? timeText(values.time) : null].filter(Boolean).join(" · ")
    : [book?.title, chapterSummary, resourceLabel].filter(Boolean).join(" · ")
  const changed = confirmedVersion !== null && confirmedVersion !== target.version
  const common: AgentScopeBuilderProps = {
    title: purpose === "analysis" ? "学情分析范围" : "备课资料范围", scope: target, dimensions, summary: summary || null,
    // Known fixture total for exactly this selection; other edits intentionally have no computed total.
    impact: purpose === "analysis" && values.group === "class-3" && fullChapter && selectedNames.length === 2 && values.time.preset === "two-weeks" ? "涉及 43 名学生、6 份作业" : undefined,
    exclusions: issue ? [{ reason: purpose === "analysis" ? "无权查看的班级未计入影响规模。" : "暂不可用的资料不计入本次检索。", ...(purpose === "analysis" ? { count: 1 } : {}) }] : [],
    confirmation: changed ? { state: "changed", reason: "已确认后的选择发生变化，请核对当前范围。" }
      : confirmedVersion ? { state: "confirmed", version: confirmedVersion } : { state: "unconfirmed" },
    onValueChange: change => { setValues(previous => ({ ...previous, [change.dimensionId]: change.value })); setRevision(value => value + 1); setFeedback("示例选择已更新，请核对范围。") },
    onConfirm: request => { setRequested(request); setFeedback("已请求确认；等待确认记录。") },
    onReset: () => { setResetRequest("reset"); setFeedback("已请求重置；载入示例范围前保留当前选择。") },
    onRestoreDefaults: () => { setResetRequest("defaults"); setFeedback("已请求恢复默认；载入示例范围前保留当前选择。") },
    onExpand: button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    notice: "固定示例；选择范围不会增加访问权限。",
    details: <p>未指定范围时，不会自动使用全部可用数据。确认仅针对当前选择，不表示已开始分析或检索；这里没有连接学校数据与资料服务。</p>,
  }
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例 · 三处共用同一份选择。可先载入可用范围，再请求确认并独立载入确认记录。</p>
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="navigation" variant="outline" onClick={() => { setIssue(value => !value); setRevision(value => value + 1) }}>{issue ? "载入可用范围示例" : purpose === "analysis" ? "载入越权班级示例" : "载入资料不可用示例"}</Button>
      <Button type="button" size="navigation" variant="outline" disabled={!requested || requested.version !== target.version || issue || !!dimensionIssue}
        onClick={() => { if (requested?.version === target.version && !issue && !dimensionIssue) { setConfirmedVersion(requested.version); setRequested(null); setFeedback("已载入当前范围的示例确认记录。") } }}>载入示例确认记录</Button>
      <Button type="button" size="navigation" variant="outline" disabled={!resetRequest} onClick={() => {
        if (!resetRequest) return
        setValues(resetRequest === "defaults" ? initialValues() : { group: "", edition: "", chapters: {}, time: { preset: "custom" }, resources: "" })
        setRevision(value => value + 1); setResetRequest(null); setFeedback("已载入所请求的示例范围，请重新核对。")
      }}>载入所请求的示例范围</Button>
    </div>
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "对话范围与微调"], ["workspace", "default", "完整范围构建"], ["inline", "compact", "紧凑范围确认"],
    ] as const).map(([view, density, label]) => <section key={label} ref={view === "workspace" ? workspace : undefined}
      tabIndex={view === "workspace" ? -1 : undefined} aria-label={label} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentScopeBuilder {...common} view={view} density={density} />
    </section>)}</div>
  </div>
}

export function AgentScopeBuilderDemo() {
  const [purpose, setPurpose] = useState<"analysis" | "preparation">("analysis")
  const [narrow, setNarrow] = useState(false)
  return <section id="scope-builder" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">范围构建器 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["analysis", "preparation"] as const).map(value => <Button key={value} type="button" size="navigation"
      variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "analysis" ? "学情分析范围示例" : "备课资料范围示例"}</Button>)}
      <Button type="button" size="navigation" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <ScopeBuilderExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
