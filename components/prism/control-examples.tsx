"use client"

import Link from "next/link"
import { AILabel, Badge, StateLabel } from "@/components/ui/badge"
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
      <StateLabel tone={isRunning ? "running" : result === null ? "neutral" : "completed"}>{isRunning ? "生成中" : result === null ? "未开始" : "生成完成"}</StateLabel>
      <span>{isRunning ? result === null ? "正在生成初稿。" : "正在生成新结果，仍可查看上次初稿。" : result === null ? "生成后在此查看初稿，再由教师复核。" : "初稿已更新，仍需教师复核。"}</span>
    </p>
    {result !== null && <div className="analysis-result">
      <div className="label-list"><AILabel>AI 初稿</AILabel><StateLabel tone="pending">待复核</StateLabel><span className="control-caption">第 {result} 次生成</span></div>
      <p>方程建模能力稳步提升，几何证明中的条件引用仍需加强。</p>
    </div>}
  </div>
}

const labelStates = [
  { tone: "neutral", label: "未开始" },
  { tone: "info", label: "信息更新" },
  { tone: "running", label: "正在处理" },
  { tone: "completed", label: "处理完成" },
  { tone: "success", label: "校验通过" },
  { tone: "pending", label: "待复核" },
  { tone: "warning", label: "证据不足" },
  { tone: "danger", label: "处理失败" },
] as const

export function LabelsExamples() {
  return <div className="labels-examples">
    <section className="labels-example-section" aria-label="静态元数据与操作入口">
      <h3>静态元数据</h3>
      <div className="label-list"><Badge>九年级</Badge><Badge>数学</Badge><Badge variant="outline">课堂证据</Badge><Link href="/components/input-field">填写课堂记录 →</Link></div>
      <p className="button-demo-note">标签只说明分类，不可点击。填写记录使用独立链接，默认就能识别。</p>
    </section>
    <section className="labels-example-section" aria-label="8 种处理状态">
      <h3>处理状态</h3>
      <div className="label-state-grid">{labelStates.map(({ tone, label }) => <StateLabel key={tone} tone={tone}>{label}</StateLabel>)}</div>
      <p className="button-demo-note">处理中与处理完成保持中性；校验、待复核、证据不足与失败分别说明含义。</p>
    </section>
    <section className="labels-example-section" aria-label="列表中的来源与复核">
      <h3>同一对象的来源与复核</h3>
      <div className="label-records">
        <article className="label-record"><div><h4>方程建模能力分析</h4><p>根据近 30 天课堂证据生成。</p></div><AILabel>AI 初稿</AILabel><StateLabel tone="pending">待复核</StateLabel></article>
        <article className="label-record"><div><h4>几何证明中的条件引用</h4><p>教师已补充适用范围并完成复核。</p></div><AILabel>AI 初稿 · 人工已编辑</AILabel><StateLabel tone="success">人工已确认</StateLabel></article>
      </div>
      <p className="button-demo-note">人工修改与确认后仍保留 AI 来源；人工已确认只表达复核结果。</p>
    </section>
    <section className="labels-example-section" aria-label="窄容器中的长标签">
      <h3>长文本与窄容器</h3>
      <div className="labels-narrow"><Badge>九年级数学 · 方程与几何 · 课堂观察记录</Badge><AILabel>AI 初稿 · 已根据课堂观察完成人工编辑</AILabel><StateLabel tone="warning">证据不足，需补充本周课堂观察后再复核</StateLabel></div>
      <p className="button-demo-note">容器最多 240px；文字完整换行，来源、条件与状态不截断。</p>
    </section>
  </div>
}
