"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"

const evidence = [
  { student: "学生 01", scores: ["3 / 4", "1 / 2"] },
  { student: "学生 02", scores: ["2 / 4", "2 / 2"] },
]
const subjects = ["方程", "几何"]

export function EvidencePerspective() {
  const [perspective, setPerspective] = useState("student")
  const byStudent = perspective === "student"
  const columns = byStudent ? subjects : evidence.map((row) => row.student)
  const rows = byStudent
    ? evidence.map((row) => ({ label: row.student, values: row.scores }))
    : subjects.map((subject, index) => ({ label: subject, values: evidence.map((row) => row.scores[index]) }))

  return <div className="evidence-perspective">
    <p className="control-caption">九年级 1 班 · 数学 · 本周 · 示例数据</p>
    <SegmentedControl label="查看视角" value={perspective} onValueChange={setPerspective} items={[["student", "学生视角"], ["knowledge", "知识点视角"]]} />
    <p className="preview-result" role="status">{byStudent ? "按学生查看" : "按知识点查看"}，班级、周期与 12 次作答保持不变。</p>
    <table className="evidence-table">
      <caption>答对题数 / 作答题数</caption>
      <thead><tr><th scope="col">{byStudent ? "学生" : "知识点"}</th>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th>{row.values.map((value, index) => <td key={columns[index]}>{value}</td>)}</tr>)}</tbody>
    </table>
  </div>
}

export function LearningAnalysisExample({ compact = false }: { compact?: boolean }) {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current) }, [])

  function generate() {
    if (timer.current !== null) return
    setIsRunning(true)
    timer.current = setTimeout(() => {
      setResult((previous) => (previous ?? 0) + 1)
      setIsRunning(false)
      timer.current = null
    }, 900)
  }

  return <div className="analysis-example">
    <div className="analysis-heading">
      <div><h3>学习表现分析</h3><p className="button-demo-note">九年级 · 数学 · 近 30 天。模拟生成过程，结果仅在当前页面保留。</p></div>
      <Button type="button" variant="ai-primary" size={compact ? "compact" : "default"} onClick={generate} loading={isRunning} loadingLabel="正在生成分析"><Sparkles aria-hidden="true" />{result === null ? "生成学习分析" : "重新生成分析"}</Button>
    </div>
    <p className="analysis-feedback" role="status">
      <span className={`state-label state-label--${isRunning ? "running" : result === null ? "neutral" : "completed"}`}><span className="state-dot" aria-hidden="true" />{isRunning ? "生成中" : result === null ? "未开始" : "生成完成"}</span>
      <span>{isRunning ? result === null ? "正在生成初稿。" : "正在生成新结果，仍可查看上次初稿。" : result === null ? "生成后在此查看初稿，再由教师复核。" : "初稿已更新，仍需教师复核。"}</span>
    </p>
    {result !== null && <div className="analysis-result">
      <div className="label-list"><span className="ai-label"><Sparkles aria-hidden="true" />AI 初稿</span><span className="state-label state-label--pending"><span className="state-dot" aria-hidden="true" />待复核</span><span className="control-caption">第 {result} 次生成</span></div>
      <p>方程建模能力稳步提升，几何证明中的条件引用仍需加强。</p>
    </div>}
  </div>
}
