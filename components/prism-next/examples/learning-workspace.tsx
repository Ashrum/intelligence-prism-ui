"use client"

import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/prism-next/badge"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { Dialog, DialogTrigger, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/coss/dialog"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { DemoSection } from "@/components/prism-next/demo-parts"
import { QuestionReviewDemo as QuestionReview } from "@/components/prism-next/demos/question-review"
import { LearningDiagnosis } from "@/components/prism-next/examples/learning-diagnosis"
import { LearningGoals } from "@/components/prism-next/examples/learning-goals"
import { LearningPlan } from "@/components/prism-next/examples/learning-plan"
import { LearningProvider, useLearning } from "@/components/prism-next/examples/learning-provider"
import { stageLabels, latestReview, type Stage } from "@/lib/prism-next/learning-workflow"
import { createReviewEditor } from "@/lib/prism-next/fixtures/review"

export function LearningWorkspace({ initialStage = "evaluation" }: { initialStage?: Stage }) {
  const [stage, setStage] = useState<Stage>(initialStage)
  const [epoch, setEpoch] = useState(0)
  const [resetOpen, setResetOpen] = useState(false)
  const { state, dispatch, editor, setEditor } = useLearning()
  const review = latestReview(state)
  return <DemoSection title="学习支持工作流" description="同一位示例学生、同一组证据：评价 → 诊断 → 目标 → 计划。四个阶段在此切换，离开本示例或刷新后重置。">
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="text-item-title">示例学生 DEMO-001</span><Badge variant="outline">数学 · 函数应用</Badge><Badge variant="secondary">交互演示</Badge></div><p className="text-ui-hint text-muted-foreground">Q-M-006 · 作答 DEMO-A · 评分标准 v1 · {review ? `评价 v${review.version} 已确认` : "初评待确认"}</p></div><Dialog open={resetOpen} onOpenChange={setResetOpen}><DialogTrigger render={<Button variant="ghost" size="sm" />}>重置示例</DialogTrigger><DialogPopup closeProps={{ "aria-label": "关闭重置确认" }}><DialogHeader><DialogTitle>重置整个示例？</DialogTitle><DialogDescription>本次会话中的评价修改、诊断、目标和任务都会恢复为初始状态。</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>取消</DialogClose><Button onClick={() => { dispatch({ type: "reset" }); setEditor(createReviewEditor()); setEpoch(value => value + 1); setStage("evaluation"); setResetOpen(false) }}>确认重置</Button></DialogFooter></DialogPopup></Dialog></header>
      <Tabs key={epoch} value={stage} onValueChange={value => setStage(value as Stage)} className="gap-6"><div className="max-w-full overflow-x-auto pb-1"><TabsList variant="underline" aria-label="学习支持流程">{Object.entries(stageLabels).map(([id, label], index) => <TabsTab key={id} value={id}>{index + 1}. {label}</TabsTab>)}</TabsList></div>
        <p className="min-h-6 text-ui-hint text-muted-foreground" role="status" aria-live="polite">{state.message}</p>
        <TabsPanel keepMounted value="evaluation"><div className="space-y-6"><QuestionReview editor={editor} onEditorChange={setEditor} onConfirm={(scores, reason) => dispatch({ type: "review", scores, reason })} /><div className="flex flex-wrap justify-between gap-3 border-t pt-5"><p className="text-ui-hint text-muted-foreground">确认后生成可追溯的评价版本，诊断引用具体评分点。</p><Button disabled={!review} onClick={() => setStage("diagnosis")}>继续诊断</Button></div>{!!state.reviews.length && <Collapsible><CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>查看评价版本（{state.reviews.length}）</CollapsibleTrigger><CollapsiblePanel><ol className="mt-3 space-y-3 text-ui-hint">{state.reviews.map(item => <li key={item.version}><strong>评价 v{item.version} · {Object.values(item.scores).reduce((sum, value) => sum + value, 0)} / 16</strong><p className="text-muted-foreground">{item.reason}</p></li>)}</ol></CollapsiblePanel></Collapsible>}</div></TabsPanel>
        <TabsPanel keepMounted value="diagnosis"><LearningDiagnosis active={stage === "diagnosis"} go={setStage} /></TabsPanel>
        <TabsPanel keepMounted value="goals"><LearningGoals active={stage === "goals"} go={setStage} /></TabsPanel>
        <TabsPanel keepMounted value="learning-plan"><LearningPlan active={stage === "learning-plan"} go={setStage} /></TabsPanel>
      </Tabs>
    </div>
  </DemoSection>
}
export function LearningExample({initialStage="evaluation"}:{initialStage?:Stage}){
 return <LearningProvider><LearningWorkspace initialStage={initialStage}/></LearningProvider>
}
