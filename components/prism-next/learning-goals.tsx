"use client"

import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/coss/badge"
import { Textarea } from "@/components/coss/textarea"
import { Field, FieldLabel } from "@/components/coss/field"
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/coss/table"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { useLearning } from "./learning-provider"
import { QuestionWorkPanel } from "./question-work-panel"
import { LearningDate, LearningEmpty, SourceNotice, futureDate } from "./learning-controls"
import { VerificationPanel } from "./learning-verification"
import { evidenceDefinitions, currentVerifications, goalPasses, goalStatus, goalSourceValid, diagnosisValid, type Goal, type Stage } from "@/lib/prism-next/learning-workflow"

export function LearningGoals({ go, active }: { go: (stage: Stage) => void; active: boolean }) {
  const { state, dispatch } = useLearning()
  const [editing, setEditing] = useState<Goal | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [error, setError] = useState("")
  const verifyGoal = state.goals.find(item => item.id === verifying)
  const canCreate = state.diagnoses.some(item => diagnosisValid(state, item))
  const create = () => dispatch({ type: "create-goal", due: futureDate(7) })
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="space-y-1"><h3 className="text-base font-semibold">把诊断变成可验证的目标</h3><p className="text-sm leading-6 text-muted-foreground">明确起点、达成标准、截止日期与验证方法。任务完成数单独记录。</p></div><Button variant="outline" disabled={!canCreate} onClick={create}>从已确认诊断创建</Button></div>
    {!state.goals.length && <LearningEmpty title="还没有学习目标" action={<Button onClick={() => go("diagnosis")}>查看诊断候选</Button>}>确认至少一个诊断，再创建目标草稿。已有教材、知识点和作答证据将作为目标的起点。</LearningEmpty>}
    {state.goals.map(goal => {
      const status = goalStatus(state, goal), valid = goalSourceValid(state, goal)
      const checks = currentVerifications(state, goal)
      const tasks = state.tasks.filter(item => item.goalId === goal.id)
      return <article key={goal.id} className="@container space-y-5 rounded-xl border p-5 sm:p-6" aria-label={`${goal.id} 学习目标`}>
        <header className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">{goal.id} · 标准 v{goal.version}</span><Badge variant={status === "已达成" ? "success" : status.includes("复核") || status.includes("重新") ? "warning" : "outline"}>{status}</Badge></div><h4 className="text-lg font-semibold leading-7">{goal.title}</h4><p className="text-sm text-muted-foreground">截止 {goal.due} · 示例学生 DEMO-001 · 来源评价 v{goal.sourceVersion}</p></div><Button disabled={!!editing || !!verifying} variant="outline" aria-controls="learning-goal-editor" onClick={() => { setEditing({ ...goal, criteria: goal.criteria.map(item => ({ ...item })) }); setError("") }}>编辑目标</Button></header>
        {!valid && <SourceNotice>目标引用的评价或诊断已变化。原目标、任务和验证记录保留，请先重新检查诊断。<div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => go("diagnosis")}>复核诊断</Button><Button size="sm" variant="outline" onClick={() => dispatch({ type: "reconfirm-goal", id: goal.id })}>确认目标仍适用</Button></div></SourceNotice>}
        <div className="grid gap-6 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"><section className="space-y-3"><h5 className="text-sm font-semibold">起点与关联</h5>{goal.sourceIds.map(id => { const definition = evidenceDefinitions.find(item => item.id === id)!; return <div key={id} className="border-l-2 pl-3 text-sm leading-6"><p>{definition.observed}</p><p className="text-muted-foreground">{definition.curriculum} · 第 {definition.partId} 问</p></div> })}<Button variant="ghost" size="sm" onClick={() => go("diagnosis")}>查看来源证据</Button></section><section className="space-y-3"><h5 className="text-sm font-semibold">达成标准</h5><ol className="list-decimal space-y-2 pl-5 text-sm leading-6">{goal.criteria.map(item => <li key={item.id}>{item.text}</li>)}</ol><p className="text-sm leading-6 text-muted-foreground">验证方法：两份不同的新情境作答，都满足以上全部标准。此门槛是本例约定。</p></section></div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4 text-sm"><span>有效验证 <strong className="tabular-nums">{goalPasses(state, goal)} / 2</strong></span><span>任务完成 <strong className="tabular-nums">{tasks.filter(item => item.status === "done").length} / {tasks.length}</strong></span><span className="text-muted-foreground">两项指标分别计算</span></div>
        <div className="flex flex-wrap gap-2">{goal.mode !== "active" ? <Button disabled={!valid} onClick={() => dispatch({ type: "goal-mode", id: goal.id, mode: "active" })}>{goal.mode === "paused" ? "恢复目标" : "启用目标"}</Button> : <><Button disabled={!valid} onClick={() => { dispatch({ type: "create-plan", id: goal.id, dates: [futureDate(0), futureDate(2), futureDate(5)] }); go("learning-plan") }}>{tasks.length ? "查看学习计划" : "生成学习计划"}</Button><Button variant="outline" disabled={!valid || !!editing || !!verifying} aria-controls="learning-verification" onClick={() => setVerifying(goal.id)}>核验目标</Button><Button variant="ghost" onClick={() => dispatch({ type: "goal-mode", id: goal.id, mode: "paused" })}>暂停目标</Button></>}</div>
        {!!checks.length && <Table><TableHeader><TableRow><TableHead>独立作答</TableHead><TableHead>逐项判断</TableHead><TableHead>核验依据</TableHead></TableRow></TableHeader><TableBody>{checks.map(check => <TableRow key={check.id}><TableCell>{check.attemptId}</TableCell><TableCell className="whitespace-normal">{goal.criteria.map((item, i) => <p key={item.id}>标准 {i + 1}：{check.results[item.id] === "pass" ? "满足" : "尚未满足"}</p>)}</TableCell><TableCell className="max-w-md whitespace-normal leading-6">{check.note}</TableCell></TableRow>)}</TableBody></Table>}
        {!!state.verifications.filter(item => item.goalId === goal.id).length && <Collapsible><CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>查看核验历史（保留旧标准与更正记录）</CollapsibleTrigger><CollapsiblePanel><ul className="mt-3 space-y-2 text-xs leading-6 text-muted-foreground">{state.verifications.filter(item => item.goalId === goal.id).map(item => <li key={item.id}>{item.id} · {item.attemptId} · 标准 v{item.goalVersion} · {Object.entries(item.results).map(([id, result]) => `${id === "domain" ? "定义域" : "数量含义"}：${result === "pass" ? "满足" : "未满足"}`).join("；")}。{item.note}</li>)}{state.audit.filter(item => item.goalId === goal.id).map((item, i) => <li key={`audit-${i}`}>{item.message}</li>)}</ul></CollapsiblePanel></Collapsible>}
      </article>
    })}
    <QuestionWorkPanel id="learning-goal-editor" open={active && !!editing} title="编辑学习目标" description="目标本身切换为编辑表单；保存后更新，关闭或取消会放弃本次修改。" onClose={() => setEditing(null)} footer={<><Button onClick={() => { if (!editing?.title.trim() || !editing.due || editing.criteria.some(item => !item.text.trim())) { setError("请填写目标、全部达成标准和截止日期。"); return } dispatch({ type: "save-goal", goal: editing }); setEditing(null) }}>保存目标</Button><Button variant="outline" onClick={() => setEditing(null)}>取消</Button></>}>
      {editing && <div className="space-y-6"><Field><FieldLabel htmlFor="goal-title">学习目标</FieldLabel><Textarea id="goal-title" value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></Field>{editing.criteria.map((item, index) => <Field key={item.id}><FieldLabel htmlFor={`goal-criterion-${item.id}`}>达成标准 {index + 1}</FieldLabel><Textarea id={`goal-criterion-${item.id}`} value={item.text} onChange={event => setEditing({ ...editing, criteria: editing.criteria.map(c => c.id === item.id ? { ...c, text: event.target.value } : c) })} /></Field>)}<Field><FieldLabel htmlFor="goal-due">截止日期</FieldLabel><LearningDate id="goal-due" value={editing.due} onChange={due => setEditing({ ...editing, due })} /></Field><p className="text-sm leading-6 text-muted-foreground">修改达成标准会保留原核验记录，并要求按新标准重新核验。</p>{error && <p role="alert" className="text-sm text-destructive-foreground">{error}</p>}</div>}
    </QuestionWorkPanel>
    {verifyGoal && <VerificationPanel active={active} key={`${verifyGoal.id}-${verifyGoal.version}`} goal={verifyGoal} onClose={() => setVerifying(null)} />}
  </div>
}
