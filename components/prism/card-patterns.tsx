"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck2,
  FileText,
  HelpCircle,
  Layers3,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ObjectCard,
  ObjectCardActions,
  ObjectCardHeader,
  ObjectCardIdentity,
  ObjectCardMeta,
  ObjectCardStatus,
} from "@/components/ui/card"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Textarea } from "@/components/ui/textarea"

export type CardDensity = "comfortable" | "compact"
type SlotState = "help" | "loading" | "error" | "success"
type CardKind = "evidence" | "run" | "ai"

const slotCopy: Record<CardKind, Record<SlotState, { title: string; detail: string }>> = {
  evidence: {
    help: { title: "待核验证据", detail: "先比对原始作答与 OCR 解释，再进入批阅。" },
    loading: { title: "正在核验证据", detail: "保留当前内容，身份与来源不会消失。" },
    error: { title: "核验未完成", detail: "原始证据仍可阅读；OCR 解释需要人工确认。" },
    success: { title: "证据已核验", detail: "原始作答、OCR 解释与题目范围一致。" },
  },
  run: {
    help: { title: "运行说明", detail: "已完成 34／46；6 项异常记录优先进入教师复核。" },
    loading: { title: "批阅运行中", detail: "已完成 34／46；当前结果可继续扫读。" },
    error: { title: "部分处理失败", detail: "41／46 已保留；5 份进入可重试队列。" },
    success: { title: "本轮处理完成", detail: "46／46 已写入证据链，6 项等待教师复核。" },
  },
  ai: {
    help: { title: "人工复核中", detail: "中等置信；编辑或确认前不会写入学生状态。" },
    loading: { title: "正在重新生成摘要", detail: "保留上一版本，来源与观察范围保持可见。" },
    error: { title: "生成失败", detail: "已保留上一版本；可检查依据后重新生成。" },
    success: { title: "摘要已保存", detail: "当前版本仍标记为 AI 生成，并保留人工编辑记录。" },
  },
}

const stateOptions = [["help", "说明"], ["loading", "处理中"], ["error", "失败"], ["success", "成功"]] as const

