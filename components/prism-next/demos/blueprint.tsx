"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, FileText, Info, Layers, MoreHorizontal, Network } from "lucide-react"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/coss/tabs"
import { Menu, MenuItem, MenuTrigger } from "@/components/coss/menu"
import { MenuPopup } from "../scoped-overlays"
import { Button } from "../button"
import { Badge } from "../badge"
import { ChartLegend } from "../charts/chart-legend"
import { BlueprintGradingDemo } from "./blueprint-grading"
import { BlueprintOverviewDemo } from "./blueprint-overview"
import { AgentWorkspacePatternsDemo } from "./agent-workspace-patterns"
import { QuestionMath } from "../question-content"
import { useHorizontalChoiceScroll } from "../use-horizontal-choice-scroll"
import { BlueprintFoundationDemo } from "../blueprint-foundation-demo"
import { BlueprintSecondBatchDemo } from "../blueprint-second-batch-demo"
import { BlueprintObjectCardsDemo } from "./blueprint-object-cards"
import { artifactOutputExamples } from "./agent-artifact-output"
import { continuousPreviewPages } from "./paper-preview-continuous"
import { BlueprintSectionHeader, BlueprintSheet, BpTargetLock, BpDiagramCallout, BpEntryRow, BpAnnotatedText, BpAnnotationList, BpButton, BpCallout, BpCard, BpCardNote, BpCodebox, BpError, BpFacts, BpFigCap, BpFrameCard, BpSectionCard, BpMetric, BpMetricLegend, BpMinor, BpPaneHead, BpSegTabs, BpSizeBar, BpSteps, BpTitleBlock, BpToast, BpTool } from "../blueprint/blueprint"

/** Synthetic host state only: no report routing, persistence or business execution. */
export function BlueprintSizeBarActivationDemo() {
  const [activeRowId, setActiveRowId] = useState("equation")
  const rows = [
    { id: "equation", label: "一元二次方程 x²", total: 40, unit: "人", display: "28 / 40", segments: [{ id: "mastered", label: "已掌握", value: 28, fill: "ink" as const }] },
    { id: "geometry", label: "相似三角形的判定与性质（长中文知识点）", total: 40, unit: "人", display: "21 / 40", segments: [{ id: "mastered", label: "已掌握", value: 21, fill: "ink" as const }] },
  ]
  return <section id="sizebar-activation" aria-label="逐行激活示例（合成数据）" className="space-y-3">
    <BpMinor code="BP-06.2 · Size Bar" label="逐行激活（合成数据）" />
    <BpSizeBar rows={rows} legend={false} onRowActivate={setActiveRowId} activeRowId={activeRowId} rowActionLabel={row => `查看知识点：${row.label}`} />
    <p role="status" className="text-ui-hint text-muted-foreground">当前选中：{rows.find(row => row.id === activeRowId)?.label}</p>
  </section>
}

const tabs = [{ value: "all", label: "全部" }, { value: "todo", label: "待批阅" }, { value: "review", label: "待复核" }, { value: "locked", label: "已锁定", disabled: true }, { value: "done", label: "已完成" }, { value: "issue", label: "异常" }]
const tabNotes: Record<string, string> = { all: "42 份答卷", todo: "9 份等待 AI 批阅", review: "7 份需要教师确认", done: "22 份已出分", issue: "4 份未提交或扫描失败" }
const views = [{ value: "blueprint", label: "blueprint", description: "工程图纸，适合结构与流程" }, { value: "paper", label: "paper", description: "暖纸，适合长中文题干与公式推导的连续阅读" }, { value: "light", label: "light", description: "浅色，日常工作" }]
const steps = [{ id: "upload", label: "上传答卷" }, { id: "ai", label: "AI 批阅" }, { id: "review", label: "教师复核" }]
const cards = [{ name: "flow", description: "查看本页的固定步骤快照。", href: "#actions" }, { name: "timeline", description: "查看本页的数据排版示例。", href: "#data" }, { name: "limits", description: "静态卡片：展示得分与及格线的关系。", href: undefined }]
const Thumb = ({ label }: { label: string }) => <span className="absolute inset-3.5 grid place-items-center border border-dashed border-border font-mono text-ui-meta text-muted-foreground">{label}</span>

