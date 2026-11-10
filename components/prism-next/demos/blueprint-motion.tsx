"use client"

import { AgentMark } from "../agent-mark"
import { Button } from "@/components/coss/button"
import { Search } from "lucide-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { BpButton, BpTool, BpMinor, BpSkeleton, useBpPending, BpWorking, BpUndoToast, BpCaret, BpSteps, BpConclusion, BpMark, BpRef, BpAnswerLabel, BpProvenanceLine } from "../blueprint/blueprint"
import { BpAnnouncerProvider, useBpAnnounce, BpStepGroup, BpDecisionDock, BpDecisionReceipt, type BpStep, type BpStepGroupProps, type BpDecisionItem, type BpDecisionAnswer } from "../blueprint/blueprint"

/** Explicitly played synthetic examples; no service or business state. */
export function BlueprintMotionDemo() {
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const pending = useBpPending(loading)
  const [count, setCount] = useState(18)
  const [running, setRunning] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [toast, setToast] = useState(false)
  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [loading])
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setCount(value => Math.min(45, value + 1)), 160)
    return () => clearInterval(timer)
  }, [running])
  useEffect(() => { if (count === 45) setRunning(false) }, [count])
  return <section id="motion" className="min-w-0 space-y-6">
    <BpMinor code="C0 · REV 0.1" label="质感层 · 动效与状态" />
    <p className="text-ui-hint text-muted-foreground">示例 · 合成数据，播放只演示状态变化。</p>
    <section aria-label="Agent 回答写法" className="min-w-0 space-y-3">
      <h3 className="text-block-title">Agent 回答写法</h3>
      <p className="text-ui-hint text-muted-foreground">示例 · 合成文字</p>
      <BpConclusion>建议先讲评<BpMark>公式的适用条件</BpMark><BpRef href="#answer-example-source">①</BpRef>。</BpConclusion>
      <p className="text-ui-body"><BpAnswerLabel kind="observe" /> 第 4、7 题集中出现概念理解错误。</p>
      <p className="text-ui-body"><BpAnswerLabel kind="explain" /> 可能混淆了两类公式的适用条件，需要看作答确认。</p>
      <p className="text-ui-body"><BpAnswerLabel kind="suggest" /> 先对照两份作答，再安排一道辨析题。</p>
      <BpProvenanceLine id="answer-example-source" items={[{ label: "依据", value: "示例作答 ①" }, { value: "教师待核对" }]} action={<a href="#motion">运行详情（示例）</a>} />
      <div className="flex flex-wrap gap-4 text-ui-meta">
        {(["thinking", "working", "idle"] as const).map(state => <span key={state} className="inline-flex items-center gap-2"><AgentMark state={state} label={state} />静止</span>)}
      </div>
    </section>
    <div className="space-y-3">
      <BpButton onClick={() => setPlaying(value => !value)}>播放三档时长</BpButton>
      {[
        ["120 ms · 快", "duration-(--motion-fast)"],
        ["200 ms · 基础", "duration-(--motion-base)"],
        ["320 ms · 慢", "duration-(--motion-slow)"],
      ].map(([label, duration]) => <div key={label} className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-3 text-ui-meta">
        <span>{label}</span><div className="min-w-0 pr-7"><span className={`relative block h-3.5 w-7 bg-(--brand-blue) transition-[left,opacity] ease-bp motion-reduce:transition-opacity motion-reduce:duration-(--motion-fast)! ${duration}`} style={{ left: playing ? "100%" : "0%", opacity: playing ? 1 : 0.5 }} /></div>
      </div>)}
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[repeat(2,minmax(0,1fr))]">
      <div className="space-y-3"><h3 className="text-block-title">四种骨架</h3><BpSkeleton width="60%" /><BpSkeleton shape="block" height={80} /><BpSkeleton shape="stat" /><BpSkeleton shape="row" lines={["65%", "50%", "35%"]} /></div>
      <div className="min-w-0 space-y-3"><h3 className="text-block-title">记录列表 · 示例</h3><BpButton disabled={loading} onClick={() => setLoading(true)}>重新读取</BpButton>
        <div aria-busy={loading || pending} aria-label="批阅记录" className="min-h-36">
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-4 text-ui-meta"><span>批阅</span><span>班级</span><span>状态</span></div>
          {pending ? [0, 1, 2].map(key => <BpSkeleton key={key} shape="row" />) : <div className="space-y-3 pt-3 text-ui-body motion-reduce:[animation-duration:var(--motion-fast)]! animate-in fade-in duration-(--motion-base) motion-reduce:duration-(--motion-fast)!">{["数学 · 间隔复查", "数学 · 新情境应用", "数学 · 单元复查"].map(name => <div key={name} className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-4 [overflow-wrap:anywhere]"><span>{name}</span><span>九年级（1）班</span><span>已完成</span></div>)}</div>}
        </div>
      </div>
    </div>
    <BpWorking tier="short" step="正在识别题干、公式与答案区域" done={2} total={3} />
    <BpButton disabled={running} onClick={() => { setCount(18); setRunning(true) }}>播放中档：18 → 45 份</BpButton>
    {count < 45 ? <BpWorking tier="mid" step="正在批阅" done={count} total={45} eta={`大约还要 ${Math.round((45 - count) * 1.4)} 秒`} actions={<BpButton onClick={() => setRunning(false)}>停止播放</BpButton>}>
      <BpSteps steps={[{ id: "receive", label: "收卷" }, { id: "recognize", label: "识别" }, { id: "ai", label: "AI 批阅" }, { id: "review", label: "复核" }]} current={2} />
    </BpWorking> : <p role="status" className="text-ui-body">AI 批阅完成，等你复核 · 45 / 45 份</p>}
    <BpWorking tier="long" step="正在批阅 · 第 3 个班" done={96} total={270} eta="大约还要 6 分钟。" />
    <div className="space-y-3">
      <h3 className="text-block-title">删除与撤销 · 示例</h3>
      {!deleted && <div className="flex flex-wrap items-center justify-between gap-3 text-ui-body"><span>二次函数 · 顶点式求最值 3 题</span><BpButton onClick={() => { setDeleted(true); setToast(true) }}>删除</BpButton></div>}
      {toast && <BpUndoToast action={<button type="button" className="text-ui-action underline" onClick={() => { setDeleted(false); setToast(false) }}>撤销</button>} onExpire={() => setToast(false)}>已删除「二次函数 · 顶点式求最值 3 题」</BpUndoToast>}
      {deleted && !toast && <BpButton onClick={() => setDeleted(false)}>重置示例</BpButton>}
    </div>
    <p className="text-ui-body">流式光标示例：正在整理结论<BpCaret /></p>
    <div className="space-y-3">
      <h3 className="text-block-title">按钮微状态</h3>
      <p className="text-ui-hint text-muted-foreground">示例 · 悬停、按下、Tab 聚焦可试。不可用按钮仅用于展示。</p>
      <div className="flex flex-wrap items-center gap-4">
        <BpButton variant="primary">开始复核</BpButton><BpButton>导出</BpButton><BpButton variant="danger">删除</BpButton>
        <BpButton variant="primary" disabled>不可用</BpButton><BpButton size="sm">小按钮</BpButton>
        <BpTool>工具</BpTool><BpTool iconOnly aria-label="搜索示例"><Search size={16} /></BpTool><BpTool count={3}>材料</BpTool>
        <Button>coss 主按钮</Button>
      </div>
    </div>
    <BpAnnouncerProvider><ProgressDecisionExamples /></BpAnnouncerProvider>
  </section>
}

const progressLabels = ["识别意图", "读取 R1 第 4 题作答", "对照 45 份标注", "组织答复"]
const completedSteps: BpStep[] = progressLabels.map((label, index) => ({ id: String(index), label, state: "done", durationMs: [1000, 6000, 4000, 3000][index] }))
const failedSteps: BpStep[] = [
  completedSteps[0],
  { ...completedSteps[1], state: "error", durationMs: 8000, detail: "作答图片读取超时" },
  { ...completedSteps[2], state: "pending", durationMs: undefined },
]
const decisionItems: BpDecisionItem[] = [
  { id: "assessment", question: "要查哪一次测评？", description: "你没说时间；目前只能查最近一次。", options: [{ value: "latest", label: "查最近一次", recommended: true }, { value: "new", label: "不查了，作为新诉求" }], other: { placeholder: "例如，查国庆前那次单元测" } },
  { id: "lesson", question: "第 4 题讲评放在哪一节？", description: "明天有两节数学课。", options: [{ value: "second", label: "明天第 2 节", recommended: true }, { value: "fifth", label: "明天第 5 节" }] },
]

function ProgressDecisionExamples() {
  const announce = useBpAnnounce()
  const [live, setLive] = useState("（安静）")
  const notify = useCallback((text: string) => { setLive(text); announce(text) }, [announce])
  return <>
    <p className="text-ui-hint text-muted-foreground">状态区此刻会说：{live}</p>
    <section aria-label="处理中" className="min-w-0 space-y-4">
      <h3 className="text-block-title">处理中</h3>
      {[696, 480, 390].map(width => <div key={width} className="min-w-0 max-w-full space-y-3" style={{ width }}>
        <p className="font-mono text-ui-meta text-muted-foreground">{width} px · 合成数据</p>
        {width === 696 ? <ProgressPlayback notify={notify} /> : <BpStepGroup status="error" steps={failedSteps} startedAt={0} endedAt={9000} />}
      </div>)}
    </section>
    <section aria-label="待你决定" className="min-w-0 space-y-4">
      <h3 className="text-block-title">待你决定</h3>
      {[696, 480, 390].map(width => <div key={width} className="min-w-0 max-w-full space-y-3" style={{ width }}>
        <p className="font-mono text-ui-meta text-muted-foreground">{width} px · 合成数据</p>
        <DecisionExample playable={width === 696} notify={notify} />
      </div>)}
    </section>
  </>
}

type Playback = { mode: "short" | "mid" | "error"; startedAt: number; elapsed: number; stopped: boolean }

function ProgressPlayback({ notify }: { notify: (text: string) => void }) {
  const [run, setRun] = useState<Playback | null>(null)
  const total = run?.mode === "short" ? 7 : run?.mode === "error" ? 9 : 26
  const active = !!run && !run.stopped && run.elapsed < total
  const firstWord = run?.mode === "short" ? 4 : 19
  const status: BpStepGroupProps["status"] = !run ? "done" : run.stopped ? "stopped" : run.elapsed >= total ? (run.mode === "error" ? "error" : "done") : run.elapsed >= firstWord ? "answering" : "preparing"
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setRun(previous => previous && ({ ...previous, elapsed: Math.min(total, Math.floor((Date.now() - previous.startedAt) / 1000)) })), 1000)
    return () => clearInterval(timer)
  }, [active, run?.startedAt, total])
  useEffect(() => {
    if (!run) return
    if (status === "done") notify(`答复完成，用了 ${total} 秒`)
    if (status === "error") notify("1 步失败：读取 R1 第 4 题作答")
    if (status === "stopped") notify("已停止，已写的保留")
  }, [status, run?.startedAt, notify, total])
  const play = (mode: Playback["mode"]) => { setRun({ mode, startedAt: Date.now(), elapsed: 0, stopped: false }); notify("Agent 正在处理") }
  const doneAt = run?.mode === "short" ? [1, 2, 3, 7] : run?.mode === "error" ? [1, 9, 12, 14] : [2, 9, 16, 26]
  const steps: BpStep[] = !run ? completedSteps : status === "error" ? failedSteps.map(step => step.state === "error" ? { ...step, action: <button type="button" className="text-(--link) underline" onClick={() => play("mid")}>重试这一步</button> } : step) : progressLabels.map((label, index) => {
    const previousEnd = index === 0 ? 0 : doneAt[index - 1]
    const done = run.elapsed >= doneAt[index]
    return { id: String(index), label, state: done ? "done" : run.elapsed >= previousEnd ? "running" : "pending", durationMs: done ? (doneAt[index] - previousEnd) * 1000 : undefined }
  })
  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap gap-2"><BpButton onClick={() => play("short")}>播放 · 短档 7 s</BpButton><BpButton onClick={() => play("mid")}>播放 · 中档 26 s</BpButton><BpButton onClick={() => play("error")}>播放 · 出错</BpButton></div>
    <BpStepGroup status={status} steps={steps} startedAt={run?.startedAt ?? 0} endedAt={run ? active ? undefined : run.startedAt + run.elapsed * 1000 : 14000} resetKey={run?.startedAt} onStop={active ? () => setRun(previous => previous && ({ ...previous, stopped: true })) : undefined} />
    {run && run.elapsed >= firstWord && <p className="text-read-body" aria-busy={active}>第 4 题是公式法求两个实根，16 / 45 人失分。{active && <BpCaret />}</p>}
    <BpStepGroup status="stopped" steps={completedSteps.slice(0, 2)} startedAt={0} endedAt={7000} />
  </div>
}

