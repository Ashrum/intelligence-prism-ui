"use client"

import { useId, useState } from "react"
import { CircleAlert, CircleHelp } from "lucide-react"
import { DemoSection, Feedback } from "../demo-parts"
import { QuestionRail, QuestionRailClass, type QuestionRailSection } from "../question-rail"
import { ScoreReview, type ScoreReviewProps } from "../score-review"
import { ErrorCauseReview } from "../error-cause-review"
import { StudentPaperReport } from "../student-paper-report"
import { scoreReviewBase } from "./score-review"
import { errorCauseReviewCategories, errorCauseReviewValue, errorCauseReviewHistory } from "./error-cause-review"
import { studentPaperReportFixture } from "./student-paper-report"
import { ReviewDemoThemes, reviewRailFixture, reviewFormula } from "./review-workspace-fixtures"

function MarkerFixture() {
  const id = useId()
  const [selected, setSelected] = useState("2")
  const [notice, setNotice] = useState("")
  const sections: QuestionRailSection[] = reviewRailFixture.sections.map(section => ({ ...section, pages: section.pages.map(page => ({ ...page, items: page.items.map((item, index) => ({ ...item,
    marker: { icon: index === 0 ? <CircleAlert /> : <CircleHelp />, ariaLabel: index === 0 ? "待处理" : "待确认", tooltip: <>需核对长中文原始作答与 {reviewFormula} 的适用条件</>, tone: "warning" },
  })) })) }))
  return <div className="space-y-4">
    <div className="h-[520px]"><QuestionRail {...reviewRailFixture} sections={sections} panelId={id} selected={selected} filter="all" onFilterChange={() => {}} onSelect={setSelected} onLocate={() => setNotice(`已请求定位第 ${selected} 题`)} onPage={page => setNotice(`已请求定位页面 ${page}`)} /></div>
    <div className="h-80"><QuestionRailClass sections={sections.map(section => ({ ...section, items: section.pages.flatMap(page => page.items) }))} overview={reviewRailFixture.overview} selected={selected} onSelect={setSelected} onLocate={() => setNotice(`已请求定位第 ${selected} 题`)} /></div>
    <Feedback>{notice || "图标只表示宿主提供的标记；选择不会清除标记。"}</Feedback>
  </div>
}
export function QuestionRailMarkerDemo() {
  return <DemoSection title="题号格与行 · 图标标记" description="两种题目栏、cell 与 row；题号和得分保留，完整标记说明在提示中。"><ReviewDemoThemes>{() => <MarkerFixture />}</ReviewDemoThemes></DemoSection>
}

function ScoreExample({ density, showIdentity = true }: { density: ScoreReviewProps["density"]; showIdentity?: boolean }) {
  const [score, setScore] = useState<number | null>(6)
  const [reason, setReason] = useState("")
  const [notice, setNotice] = useState("")
  return <div data-density-comparison={density} className="min-w-0 space-y-2">
    <p className="text-item-title">{density}{showIdentity ? "" : " · 身份已在顶栏"}</p>
    {!showIdentity && <p className="text-ui-body">李华 · 主观题 3 · 考号 20260126 · 低置信度 62% · 第 1 / 9 题</p>}
    <ScoreReview {...scoreReviewBase} density={density} showIdentity={showIdentity} score={score} onScoreChange={setScore} reason={reason} onReasonChange={setReason}
      standardAnswer="配方得 \\(f(x)=(x-1)^2-4\\)，当且仅当 \\(x=1\\) 时取最小值 −4。"
      sectionsDefaultOpen={{ answer: false, standardAnswer: false, history: false }} shortcuts
      onAcceptAi={() => setNotice("已接受建议作为草稿，尚未保存。")}
      onSave={draft => setNotice(`已请求保存 ${draft.score} 分；等待宿主回执。`)} />
    <Feedback>{notice || "等待操作，尚未保存。"}</Feedback>
  </div>
}
export function ScoreReviewCompactDemo() {
  return <>
    <DemoSection title="同一数据 · 默认与紧凑" description="每个主题内数据、字号和控件尺寸相同；紧凑模式初始折叠作答、标准答案和历史。">
      <ReviewDemoThemes>{() => <div className="grid items-start gap-4"><ScoreExample density="default" /><ScoreExample density="compact" /></div>}</ReviewDemoThemes>
    </DemoSection>
    <DemoSection title="顶栏已提供身份" description="showIdentity=false 隐藏重复身份，面板保留可访问名称。"><div className="max-w-lg"><ScoreExample density="compact" showIdentity={false} /></div></DemoSection>
    <DemoSection title="宿主声明初始展开" description="三个长内容分区均可由宿主声明初始展开；控件沿用 coss 键盘行为。"><div className="max-w-lg"><ScoreReview {...scoreReviewBase} density="compact" standardAnswer="最小值 −4，取等条件 x=1。" sectionsDefaultOpen={{ answer: true, standardAnswer: true, history: true }} /></div></DemoSection>
  </>
}

function CauseExample({ density }: { density: "default" | "compact" }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(errorCauseReviewValue)
  const [notice, setNotice] = useState("")
  return <div className="space-y-2"><p className="text-item-title">{density}</p><ErrorCauseReview density={density} categories={errorCauseReviewCategories} value={errorCauseReviewValue} history={errorCauseReviewHistory}
    editing={editing} draft={draft} onEdit={() => { setDraft(errorCauseReviewValue); setEditing(true) }} onChange={setDraft}
    onCancel={() => { setEditing(false); setNotice("已取消编辑，保留原错因。") }} onSave={() => setNotice("已请求保存错因，等待宿主回执。")} /><Feedback>{notice}</Feedback></div>
}
export function ErrorCauseReviewCompactDemo() {
  return <DemoSection title="错因核对 · 默认与紧凑" description="同一分类、说明与历史；紧凑模式只减间距和内边距。"><ReviewDemoThemes>{() => <div className="space-y-6"><CauseExample density="default" /><CauseExample density="compact" /></div>}</ReviewDemoThemes></DemoSection>
}
function ReportExample({ density }: { density: "default" | "compact" }) {
  const [notice, setNotice] = useState("")
  return <div className="space-y-2"><p className="text-item-title">{density}</p><StudentPaperReport {...studentPaperReportFixture} density={density} onFirstPending={() => setNotice("已请求定位第一道待办题")} /><Feedback>{notice}</Feedback></div>
}
export function StudentPaperReportCompactDemo() {
  return <DemoSection title="整卷报告 · 默认与紧凑" description="同一统计、归因与 AI 分析；完整保留所有信息。"><ReviewDemoThemes>{() => <div className="space-y-6"><ReportExample density="default" /><ReportExample density="compact" /></div>}</ReviewDemoThemes></DemoSection>
}
