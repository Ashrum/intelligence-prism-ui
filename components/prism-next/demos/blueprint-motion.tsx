"use client"

import { AgentMark } from "../agent-mark"
import { Button } from "@/components/coss/button"
import { Search } from "lucide-react"
import { useEffect, useState } from "react"
import { BpButton, BpTool, BpMinor, BpSkeleton, useBpPending, BpWorking, BpUndoToast, BpCaret, BpSteps, BpConclusion, BpMark, BpRef, BpAnswerLabel, BpProvenanceLine } from "../blueprint/blueprint"

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
  </section>
}
