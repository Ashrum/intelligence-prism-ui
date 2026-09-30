"use client"

import { useState } from "react"
import { DemoSection, Feedback } from "../demo-parts"
import { InstrumentPanel, type InstrumentPanelProps } from "../instrument-panel"

export const instrumentFixtures: readonly InstrumentPanelProps[] = [
  {
    title: "创建批阅任务", description: "完成基础设置，再选择本次批阅方式。", headerAction: { label: "更改批阅方式" },
    metric: { value: "0/5", label: "基础设置已完成", status: { label: "待完成" }, progress: { value: 0, max: 5, label: "基础设置完成比例" } },
    list: { title: "当前发生什么", items: [
      { id: "settings", title: "基础参数", description: "学科、班级、人数与纸张", status: { label: "待完成" }, selectable: true },
      { id: "mode", title: "批阅模式", description: "答题卡试卷 / 试卷原卷作答", status: { label: "可选择", tone: "info" } },
      { id: "materials", title: "下一步准备事项", description: "选择批阅方式后提供资料清单", status: { label: "等待" } },
    ] },
    primaryAction: { label: "继续准备批阅资料", disabled: true, disabledReason: "请先完成基础设置并选择批阅方式" },
    next: { text: "完成设置并选择批阅方式", status: { label: "等待" } },
  },
  {
    title: "等待批阅资料", description: "原卷与评分依据尚未齐备。", headerAction: { label: "更改批阅方式" },
    metric: { value: "2项", label: "仍需准备的资料", status: { label: "需要准备", tone: "warning" } },
    list: { title: "还缺少什么", items: [
      { id: "paper", title: "试卷原卷", description: "请提供完整页序的清晰原卷", status: { label: "缺失", tone: "warning" }, selectable: true },
      { id: "basis", title: "标准答案与评分依据", description: "用于确认主观题评分规则", status: { label: "缺失", tone: "warning" }, selectable: true },
    ] },
    primaryAction: { label: "添加批阅资料" }, secondaryActions: [{ id: "scan", label: "先扫描学生试卷" }],
    next: { text: "确认批阅依据", status: { label: "等待" } },
  },
  {
    title: "正在接收学生试卷", description: "已收到 1 份；另一份正在扫描。",
    metric: { value: "1/42", label: "已收到 / 预计提交", status: { label: "接收中", tone: "info" }, linkLabel: "查看名单 →", progress: { value: 1, max: 42, label: "学生试卷接收比例" } },
    list: { title: "实时任务状态", items: [
      { id: "receive", title: "学生试卷接收", description: "1 份已收到 · 1 份扫描中", status: { label: "接收中", tone: "info" } },
      { id: "grading", title: "后台智能批阅", description: "0 份完成 · 1 份处理中", status: { label: "自动进行", tone: "info" } },
    ] },
    primaryAction: { label: "结束扫描并核对" }, actionNote: "第一份试卷到达后，后台批阅已自动开始",
    next: { text: "核对扫描结果", status: { label: "可随时结束", tone: "info" } },
  },
  {
    title: "完成扫描验收", description: "请逐项核对收交情况与扫描质量。", headerAction: { label: "返回扫描验收" },
    metric: { value: "3/6", label: "验收事项已确认", status: { label: "待完成" }, progress: { value: 3, max: 6, label: "扫描验收完成比例" } },
    list: { title: "验收状态", items: [
      { id: "order", title: "扫描页序", completed: true, status: { label: "正常", tone: "success" } },
      { id: "clarity", title: "页面清晰度", completed: true, status: { label: "正常", tone: "success" } },
      { id: "identity", title: "学生身份匹配", completed: true, status: { label: "已完成", tone: "success" } },
      { id: "missing", title: "未提交名单", status: { label: "待完成" }, selectable: true },
      { id: "exceptions", title: "扫描异常", status: { label: "待完成" }, selectable: true },
      { id: "basis", title: "批阅依据", status: { label: "待完成" }, selectable: true },
    ] },
    primaryAction: { label: "处理 2 项异常" },
    secondaryActions: [{ id: "resume-scan", label: "返回继续扫描" }, { id: "add", label: "补交学生试卷" }],
    actionNote: "AI 批阅已在后台进行；完成验收不会重新启动已有批阅",
    next: { text: "确认后进入智能批阅", status: { label: "等待" } },
  },
  {
    title: "智能批阅运行中", description: "持续处理 5 份试卷；发现 2 份需要教师判断。", headerAction: { label: "查看批阅配置" },
    metric: { value: "82%", label: "31 / 38 份已完成", status: { label: "进行中", tone: "info" }, progress: { value: 82, label: "智能批阅完成比例" } },
    current: { label: "当前正在处理", title: "王子睿 · 第 8/12 题", description: "答案识别 → 评分规则匹配" },
    attention: { label: "需要教师处理", title: "2 份试卷", description: "低置信度主观题，需要确认评分判断" },
    primaryAction: { label: "处理 2 份需复核试卷" }, secondaryActions: [{ id: "add", label: "补交学生试卷" }, { id: "results", label: "查看当前批阅结果" }],
    actionNote: "人工复核不会中断其他试卷的后台批阅。",
    next: { text: "补交学生试卷", status: { label: "有限窗口", tone: "warning" } },
  },
  {
    title: "批阅结果已生成", description: "结果版本 V1 已生成，等待教师发布。", headerAction: { label: "返回工作台" },
    metric: { value: "38/38", label: "试卷已完成批阅", status: { label: "已完成", tone: "success" }, progress: { value: 38, max: 38, label: "批阅完成比例" } },
    list: { title: "完成摘要", items: [
      { id: "grading", title: "智能批阅", completed: true, status: { label: "已完成", tone: "success" } },
      { id: "review", title: "教师复核", completed: true, description: "2 份需复核试卷均已确认", status: { label: "已完成", tone: "success" } },
      { id: "publish", title: "结果发布", description: "当前版本尚未发布给学生", status: { label: "待发布" } },
    ] },
    primaryAction: { label: "发布批阅结果" }, secondaryActions: [{ id: "export", label: "导出批阅结果" }], actionNote: "发布范围由下一步确认。",
    next: { text: "确认发布范围", status: { label: "可继续", tone: "success" } },
  },
]