function MetaItem({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <span className="object-card-meta-item" aria-label={`${label}：${String(children)}`}>{icon}{children}</span>
}

function StatusSlot({ kind, state }: { kind: CardKind; state: SlotState }) {
  const copy = slotCopy[kind][state]
  const Icon = state === "help" ? HelpCircle : state === "loading" ? Loader2 : state === "error" ? AlertCircle : CheckCircle2
  return <ObjectCardStatus state={state}><Icon aria-hidden="true" className={state === "loading" ? "object-card-spin" : undefined} /><span><strong>{copy.title}</strong><small>{copy.detail}</small></span></ObjectCardStatus>
}

function StateSignal({ kind, state }: { kind: "evidence" | "run"; state: SlotState }) {
  const labels = kind === "evidence" ? { help: "待核验", loading: "核验中", error: "未完成", success: "已核验" } : { help: "6 待复核", loading: "处理中", error: "部分失败", success: "已完成" }
  const Icon = state === "loading" ? Loader2 : state === "success" ? CheckCircle2 : AlertCircle
  const tone = state === "loading" ? "running" : state === "success" ? "success" : state === "error" ? "danger" : "pending"
  return <span className="object-card-signal" data-tone={tone}><Icon aria-hidden="true" className={state === "loading" ? "object-card-spin" : undefined} />{labels[state]}</span>
}

function Identity({ icon, type, id, title, tone = "knowledge", signal }: { icon: ReactNode; type: string; id: string; title: string; tone?: "knowledge" | "ai"; signal: ReactNode }) {
  return <ObjectCardHeader><ObjectCardIdentity><span className="object-card-mark" data-tone={tone} aria-hidden="true">{icon}</span><div className="object-card-identity-copy"><span className="object-card-type">{type} · {id}</span><h3 id={`${id}-title`} className="object-card-title">{title}</h3></div><div className="object-card-signal-wrap">{signal}</div></ObjectCardIdentity></ObjectCardHeader>
}

function Disclosure({ open, controls, children, onClick }: { open: boolean; controls: string; children: ReactNode; onClick: () => void }) {
  return <Button type="button" variant="ghost" size="compact" aria-expanded={open} aria-controls={controls} onClick={onClick}>{children}<ChevronDown aria-hidden="true" className="object-card-disclosure" data-open={open || undefined} /></Button>
}

export function CardWorkbench({ density = "comfortable", showDensityControl = false }: { density?: CardDensity; showDensityControl?: boolean }) {
  const [localDensity, setLocalDensity] = useState<CardDensity>(density)
  const [slotState, setSlotState] = useState<SlotState>("help")
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [runOpen, setRunOpen] = useState(false)
  const [runSelected, setRunSelected] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [summary, setSummary] = useState("方程建模能力持续提升；几何证明中对已知条件的引用仍不稳定。")
  const [draft, setDraft] = useState(summary)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const restoreEditFocusRef = useRef(false)
  const activeDensity = showDensityControl ? localDensity : density

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  useEffect(() => {
    if (editing) editorRef.current?.focus()
    else if (restoreEditFocusRef.current) { restoreEditFocusRef.current = false; editButtonRef.current?.focus() }
  }, [editing])

  function chooseState(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setSlotState(value as SlotState)
  }

  function regenerate() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSlotState("loading")
    timerRef.current = setTimeout(() => { timerRef.current = null; setSlotState("success") }, 1600)
  }

  function beginEditing() { setAiOpen(true); setDraft(summary); restoreEditFocusRef.current = false; setEditing(true) }
  function cancelEditing() { restoreEditFocusRef.current = true; setEditing(false) }
  function saveSummary() { const next = draft.trim(); if (next) setSummary(next); restoreEditFocusRef.current = true; setEditing(false); setSlotState("success") }

  return <div className="object-card-workbench" data-density={activeDensity}>
    <div className="object-card-toolbar">
      {showDensityControl && <div><span>界面密度</span><SegmentedControl label="Card 界面密度" size="sm" value={localDensity} onValueChange={(value) => setLocalDensity(value as CardDensity)} items={[["comfortable", "舒适"], ["compact", "紧凑"]]} /></div>}
      <div><span>固定状态槽</span><SegmentedControl label="Card 固定状态槽" size="sm" value={slotState} onValueChange={chooseState} items={stateOptions} /></div>
    </div>
    <div className="object-card-grid">
      <ObjectCard aria-labelledby="EV-0912-title">
        <Identity icon={<FileText />} type="证据记录" id="EV-0912" title="林予安 · 第 12 题作答证据" signal={<StateSignal kind="evidence" state={slotState} />} />
        <div className="object-card-content"><ObjectCardMeta><MetaItem icon={<FileCheck2 aria-hidden="true" />} label="来源">周测答题卡扫描</MetaItem><MetaItem icon={<Layers3 aria-hidden="true" />} label="范围">一元二次方程 · 第 12 题</MetaItem><MetaItem icon={<Clock3 aria-hidden="true" />} label="时间">14:21</MetaItem></ObjectCardMeta><div className="object-card-summary"><span>当前判断</span><p>答案跨越题目右侧边界，OCR 已识别主表达式，但结论行仍需人工比对。</p></div><div id="evidence-detail" className="object-card-detail" data-open={evidenceOpen || undefined} hidden={!evidenceOpen}><dl><div><dt>OCR 解释</dt><dd>x² − 5x + 6 = 0；x = 2 或 3</dd></div><div><dt>异常信号</dt><dd>结论行越过右栏 18px，识别置信度 78%</dd></div><div><dt>关联对象</dt><dd>QuestionVersion QV-12.4 · AnswerSegment AS-0912</dd></div></dl></div></div>
        <footer className="object-card-footer"><StatusSlot kind="evidence" state={slotState} /><ObjectCardActions><Disclosure open={evidenceOpen} controls="evidence-detail" onClick={() => setEvidenceOpen(value => !value)}>查看证据依据</Disclosure></ObjectCardActions></footer>
      </ObjectCard>

      <ObjectCard aria-labelledby="PR-042-title" selected={runSelected}>
        <Identity icon={<RefreshCw />} type="处理运行" id="PR-042" title="九年级数学周测批阅" signal={<StateSignal kind="run" state={slotState} />} />
        <div className="object-card-content"><ObjectCardMeta><MetaItem icon={<FileCheck2 aria-hidden="true" />} label="来源">周测答题卡</MetaItem><MetaItem icon={<Users aria-hidden="true" />} label="范围">9A 班 · 46 份</MetaItem><MetaItem icon={<Clock3 aria-hidden="true" />} label="时间">14:18 启动</MetaItem></ObjectCardMeta><div className="object-card-progress"><div><span>结构化与批阅进度</span><strong>{slotState === "success" ? "46／46" : slotState === "error" ? "41／46" : "34／46"}</strong></div><div className="object-card-progress-track" role="progressbar" aria-label="结构化与批阅进度" aria-valuemin={0} aria-valuemax={46} aria-valuenow={slotState === "success" ? 46 : slotState === "error" ? 41 : 34}><span style={{ width: `${slotState === "success" ? 100 : slotState === "error" ? 89 : 74}%` }} /></div><p><AlertCircle aria-hidden="true" />6 项跨栏书写需要教师复核</p></div><div id="run-detail" className="object-card-detail" data-open={runOpen || undefined} hidden={!runOpen}><ul className="object-card-stages"><li><Check aria-hidden="true" /><span><strong>输入与切分</strong><small>46／46 · 已完成</small></span></li><li><Check aria-hidden="true" /><span><strong>OCR 解释</strong><small>46／46 · 已完成</small></span></li><li data-state="attention"><AlertCircle aria-hidden="true" /><span><strong>证据链批阅</strong><small>{slotState === "success" ? "46／46 · 6 项待复核" : slotState === "error" ? "41／46 · 5 份可重试" : "34／46 · 6 项待复核"}</small></span></li></ul></div></div>
        <footer className="object-card-footer"><StatusSlot kind="run" state={slotState} /><ObjectCardActions><Button type="button" variant={runSelected ? "secondary" : "outline"} size="compact" aria-pressed={runSelected} onClick={() => setRunSelected(value => !value)}><Check aria-hidden="true" />{runSelected ? "已选择" : "选择此运行"}</Button><Disclosure open={runOpen} controls="run-detail" onClick={() => setRunOpen(value => !value)}>查看阶段</Disclosure></ObjectCardActions></footer>
      </ObjectCard>

      <ObjectCard aria-labelledby="DH-118-title" tone="ai" className="object-card--wide">
        <Identity icon={<Sparkles />} type="诊断假设" id="DH-118" title="林予安 · 方程建模能力诊断" tone="ai" signal={<span className="object-card-signal" data-tone="ai"><Sparkles aria-hidden="true" />AI 生成</span>} />
        <div className="object-card-content"><ObjectCardMeta><MetaItem icon={<Layers3 aria-hidden="true" />} label="来源">课堂 24 · 作业 72 · 测评 32</MetaItem><MetaItem icon={<Clock3 aria-hidden="true" />} label="范围">近 30 天 · 生成于 14:28</MetaItem><span className="object-card-confidence"><AlertCircle aria-hidden="true" />中等置信 · 72%</span></ObjectCardMeta><div className="object-card-ai-layout"><div className="object-card-summary"><span>候选结论</span>{editing ? <Textarea ref={editorRef} value={draft} onChange={event => setDraft(event.currentTarget.value)} aria-label="编辑诊断摘要" className="object-card-editor" /> : <p>{summary}</p>}</div><div className="object-card-confidence-block" aria-label="AI 置信度：中等，72%"><div><span>置信度</span><strong>72% · 中等</strong></div><div className="object-card-confidence-track"><span /></div><small>证据一致性较高，但几何证明样本只有 8 份。</small></div></div><div id="ai-detail" className="object-card-detail" data-open={aiOpen || undefined} hidden={!aiOpen}><dl><div><dt>支持证据</dt><dd>方程建模 18／22 次正确；连续三周保持上升</dd></div><div><dt>不确定来源</dt><dd>几何证明样本较少；2 份作答存在 OCR 边界异常</dd></div><div><dt>写入边界</dt><dd>教师确认前不写入学生状态，不触发学习任务</dd></div></dl></div></div>
        <footer className="object-card-footer"><StatusSlot kind="ai" state={editing ? "help" : slotState} /><ObjectCardActions>{editing ? <><Button type="button" variant="ghost" size="compact" onClick={cancelEditing}><X aria-hidden="true" />取消</Button><Button type="button" size="compact" onClick={saveSummary}><Save aria-hidden="true" />保存摘要</Button></> : <><Button type="button" variant="ai-soft" size="compact" onClick={regenerate} loading={slotState === "loading"} loadingLabel="正在生成"><Sparkles aria-hidden="true" />重新分析</Button><Button ref={editButtonRef} type="button" variant="outline" size="compact" onClick={beginEditing}><Pencil aria-hidden="true" />编辑摘要</Button><Disclosure open={aiOpen} controls="ai-detail" onClick={() => setAiOpen(value => !value)}>查看依据</Disclosure></>}</ObjectCardActions></footer>
      </ObjectCard>
    </div>
  </div>
}
