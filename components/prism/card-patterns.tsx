"use client"

import { useEffect, useId, useRef, useState } from "react"
import type { ReactNode } from "react"
import { Check, ChevronDown, Clock3, FileCheck2, FileText, Layers3, Pencil, RefreshCw, Sparkles, Users } from "lucide-react"
import { AILabel, StateLabel } from "@/components/ui/badge"
import type { StateLabelTone } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ObjectCard, ObjectCardActions, ObjectCardHeader, ObjectCardIdentity, ObjectCardMeta, ObjectCardStatus } from "@/components/ui/card"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Textarea } from "@/components/ui/textarea"

export type CardDensity = "comfortable" | "compact"
type RunState = "error" | "running" | "completed"
type Summary = { text: string; edited: boolean; reviewed: boolean }
const initialSummary: Summary = { text: "方程建模能力持续提升；几何证明中对已知条件的引用仍不稳定。", edited: false, reviewed: false }
const generatedSummaries = [
  "方程建模 18／22 次正确，近三周表现持续提升。几何证明样本只有 8 份，暂不推断整体能力变化。",
  "当前证据支持方程建模表现有所提升；几何证明还需补充课堂观察，并核对 2 份存在 OCR 边界异常的作答。",
]

function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <span className="object-card-meta-item">{icon}<span>{children}</span></span>
}
function Identity({ icon, type, id, title, signal }: { icon: ReactNode; type: string; id: string; title: string; signal: ReactNode }) {
  return <ObjectCardHeader><ObjectCardIdentity><span className="object-card-mark" aria-hidden="true">{icon}</span><div className="object-card-identity-copy"><span className="object-card-type">{type}</span><h3 id={id} className="object-card-title">{title}</h3></div><div className="object-card-signal-wrap">{signal}</div></ObjectCardIdentity></ObjectCardHeader>
}
function Feedback({ tone, title, children }: { tone: StateLabelTone; title: string; children: ReactNode }) {
  return <ObjectCardStatus state={tone === "danger" ? "error" : tone === "running" ? "loading" : "help"}><StateLabel tone={tone}>{title}</StateLabel><p>{children}</p></ObjectCardStatus>
}
function Disclosure({ open, controls, children, onClick }: { open: boolean; controls: string; children: ReactNode; onClick: () => void }) {
  return <Button type="button" variant="ghost" size="compact" aria-expanded={open} aria-controls={controls} onClick={onClick}>{children}<ChevronDown aria-hidden="true" className="object-card-disclosure" data-open={open || undefined} /></Button>
}

