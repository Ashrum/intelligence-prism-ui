"use client"
import { followupAttempts } from "@/components/prism-next/fixtures/followup-attempts"
import { VerificationFields } from "@/components/prism-next/learning-components"

import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { QuestionSelect } from "@/components/prism-next/question-controls"
import { QuestionWorkPanel } from "@/components/prism-next/question-work-panel"
import { useLearning } from "@/components/prism-next/examples/learning-provider"
import { currentVerifications, goalSourceValid, type Goal, type DiagnosisId } from "@/lib/prism-next/learning-workflow"

export function VerificationPanel({ goal, onClose, active, panelId = "learning-verification" }: { goal: Goal; onClose: () => void; active: boolean; panelId?: string }) {
  const { state, dispatch } = useLearning()
  const [attemptId, setAttemptId] = useState("DEMO-B")
  const saved = currentVerifications(state, goal).find(item => item.attemptId === "DEMO-B")
  const [results, setResults] = useState<Partial<Record<DiagnosisId, "pass" | "retry">>>(saved?.results ?? {})
  const [note, setNote] = useState(saved?.note ?? "")
  const [drafts, setDrafts] = useState<Record<string, {results: typeof results; note: string}>>({})
  const [error, setError] = useState("")
  const attempt = followupAttempts.find(item => item.id === attemptId)!
  function select(id: string) {
    setDrafts(previous => ({ ...previous, [attemptId]: { results: { ...results }, note } }))
    const latest = drafts[id] ?? currentVerifications(state, goal).find(item => item.attemptId === id)
    setAttemptId(id); setResults(latest?.results ?? {}); setNote(latest?.note ?? ""); setError("")
  }
  function save() {
    if (goal.mode !== "active" || !goalSourceValid(state, goal)) { setError("目标已暂停或来源需复核。输入已保留，请先处理目标后继续。"); return }
    if (!note.trim() || goal.criteria.some(item => !results[item.id])) { setError("请逐项判断并填写核验依据。"); return }
    dispatch({ type: "verify", check: { goalId: goal.id, goalVersion: goal.version, attemptId, results, note } }); onClose()
  }
  return <QuestionWorkPanel id={panelId} open={active} title="核验目标" description={`${goal.id} · 标准 v${goal.version}。两份独立新作答均满足所有标准，才判定达成。`} onClose={onClose} footer={<><Button onClick={save}>保存核验</Button><Button variant="outline" onClick={onClose}>取消</Button></>}>
    <div className="space-y-6">
      <Field><FieldLabel>新情境作答</FieldLabel><QuestionSelect label="选择新作答" value={attemptId} onChange={select} items={followupAttempts.map(item => ({ value: item.id, label: `${item.id} · ${item.title}` }))} /></Field>
      <p className="text-xs leading-6 text-muted-foreground">两份作答均为人工编写的界面示例，代表两次独立练习。请根据下方内容手动判断；不自动评分。</p>
      <section className="space-y-3"><h4 className="text-sm font-semibold">新情境题面</h4><p className="text-base leading-7">{attempt.prompt}</p></section>
      <section className="space-y-3"><h4 className="text-sm font-semibold">示例学生作答 · {attempt.id}</h4><blockquote className="border-l-2 pl-4 text-base leading-7">{attempt.answer}</blockquote></section>
      <VerificationFields criteria={goal.criteria} results={results} note={note} onResultsChange={setResults} onNoteChange={setNote} error={error}/>
      <p className="text-xs leading-6 text-muted-foreground">更正同一份作答会保留历史记录，以最新判断为准；同一份作答始终只计一次。</p>
    </div>
  </QuestionWorkPanel>
}
