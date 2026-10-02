"use client"
import { useState } from "react"
import { DemoSection } from "../demo-parts"
import { QuestionInspector } from "../question-inspector"
import { ScrollArea } from '@/components/coss/scroll-area'
import { Frame } from '@/components/coss/frame'
import { QuestionAnalysisPanel } from '../question-analysis-panel'
import { incompleteAnalysisPanel } from './question-analysis-panel'
import { Button } from "../button"
import { ReviewDemoThemes, reviewInspectorFixture } from "./review-workspace-fixtures"
export function QuestionInspectorFixture({ incomplete = false }: { incomplete?: boolean }) {
  const [notice, setNotice] = useState('')
  return <><div className="grid h-[640px]"><QuestionInspector {...reviewInspectorFixture} {...(incomplete ? {
    points: [], pointsEmptyText: '未提供', evidence: '未提供', knowledge: ['未提供'], comparison: [], comparisonEmptyText: '未提供',
    actions: [{ id: 'correct', label: '更正评分', primary: true, disabled: true, disabledReason: '未提供评分标准，请先补全评分依据与各评分点的分值后再更正。' }, { id: 'review', label: '教师批阅', disabled: true, disabledReason: '当前作答尚未开放教师批阅。' }],
  } : {})} onStep={delta => setNotice(`已请求${delta > 0 ? '下一题' : '上一题'}`)} onWrong={() => setNotice('已请求下一道错题')} onIntent={id => setNotice(`已请求：${id}`)} extraLink={<Button variant="link" onClick={() => setNotice('已请求看全班此题')}>看全班此题 →</Button>} /></div><p role="status" className="text-ui-hint">{notice || '评分、状态与置信度均由宿主提供。'}</p></>
}
export function QuestionInspectorDemo() { return <><DemoSection title="单题反馈 · 长中文与公式" description="点击动作仅记录请求，确认状态与得分保持外部事实。"><ReviewDemoThemes>{() => <QuestionInspectorFixture />}</ReviewDemoThemes></DemoSection><DemoSection title="数据不全" description="评分点与班级对比空态由宿主提供；禁用原因显示在动作下方并关联对应按钮。"><ReviewDemoThemes>{() => <QuestionInspectorFixture incomplete />}</ReviewDemoThemes></DemoSection><DemoSection title="数据不全 · 当前作答共用滚动区" description="bodyOnly 只输出主体；分析面板和当前作答由宿主提供一个 ScrollArea。"><ReviewDemoThemes>{() => <QuestionInspectorBodyFixture />}</ReviewDemoThemes></DemoSection></> }

export function QuestionInspectorBodyFixture(){return <div className="h-[640px]"><ScrollArea overscrollContain scrollFade><Frame><div className="space-y-4 px-4 py-5"><h3 className="text-block-title">本题分析</h3><QuestionAnalysisPanel {...incompleteAnalysisPanel} onKnowledge={()=>{}} onEvidence={()=>{}}/><h3 className="text-block-title">当前作答 · 张同学</h3></div><QuestionInspector {...reviewInspectorFixture} bodyOnly points={[]} pointsEmptyText="未提供" comparison={[]} comparisonEmptyText="未提供" onStep={()=>{}} onWrong={()=>{}}/></Frame></ScrollArea></div>}
