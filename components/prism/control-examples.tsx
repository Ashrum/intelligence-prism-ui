"use client"

import Link from "next/link"
import { AILabel, Badge, StateLabel } from "@/components/ui/badge"
import { useEffect, useRef, useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { TextField } from "@/components/ui/text-field"
import { contrastPresets, contrastRatio } from "@/lib/color-contrast"

function ColorStylePreview() {
  const [name, setName] = useState("学生 01")
  const [appliedName, setAppliedName] = useState(name)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  const composing = useRef(false)

  return <div className="color-direction-review" id="color-direction-review">
    <div className="doc-section-heading"><h3>当前配色 · 真实组件</h3><p>近白页面、白色内容面、浅中性底色与深灰文字已应用到现有组件。</p></div>
    <div className="color-review-scene">
      <header className="color-review-heading"><h4>课堂观察与学习记录</h4><p>保留来源与复核状态。</p><small>更新于今日 09:30 · 示例数据</small></header>
      <div className="color-review-sources" aria-label="三种品牌源色"><span><i style={{ background: "var(--source-knowledge)" }} aria-hidden="true" />曜蓝</span><span><i style={{ background: "var(--source-ai)" }} aria-hidden="true" />智绯</span><span><i style={{ background: "var(--source-growth)" }} aria-hidden="true" />生长荧</span></div>
      <article className="color-review-card">
        <div><h5>本周学习记录</h5><p className="color-review-secondary">{appliedName} · 九年级数学</p></div>
        <div className="label-list"><AILabel>AI 初稿</AILabel><StateLabel tone="pending">待复核</StateLabel></div>
        <p className="color-review-body">方程建模步骤完整，条件说明仍需补充。</p>
        <p className="color-review-note">来源：课堂观察 · 12 份学习记录</p>
        <form aria-label="当前配色输入示例" noValidate onSubmit={event => {
          event.preventDefault()
          if (composing.current) return
          if (!name.trim()) {
            setError("请填写学生姓名。")
            setFeedback("")
            event.currentTarget.querySelector("input")?.focus()
            return
          }
          setAppliedName(name.trim())
          setName(name.trim())
          setError("")
          setFeedback("修改已应用到本页记录。")
        }}>
          <TextField label="学生姓名" value={name} required error={error} onChange={event => { setName(event.target.value); setError(""); setFeedback("") }} onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }} />
          <div className="color-review-actions"><Button type="submit">应用修改</Button><Button type="button" variant="outline" onClick={() => { setName(appliedName); setError(""); setFeedback("已取消修改，原记录保留。") }}>取消</Button></div>
        </form>
      </article>
    </div>
    <p className="color-review-feedback" role="status">{feedback}</p>
    <p className="button-demo-note">曜蓝按钮采用白字，默认对比度为 {contrastRatio(...contrastPresets.current.action)?.toFixed(2)}:1，未达到普通文字 AA（4.5:1）与本站 7:1 目标；Hover 和按下使用更深底色。链接和小字号操作文字使用独立的深蓝色。</p>
  </div>
}

export function ColorContrastLab() {
  const [scheme, setScheme] = useState<keyof typeof contrastPresets>("current")
  const [role, setRole] = useState<"action" | "ai" | "growth">("ai")
  const [colors, setColors] = useState<{ foreground: string; background: string }>({ foreground: contrastPresets.current.ai[0], background: contrastPresets.current.ai[1] })
  const ratio = contrastRatio(colors.foreground, colors.background)
  const foregroundError = /^#[\da-f]{6}$/i.test(colors.foreground) ? "" : "前景色需为六位颜色，例如 #751C4A。"
  const backgroundError = /^#[\da-f]{6}$/i.test(colors.background) ? "" : "背景色需为六位颜色，例如 #FDF0F6。"
  const reset = (nextScheme = scheme, nextRole = role) => {
    setScheme(nextScheme)
    setRole(nextRole)
    const pair = contrastPresets[nextScheme][nextRole]
    setColors({ foreground: pair[0], background: pair[1] })
  }
  const changed = colors.foreground.toUpperCase() !== contrastPresets[scheme][role][0] || colors.background.toUpperCase() !== contrastPresets[scheme][role][1]

  return <><ColorStylePreview /><div className="contrast-lab">
    <h3>单个配对实验</h3>
    <SegmentedControl label="配色方案" value={scheme} onValueChange={value => reset(value as typeof scheme)} items={[["current", "当前浅色"], ["light", "候选浅色"], ["dark", "候选深色"]]} />
    <SegmentedControl label="语义角色" size="sm" value={role} onValueChange={value => reset(scheme, value as typeof role)} items={[["action", "曜蓝"], ["ai", "智绯"], ["growth", "生长荧"]]} />
    <p className="button-demo-note">{changed ? "自定义实验值，仅影响下方样本。" : scheme === "current" ? role === "growth" ? "源色限制示例：生长荧用于色样展示，不直接承担浅色底上的正文或必要边界。" : "当前浅色 Token 配对。" : "候选配对，尚未应用到主题；数值通过不等于主题验收。"} 输入不带透明度的六位十六进制颜色；透明色需先与实际背景合成。</p>
    <div className="contrast-lab-fields">
      <TextField label="前景文本色" value={colors.foreground} error={foregroundError} spellCheck={false} autoCapitalize="characters" onChange={event => setColors(previous => ({ ...previous, foreground: event.target.value }))} />
      <TextField label="背景色" value={colors.background} error={backgroundError} spellCheck={false} autoCapitalize="characters" onChange={event => setColors(previous => ({ ...previous, background: event.target.value }))} />
    </div>
    {ratio !== null && <div className="contrast-lab-sample" style={{ color: colors.foreground, backgroundColor: colors.background }}><strong>课堂观察与学习记录</strong><p>AI 来源、人工复核与评价条件分别说明。</p><span>得分 08 / 12 · 示例数据</span></div>}
    <p className="contrast-lab-result" role="status">{ratio === null ? "请输入有效颜色，例如 #751C4A。" : <>对比度 <strong>{ratio.toFixed(2)}:1</strong> · 普通文字 AA（4.5:1）：{ratio >= 4.5 ? "达到" : "未达到"} · 本站阅读目标（7:1）：{ratio >= 7 ? "达到" : "未达到"}</>}</p>
    <div><Button type="button" variant="outline" size="compact" onClick={() => reset()}>恢复所选配对</Button></div>
    <p className="button-demo-note">按原始计算值判定，显示值保留两位小数。实验值不修改全站 Token。</p>
  </div></>
}

