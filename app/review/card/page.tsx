"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
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
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Textarea } from "@/components/ui/textarea"

import styles from "./review.module.css"

type Density = "comfortable" | "compact"
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

const stateOptions = [
  ["help", "说明"],
  ["loading", "处理中"],
  ["error", "失败"],
  ["success", "成功"],
] as const

function MetaRow({ children }: { children: ReactNode }) {
  return <div className={styles.metaRow}>{children}</div>
}

function MetaItem({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <span className={styles.metaItem} aria-label={`${label}：${String(children)}`}>{icon}{children}</span>
}

function StatusSlot({ kind, state }: { kind: CardKind; state: SlotState }) {
  const copy = slotCopy[kind][state]
  const Icon = state === "help" ? HelpCircle : state === "loading" ? Loader2 : state === "error" ? AlertCircle : CheckCircle2
  return (
    <div
      className={styles.statusSlot}
      data-state={state}
      role={state === "error" ? "alert" : "status"}
      aria-live="polite"
      aria-atomic="true"
      aria-busy={state === "loading" || undefined}
    >
      <Icon aria-hidden="true" className={state === "loading" ? styles.spin : undefined} />
      <span><strong>{copy.title}</strong><small>{copy.detail}</small></span>
    </div>
  )
}

function ObjectStateSignal({ kind, state }: { kind: "evidence" | "run"; state: SlotState }) {
  const labels = kind === "evidence"
    ? { help: "待核验", loading: "核验中", error: "未完成", success: "已核验" }
    : { help: "6 待复核", loading: "处理中", error: "部分失败", success: "已完成" }
  const Icon = state === "loading" ? Loader2 : state === "success" ? CheckCircle2 : AlertCircle
  const tone = state === "loading" ? "running" : state === "success" ? "success" : state === "error" ? "danger" : "pending"
  return <span className={styles.signalLabel} data-tone={tone}><Icon aria-hidden="true" className={state === "loading" ? styles.spin : undefined} />{labels[state]}</span>
}

function ObjectHeader({
  icon,
  type,
  id,
  title,
  tone = "knowledge",
  signal,
}: {
  icon: ReactNode
  type: string
  id: string
  title: string
  tone?: "knowledge" | "ai"
  signal: ReactNode
}) {
  return (
    <CardHeader className={styles.objectHeader}>
      <div className={styles.identityLine}>
        <span className={styles.objectMark} data-tone={tone} aria-hidden="true">{icon}</span>
        <div className={styles.identityCopy}>
          <span className={styles.objectType}>{type} · {id}</span>
          <h3 id={`${id}-title`} className={styles.objectTitle}>{title}</h3>
        </div>
        <div className={styles.objectSignal}>{signal}</div>
      </div>
    </CardHeader>
  )
}

function DisclosureButton({ open, controls, children, onClick }: { open: boolean; controls: string; children: ReactNode; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="compact" aria-expanded={open} aria-controls={controls} onClick={onClick}>
      {children}<ChevronDown aria-hidden="true" className={styles.disclosureIcon} data-open={open || undefined} />
    </Button>
  )
}

export default function CardReviewPage() {
  const [density, setDensity] = useState<Density>("comfortable")
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

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  useEffect(() => {
    if (editing) editorRef.current?.focus()
    else if (restoreEditFocusRef.current) {
      restoreEditFocusRef.current = false
      editButtonRef.current?.focus()
    }
  }, [editing])

  function chooseSlotState(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setSlotState(value as SlotState)
  }

  function regenerate() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSlotState("loading")
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setSlotState("success")
    }, 1600)
  }

  function beginEditing() {
    setAiOpen(true)
    setDraft(summary)
    restoreEditFocusRef.current = false
    setEditing(true)
  }

  function cancelEditing() {
    restoreEditFocusRef.current = true
    setEditing(false)
  }

  function saveSummary() {
    const next = draft.trim()
    if (next) setSummary(next)
    restoreEditFocusRef.current = true
    setEditing(false)
    setSlotState("success")
  }

  return (
    <main id="main-content" tabIndex={-1} className={styles.review} data-density={density}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>临时设计评审 · Card · 未替换正式组件</p>
          <h1>Card 作为连续对象</h1>
          <p>对象身份留在原位；来源、范围、时间与状态组成固定阅读骨架，详情和操作按意图就地展开。</p>
        </div>
        <div className={styles.headerLinks}>
          <Link href="/components/card">版本 12 Card</Link>
          <Link href="/benchmark">正式 Benchmark</Link>
        </div>
      </header>

      <section className={styles.proposition} aria-labelledby="proposition-title">
        <div className={styles.sectionHeading}>
          <div><span>设计命题</span><h2 id="proposition-title">三类真实对象，共用一套 Card 语法</h2></div>
          <p>Identity → Context → Stable status → Summary → Disclosure / Actions</p>
        </div>
        <ol className={styles.typeGrid}>
          <li><span>01 · 阅读与追溯</span><strong>证据卡 · EvidenceRecord</strong><p>标题与编号先确定对象，紧随其后的是来源、题目范围和采集时间；摘要只回答“看到了什么”。</p><small>不把整卡做成按钮；原图、OCR 解释与关联证据按需展开。</small></li>
          <li><span>02 · 运行与复核</span><strong>处理卡 · ProcessingRun</strong><p>任务身份、输入范围与启动时间保持不动；进度、异常和运行反馈进入固定状态槽。</p><small>选择用于批量工作，展开用于阶段详情；两者使用不同的明确控件。</small></li>
          <li><span>03 · AI 与人工判断</span><strong>复核卡 · DiagnosisHypothesis</strong><p>AI 来源、观察周期、置信度与待复核状态贴近结论；依据和编辑均留在同一对象内。</p><small>只用于需要人工判断的候选结论；普通 AI 文案不升级为复核卡。</small></li>
        </ol>
      </section>

      <section className={styles.benchmarkSection} aria-labelledby="benchmark-title">
        <div className={styles.sectionHeading}>
          <div><span>真实 Benchmark</span><h2 id="benchmark-title">教育证据工作台</h2></div>
          <p>同一页面检验扫读、聚焦、选择、展开、编辑与异步状态替换。</p>
        </div>

        <div className={styles.benchmarkToolbar}>
          <div><span>界面密度</span><SegmentedControl label="Card 界面密度" size="sm" value={density} onValueChange={(value) => setDensity(value as Density)} items={[["comfortable", "舒适"], ["compact", "紧凑"]]} /></div>
          <div><span>固定状态槽演练</span><SegmentedControl label="Card 固定状态槽演练" size="sm" value={slotState} onValueChange={chooseSlotState} items={stateOptions} /></div>
        </div>

        <div className={styles.workspace}>
          <header className={styles.workspaceHeader}>
            <div><span>九年级数学 · 教育证据</span><strong>今日需要判断的对象</strong></div>
            <p>2026-09-06 · 最近同步 14:32</p>
          </header>

          <div className={styles.cardGrid}>
            <Card role="article" aria-labelledby="EV-0912-title" className={styles.candidateCard} data-kind="evidence">
              <ObjectHeader
                icon={<FileText />}
                type="证据记录"
                id="EV-0912"
                title="林予安 · 第 12 题作答证据"
                signal={<ObjectStateSignal kind="evidence" state={slotState} />}
              />
              <CardContent className={styles.objectContent}>
                <MetaRow>
                  <MetaItem icon={<FileCheck2 aria-hidden="true" />} label="来源">周测答题卡扫描</MetaItem>
                  <MetaItem icon={<Layers3 aria-hidden="true" />} label="范围">一元二次方程 · 第 12 题</MetaItem>
                  <MetaItem icon={<Clock3 aria-hidden="true" />} label="时间">14:21</MetaItem>
                </MetaRow>
                <div className={styles.summaryBlock}>
                  <span className={styles.summaryLabel}>当前判断</span>
                  <p>答案跨越题目右侧边界，OCR 已识别主表达式，但结论行仍需人工比对。</p>
                </div>
                <div id="evidence-detail" className={styles.detailPanel} data-open={evidenceOpen || undefined} hidden={!evidenceOpen}>
                  <dl className={styles.detailList}>
                    <div><dt>OCR 解释</dt><dd>x² − 5x + 6 = 0；x = 2 或 3</dd></div>
                    <div><dt>异常信号</dt><dd>结论行越过右栏 18px，识别置信度 78%</dd></div>
                    <div><dt>关联对象</dt><dd>QuestionVersion QV-12.4 · AnswerSegment AS-0912</dd></div>
                  </dl>
                </div>
              </CardContent>
              <CardFooter className={styles.objectFooter}>
                <StatusSlot kind="evidence" state={slotState} />
                <div className={styles.actionRow}><DisclosureButton open={evidenceOpen} controls="evidence-detail" onClick={() => setEvidenceOpen((value) => !value)}>查看证据依据</DisclosureButton></div>
              </CardFooter>
            </Card>

            <Card role="article" aria-labelledby="PR-042-title" className={styles.candidateCard} data-kind="run" data-selected={runSelected || undefined}>
              <ObjectHeader
                icon={<RefreshCw />}
                type="处理运行"
                id="PR-042"
                title="九年级数学周测批阅"
                signal={<ObjectStateSignal kind="run" state={slotState} />}
              />
              <CardContent className={styles.objectContent}>
                <MetaRow>
                  <MetaItem icon={<FileCheck2 aria-hidden="true" />} label="来源">周测答题卡</MetaItem>
                  <MetaItem icon={<Users aria-hidden="true" />} label="范围">9A 班 · 46 份</MetaItem>
                  <MetaItem icon={<Clock3 aria-hidden="true" />} label="时间">14:18 启动</MetaItem>
                </MetaRow>
                <div className={styles.progressBlock}>
                  <div><span>结构化与批阅进度</span><strong>{slotState === "success" ? "46／46" : slotState === "error" ? "41／46" : "34／46"}</strong></div>
                  <div className={styles.progressTrack} role="progressbar" aria-label="结构化与批阅进度" aria-valuemin={0} aria-valuemax={46} aria-valuenow={slotState === "success" ? 46 : slotState === "error" ? 41 : 34}>
                    <span style={{ width: `${slotState === "success" ? 100 : slotState === "error" ? 89 : 74}%` }} />
                  </div>
                  <p><AlertCircle aria-hidden="true" />6 项跨栏书写需要教师复核</p>
                </div>
                <div id="run-detail" className={styles.detailPanel} data-open={runOpen || undefined} hidden={!runOpen}>
                  <ul className={styles.stageList}>
                    <li><Check aria-hidden="true" /><span><strong>输入与切分</strong><small>46／46 · 已完成</small></span></li>
                    <li><Check aria-hidden="true" /><span><strong>OCR 解释</strong><small>46／46 · 已完成</small></span></li>
                    <li data-state="attention"><AlertCircle aria-hidden="true" /><span><strong>证据链批阅</strong><small>{slotState === "success" ? "46／46 · 6 项待复核" : slotState === "error" ? "41／46 · 5 份可重试" : "34／46 · 6 项待复核"}</small></span></li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className={styles.objectFooter}>
                <StatusSlot kind="run" state={slotState} />
                <div className={styles.actionRow}>
                  <Button type="button" variant={runSelected ? "secondary" : "outline"} size="compact" aria-pressed={runSelected} onClick={() => setRunSelected((value) => !value)}>
                    <Check aria-hidden="true" />{runSelected ? "已选择" : "选择此运行"}
                  </Button>
                  <DisclosureButton open={runOpen} controls="run-detail" onClick={() => setRunOpen((value) => !value)}>查看阶段</DisclosureButton>
                </div>
              </CardFooter>
            </Card>

            <Card role="article" aria-labelledby="DH-118-title" className={`${styles.candidateCard} ${styles.aiCard}`} data-kind="ai">
              <ObjectHeader
                icon={<Sparkles />}
                type="诊断假设"
                id="DH-118"
                title="林予安 · 方程建模能力诊断"
                tone="ai"
                signal={<span className={styles.signalLabel} data-tone="ai"><Sparkles aria-hidden="true" />AI 生成</span>}
              />
              <CardContent className={styles.objectContent}>
                <MetaRow>
                  <MetaItem icon={<Layers3 aria-hidden="true" />} label="来源">课堂 24 · 作业 72 · 测评 32</MetaItem>
                  <MetaItem icon={<Clock3 aria-hidden="true" />} label="范围">近 30 天 · 生成于 14:28</MetaItem>
                  <span className={styles.confidence}><AlertCircle aria-hidden="true" />中等置信 · 72%</span>
                </MetaRow>
                <div className={styles.aiLayout}>
                  <div className={styles.summaryBlock}>
                    <span className={styles.summaryLabel}>候选结论</span>
                    {editing ? (
                      <Textarea ref={editorRef} value={draft} onChange={(event) => setDraft(event.currentTarget.value)} aria-label="编辑诊断摘要" className={styles.summaryEditor} />
                    ) : <p>{summary}</p>}
                  </div>
                  <div className={styles.confidenceBlock} aria-label="AI 置信度：中等，72%">
                    <div><span>置信度</span><strong>72% · 中等</strong></div>
                    <div className={styles.confidenceTrack}><span /></div>
                    <small>证据一致性较高，但几何证明样本只有 8 份。</small>
                  </div>
                </div>
                <div id="ai-detail" className={styles.detailPanel} data-open={aiOpen || undefined} hidden={!aiOpen}>
                  <dl className={styles.detailList}>
                    <div><dt>支持证据</dt><dd>方程建模 18／22 次正确；连续三周保持上升</dd></div>
                    <div><dt>不确定来源</dt><dd>几何证明样本较少；2 份作答存在 OCR 边界异常</dd></div>
                    <div><dt>写入边界</dt><dd>教师确认前不写入学生状态，不触发学习任务</dd></div>
                  </dl>
                </div>
              </CardContent>
              <CardFooter className={styles.objectFooter}>
                <StatusSlot kind="ai" state={editing ? "help" : slotState} />
                <div className={styles.actionRow}>
                  {editing ? (
                    <>
                      <Button type="button" variant="ghost" size="compact" onClick={cancelEditing}><X aria-hidden="true" />取消</Button>
                      <Button type="button" size="compact" onClick={saveSummary}><Save aria-hidden="true" />保存摘要</Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="ai-soft" size="compact" onClick={regenerate} loading={slotState === "loading"} loadingLabel="正在生成"><Sparkles aria-hidden="true" />重新分析</Button>
                      <Button ref={editButtonRef} type="button" variant="outline" size="compact" onClick={beginEditing}><Pencil aria-hidden="true" />编辑摘要</Button>
                      <DisclosureButton open={aiOpen} controls="ai-detail" onClick={() => setAiOpen((value) => !value)}>查看依据</DisclosureButton>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <footer className={styles.reviewBoundary}>
        <strong>当前边界</strong>
        <p>候选只存在于此临时路由；公共 Card、正式组件页、Foundations 与正式 Benchmark 均未替换。确认取舍后再回填并删除本页。</p>
      </footer>
    </main>
  )
}