/** Fixed source records and an ordered two-section paper, not a live task. */
export function BlueprintCardsDemo() {
  const [pageIndex, setPageIndex] = useState(0)
  const [showNote, setShowNote] = useState(false)
  const page = continuousPreviewPages[pageIndex]
  return <section id="object-section-cards" aria-label="原件卡片与试卷分节" className="space-y-6">
    <BlueprintSectionHeader title="原件与成果分节" description="原件沿用现有固定扫描夹具；下方试卷有 A / B 两个实际分节。状态和计数均来自当前示例内容。" />
    <BpFrameCard title={`作答原件 · ${page.alt}`} status={{ tone: page.imageUrl ? "info" : "warning", label: `第 ${pageIndex + 1} / ${continuousPreviewPages.length} 份作答${page.imageUrl ? "" : " · 未提供原图"}` }}
      actions={<>
        <BpTool iconOnly aria-label="查看上一份原件" disabled={pageIndex === 0} onClick={() => setPageIndex(index => index - 1)}><ArrowLeft className="size-4" aria-hidden="true" /></BpTool>
        <BpTool iconOnly aria-label="查看下一份原件" disabled={pageIndex === continuousPreviewPages.length - 1} onClick={() => setPageIndex(index => index + 1)}><ArrowRight className="size-4" aria-hidden="true" /></BpTool>
      </>}>
      {page.imageUrl ? <img src={page.imageUrl} alt={`${page.alt} · 固定扫描夹具`} width={page.dimensions?.width} height={page.dimensions?.height} className="mx-auto h-auto w-full max-w-60" /> : <p className="text-ui-body">此份作答未提供原图，无法预览。</p>}
    </BpFrameCard>
    <BpSectionCard letter="A" title="选择题" meta="第 1 题 · 共 1 题"
      action={<BpTool iconOnly aria-label="查看选择题作答说明" aria-expanded={showNote} aria-controls="bp-choice-note" onClick={() => setShowNote(value => !value)}><Info className="size-4" aria-hidden="true" /></BpTool>}>
      <p className="text-read-body">1. 一元二次方程的最高次数是（　）。</p>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-read-body"><li>A. 1</li><li>B. 2</li><li>C. 3</li><li>D. 4</li></ul>
      <p id="bp-choice-note" hidden={!showNote} className="mt-4 text-ui-hint text-muted-foreground">每题只有一个正确选项，请在答题卡中填写。</p>
    </BpSectionCard>
    <BpSectionCard letter="B" title="填空题" meta="第 2 题 · 共 1 题">
      <p className="text-read-body">2. 若下列方程有两个相等的实数根，则判别式的值为______。</p>
      <QuestionMath block label="x 平方减二 x 加一等于零"><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn><mo>=</mo><mn>0</mn></QuestionMath>
    </BpSectionCard>
  </section>
}

/** Selection belongs to this synthetic host, not to SectionCard. */
export function BlueprintSectionCardSelectionDemo() {
  const [selectedId, setSelectedId] = useState<string | undefined>("summary")
  return <section id="section-card-selection" aria-label="分节卡选中态（合成数据）" className="space-y-6">
    <BlueprintSectionHeader title="分节卡选中态" description="合成数据；选择按钮切换当前查看对象，卡片本身不执行打开操作。" />
    <div className="flex flex-wrap gap-3">
      <BpTool aria-pressed={selectedId === "summary"} onClick={() => setSelectedId("summary")}>查看概览</BpTool>
      <BpTool aria-pressed={selectedId === "detail"} onClick={() => setSelectedId("detail")}>查看明细</BpTool>
      <BpTool onClick={() => setSelectedId(undefined)}>清除选中</BpTool>
    </div>
    <BpSectionCard letter="A" title="学情概览" selected={selectedId === "summary"} aria-current={selectedId === "summary" ? "true" : undefined}>
      <p className="text-read-body">当前范围：高一（1）班，合成数据。</p>
    </BpSectionCard>
    <BpSectionCard density="compact" titleRule letter="B" title="一元二次方程的判别式与相等实数根：长中文结果明细" meta="learning-result-detail.pdf" selected={selectedId === "detail"} aria-current={selectedId === "detail" ? "true" : undefined}>
      <QuestionMath block label="x 平方减二 x 加一等于零"><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn><mo>=</mo><mn>0</mn></QuestionMath>
    </BpSectionCard>
    <p role="status" className="text-ui-hint">当前选中：{selectedId === "summary" ? "学情概览" : selectedId === "detail" ? "结果明细" : "无"}</p>
    {(["light", "paper", "dark"] as const).map(theme => <div key={theme} data-agent-preview data-prism-theme={theme} className="bg-background p-4 text-foreground">
      <BpSectionCard selected density="compact" title={`${theme} · 局部选中态`}><p className="text-ui-body">强调色与选中描边跟随局部主题。</p></BpSectionCard>
    </div>)}
  </section>
}

