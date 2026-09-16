"use client"

import { useState } from "react"
import { Button } from "@/components/coss/button"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { QuestionSelect } from "./question-controls"
import { QuestionWorkPanel } from "./question-work-panel"
import { useLearning } from "./learning-provider"
import { currentVerifications, goalSourceValid, type Goal, type DiagnosisId } from "@/lib/prism-next/learning-workflow"

export const followupAttempts = [
  { id: "DEMO-B", title: "仓库存量", prompt: "某仓库初有 30 箱货物，随后每小时入库 8 箱，持续 5 小时。N(t) = 30 + 8t，0 ≤ t ≤ 5。求 3 小时后的总量与增量，以及总量不少于 62 箱的时间范围。", answer: "N 表示总箱数，30 是初始量。N(3) = 54，新增 54 − 30 = 24 箱。30 + 8t ≥ 62 得 t ≥ 4，与 0 ≤ t ≤ 5 取交集得 4 ≤ t ≤ 5。" },
  { id: "DEMO-C", title: "行程记录", prompt: "一份行程记录开始时已有 5 km，之后以 3 km/h 继续行进 4 小时。S(t) = 5 + 3t，0 ≤ t ≤ 4。求记录开始 2 小时后的总里程和新增里程，以及总里程不少于 11 km 的时间范围。", answer: "S 表示记录中的总里程，5 是已有里程。S(2) = 11，新增 11 − 5 = 6 km。5 + 3t ≥ 11 得 t ≥ 2，结合 0 ≤ t ≤ 4，范围为 2 ≤ t ≤ 4。" },
]
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
      <div className="space-y-5 border-t pt-5">{goal.criteria.map((item, index) => <Field key={item.id}><FieldLabel>标准 {index + 1}</FieldLabel><p className="text-sm leading-6">{item.text}</p><QuestionSelect label={`标准 ${index + 1} 判断`} value={results[item.id] ?? "pending"} onChange={value => setResults(previous => ({ ...previous, [item.id]: value === "pending" ? undefined : value as "pass" | "retry" }))} items={[{ value: "pending", label: "待判断" }, { value: "pass", label: "满足标准" }, { value: "retry", label: "尚未满足" }]} /></Field>)}</div>
      <Field><FieldLabel htmlFor="verification-note">核验依据</FieldLabel><Textarea id="verification-note" placeholder="指出作答中满足或未满足标准的具体内容。" value={note} onChange={event => setNote(event.target.value)} /></Field>
      {error && <p role="alert" className="text-sm text-destructive-foreground">{error}</p>}
      <p className="text-xs leading-6 text-muted-foreground">更正同一份作答会保留历史记录，以最新判断为准；同一份作答始终只计一次。</p>
    </div>
  </QuestionWorkPanel>
}
