"use client"

import { useState } from "react"
import { BlueprintSectionHeader, BpButton, BpFrameCard, BpPaperSlot, BpScanTrace, BpSteps, type BpPaperSlotState } from "../blueprint/blueprint"

const names = ["陈一诺", "林子涵", "王思远", "李沐辰", "张语桐", "赵知行", "周若溪", "吴书言", "郑明轩", "孙清越", "许嘉宁", "黄雨辰"]
const initialStates: BpPaperSlotState[] = ["graded", "review", "grading", "received", "waiting", "waiting", "received", "graded", "waiting", "review", "waiting", "received"]
const details: Record<BpPaperSlotState, string> = { waiting: "等待接收", received: "已接收 · 等待批阅", grading: "AI 批阅中", graded: "已批 · 18 / 20", review: "待你处理 2 项" }

/** Explicit synthetic events only; this fixture has no service or automatic progression. */
export function BlueprintGradingDemo() {
  const [slots, setSlots] = useState(initialStates)
  const [current, setCurrent] = useState(1)
  const [receiving, setReceiving] = useState(true)
  const [fresh, setFresh] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const [reduced, setReduced] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [event, setEvent] = useState("五态合成快照，可选择答卷位查看聚焦框。")
  function simulate(from: BpPaperSlotState, to: BpPaperSlotState, phase: number) {
    const index = slots.indexOf(from)
    if (index < 0) return
    setSlots(values => values.map((value, i) => i === index ? to : value))
    setFresh(to === "received" || to === "graded" || to === "review" ? index : null)
    setCurrent(phase)
    setReceiving(phase === 1)
    setEvent(`演示事件：${names[index]}，${details[to]}。`)
  }
  function reset() {
    setSlots(initialStates)
    setCurrent(1)
    setReceiving(true)
    setFresh(null)
    setFocused(null)
    setReviewIndex(0)
    setEvent("已重置为五态合成快照。")
  }
  return <section id="grading-p102" className="bp-grading-demo space-y-5" data-reduced-motion={reduced ? "true" : undefined} aria-label="智能批阅组件示例">
    <BlueprintSectionHeader title="智能批阅 · P102" description="演示事件，产品中由真实状态驱动。姓名、答卷与分数均为合成数据，按钮只修改当前示例。" />
    <BpSteps variant="bars" current={current} steps={[
      { id: "setup", label: "设置任务", tone: "ink" },
      { id: "receive", label: "扫描学生试卷", tone: "receive", meta: `已收到 ${slots.filter(state => state !== "waiting").length} / 12` },
      { id: "ai", label: "AI 批阅", tone: "ai", meta: `已批 ${slots.filter(state => state === "graded" || state === "review").length} / 12` },
      { id: "review", label: "教师复核", tone: "review", meta: `待你处理 ${slots.filter(state => state === "review").length} 份` },
    ]} />
    <div className="flex flex-wrap items-center gap-5">
      <div className="bp-grading-station" aria-hidden="true"><BpScanTrace kind="beam" tone="receive" active={receiving} /></div>
      <div className="space-y-2"><p className="text-item-title">接收工位</p><p className="text-ui-body">{receiving ? "接收中 · 演示状态" : "接收已停止 · 演示状态"}</p><BpButton onClick={() => setReceiving(value => !value)}>{receiving ? "模拟停止接收" : "模拟恢复接收"}</BpButton></div>
    </div>
    <div className="flex flex-wrap gap-3" aria-label="演示事件">
      <BpButton disabled={!slots.includes("waiting")} onClick={() => simulate("waiting", "received", 1)}>模拟到达 1 份</BpButton>
      <BpButton disabled={!slots.includes("received")} onClick={() => simulate("received", "grading", 2)}>模拟开始 AI 批阅</BpButton>
      <BpButton disabled={!slots.includes("grading")} onClick={() => simulate("grading", "graded", 2)}>模拟批完 1 份</BpButton>
      <BpButton disabled={!slots.includes("grading")} onClick={() => simulate("grading", "review", 2)}>模拟待处理回执</BpButton>
      <BpButton disabled={!slots.includes("review")} onClick={() => { setCurrent(3); setReceiving(false); setFresh(null); setFocused(slots.indexOf("review")); setEvent("演示事件：进入教师复核，聚焦首份待处理答卷。") }}>模拟进入复核</BpButton>
      <BpButton onClick={reset}>重置演示</BpButton>
    </div>
    <p className="text-ui-hint" aria-live="polite">{event}</p>
    <div className="bp-grading-grid">
      {slots.map((state, index) => <BpPaperSlot key={index} state={state} name={names[index]} code={String(index + 1).padStart(2, "0")} detail={details[state]} fresh={fresh === index} focused={focused === index} onSelect={() => { setFocused(index); setEvent(`当前查看：${names[index]}，${details[state]}。`) }} />)}
    </div>
    <section id="frame-focus-p103" className="space-y-4" aria-label="复核原件示例">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2"><h3 className="text-block-title">复核原件 · P103</h3><p className="text-ui-hint text-muted-foreground">演示事件，产品中由真实选中驱动。以下原件文字为合成数据。</p></div>
        <BpButton onClick={() => setReviewIndex(value => (value + 1) % names.length)}>下一份</BpButton>
      </div>
      <BpFrameCard title={`当前作答原件 · ${names[reviewIndex]} · 第 1 题`} focus="review" swapKey={`demo-submission-${reviewIndex}:question-1`} aria-current="true" status={{ tone: "neutral", label: `第 ${reviewIndex + 1} / ${names.length} 份` }}>
        <div className="space-y-3">
          <p className="text-read-body">{names[reviewIndex]}的合成作答：y = −(x − 1)² + 5，对称轴为 x = 1，最大值为 5。</p>
          <p className="text-ui-hint text-muted-foreground">此处仅演示当前原件的聚焦与切换，不代表真实扫描图像或复核结果。</p>
        </div>
      </BpFrameCard>
    </section>
    <div className="space-y-2">
      <BpButton aria-pressed={reduced} onClick={() => setReduced(value => !value)}>减少动态效果对照：{reduced ? "开" : "关"}</BpButton>
      <p className="text-ui-hint text-muted-foreground">仅为本示例的静态对照，不保存偏好。系统开启减少动态效果时始终隐藏光束、扫描线和闪边，取消落位、阶段展开、聚焦与原件横移淡入动画；姓名、状态、成功标记和聚焦框仍保留。系统关闭后，对照开关才允许查看动效。</p>
    </div>
  </section>
}