export function BlueprintTitleRuleDemo() {
  const [showNote, setShowNote] = useState(false)
  return <section id="title-rules" aria-label="标题墨线" className="space-y-6">
    <BlueprintSectionHeader title="标题墨线" description="成组标题与分节使用结构墨线；正文内次级小标题保留细线。" />
    <BpMinor rule="ink" code="01" label="任务设置" />
    <BpSectionCard titleRule letter="A" title="任务范围" meta="2 个班级"
      action={<BpTool iconOnly aria-label="查看任务范围说明" aria-expanded={showNote} aria-controls="bp-title-rule-note" onClick={() => setShowNote(value => !value)}><Info className="size-4" aria-hidden="true" /></BpTool>}>
      <p className="text-ui-body">高一（1）班、高一（2）班 · 合成数据。</p>
      <p id="bp-title-rule-note" hidden={!showNote} className="mt-3 text-ui-hint">仅展示已选范围，不执行创建任务。</p>
    </BpSectionCard>
    <BpSectionCard titleRule density="compact" letter="B" title="批阅设置" meta="1 项设置">
      <BpMinor headingLevel={4}>评分说明</BpMinor>
      <p className="text-ui-body">按题目评分点复核作答。</p>
    </BpSectionCard>
    <BpSectionCard titleRule density="compact" title="长中文分节标题：检查多个班级的任务范围与批阅设置是否完整" meta="task-scope-and-grading-settings-preview.pdf">
      <BpMinor rule="ink" headingLevel={4} label="长中文成组标题：分节范围、评分说明与教师复核要求" />
      <QuestionMath block label="x 平方减二 x 加一等于零"><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn><mo>=</mo><mn>0</mn></QuestionMath>
    </BpSectionCard>
    <div className="space-y-4">
      {(["light", "paper", "dark"] as const).map(theme => <div key={theme} data-agent-preview data-prism-theme={theme} className="bg-background p-4 text-foreground">
        <BpMinor rule="ink" label={`${theme} · 中性标题线`} />
        <BpSectionCard titleRule density="compact" title="局部主题分节"><p className="text-ui-body">线色与线宽跟随此预览的主题。</p></BpSectionCard>
      </div>)}
    </div>
  </section>
}

