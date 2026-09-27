"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/coss/button"
import { AgentSlideWorkspace, type AgentSlide, type AgentSlideCapabilities, type AgentSlideIntent } from "../agent-slide-workspace"

const thumbnail = (number: number) => ({
  src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect x="1" y="1" width="318" height="178" fill="white" stroke="gray"/><path d="M28 40H220M28 75H275M28 100H250M28 125H180" stroke="gray"/><text x="275" y="158" font-size="16">${number}</text></svg>`)}`,
  alt: `第 ${number} 页的模拟缩略图，仅表示版面占位`,
})
export const slideWorkspaceExample: readonly AgentSlide[] = [
  { id: "goals", number: 1, title: "学习目标", points: "辨认直角边和斜边。\n说明使用勾股定理的条件。", notes: "请学生先用自己的语言说出直角的位置。", status: "已完成", thumbnail: thumbnail(1) },
  { id: "recognize", number: 2, title: "旋转图形后，怎样辨认直角边与斜边并说明判断依据", points: "旋转不改变边的角色。\n斜边始终在直角的对面。", notes: "板书同一个三角形的两种摆放方向。", status: "已完成", thumbnail: thumbnail(2) },
  { id: "formula", number: 3, title: "公式与适用条件", points: "直角三角形中：a² + b² = c²\n两条直角边为 3、4 时：c = √(3² + 4²) = 5\n非直角三角形不能直接套用。", notes: "强调 c 表示斜边；先判条件，再代入。", status: "已完成", thumbnail: thumbnail(3) },
  { id: "practice", number: 4, title: "列式练习", points: "两条直角边为 5 和 12，求斜边。\n用代回原式的方式检查结果。", notes: "留出学生独立计算与同伴解释的时间。", status: "已完成", thumbnail: thumbnail(4) },
  { id: "check", number: 5, title: "课堂检查", points: "请比较直角三角形与非直角三角形的求边方法。", notes: "追问使用定理的依据，不只核对数值。", status: "已完成", thumbnail: thumbnail(5) },
  { id: "followup", number: 6, title: "课后巩固安排", points: "待补充教材页码、练习题与课时安排。", notes: "尚未取得本班作答数据，不推断掌握情况。", status: "待补充", thumbnail: thumbnail(6) },
]
const supported = { supported: true } as const
export const slideExampleCapabilities: AgentSlideCapabilities = {
  view: supported, reorder: supported, "edit-text": supported, add: supported, delete: supported,
  generate: { supported: false, reason: "尚未接入课件生成服务。" },
  export: { supported: false, reason: "尚未提供可下载的演示文件。" },
}

export function SlideWorkspaceExample({ readOnly = false, narrow = false }: { readOnly?: boolean; narrow?: boolean }) {
  const [slides, setSlides] = useState<readonly AgentSlide[]>(slideWorkspaceExample)
  const [selected, setSelected] = useState<string | null>(slideWorkspaceExample[0].id)
  const [revision, setRevision] = useState(1)
  const [feedback, setFeedback] = useState("全部内容为模拟示例。")
  const trigger = useRef<HTMLButtonElement | null>(null)
  const workspace = useRef<HTMLElement>(null)
  const nextSlide = useRef(7)
  function intent(value: AgentSlideIntent) {
    if (value.deckId !== (readOnly ? "historical-lesson-slides" : "lesson-slides") || value.version !== `demo-${revision}`) return
    if (value.type === "select-slide") { setSelected(value.slideId); return }
    if (value.type === "open-source") { setFeedback("来源为备课提纲模拟内容；没有真实来源文件。"); return }
    if (readOnly) return
    let updated = [...slides]
    if (value.type === "reorder") {
      const from = updated.findIndex(slide => slide.id === value.slideId)
      if (from < 0 || value.toIndex < 0 || value.toIndex >= updated.length) return
      updated.splice(value.toIndex, 0, ...updated.splice(from, 1))
    } else if (value.type === "edit-text") {
      updated = updated.map(slide => slide.id === value.slideId ? { ...slide, title: value.title, points: value.points } : slide)
    } else if (value.type === "add-slide") {
      const number = nextSlide.current++
      const slide = { id: `added-${number}`, number, title: `补充页面 ${number}`, points: "待填写要点。", status: "待补充" }
      updated.splice(value.afterSlideId === null ? updated.length : updated.findIndex(item => item.id === value.afterSlideId) + 1, 0, slide)
      setSelected(slide.id)
    } else if (value.type === "delete-slide") {
      updated = updated.filter(slide => slide.id !== value.slideId)
      setSelected(null)
    } else { setFeedback("此示例没有生成或导出结果。"); return }
    setSlides(updated.map((slide, index) => ({ ...slide, number: index + 1 })))
    setRevision(previous => previous + 1)
    setFeedback("模拟内容已更新，仍未保存；刷新后还原。")
  }
  return <section className="min-w-0 space-y-4">
    <h3 className="text-block-title">{readOnly ? "只读版本示例" : "可调整文字与顺序的模拟课件"}</h3>
    <p role="status" className="text-ui-hint">{feedback}</p>
    {([["inline", "default", "对话摘要"], ["workspace", "default", "页面查看与调整"], ["inline", "compact", "紧凑摘要"]] as const).map(([view, density, label]) =>
      <section key={`${view}-${density}`} aria-label={label} ref={view === "workspace" ? workspace : undefined} tabIndex={view === "workspace" ? -1 : undefined}
        className={`min-w-0 space-y-2 ${narrow ? "max-w-[320px]" : ""}`}>
        <h4 className="text-ui-action">{label}</h4>
        <AgentSlideWorkspace deckId={readOnly ? "historical-lesson-slides" : "lesson-slides"} version={`demo-${revision}`} versionLabel={`课件 v${revision}（模拟）`}
          title="勾股定理复习课" source={{ label: "由备课提纲生成（模拟）", openable: true }}
          save={{ state: "unsaved" }} slides={slides} selectedSlideId={selected} capabilities={slideExampleCapabilities}
          readOnlyReason={readOnly ? "此版本仅供回看，不可修改或重新生成。" : undefined} view={view} density={density} onIntent={intent}
          onExpand={button => { trigger.current = button; workspace.current?.focus(); workspace.current?.scrollIntoView({ block: "nearest" }) }}
          onBack={() => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) }}
          details={<p>缩略图为 SVG 占位，文字和讲者备注供阅读，不对应真实 PPT 版式。展开与返回不改变保存状态。</p>} />
      </section>)}
  </section>
}

export function AgentSlideWorkspaceDemo() {
  const [narrow, setNarrow] = useState(false)
  return <section id="slide-workspace" className="min-w-0 space-y-5 py-6">
    <h2 className="text-section-title">演示文稿工作区 v0.1 · 设计候选</h2>
    <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    <SlideWorkspaceExample narrow={narrow} />
    <SlideWorkspaceExample readOnly narrow={narrow} />
  </section>
}