export function CardWorkbench({ density = "comfortable", showDensityControl = false }: { density?: CardDensity; showDensityControl?: boolean }) {
  const id = useId()
  const [localDensity, setLocalDensity] = useState<CardDensity>(density)
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [runOpen, setRunOpen] = useState(false)
  const [runSelected, setRunSelected] = useState(false)
  const [runState, setRunState] = useState<RunState>("error")
  const [aiOpen, setAiOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [record, setRecord] = useState<Summary>(initialSummary)
  const [previous, setPrevious] = useState<Summary | null>(null)
  const [draft, setDraft] = useState(initialSummary.text)
  const [error, setError] = useState("")
  const [outcome, setOutcome] = useState("success")
  const [aiState, setAiState] = useState<"idle" | "running" | "error">("idle")
  const [aiFeedback, setAiFeedback] = useState("候选结论需结合依据复核；确认前不会形成正式结论。")
  const runTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const generation = useRef(0)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const restoreEditFocus = useRef(false)
  const isGenerating = aiState === "running"
  const completedCount = runState === "completed" ? 46 : 41

  useEffect(() => () => {
    if (runTimer.current !== null) clearTimeout(runTimer.current)
    if (aiTimer.current !== null) clearTimeout(aiTimer.current)
  }, [])
  useEffect(() => {
    if (editing) editorRef.current?.focus()
    else if (restoreEditFocus.current) { restoreEditFocus.current = false; editButtonRef.current?.focus() }
  }, [editing])

  function retryRun() {
    if (runTimer.current !== null) return
    setRunState("running")
    runTimer.current = setTimeout(() => { runTimer.current = null; setRunState("completed") }, 1600)
  }
  function regenerate() {
    if (aiTimer.current !== null || editing) return
    setAiState("running")
    setAiFeedback("正在生成新初稿；上一份结论与复核结果仍保留。")
    aiTimer.current = setTimeout(() => {
      aiTimer.current = null
      if (outcome === "error") {
        setAiState("error")
        setAiFeedback("生成失败，已保留上一份结论、来源与复核结果；可以重新分析。")
        return
      }
      setRecord({ text: generatedSummaries[generation.current++ % generatedSummaries.length], edited: false, reviewed: false })
      setPrevious(null)
      setAiState("idle")
      setAiFeedback("新初稿已生成，仍需人工复核。")
    }, 1600)
  }
  function beginEditing() {
    if (aiTimer.current !== null) return
    setDraft(record.text)
    setAiState("idle")
    setError("")
    setEditing(true)
  }
  function finishEditing() { restoreEditFocus.current = true; setEditing(false) }
  function applySummary() {
    const next = draft.trim()
    if (!next) { setError("请填写候选结论后再应用。"); editorRef.current?.focus(); return }
    if (next !== record.text) {
      setPrevious(record)
      setRecord({ text: next, edited: true, reviewed: false })
      setAiFeedback("修改已应用，保留 AI 来源；修改后的结论需重新复核。")
    } else setAiFeedback("内容未改变，保留原有结论与复核结果。")
    setAiState("idle")
    finishEditing()
  }
  function undoSummary() {
    if (!previous || aiTimer.current !== null) return
    setRecord(previous)
    setPrevious(null)
    editButtonRef.current?.focus()
    setAiState("idle")
    setAiFeedback("已撤回上次修改，恢复先前结论、来源与复核结果。")
  }
  function reviewSummary() {
    if (aiTimer.current !== null || editing) return
    setRecord({ ...record, reviewed: !record.reviewed })
    setAiState("idle")
    setAiFeedback(record.reviewed ? "已撤回复核，当前结论重新等待人工确认。" : "人工已确认当前结论；AI 来源继续保留。")
  }

  return <div className="object-card-workbench" data-density={showDensityControl ? localDensity : density}>
    <p className="object-card-example-note">示例数据。操作只影响当前对象，结果仅在本页保留；刷新恢复初始内容。</p>
    <div className="object-card-toolbar">
      {showDensityControl && <div><span>界面密度</span><SegmentedControl label="Card 界面密度" size="sm" value={localDensity} onValueChange={value => setLocalDensity(value as CardDensity)} items={[["comfortable", "舒适"], ["compact", "紧凑"]]} /></div>}
      <div><span>模拟生成结果</span><SegmentedControl label="模拟 AI 生成结果" disabled={isGenerating} size="sm" value={outcome} onValueChange={setOutcome} items={[["success", "成功"], ["error", "失败"]]} /></div>
    </div>
    <div className="object-card-grid">
      <ObjectCard aria-labelledby={`${id}-evidence-title`}>
        <Identity icon={<FileText />} type="证据记录 · EV-0912" id={`${id}-evidence-title`} title="林予安 · 第 12 题作答证据" signal={<StateLabel tone="pending">待核验</StateLabel>} />
        <div className="object-card-content">
          <ObjectCardMeta><MetaItem icon={<FileCheck2 aria-hidden="true" />}>周测答题卡扫描</MetaItem><MetaItem icon={<Layers3 aria-hidden="true" />}>一元二次方程 · 第 12 题</MetaItem><MetaItem icon={<Clock3 aria-hidden="true" />}>14:21</MetaItem></ObjectCardMeta>
          <div className="object-card-summary"><span>当前判断</span><p>答案跨越题目右侧边界，OCR 已识别主表达式，但结论行仍需人工比对。</p></div>
          <div id={`${id}-evidence-detail`} className="object-card-detail" hidden={!evidenceOpen}><dl><div><dt>OCR 解释</dt><dd>x² − 5x + 6 = 0；x = 2 或 3</dd></div><div><dt>异常信号</dt><dd>结论行越过右栏 18px，需人工比对。</dd></div><div><dt>证据范围</dt><dd>本例提供文字解释；原始作答图像未接入，不能在此完成核验。</dd></div></dl></div>
        </div>
        <footer className="object-card-footer"><p className="object-card-static-note">先比对原始作答与 OCR 解释；展开详情不会改变核验状态。</p><ObjectCardActions><Disclosure open={evidenceOpen} controls={`${id}-evidence-detail`} onClick={() => setEvidenceOpen(value => !value)}>查看证据依据</Disclosure></ObjectCardActions></footer>
      </ObjectCard>

      <ObjectCard aria-labelledby={`${id}-run-title`} selected={runSelected}>
        <Identity icon={<RefreshCw />} type="处理运行 · PR-042" id={`${id}-run-title`} title="九年级数学周测批阅" signal={<StateLabel tone={runState === "error" ? "danger" : runState}>{runState === "error" ? "部分失败" : runState === "running" ? "正在处理" : "处理完成"}</StateLabel>} />
        <div className="object-card-content">
          <ObjectCardMeta><MetaItem icon={<FileCheck2 aria-hidden="true" />}>周测答题卡</MetaItem><MetaItem icon={<Users aria-hidden="true" />}>9A 班 · 46 份</MetaItem><MetaItem icon={<Clock3 aria-hidden="true" />}>14:18 启动</MetaItem></ObjectCardMeta>
          <div className="object-card-progress"><div><span>结构化与批阅进度</span><strong>{completedCount}／46</strong></div><div className="object-card-progress-track" role="progressbar" aria-label="结构化与批阅进度" aria-valuemin={0} aria-valuemax={46} aria-valuenow={completedCount}><span style={{ width: `${completedCount / 46 * 100}%` }} /></div><StateLabel tone="pending">6 项跨栏书写需要教师复核</StateLabel></div>
          <div id={`${id}-run-detail`} className="object-card-detail" hidden={!runOpen}><dl><div><dt>输入与切分</dt><dd>46／46 · 已完成</dd></div><div><dt>OCR 解释</dt><dd>46／46 · 已完成</dd></div><div><dt>证据链批阅</dt><dd>{completedCount}／46 · {runState === "completed" ? "6 项待复核" : runState === "running" ? "正在重试 5 份" : "5 份可重试"}</dd></div></dl></div>
        </div>
        <footer className="object-card-footer"><Feedback tone={runState === "error" ? "danger" : runState} title={runState === "error" ? "5 份处理失败" : runState === "running" ? "正在重试" : "本轮处理完成"}>{runState === "completed" ? "46 份处理结果已保留；6 项仍等待教师复核。" : "41 份已有结果保留，重试只处理失败的 5 份。"}</Feedback><ObjectCardActions><Button type="button" variant={runSelected ? "secondary" : "outline"} size="compact" aria-pressed={runSelected} onClick={() => setRunSelected(value => !value)}><Check aria-hidden="true" />{runSelected ? "已选择" : "选择此运行"}</Button>{runState === "completed" ? <Button type="button" variant="ghost" size="compact" onClick={() => setRunState("error")}>重置运行示例</Button> : <Button type="button" variant="outline" size="compact" onClick={retryRun} loading={runState === "running"} loadingLabel="正在重试">重试 5 份</Button>}<Disclosure open={runOpen} controls={`${id}-run-detail`} onClick={() => setRunOpen(value => !value)}>查看阶段</Disclosure></ObjectCardActions></footer>
      </ObjectCard>

      <ObjectCard aria-labelledby={`${id}-ai-title`} tone="ai" className="object-card--wide">
        <Identity icon={<FileText />} type="诊断假设 · DH-118" id={`${id}-ai-title`} title="林予安 · 方程建模能力诊断" signal={<AILabel>{record.edited ? "AI 初稿 · 人工已编辑" : "AI 初稿"}</AILabel>} />
        <div className="object-card-content">
          <ObjectCardMeta><MetaItem icon={<Layers3 aria-hidden="true" />}>课堂 24 · 作业 72 · 测评 32</MetaItem><MetaItem icon={<Clock3 aria-hidden="true" />}>近 30 天</MetaItem><StateLabel tone={record.reviewed ? "success" : "pending"}>{record.reviewed ? "人工已确认" : "待复核"}</StateLabel></ObjectCardMeta>
          <div className="object-card-summary object-card-summary--reading">
            {editing ? <><label htmlFor={`${id}-editor`}>候选结论 · 编辑中</label><Textarea id={`${id}-editor`} ref={editorRef} value={draft} onChange={event => { setDraft(event.currentTarget.value); if (error && event.currentTarget.value.trim()) setError("") }} aria-invalid={Boolean(error)} aria-describedby={`${id}-editor-help`} className="object-card-editor" /><p id={`${id}-editor-help`} className="object-card-editor-help" data-error={Boolean(error)}>{error || "应用后更新本页结论；取消保留上次已应用内容。"}</p></> : <><span>候选结论</span><p>{record.text}</p></>}
          </div>
          <p className="object-card-limitation">判断范围：几何证明样本只有 8 份，其中 2 份存在 OCR 边界异常，需结合原始证据判断。</p>
          <div id={`${id}-ai-detail`} className="object-card-detail" hidden={!aiOpen}><dl><div><dt>支持证据</dt><dd>方程建模 18／22 次正确；连续三周保持上升。</dd></div><div><dt>不确定来源</dt><dd>几何证明样本较少；2 份作答存在 OCR 边界异常。</dd></div><div><dt>保留范围</dt><dd>本例只更新当前页面，不写入学生状态，不触发学习任务。</dd></div></dl></div>
        </div>
        <footer className="object-card-footer">
          <Feedback tone={isGenerating ? "running" : aiState === "error" ? "danger" : "neutral"} title={isGenerating ? "正在重新分析" : aiState === "error" ? "生成失败" : editing ? "修改尚未应用" : "当前结论"}>{editing ? "正在编辑当前对象，已应用内容与复核结果保留至本次应用。" : aiFeedback}</Feedback>
          <ObjectCardActions>{editing ? <><Button type="button" variant="ghost" size="compact" onClick={() => { finishEditing(); setAiFeedback("已取消编辑，保留原有结论与复核结果。") }}>取消</Button><Button type="button" size="compact" onClick={applySummary}>应用修正</Button></> : <><Button type="button" variant="ai-soft" size="compact" onClick={regenerate} loading={isGenerating} loadingLabel="正在生成"><Sparkles aria-hidden="true" />重新分析</Button><Button ref={editButtonRef} type="button" variant="outline" size="compact" disabled={isGenerating} onClick={beginEditing}><Pencil aria-hidden="true" />编辑结论</Button><Button type="button" variant="outline" size="compact" disabled={isGenerating} onClick={reviewSummary}>{record.reviewed ? "撤回复核" : "确认复核"}</Button>{previous && <Button type="button" variant="ghost" size="compact" disabled={isGenerating} onClick={undoSummary}>撤回修改</Button>}</>}<Disclosure open={aiOpen} controls={`${id}-ai-detail`} onClick={() => setAiOpen(value => !value)}>查看依据</Disclosure></ObjectCardActions>
        </footer>
      </ObjectCard>
    </div>
  </div>
}