export function BlueprintComponentsDemo() {
  const [tab, setTab] = useState("all")
  const [view, setView] = useState("blueprint")
  const [reading, setReading] = useState("question")
  const readingScroll = useHorizontalChoiceScroll(reading)
  const [actionPreview, setActionPreview] = useState("点击按钮查看样式反馈；此页不执行批阅或发布。")
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle")
  const [folioPage, setFolioPage] = useState(0)
  const [showVersionNote, setShowVersionNote] = useState(false)
  const output = artifactOutputExamples.paper.output
  const revision = output?.status.state === "ready" ? output.version.label.match(/^v(\d+)\b/)?.[1] : undefined
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
  }
  return <div className="bp-demo space-y-8">
    <nav aria-label="蓝图示例导航" className="flex flex-wrap gap-x-5 gap-y-2 text-ui-hint">
      <a href="#common-components">常用基础组件</a>
      <a href="#common-components-two">第二批常用组件</a>
      <a href="#narrow-frame">窄屏图纸外框</a>
      <a href="#title-rules">标题墨线</a>
      <a href="#actions">蓝图按钮与标签页</a>
      <a href="#entry-annotations">图形标注与入口</a>
      <a href="#artifact-folio">成果标题定位</a>
      <a href="#object-section-cards">原件与成果分节</a>
      <a href="#workspace-contracts">Agent 工作区稳定交互</a>
      <a href="#grading-p102">智能批阅组件</a>
      <a href="#trend-calibration">C0 趋势图对照</a>
    </nav>
    <BlueprintFoundationDemo />
    <BlueprintSecondBatchDemo />
    <BlueprintTitleRuleDemo />
    <BlueprintSheet id="narrow-frame" title="窄屏保留图纸外框" narrowFrame="keep" description="窄屏保留左右外框，隐藏坐标尺与内框。">
      <p className="text-ui-body">长中文标题与正文在图纸内自然换行，左右保留阅读间距。</p>
    </BlueprintSheet>
    <p className="border-l-2 border-(--line) pl-4 text-ui-hint text-muted-foreground">样式与状态样板 · 下方班级、答卷、评分与步骤均为固定示例数据。页面内选择只切换预览内容。</p>
    <BlueprintCardsDemo />
    <BlueprintSectionCardSelectionDemo />
    <AgentWorkspacePatternsDemo />
    <BlueprintOverviewDemo />
    <BlueprintGradingDemo />
    <section id="artifact-folio" aria-label="成果标题定位样例" className="space-y-6">
      <BlueprintSheet rulers={false} title={output?.title} folio={revision ? { kind: "rev", value: revision } : undefined} folioAriaHidden
        titleActions={<Menu><MenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="成果标题更多操作" />}><MoreHorizontal aria-hidden="true" /></MenuTrigger>
          <MenuPopup align="end"><MenuItem onClick={() => setShowVersionNote(value => !value)}>版本说明</MenuItem></MenuPopup></Menu>}
        description={`版本：${output?.version.label}；沿用成果导出的已有文件夹具，无分页信息。`}>
        <p className="text-ui-hint text-muted-foreground">固定文件记录：{output?.status.state === "ready" ? output.status.file.name : "—"}。本页不执行保存或导出。</p>
        {showVersionNote && <p role="status" className="text-ui-hint">当前成果有已保存版本，尚未提供分页事实，因此显示 REV。</p>}
      </BlueprintSheet>
      <BlueprintSheet rulers={false} title={continuousPreviewPages[folioPage].alt} folio={{ kind: "sheet", value: `${folioPage + 1} / ${continuousPreviewPages.length}` }} folioAriaHidden
        description={`第 ${folioPage + 1} / ${continuousPreviewPages.length} 份作答；沿用连续纸张夹具的实际顺序。`}>
        <div className="flex flex-wrap gap-3">
          <BpButton disabled={folioPage === 0} onClick={() => setFolioPage(page => page - 1)}>上一份作答</BpButton>
          <BpButton disabled={folioPage === continuousPreviewPages.length - 1} onClick={() => setFolioPage(page => page + 1)}>下一份作答</BpButton>
        </div>
      </BlueprintSheet>
      <BlueprintSectionHeader title="本页样式预览" description="没有成果序列或已保存版本，不显示 folio。" />
    </section>
    <BlueprintSheet id="actions" letter="A" sheetNo="01 / 05" title="按钮与标签页" description="页面级行动用蓝图按钮；表单与工具操作继续使用 coss Button。">
      <div className="bp-demo-columns">
        <div className="min-w-0">
          <BpMinor code="BP-01 · Button" label="按钮" />
          <div className="flex flex-wrap items-center gap-3.5"><BpButton variant="primary" onClick={() => setActionPreview("正在预览主行动：墨底与偏移阴影。")}>预览主行动 →</BpButton><BpButton onClick={() => setActionPreview("正在预览次要行动：边框与纸面。")}>预览次要行动</BpButton></div>
          <div className="mt-4 flex flex-wrap items-center gap-2.5"><BpButton size="sm" onClick={() => setActionPreview("正在预览小尺寸按钮。")}>小尺寸样式</BpButton><BpButton size="sm" variant="danger" onClick={() => setActionPreview("正在预览危险操作样式；未执行任何操作。")}>危险操作样式</BpButton></div>
          <p className="mt-3 text-ui-hint text-muted-foreground" role="status">{actionPreview}</p>
          <div className="mt-5 space-y-3 border-t border-border pt-4">
            <p id="bp-disabled-note" className="text-ui-hint text-muted-foreground">禁用状态示例：所需材料尚未提供。悬停与按下不会产生可操作反馈。</p>
            <div className="flex flex-wrap items-center gap-3"><BpButton variant="primary" disabled aria-describedby="bp-disabled-note">主行动不可用</BpButton><BpButton disabled aria-describedby="bp-disabled-note">次要行动不可用</BpButton><BpButton size="sm" variant="danger" disabled aria-describedby="bp-disabled-note">危险操作不可用</BpButton></div>
            <BpButton size="sm" disabled aria-busy="true">处理中 · 固定状态样例</BpButton>
          </div>
          <BpMinor className="mt-6" code="BP-01.1 · Tool" label="工具操作" />
          <div className="flex flex-wrap items-center gap-2"><BpTool onClick={() => setActionPreview("工具说明：工具按钮用于紧凑的页面级操作。")}>工具说明</BpTool><BpTool count="v1.14.0" onClick={() => setActionPreview("组件库版本标签的静态样例：v1.14.0。")}>版本样例</BpTool><BpTool iconOnly aria-label="查看工具说明" onClick={() => setActionPreview("图标按钮必须提供可访问名称；可用 Tab 聚焦后按 Enter 激活。")}><Info className="size-4" aria-hidden="true" /></BpTool><BpTool disabled aria-describedby="bp-disabled-note">不可用</BpTool><BpTool aria-live="polite" onClick={copyLink}>{copyState === "copied" ? "已复制链接" : copyState === "failed" ? "复制失败，重试" : "复制链接"}</BpTool></div>
        </div>
        <div className="min-w-0">
          <BpMinor code="BP-02 · Segmented" label="分段选择" />
          <BpSegTabs label="答卷状态预览" items={tabs} value={tab} onValueChange={setTab} />
          <p className="mt-2.5 text-ui-hint text-muted-foreground" aria-live="polite">示例快照：{tabNotes[tab]}</p>
          <div className="mt-4 max-w-72"><BpSegTabs label="纵向选择样式预览" orientation="vertical" items={views} value={view} onValueChange={setView} /></div>
          <p className="mt-2.5 text-ui-hint text-muted-foreground">此选择仅演示纵向状态；整站主题由顶部设置切换。</p>
          <BpMinor className="mt-6" code="BP-02.1 · Stepper" label="步骤快照" />
          <BpSteps steps={steps} current={1} label="固定步骤样例" status="示例快照 · 18 / 42" />
          <p className="mt-2.5 text-ui-hint text-muted-foreground">步骤位置来自固定快照，不通过点击推进任务。</p>
        </div>
      </div>
    </BlueprintSheet>

    <BlueprintSheet id="cards" letter="B" sheetNo="02 / 05" title="卡片与线条" description="前两张卡片可跳转到本页章节；静态卡片保持纸面。结构线、分隔线与虚线各有层级。">
      <BpMinor code="BP-03 · Card" label="卡片" />
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
        {cards.map(card => <li key={card.name} className="min-w-0"><BpCard name={card.name} description={card.description} thumb={<Thumb label={`${card.name} 缩略`} />} href={card.href} /></li>)}
        <li><BpCardNote><p>虚线卡用于说明与空位，不可点击。</p></BpCardNote></li>
      </ul>
      <div className="bp-demo-columns mt-9">
        <div className="min-w-0">
          <BpMinor code="BP-04 · Pane" label="阅读面板" />
          <BpPaneHead title="答题卡 · 第 3 页" action={<a href="#reading" className="text-ui-meta underline underline-offset-3">查看阅读样例</a>} />
          <div className="relative h-30 border-(length:--line-width) border-(--line) bg-background"><Thumb label="扫描页预览" /></div>
          <BpFigCap label="FIG. 1">面板头使用墨底白字，与下方内容共用一条墨线。</BpFigCap>
        </div>
        <div className="min-w-0">
          <BpMinor code="BP-05 · Title Block" label="题目信息" />
          <BpTitleBlock items={[{ id: "paper", label: "试卷", value: "八年级数学期中" }, { id: "class", label: "班级", value: "初二（3）班" }, { id: "full", label: "满分", value: "120" }, { id: "due", label: "截止", value: "10 月 18 日 17:00" }]} />
        </div>
      </div>
      <BlueprintObjectCardsDemo />
    </BlueprintSheet>

    <BlueprintSheet id="data" letter="C" sheetNo="03 / 05" title="进度与数据" description="实色、墨色与斜线纹区分系列，不依赖颜色深浅；数值始终以文字写出。">
      <div className="bp-demo-columns">
        <div className="min-w-0">
          <BpMinor code="BP-06 · Size Bar" label="人数构成" />
          <BpSizeBar rows={[{ id: "all", label: "全班", unit: "人", segments: [{ id: "done", label: "已批阅", value: 22, fill: "ink" }, { id: "review", label: "待复核", value: 7, fill: "hatch" }, { id: "ai", label: "AI 处理中", value: 9, fill: "accent" }, { id: "missing", label: "未提交", value: 4, fill: "quiet" }] }]} />
          <BpFacts className="mt-5" items={[{ id: "rate", value: "68%", label: "全班平均得分率" }, { id: "time", value: "3.2 min", label: "每份答卷平均复核时长" }, { id: "diff", value: "5", label: "AI 与教师评分不一致的题" }, { id: "unsaved", value: "0", label: "未保存的修改" }]} />
        </div>
        <div className="min-w-0">
          <BpMinor code="BP-07 · Metric" label="指标对照" />
          <BpMetricLegend baseline="上次测验" current="本次测验" />
          <div className="border-t-(length:--line-width) border-t-(--line)">
            <BpMetric name="平均分" max={120} baseline={{ label: "上次", value: 71.4 }} current={{ label: "本次", value: 78.9 }} gain="+7.5" gainUnit="分" />
            <BpMetric name="及格率" max={100} baseline={{ label: "上次", value: 76, display: "76%" }} current={{ label: "本次", value: 88, display: "88%" }} gain="+12" gainUnit="个百分点" />
            <BpMetric name="批阅用时" max={100} baseline={{ label: "上次", value: 96, display: "96 min" }} current={{ label: "本次", value: 31, display: "31 min" }} gain="3.1×" gainUnit="更快" />
          </div>
        </div>
      </div>
      <BlueprintSizeBarActivationDemo />
      <section id="calibration" className="mt-9 space-y-5" aria-label="学情比例与状态样例">
        <BpMinor code="BP-06.1 · Size Bar" label="补回与保持（合成数据）" />
        <BpSizeBar legendValues rows={[
          { id: "recovered", label: "补回率", total: 272, unit: "项", display: "65% · 177 / 272", segments: [
            { id: "qualified", label: "合格", value: 177, fill: "ink" },
            { id: "excluded", label: "排除 / 未核实", value: 31, fill: "hatch" },
            { id: "other", label: "其他", value: 64, fill: "quiet" },
          ] },
          { id: "retained", label: "保持率", total: 1200, unit: "项", display: "80% · 960 / 1,200", segments: [
            { id: "qualified", label: "合格", value: 960, fill: "ink" },
            { id: "excluded", label: "排除 / 未核实", value: 0, fill: "hatch" },
            { id: "other", label: "其他", value: 240, fill: "quiet" },
          ] },
        ]} />
        <BpSizeBar rows={[{ id: "count", label: "记录数", unit: "项", segments: [{ id: "verified", label: "已核实", value: 12345, fill: "ink" }, { id: "unverified", label: "未核实", value: 0, fill: "hatch" }] }]} />
        <div className="flex flex-wrap gap-2" aria-label="状态标签样例"><Badge variant="success" mark="ok">已通过</Badge><Badge variant="warning" mark="warn">需补充</Badge><Badge variant="error" mark="no">未通过</Badge></div>
        <ChartLegend label="类别与语义形状样例" items={[
          { id: "area", label: "面积类别", marker: "area" }, { id: "bar", label: "柱类别", marker: "bar" },
          { id: "segment", label: "分段类别", marker: "segment" }, { id: "excluded", label: "排除 / 未核实", marker: "hatch" },
          { id: "incomparable", label: "不可比", marker: "hollow-dot" }, { id: "new", label: "新情境", marker: "diamond" },
          { id: "trend", label: "趋势", marker: "line" },
        ]} />
      </section>
    </BlueprintSheet>

    <BlueprintSheet id="feedback" letter="D" sheetNo="04 / 05" title="反馈与文本" description="提示、错误与批注都指向具体位置，并给出可照做的修改。">
      <div className="bp-demo-columns">
        <div className="min-w-0 space-y-5">
          <BpMinor code="BP-08 · Feedback" label="提示与错误" />
          <BpCallout title="为什么 AI 分数与教师分数不同" action={<a className="prism-link text-ui-action underline underline-offset-3" href="#rubric">查看评分点 →</a>}>示例记录：第 7 题的评分点 2 要求写出单位。AI 判定为漏写，教师改判为可接受。</BpCallout>
          <BpError location="第 12 行 · 选项" message="选择题缺少选项 D。单选题需要 4 个选项，每个以字母开头。" example="A. 3　B. 4　C. 5　D. 6" />
          <BpToast>成功状态样例 · 第 7 题评分已保存</BpToast>
        </div>
        <div className="min-w-0 space-y-5">
          <BpMinor code="BP-09 · Annotation" label="批注" />
          <div>
            <BpAnnotatedText parts={["因为直角三角形两条直角边分别是 3 和 4，", { text: "所以斜边是 7", n: 1 }, "，", { text: "答案应该是对的", n: 2, tone: "warn" }, "。"]} />
            <BpAnnotationList className="mt-3" items={[{ n: 1, rule: "计算", message: "两直角边直接相加。", suggestion: "斜边 = √(3² + 4²) = 5" }, { n: 2, tone: "warn", rule: "表述", message: "结论缺少依据。", suggestion: "写出所用定理：勾股定理" }]} />
          </div>
          <BpMinor id="rubric" code="BP-10 · Codebox" label="评分点" />
          <BpCodebox file="rubric.md" meta="第 7 题 · 评分点">{"## 第 7 题 {score=6}\n- 写出勾股定理  +2\n- 代入并求得 5  +3\n- 带单位作答    +1"}</BpCodebox>
        </div>
      </div>
      <section id="reading" className="mt-9 border-t border-border pt-7" aria-labelledby="bp-reading-heading">
        <BpMinor id="bp-reading-heading" code="BP-11 · Reading" label="长中文与公式阅读" />
        <Tabs value={reading} onValueChange={value => setReading(String(value))} className="min-w-0">
          <div {...readingScroll} className="min-w-0 max-w-full overflow-x-auto px-1 py-1">
            <TabsList aria-label="长内容阅读样例">
              <TabsTab value="question">题干与条件说明</TabsTab><TabsTab value="explanation">完整公式推导与教学提示</TabsTab><TabsTab value="locked" disabled>未提供的参考材料</TabsTab>
            </TabsList>
          </div>
          <TabsPanel value="question" className="max-w-186 space-y-4 py-5 text-read-body">
            <p>某校准备在矩形场地内划出一块教学实践区域，面积记为 A。请先完整阅读题目中的长度条件、单位和取值范围，再建立一元二次方程；不能只凭图形比例或某个中间结果判断最终答案。</p>
            <QuestionMath block label="一元二次方程的一般形式，a 不等于零"><mi>a</mi><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mi>b</mi><mi>x</mi><mo>+</mo><mi>c</mi><mo>=</mo><mn>0</mn><mo>，</mo><mi>a</mi><mo>≠</mo><mn>0</mn></QuestionMath>
            <p className="text-ui-hint text-muted-foreground">正文保持阅读字号；章节图框只出现在外层。长公式可在自身区域横向滚动。</p>
          </TabsPanel>
          <TabsPanel value="explanation" className="max-w-186 space-y-4 py-5 text-read-body">
            <p>先用判别式判断实数根的情况，再将两个结果代回原题的取值范围。负数根即使满足方程，也未必符合长度条件。</p>
            <QuestionMath block label="求根公式：x 一、二等于负 b 加减根号 b 平方减四 a c，整体除以二 a；判别式必须大于等于零"><msub><mi>x</mi><mrow><mn>1</mn><mo>,</mo><mn>2</mn></mrow></msub><mo>=</mo><mfrac><mrow><mo>−</mo><mi>b</mi><mo>±</mo><msqrt><msup><mi>b</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>a</mi><mi>c</mi></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac><mo>，</mo><msup><mi>b</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>a</mi><mi>c</mi><mo>≥</mo><mn>0</mn></QuestionMath>
            <p>教学提示：要求学生分别说明列式依据、判别式计算、根的筛选和单位，避免把“计算正确”直接等同于“情境解释完整”。</p>
          </TabsPanel>
        </Tabs>
      </section>
    </BlueprintSheet>
    <BlueprintEntryAnnotationsDemo />
  </div>
}


