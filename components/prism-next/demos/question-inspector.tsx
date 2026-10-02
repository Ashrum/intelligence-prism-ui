"use client"
import { useState } from "react"
import { DemoSection } from "../demo-parts"
import { QuestionInspector } from "../question-inspector"
import { Button } from "../button"
import { ReviewDemoThemes, reviewInspectorFixture } from "./review-workspace-fixtures"
export function QuestionInspectorFixture() {
  const [notice, setNotice] = useState('')
  return <><div className="grid h-[640px]"><QuestionInspector {...reviewInspectorFixture} onStep={delta => setNotice(`已请求${delta > 0 ? '下一题' : '上一题'}`)} onWrong={() => setNotice('已请求下一道错题')} onIntent={id => setNotice(`已请求：${id}`)} extraLink={<Button variant="link" onClick={() => setNotice('已请求看全班此题')}>看全班此题 →</Button>} /></div><p role="status" className="text-ui-hint">{notice || '评分、状态与置信度均由宿主提供。'}</p></>
}
export function QuestionInspectorDemo() { return <DemoSection title="单题反馈 · 长中文与公式" description="点击动作仅记录请求，确认状态与得分保持外部事实。"><ReviewDemoThemes>{() => <QuestionInspectorFixture />}</ReviewDemoThemes></DemoSection> }
