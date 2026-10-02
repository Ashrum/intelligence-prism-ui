"use client"

import { useState } from "react"
import { DemoSection, Feedback } from "../demo-parts"
import { Button } from "../button"
import { Stepper, type StepperState, type StepperStep } from "../stepper"

const names = ["设置任务", "准备资料", "扫描学生试卷", "扫描验收", "AI 批阅", "查看结果"]
const stages = (states: readonly StepperState[]): StepperStep[] => states.map((state, index) => ({ id: `stage-${index + 1}`, label: names[index], state }))
export const stepperFixtures = {
  first: stages(["current", "upcoming", "upcoming", "upcoming", "upcoming", "upcoming"]),
  third: stages(["done", "done", "current", "upcoming", "upcoming", "upcoming"]),
  fifth: stages(["done", "done", "done", "done", "current", "upcoming"]),
  pending: stages(["done", "pending", "current", "upcoming", "upcoming", "upcoming"]),
  blocked: stages(["done", "done", "done", "done", "blocked", "upcoming"]).map(step => step.state === "blocked" ? { ...step, description: "答题区域无法匹配，请检查试卷模板" } : step),
}
const longSteps = stepperFixtures.pending.map((step, index) => ({ ...step, label: ["设置高二年级数学期中考试批阅任务", "准备试卷原卷、标准答案与评分依据", "扫描并核对学生试卷姓名与考号", "验收扫描页序、缺页及识别异常", "按已确认的评分依据进行 AI 批阅", "查看批阅结果并安排人工复核"][index] }))

export function StepperDemo() {
  const [position, setPosition] = useState<"first" | "third" | "fifth">("third")
  const [narrow, setNarrow] = useState(false)
  const [intent, setIntent] = useState("尚未请求跳步")
  return <>
    <DemoSection title="六步批阅流程" description="步骤只读；下方按钮载入不同阶段的固定事实。窄容器保留全部步骤，可聚焦后用方向键横向滚动。">
      <div className="mb-4 flex flex-wrap gap-2">{(["first", "third", "fifth"] as const).map((key, index) => <Button key={key} variant={position === key ? "secondary" : "outline"} aria-pressed={position === key} onClick={() => setPosition(key)}>当前第 {[1, 3, 5][index]} 步</Button>)}<Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button></div>
      <div style={narrow ? { width: 320, maxWidth: "100%" } : undefined}><Stepper steps={stepperFixtures[position]} aria-label="批阅任务阶段" /></div>
    </DemoSection>
    <DemoSection id="stepper-select" title="宿主允许的步骤导航" description="点击只发送步骤 ID，当前步骤不提供按钮；状态与可选资格分别由宿主提供。">
      <div className="grid gap-6">{(["horizontal", "compact", "vertical"] as const).map(layout => <Stepper key={layout}
        orientation={layout === "vertical" ? "vertical" : "horizontal"} compact={layout === "compact"}
        aria-label={`${layout} 可选步骤`} steps={stepperFixtures.pending.map(step => ({ ...step, selectable: ["stage-1", "stage-2", "stage-3"].includes(step.id), selectLabel: `返回：${step.label}` }))}
        onStepSelect={id => setIntent(`请求返回 ${id}；等待宿主更新当前位置`)} />)}</div><Feedback>{intent}</Feedback>
    </DemoSection>
    <DemoSection title="准备资料 · 待完成" description="扫描已开始，但资料尚未确认；第二步不显示完成勾，也不会被推定为当前步。"><Stepper steps={stepperFixtures.pending} /></DemoSection>
    <DemoSection title="批阅受阻" description="S46：当前第 5 步 AI 批阅受阻；当前位置与受阻状态由调用方分别提供。"><Stepper steps={stepperFixtures.blocked} currentStepId="stage-5" /></DemoSection>
    <DemoSection title="侧栏 · 垂直方向"><div className="w-80 max-w-full"><Stepper orientation="vertical" steps={stepperFixtures.pending} /></div></DemoSection>
    <DemoSection title="三主题 · 320px · 长中文标签" description="当前步骤自动进入局部视野；横向滚动可查看之前的待完成步骤和后续阶段。">
      <div className="flex flex-wrap gap-4">{(["light", "paper", "dark"] as const).map(theme => <div key={theme} data-agent-preview data-prism-theme={theme} data-ui-version="coss-v1" className="w-80 max-w-full p-3">
        <h3 className="mb-3 text-item-title">{theme === "light" ? "浅色" : theme === "paper" ? "暖纸" : "深色"}</h3>
        <Stepper onStepSelect={id => setIntent(`请求前往 ${id}`)} steps={longSteps.map(step => ({ ...step, selectable: true }))} aria-label={`${theme} 长中文批阅阶段`} />
        <p className="mt-4 text-read-body">核对公式：<math><mi>y</mi><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn></math></p>
      </div>)}</div>
    </DemoSection>
    <DemoSection title="紧凑工具栏 · 三主题与 320px" description="只压缩横向布局；仍保留全部步骤、当前位置、待完成和受阻原因，垂直模式保持原样。">
      <div className="flex flex-wrap gap-4">{(["light", "paper", "dark"] as const).map(theme => <div key={theme} data-agent-preview data-prism-theme={theme} data-ui-version="coss-v1" className="w-80 max-w-full space-y-3 p-3">
        <Stepper compact steps={stepperFixtures.blocked} currentStepId="stage-5" aria-label={`${theme} 紧凑批阅阶段`} />
        <Stepper compact steps={[{ id: "unknown", label: "准备试卷原卷、标准答案与评分依据并核对跨页公式", state: "pending" }]} />
      </div>)}</div>
    </DemoSection>
    <DemoSection title="3–8 步与无当前阶段" description="步数不固定；未提供 current 时如实说明，不把受阻或最后一步自动视为当前。">
      <div className="grid gap-6"><Stepper steps={stages(["done", "current", "upcoming"])} /><Stepper steps={Array.from({ length: 8 }, (_, index) => ({ id: `review-${index}`, label: `复核阶段 ${index + 1}`, state: index === 7 ? "error" : "done" }))} /></div>
    </DemoSection>
  </>
}