const entryNodes = [
  { code: "R01", title: "资料索引", description: "查看资料与图纸之间的关联。", actionLabel: "查看索引", x: 80, y: 100, direction: "se" as const, Icon: FileText },
  { code: "R02", title: "结构关系", description: "查看三个节点的连接关系。", actionLabel: "查看关系", x: 200, y: 160, direction: "ne" as const, Icon: Network },
  { code: "R03", title: "分层内容", description: "查看不同层次的内容说明。", actionLabel: "阅读说明", x: 320, y: 100, direction: "sw" as const, Icon: Layers },
]

function BlueprintEntryAnnotationsDemo() {
  const sheetRef = useRef<HTMLElement>(null)
  const diagramRef = useRef<SVGSVGElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const active = hovered ?? focused
  const [mark, setMark] = useState<{ column: number; row: number } | null>(null)
  const [selection, setSelection] = useState("选择入口可查看对应内容。")
  useEffect(() => {
    if (active === null) { setMark(null); return }
    const sheet = sheetRef.current
    const diagram = diagramRef.current
    if (!sheet || !diagram) return
    const measure = () => {
      const frame = sheet.getBoundingClientRect()
      const node = diagram.querySelector(`[data-entry-node="${active}"]`)?.getBoundingClientRect()
      if (!node || !frame.width || !frame.height) { setMark(null); return }
      setMark({ column: Math.min(7, Math.max(0, Math.floor((node.x + node.width / 2 - frame.x) / frame.width * 8))), row: Math.min(3, Math.max(0, Math.floor((node.y + node.height / 2 - frame.y) / frame.height * 4))) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(sheet)
    observer.observe(diagram)
    return () => observer.disconnect()
  }, [active])
  return <BlueprintSheet ref={sheetRef} id="entry-annotations" letter="E" sheetNo="05 / 05" title="图形标注与入口" description="移动指针查看图纸坐标，聚焦入口查看对应节点。" rulerTracking rulerMark={active === null ? undefined : mark}>
    <div className="bp-demo-columns">
      <div className="min-w-0">
        <div className="relative mx-auto w-full max-w-100">
          <svg ref={diagramRef} viewBox="0 0 400 260" className="block h-auto w-full" aria-hidden="true">
            <path d="M80 100 L200 160 L320 100" fill="none" stroke="var(--line)" strokeWidth="1" />
            {entryNodes.map((node, index) => <g key={node.code}>
              <circle data-entry-node={index} cx={node.x} cy={node.y} r="6" fill="var(--foreground)" />
              <BpTargetLock x={node.x} y={node.y} active={active === index} halo />
            </g>)}
          </svg>
          {entryNodes.map((node, index) => <BpDiagramCallout key={node.code} x={node.x} y={node.y} viewBox={[400, 260]} direction={node.direction} code={node.code} label={node.title} meta={active === index && mark ? `${String.fromCharCode(65 + mark.row)}${mark.column + 1} · ${node.code}` : node.code} active={active === index} />)}
        </div>
        <BpFigCap label="FIG. 2">资料索引连接结构关系，结构关系连接分层内容；节点与内容入口一一对应。{active !== null && mark && <span className="block">当前定位：{entryNodes[active].title} · {String.fromCharCode(65 + mark.row)}{mark.column + 1} · {entryNodes[active].code}</span>}</BpFigCap>
      </div>
      <div className="min-w-0">
        <BpMinor code="BP-11" label="内容入口" />
        <div className="space-y-2">
          {entryNodes.map((node, index) => {
            const rowProps = { code: node.code, icon: <node.Icon />, title: node.title, description: node.description, actionLabel: node.actionLabel, emphasis: index === 0,
              onPointerEnter: (event: { pointerType: string }) => { if (event.pointerType !== "touch") setHovered(index) }, onPointerLeave: () => setHovered(null),
              onFocus: () => setFocused(index), onBlur: () => setFocused(null),
              onSelect: () => setSelection(`${node.title}：${node.description}`) }
            return index === 0 ? <BpEntryRow key={node.code} {...rowProps} href="#entry-index" /> : <BpEntryRow key={node.code} {...rowProps} />
          })}
        </div>
        <p id="entry-index" role="status" className="mt-4 text-ui-hint">{selection}</p>
      </div>
    </div>
  </BlueprintSheet>
}