function InteractivePanel(props: InstrumentPanelProps) {
  const [feedback, setFeedback] = useState("尚未发出操作请求")
  return <div className="min-w-0 w-full">
    <InstrumentPanel eyebrow="OLE AI INSTRUMENT" {...props}
      onPrimary={() => setFeedback(`已发出请求：${props.primaryAction?.label}`)}
      onSecondary={id => setFeedback(`已发出次操作请求：${id}`)}
      onHeaderAction={() => setFeedback(`已发出请求：${props.headerAction?.label}`)}
      onMetricLink={() => setFeedback("已发出请求：查看名单")}
      onItemSelect={id => setFeedback(`已发出清单查看请求：${id}`)}
      onRetry={() => setFeedback("已发出重试请求，等待外部加载结果")} />
    <Feedback>{feedback}</Feedback>
  </div>
}

export function InstrumentPanelDemo() {
  return <>
    <DemoSection title="批阅任务 · 六个阶段" description="固定任务快照。操作仅记录请求；执行结果由调用方提供。">
      <div className="flex flex-wrap items-start gap-6">{instrumentFixtures.map(fixture => <div key={fixture.title} className="w-full max-w-[380px]"><InteractivePanel {...fixture} /></div>)}</div>
    </DemoSection>
    <DemoSection title="主操作不可用 · 原因关联" description="主按钮下方说明阻断原因，并通过 aria-describedby 关联。">
      <div className="w-80 max-w-full"><InteractivePanel title="等待批阅依据确认" primaryAction={{ label: "开始智能批阅", disabled: true, disabledReason: "请先确认批阅依据" }} actionNote="原卷与标准答案已接收，尚未完成核对。" /></div>
    </DemoSection>
    <DemoSection title="Loading / Empty / Error" description="状态由宿主传入；加载失败后重试只发出请求。">
      <div className="flex flex-wrap items-start gap-4">{(["loading", "empty", "error"] as const).map(state => <div className="w-80 max-w-full" key={state}><InteractivePanel title="任务状态" state={state} /></div>)}</div>
    </DemoSection>
    <DemoSection title="三主题 · 320px · 长中文与公式" description="完整保留状态、原因和操作文字；内容随窄容器自然增高。">
      <div className="flex flex-wrap items-start gap-4">{(["light", "paper", "dark"] as const).map(theme => <div key={theme} data-agent-preview data-prism-theme={theme} data-ui-version="coss-v1" className="w-80 max-w-full p-3">
        <h3 className="mb-3 text-item-title">{theme === "light" ? "浅色" : theme === "paper" ? "暖纸" : "深色"}</h3>
        <InteractivePanel {...instrumentFixtures[4]} title="高二年级数学期中考试智能批阅运行中" current={{ label: "当前正在处理", title: "王子睿 · 第 8/12 题 · 二次函数与不等式综合应用", description: <span>核对评分依据：<math><mi>y</mi><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn></math></span> }}
          list={{ title: "实时任务状态", items: [{ id: "long", title: "补交跨页作答的学生试卷并重新核对页序与答题区域", description: "仅接收本轮尚未提交的试卷，接收范围由当前任务配置提供。", status: { label: "有限开放", tone: "warning" }, selectable: true }] }} />
      </div>)}</div>
    </DemoSection>
    <DemoSection title="可选区块 · 未提供进度" description="仅展示调用方提供的事实，不补造进度、当前学生或预计时间。">
      <div className="w-80 max-w-full"><InstrumentPanel current={{ label: "当前正在处理", title: "未提供", description: "题号未提供 · 预计时间未提供" }} /></div>
    </DemoSection>
  </>
}
