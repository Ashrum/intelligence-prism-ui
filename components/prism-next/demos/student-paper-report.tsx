"use client"

import { useState } from "react"
import { DemoSection, Feedback } from "../demo-parts"
import { StudentPaperReport, type StudentPaperReportProps } from "../student-paper-report"
import { ReviewDemoThemes, reviewFormula } from "./review-workspace-fixtures"

export const studentPaperReportFixture: StudentPaperReportProps = {
  studentName: "张同学 · 高二年级数学阶段性学习情况",
  status: "待复核",
  score: 78.5,
  maxScore: 100,
  counts: { full: 12, partial: 4, wrong: 3, unanswered: 1 },
  complete: true,
  provided: 20,
  totalLost: 21.5,
  causes: [
    { id: "conditions", category: "未完整说明参数范围与等价变形成立的前提条件", count: 3, lost: 10.5, meter: { value: 3, max: 4, label: "条件分析不完整，3 题，失 10.5 分；条形上限 4 题" } },
    { id: "calculation", category: "计算过程", count: 4, lost: 8, meter: { value: 4, max: 4, label: "计算过程，4 题，失 8 分；条形上限 4 题" } },
  ],
  missingCauses: 1,
  unattributedLost: 3,
  analysis: <>本次作答中，能够建立基本数量关系，但部分推导未注明参数约束。请结合原始作答核对 {reviewFormula} 的适用条件，并关注完整论证过程。此分析由宿主提供，教师确认情况另见报告状态。</>,
  analysisSource: "AI 整卷分析 · 本次批阅结果",
  pendingCount: 2,
  footer: "AI 分析仅供参考，分数与对错以你的批阅为准。",
}

export const studentPaperReportPartialFixture: StudentPaperReportProps = {
  studentName: "李同学",
  status: "批阅中",
  score: null,
  maxScore: 100,
  counts: { full: 2, partial: 1, wrong: 0, unanswered: 0, unprovided: 17 },
  complete: false,
  provided: 3,
  totalLost: 2,
  causes: [{ id: "missing", category: "推导步骤未完整提供", count: 1, lost: 2 }],
  analysis: null,
  pendingCount: 1,
  firstPendingDisabledReason: "当前原始作答尚未提供，待资料齐全后再定位。",
  footer: "仅展示宿主已提供的统计，缺失信息不计作零分或错误。",
}

function ReportExample({ value }: { value: StudentPaperReportProps }) {
  const [notice, setNotice] = useState("")
  return <><StudentPaperReport {...value} onFirstPending={() => setNotice("已请求定位第一道待办题")} /><Feedback>{notice || "定位操作只发出请求，报告与待办数由宿主更新。"}</Feedback></>
}

export function StudentPaperReportDemo() {
  return <>
    <DemoSection title="整卷报告 · 长中文与公式" description="总分、每题对错和归因分布都来自宿主；点击定位不改变报告。">
      <ReviewDemoThemes>{() => <ReportExample value={studentPaperReportFixture} />}</ReviewDemoThemes>
    </DemoSection>
    <DemoSection title="仅部分题目已提供" description="明确统计范围、未知总分、未提供的分析及不能定位的原因。">
      <ReviewDemoThemes>{() => <ReportExample value={studentPaperReportPartialFixture} />}</ReviewDemoThemes>
    </DemoSection>
    <DemoSection title="信息未提供" description="未知总分、四档计数、统计范围和 AI 分析都保持未知，不根据空数组补出结论。">
      <ReviewDemoThemes>{() => <StudentPaperReport />}</ReviewDemoThemes>
    </DemoSection>
    <DemoSection title="宿主确认没有失分" description="零与缺失分别呈现；没有失分的结论由宿主明确提供。">
      <div className="max-w-lg"><StudentPaperReport studentName="王同学" status="已批完" score={100} maxScore={100} complete provided={20} counts={{ full: 20, partial: 0, wrong: 0, unanswered: 0 }} causes={[]} totalLost={0} causesEmptyText="本卷没有失分" pendingCount={0} analysis="各题得分均达到满分，请结合原始作答核对本次批阅结果。" footer="最终报告状态由宿主提供。" /></div>
    </DemoSection>
  </>
}

export function StudentPaperReportPendingDemo() {
  return (
    <DemoSection title="醒目的待办入口" description="同一外部事实，标准与紧凑密度均将待办置顶；定位仅发出请求。">
      <ReviewDemoThemes>{() => <div className="space-y-4">{(["default", "compact"] as const).map(density => <ReportExample key={density} value={{ ...studentPaperReportFixture, density, pendingEmphasis: "strong" }} />)}<ReportExample value={{ ...studentPaperReportPartialFixture, pendingEmphasis: "strong" }} /></div>}</ReviewDemoThemes>
    </DemoSection>
  )
}