export function HomeControlPreview() {
  const [record, setRecord] = useState({ text: "方程建模步骤完整，条件说明仍需补充。", edited: false, reviewed: false })
  const [draft, setDraft] = useState(record.text)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable")
  const editor = useRef<HTMLTextAreaElement>(null)
  const editButton = useRef<HTMLButtonElement>(null)
  const composing = useRef(false)
  const returnFocus = useRef(false)

  useEffect(() => {
    if (editing) editor.current?.focus()
    else if (returnFocus.current) {
      editButton.current?.focus()
      returnFocus.current = false
    }
  }, [editing])

  function finishEditing() {
    composing.current = false
    returnFocus.current = true
    setEditing(false)
    setError("")
  }

  return <section className="home-control-preview" data-density={density} aria-labelledby="home-preview-title">
    <header><span className="control-caption">真实组件 · 可直接操作</span><h2 id="home-preview-title">AI 来源与人工复核分开</h2><p>九年级数学 · 课堂观察。演示初稿，修改仅在本页保留。</p></header>
    <div className="home-preview-density"><span>界面密度</span><SegmentedControl label="首页示例密度" size="sm" value={density} onValueChange={value => setDensity(value as typeof density)} items={[["comfortable", "舒适"], ["compact", "紧凑"]]} /></div>
    <div className="label-list"><AILabel>{record.edited ? "AI 初稿 · 人工已编辑" : "AI 初稿"}</AILabel><StateLabel tone={record.reviewed ? "success" : "pending"}>{record.reviewed ? "人工已确认" : "待复核"}</StateLabel></div>
    <p className="home-preview-reading">{record.text}</p>
    {editing ? <form noValidate onSubmit={event => {
      event.preventDefault()
      if (composing.current) return
      const text = draft.trim()
      if (!text) {
        setError("请填写候选结论。")
        editor.current?.focus()
        return
      }
      if (text !== record.text) {
        setRecord({ text, edited: true, reviewed: false })
        setFeedback("修改已应用，需重新复核；AI 来源保留。")
      } else setFeedback("内容未变化，复核状态保留。")
      finishEditing()
    }}>
      <TextField multiline ref={editor} label="候选结论" required density={density} value={draft} error={error} description="上方保留已应用的结论。应用修改后，再单独确认复核。"
        onChange={event => { setDraft(event.target.value); setError("") }}
        onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }} />
      <div className="home-preview-actions"><Button key="apply" type="submit" size={density === "compact" ? "compact" : "default"}>应用修改</Button><Button key="cancel" type="button" variant="ghost" size={density === "compact" ? "compact" : "default"} onClick={() => { finishEditing(); setFeedback("已取消修改，原结论与复核状态保留。") }}>取消</Button></div>
    </form> : <div className="home-preview-actions">
      <Button key="review" type="button" variant={record.reviewed ? "outline" : "default"} size={density === "compact" ? "compact" : "default"} onClick={() => {
        setRecord(previous => ({ ...previous, reviewed: !previous.reviewed }))
        setFeedback(record.reviewed ? "已撤回确认，恢复待复核；AI 来源保留。" : "已记录人工确认；AI 来源保留。")
      }}>{record.reviewed ? "撤回确认" : "确认复核"}</Button>
      <Button key="edit" ref={editButton} type="button" variant="ghost" size={density === "compact" ? "compact" : "default"} onClick={() => { setDraft(record.text); setFeedback(""); setEditing(true) }}>编辑结论</Button>
    </div>}
    <p className="home-preview-feedback" role="status">{feedback}</p>
    <footer><p>复用 Button、Input / Field 与 Labels；此示例不代表 AI 对话组件已交付。</p><Link href="/components/badge-labels">查看来源与状态规范 →</Link></footer>
  </section>
}

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