function DecisionExample({ playable, notify }: { playable: boolean; notify: (text: string) => void }) {
  const [items, setItems] = useState<BpDecisionItem[]>(playable ? [] : decisionItems)
  const [receipts, setReceipts] = useState<{ id: string; question: ReactNode; answer?: ReactNode }[]>(playable ? [] : decisionItems)
  const [index, setIndex] = useState(0)
  const [folded, setFolded] = useState(false)
  const onAnswer = (id: string, answer: BpDecisionAnswer) => {
    const item = items.find(item => item.id === id)
    const label = "other" in answer ? answer.other : item?.options.find(option => option.value === answer.value)?.label
    const rest = items.filter(item => item.id !== id)
    setReceipts(previous => previous.map(receipt => receipt.id === id ? { ...receipt, answer: label } : receipt))
    setItems(rest)
    setIndex(Math.min(index, Math.max(0, rest.length - 1)))
    notify(rest.length ? `已选择 ${label}，还剩 ${rest.length} 件` : "没有待你决定的了")
  }
  return <div className="min-w-0 space-y-3">
    {playable && <BpButton onClick={() => { setItems(decisionItems); setReceipts(decisionItems); setIndex(0); setFolded(false); notify("有 2 件待你决定") }}>来两件待你决定</BpButton>}
    {receipts.map(receipt => <BpDecisionReceipt key={receipt.id} question={receipt.question} answer={receipt.answer} />)}
    <BpDecisionDock items={items} index={index} onIndexChange={setIndex} folded={folded} onFoldedChange={setFolded} onAnswer={onAnswer} />
  </div>
}
