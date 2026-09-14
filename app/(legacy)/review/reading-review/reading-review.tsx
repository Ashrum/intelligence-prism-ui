"use client"

import { createContext, createElement as h, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, Circle, CircleAlert, FileText, Pencil, RotateCcw, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const m = (tag: string, ...children: ReactNode[]) => h(tag, null, ...children)
const n = (text: string) => m("mn", text)
const v = (text: string) => m("mi", text)
const op = (text: string) => m("mo", text)
const square = (value: ReactNode) => m("msup", value, n("2"))
const sub = (index: string) => m("msub", v("x"), n(index))
const fx = (value: ReactNode = v("x")) => m("mrow", v("f"), op("("), value, op(")"))
const MathFontContext = createContext(true)
function Formula({ label, children, block = false }: { label: string; children: ReactNode; block?: boolean }) {
  const available = useContext(MathFontContext)
  if (!available) return <span className="rr-math-fallback" data-block={block}>公式文字表达：{label}。</span>
  return h("math", { xmlns: "http://www.w3.org/1998/Math/MathML", display: block ? "block" : "inline", "aria-label": label }, children)
}
const quadratic = <Formula label="f(x) 等于 x 平方减 2x 加 3">{m("mrow", fx(), op("="), square(v("x")), op("−"), n("2"), v("x"), op("+"), n("3"))}</Formula>
const rational = <Formula label="g(x) 等于（x 减 1）的平方根除以（x 减 2）">{m("mrow", m("mrow", v("g"), op("("), v("x"), op(")")), op("="), m("mfrac", m("msqrt", v("x"), op("−"), n("1")), m("mrow", v("x"), op("−"), n("2"))))}</Formula>
const rootA = () => m("msqrt", v("a"))
const rootXA = () => m("msqrt", v("x"), op("+"), v("a"))
const rootSum = () => m("mrow", rootXA(), op("+"), rootA())
const ha = (value: ReactNode = v("x")) => m("mrow", m("msub", v("h"), v("a")), op("("), value, op(")"))
const parameterFunction = <Formula label="a 大于零，h 下标 a 的 x 值等于（（x 加 a）的平方根减去 a 的平方根）除以 x">{m("mrow", ha(), op("="), m("mfrac", m("mrow", rootXA(), op("−"), rootA()), v("x")))}</Formula>

const cases = [
  { id: "01", title: "单调区间", description: "结论是否超出了证明范围", topic: "函数的单调性", question: "根据下面的函数与原推导，判断结论的适用范围。", formula: quadratic,
    initial: "函数在整个实数范围内严格递增。", hint: "原推导对自变量作了什么限制？这个限制在结论中还在吗？", source: "示例作答 A · 第 2 步", sourceNote: "对比结论与这一步的取值条件。", sourceTitle: "比较两个函数值",
    evidence: <><p>任取 <Formula label="1 小于 x1 小于 x2">{m("mrow", n("1"), op("<"), sub("1"), op("<"), sub("2"))}</Formula>，有：</p><div className="rr-formula-scroll" tabIndex={0} role="group" aria-label="函数值之差的推导，可横向滚动"><Formula block label="f(x2) 减 f(x1) 等于 x2 减 x1 乘以 x1 加 x2 减 2，大于零">{m("mrow", fx(sub("2")), op("−"), fx(sub("1")), op("="), op("("), sub("2"), op("−"), sub("1"), op(")"), op("("), sub("1"), op("+"), sub("2"), op("−"), n("2"), op(")"), op(">"), n("0"))}</Formula></div><p>两个因式均为正。因此，在这一步设定的区间内，函数值随自变量增大而增大。</p></>,
  },
  { id: "02", title: "最小值", description: "数值与等号条件是否对应", topic: "二次函数的最值", question: "根据配方结果，核对最小值及其取得条件。", formula: quadratic,
    initial: "函数的最小值为 2，在 x = 1 时取得。", hint: "数值正确还不够；取得最小值的条件，也应留在结论里。", source: "示例作答 A · 第 3 步", sourceNote: "同时核对最小值和等号成立的条件。", sourceTitle: "通过配方确定最值",
    evidence: <><div className="rr-formula-scroll" tabIndex={0} role="group" aria-label="配方结果，可横向滚动"><Formula block label="f(x) 等于 x 减 1 的平方加 2，大于等于 2">{m("mrow", fx(), op("="), square(m("mrow", op("("), v("x"), op("−"), n("1"), op(")"))), op("+"), n("2"), op("≥"), n("2"))}</Formula></div><p>平方项不小于零，且当 x = 1 时等于零。函数的最小值为 2，等号条件与结论一致。</p></>,
  },
  { id: "03", title: "定义域", description: "多个约束是否被同时保留", topic: "根式与分式的约束", question: "核对这个表达式有意义时，自变量需要满足哪些条件。", formula: rational,
    initial: "定义域为 x ≥ 1。", hint: "一个对象可能同时受到多个约束。核对根式时，别让分母的限制消失。", source: "示例作答 B · 第 1 步", sourceNote: "这里的两个条件需要同时成立。", sourceTitle: "分别检查根式和分母",
    evidence: <><p>根号内的数非负，因此 <Formula label="x 减 1 大于等于零，即 x 大于等于 1">{m("mrow", v("x"), op("−"), n("1"), op("≥"), n("0"), m("mtext", "，即 "), v("x"), op("≥"), n("1"))}</Formula>。</p><p>分母不能为零，因此 <Formula label="x 减 2 不等于零，即 x 不等于 2">{m("mrow", v("x"), op("−"), n("2"), op("≠"), n("0"), m("mtext", "，即 "), v("x"), op("≠"), n("2"))}</Formula>。</p><p>端点 x = 1 可以取到；x = 2 必须排除。</p></>,
  },
  { id: "04", title: "参数与值域", description: "化简之后，原式约束是否还在", topic: "有理化、单调性与值域", question: "参数 a > 0。沿原推导核对定义域和端点，判断化简是否改变了原函数。", formula: parameterFunction, longEvidence: true,
    initial: "当 a > 0 时，函数在 [−a, +∞) 上严格递减，值域为 (0, 1/√a]。有理化后 x = 0 可以取到，对应函数值为 1/(2√a)，因此结论适用于整个区间。",
    hint: "化简后的表达式与原函数是否拥有同一个定义域？核对端点、极限与实际取值。", source: "示例作答 C · 第 1–5 步", sourceTitle: "从原式约束追到值域", sourceNote: "以上为合成推导，供复核练习。原式的约束必须随等价变形保留；人为补上的点属于另一个函数。",
    evidence: <>
      <section className="rr-evidence-step"><h4>01 · 先保留原式约束</h4><p>参数 a 为正数。根号内要求 x + a ≥ 0，原分母还要求 x ≠ 0；两项限制需要同时满足。左端点 x = −a 可以代入，因为此时分母为 −a，并不等于零。</p>
        <div className="rr-formula-scroll" tabIndex={0} role="group" aria-label="原式定义域，可横向滚动"><Formula block label="定义域 D 等于负 a 到零的左闭右开区间，与零到正无穷的开区间的并集">{m("mrow", v("D"), op("="), m("mrow", op("["), op("−"), v("a"), op(","), n("0"), op(")")), op("∪"), m("mrow", op("("), n("0"), op(","), op("+"), op("∞"), op(")")))}</Formula></div>
      </section>
      <section className="rr-evidence-step"><h4>02 · 有理化不补回缺失点</h4><p>分子、分母同乘两根式之和。由于 a 为正数，这个和始终为正；约去 x 则必须沿用 x ≠ 0 的限制。等式只在原定义域内成立。</p>
        <div className="rr-formula-scroll" tabIndex={0} role="group" aria-label="有理化推导，可横向滚动"><Formula block label="对原定义域中的 x，h 下标 a 的 x 值等于 x 除以 x 与（（x 加 a）的平方根加 a 的平方根）的乘积，等于一除以（（x 加 a）的平方根加 a 的平方根）">{m("mrow", ha(), op("="), m("mfrac", v("x"), m("mrow", v("x"), m("mrow", op("("), rootSum(), op(")")))), op("="), m("mfrac", n("1"), rootSum()))}</Formula></div>
        <p>化简式在 x = 0 处有意义，只说明它可以给原函数作连续延拓，不能据此修改原函数的定义域。</p>
      </section>
      <section className="rr-evidence-step"><h4>03 · 单调性需要覆盖两侧</h4><p>在 x 大于 −a 且 x ≠ 0 时求导，分母中每个因子均为正，因此导数为负。它分别说明两个开区间内的递减关系。</p>
        <div className="rr-formula-scroll" tabIndex={0} role="group" aria-label="带根式分母的导数，可横向滚动"><Formula block label="h 下标 a 的导数等于负一除以以下三项的乘积：二、（x 加 a）的平方根、以及〔（x 加 a）的平方根与 a 的平方根之和〕的平方；结果小于零">{m("mrow", m("mrow", m("msubsup", v("h"), v("a"), op("′")), op("("), v("x"), op(")")), op("="), op("−"), m("mfrac", n("1"), m("mrow", n("2"), rootXA(), square(m("mrow", op("("), rootSum(), op(")"))))), op("<"), n("0"))}</Formula></div>
        <p>若要比较跨过 x = 0 的两个自变量，不能仅凭分段导数下结论。这里还可以直接观察化简式：在原定义域内，x 越大，正分母越大，倒数越小；包含左端点或跨过缺失点的比较也成立。</p>
      </section>
      <section className="rr-evidence-step"><h4>04 · 区分取到的端点与极限</h4><p>左端点处的函数值可以取到；当 x 趋向正无穷时，函数值趋向零，但不会等于零。x 从两侧趋近零时，函数值趋向同一个数，不过原式在零处没有定义。</p>
        <div className="rr-formula-scroll" tabIndex={0} role="group" aria-label="左端点取值，可横向滚动"><Formula block label="h 下标 a 在负 a 处的值等于一除以 a 的平方根">{m("mrow", ha(m("mrow", op("−"), v("a"))), op("="), m("mfrac", n("1"), rootA()))}</Formula></div>
        <div className="rr-formula-scroll" tabIndex={0} role="group" aria-label="缺失点处的极限，可横向滚动"><Formula block label="当 x 趋向零时，h 下标 a 的 x 值的极限等于一除以二倍 a 的平方根">{m("mrow", m("munder", m("mo", "lim"), m("mrow", v("x"), op("→"), n("0"))), ha(), op("="), m("mfrac", n("1"), m("mrow", n("2"), rootA())))}</Formula></div>
        <p>反过来解“函数值等于 1/(2√a)”的方程，只会得到 x = 0。因此，没有另一个合法自变量能补上这个缺失的函数值。</p>
      </section>
      <section className="rr-evidence-step"><h4>05 · 将限制带回最终结论</h4><p>原函数的定义域为 [−a, 0) ∪ (0, +∞)，在该定义域内严格递减。两个区间分别连续，值域合起来需要保留最大值、排除零，并排除缺失点所对应的值。</p>
        <div className="rr-formula-scroll" tabIndex={0} role="group" aria-label="排除缺失值后的值域，可横向滚动"><Formula block label="值域为零到一除以 a 的平方根的左开右闭区间，去掉一除以二倍 a 的平方根这个值">{m("mrow", m("mrow", op("("), n("0"), op(","), m("mfrac", n("1"), rootA()), op("]")), op("∖"), m("mrow", op("{"), m("mfrac", n("1"), m("mrow", n("2"), rootA())), op("}")))}</Formula></div>
        <p>修正结论时应保留 a 为正数、原定义域和被排除的函数值。如果另行定义 x = 0 处的值，需明确那是延拓后的新函数。</p>
      </section>
    </>,
  },
]

type Entry = { value: string; draft: string; reviewed: boolean; editing: boolean; evidenceOpen: boolean; error: boolean; notice: string; previous: { value: string; reviewed: boolean } | null }
const initialEntries = (): Entry[] => cases.map(item => ({ value: item.initial, draft: item.initial, reviewed: false, editing: false, evidenceOpen: false, error: false, notice: "", previous: null }))

export function ReadingReview() {
  const [entries, setEntries] = useState(initialEntries)
  const [index, setIndex] = useState(0)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [mathAvailable, setMathAvailable] = useState(true)
  const [fontFallback, setFontFallback] = useState(false)
  const [fontRevision, setFontRevision] = useState(0)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const editRef = useRef<HTMLButtonElement>(null)
  const sourceRef = useRef<HTMLButtonElement>(null)
  const evidenceRef = useRef<HTMLHeadingElement>(null)
  const focusNext = useRef<"title" | "editor" | "edit" | "source" | "evidence" | null>(null)
  const entry = entries[index]
  const item = cases[index]
  const evidenceOpen = entry.evidenceOpen
  const completed = entries.filter(item => item.reviewed).length
  const changed = entry.value !== item.initial
  const patch = (update: Partial<Entry>) => setEntries(current => current.map((item, i) => i === index ? { ...item, ...update } : item))

  useEffect(() => {
    let active = true
    const refreshFonts = () => {
      if (!active) return
      let failed = false
      document.fonts.forEach(face => {
        const family = face.family.replace(/^['"]|['"]$/g, "")
        if ((family === "Prism Reading Sans SC" || family === "Prism Reading Serif SC") && face.status === "error") failed = true
      })
      setFontFallback(failed)
      setFontRevision(current => current + 1)
    }
    document.fonts.addEventListener("loadingerror", refreshFonts)
    document.fonts.addEventListener("loadingdone", refreshFonts)
    // Read existing failures as well as future events: fonts can finish before hydration.
    refreshFonts()
    document.fonts.load('400 22px "Prism Review STIX Two Math"', "x∫√∑").then(faces => {
      if (active && !faces.length) setMathAvailable(false)
    }).catch(() => { if (active) setMathAvailable(false) })
    document.fonts.ready.then(refreshFonts)
    return () => { active = false; document.fonts.removeEventListener("loadingerror", refreshFonts); document.fonts.removeEventListener("loadingdone", refreshFonts) }
  }, [])

  useLayoutEffect(() => {
    const editor = editorRef.current
    if (!editor || !entry.editing) return
    editor.style.height = "auto"
    editor.style.height = `${editor.scrollHeight + editor.offsetHeight - editor.clientHeight}px`
  }, [entry.editing, entry.draft, index, fontRevision])

  useEffect(() => {
    const refs = { title: titleRef, editor: editorRef, edit: editRef, source: sourceRef, evidence: evidenceRef }
    if (focusNext.current) refs[focusNext.current].current?.focus({ preventScroll: focusNext.current !== "title" })
    focusNext.current = null
  }, [index, entry, evidenceOpen])

  function navigate(next: number) {
    if (next === index) return
    focusNext.current = "title"
    setIndex(next)
    setHistoryOpen(false)
  }
  function openEditor() {
    focusNext.current = "editor"
    patch({ editing: true, draft: entry.value, error: false, notice: "" })
  }
  function cancelEdit() {
    focusNext.current = "edit"
    patch({ editing: false, draft: entry.value, error: false, notice: "已取消修正，当前结论保持原样。" })
  }
  function apply() {
    const value = entry.draft.trim()
    if (!value) {
      patch({ error: true })
      editorRef.current?.focus()
      return
    }
    focusNext.current = "edit"
    patch({ value, draft: value, editing: false, reviewed: true, error: false, previous: { value: entry.value, reviewed: entry.reviewed }, notice: value === entry.value ? "已确认此结论，内容未改动。" : "修正已应用。原文证据保留，本次操作可以撤回。" })
  }
  function confirm() {
    focusNext.current = "edit"
    patch({ reviewed: true, previous: { value: entry.value, reviewed: entry.reviewed }, notice: "已确认此结论，内容未改动。" })
  }
  function undo() {
    if (!entry.previous) return
    focusNext.current = "edit"
    patch({ ...entry.previous, draft: entry.previous.value, previous: null, notice: "已撤回本次操作，恢复到操作前的结论与复核状态。" })
    setHistoryOpen(false)
  }
  function toggleEvidence() {
    focusNext.current = evidenceOpen ? "source" : "evidence"
    patch({ evidenceOpen: !evidenceOpen })
  }
  function returnToConclusion() {
    const target = entry.editing ? editorRef.current : editRef.current
    target?.scrollIntoView({ block: "center", behavior: "instant" })
    target?.focus({ preventScroll: true })
  }

  return <MathFontContext.Provider value={mathAvailable}><main id="main-content" tabIndex={-1} className="rr-page">
    <div className="rr-context"><Link href="/benchmark"><ArrowLeft size={14} aria-hidden="true" />Benchmark</Link><span>交互语言候选 · 01</span><Link href="/review/typography">字体对照</Link></div>
    <header className="rr-page-heading"><div><p className="rr-eyebrow">阅读 → 证据 → 修正</p><h1>结论复核</h1><p>看清依据，再让结论前进一步。</p></div><div className="rr-progress"><span><strong>{completed}</strong> / {cases.length}</span><span>已复核</span></div></header>
    <div className="rr-workspace">
      <nav className="rr-queue" aria-label="待复核结论"><div className="rr-queue-heading"><span>本次复核</span><span>{cases.length} 条</span></div><ol>{cases.map((c, i) => {
        const state = entries[i]
        return <li key={c.id}><button type="button" aria-current={index === i ? "step" : undefined} onClick={() => navigate(i)}><span className="rr-queue-number">{c.id}</span><span className="rr-queue-copy"><span>{c.title}</span><span>{c.description}</span><span className="rr-queue-state" data-done={state.reviewed && !state.editing}>{state.editing ? <Pencil size={13} aria-hidden="true" /> : state.reviewed ? <CheckCircle2 size={13} aria-hidden="true" /> : <Circle size={12} aria-hidden="true" />}{state.editing ? "修正未应用" : state.reviewed ? "已复核" : "待复核"}</span></span>{index === i && <ArrowRight className="rr-current-arrow" size={15} aria-hidden="true" />}</button></li>
      })}</ol><p className="rr-session-note">演示数据 · 本页内保留操作<br />刷新后恢复初稿</p></nav>

      <article className="rr-object" aria-labelledby="rr-object-title">
        <header className="rr-object-heading"><div><p className="rr-eyebrow">{item.id} / 函数与表达式</p><h2 id="rr-object-title" ref={titleRef} tabIndex={-1}>{item.title}</h2><p className="rr-object-meta">{item.topic}<span aria-hidden="true">·</span>合成样例<span aria-hidden="true">·</span>2026-09-06</p></div><span className="rr-object-status" data-done={entry.reviewed && !entry.editing}>{entry.editing ? <Pencil size={15} aria-hidden="true" /> : entry.reviewed ? <CheckCircle2 size={15} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}{entry.editing ? "修正未应用" : entry.reviewed ? "已复核" : "待复核"}</span></header>

        <div className="rr-reading">
          <section className="rr-question" aria-label="原题"><div className="rr-main-formula" tabIndex={0} role="group" aria-label="原题公式，可横向滚动">{item.formula}</div><p>{item.question}</p></section>

          <section className="rr-conclusion" data-editing={entry.editing} aria-labelledby="rr-conclusion-label">
            <div className="rr-conclusion-heading"><h3 id="rr-conclusion-label">当前结论</h3>{changed && <span className="rr-authorship"><Pencil size={13} aria-hidden="true" />人工修正</span>}<span className="rr-origin"><Sparkles size={13} aria-hidden="true" />{changed ? "源自 AI 初稿" : "AI 初稿"}</span>{changed && !entry.editing && <button type="button" className="rr-history-toggle" aria-expanded={historyOpen} aria-controls="rr-original-conclusion" onClick={() => setHistoryOpen(!historyOpen)}>{historyOpen ? "收起 AI 初稿" : "对照 AI 初稿"}<ChevronDown size={14} aria-hidden="true" /></button>}</div>
            {entry.editing ? <form id="rr-conclusion-form" onSubmit={e => { e.preventDefault(); apply() }}><label className="sr-only" htmlFor="rr-conclusion-input">结论内容</label><Textarea ref={editorRef} id="rr-conclusion-input" className="rr-editor" value={entry.draft} onChange={e => patch({ draft: e.target.value, error: false })} aria-invalid={entry.error} aria-describedby="rr-status-copy" rows={1} onKeyDown={e => { if (e.key === "Escape" && !e.nativeEvent.isComposing) { e.preventDefault(); cancelEdit() } }} /></form> : <p className="rr-statement">{entry.value}</p>}
            <div className="rr-status-slot" data-state={entry.error ? "error" : entry.editing ? "editing" : entry.reviewed ? "done" : "reading"} role={entry.error ? "alert" : "status"} aria-live={entry.error ? "assertive" : "polite"}><span className="rr-status-icon">{entry.error ? <CircleAlert size={16} aria-hidden="true" /> : entry.editing ? <Pencil size={16} aria-hidden="true" /> : entry.reviewed ? <CheckCircle2 size={16} aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}</span><p id="rr-status-copy">{entry.error ? "请保留一条可阅读的结论，再应用修正。" : entry.editing ? "请保留适用范围与成立条件。切换条目会保留未应用的文字。" : entry.notice || item.hint}</p></div>
            <div className="rr-conclusion-tools">
              <div className="rr-decision-actions">{entry.editing ? <><Button key="apply" type="submit" form="rr-conclusion-form" size="sm"><Check />应用修正</Button><Button key="cancel" type="button" variant="ghost" size="sm" onClick={cancelEdit}>取消修正</Button></> : <><Button key="edit" type="button" ref={editRef} variant={entry.reviewed ? "ghost" : "outline"} size="sm" onClick={openEditor}><Pencil />修正结论</Button>{!entry.reviewed && <Button key="confirm" type="button" size="sm" onClick={confirm}><Check />确认此结论</Button>}{entry.previous && <Button key="undo" type="button" variant="ghost" size="sm" onClick={undo}><RotateCcw />撤回本次</Button>}</>}</div>
              <nav className="rr-navigation" aria-label="结论切换"><span>{index + 1} / {cases.length}</span><Button type="button" variant="ghost" size="icon-sm" aria-label="上一条结论" disabled={index === 0} onClick={() => navigate(index - 1)}><ArrowLeft /></Button><Button type="button" variant={entry.reviewed && !entry.editing ? "default" : "ghost"} size="sm" disabled={index === cases.length - 1} onClick={() => navigate(index + 1)}>下一条<ArrowRight /></Button></nav>
            </div>
            {changed && !entry.editing && <div id="rr-original-conclusion" className="rr-revision" hidden={!historyOpen}><span>AI 初稿</span><p>{item.initial}</p></div>}
          </section>

          <section className="rr-evidence" aria-label="结论依据">
            <button ref={sourceRef} type="button" className="rr-source" aria-expanded={evidenceOpen} aria-controls="rr-evidence-content" onClick={toggleEvidence}><span><FileText size={16} aria-hidden="true" /><span>{item.source}</span></span><span>{evidenceOpen ? "收起证据" : "查看证据"}<ChevronDown size={15} aria-hidden="true" /></span></button>
            <div id="rr-evidence-content" hidden={!evidenceOpen} className="rr-evidence-content" onKeyDown={e => { if (e.key === "Escape" && !e.nativeEvent.isComposing) { e.preventDefault(); toggleEvidence() } }}><div className="rr-evidence-heading"><div><p>原文证据 · {item.source}</p><h3 ref={evidenceRef} tabIndex={-1}>{item.sourceTitle}</h3></div><Button size="icon-sm" variant="ghost" aria-label="关闭证据，返回来源入口" onClick={toggleEvidence}><X /></Button></div><div className="rr-evidence-prose">{item.evidence}</div><p className="rr-evidence-note">{item.sourceNote}</p>{item.longEvidence && <div className="rr-evidence-return"><Button type="button" variant="outline" size="sm" onClick={returnToConclusion}><ArrowLeft />返回当前结论</Button></div>}</div>
          </section>
        </div>

      </article>
    </div>
    <p className="rr-bottom-note" role={fontFallback || !mathAvailable ? "status" : undefined}>{!mathAvailable ? "公式字体未能载入，暂显示文字表达；结论仍可修正，刷新后可重试。" : fontFallback ? "部分文字暂使用备用字体，内容仍可阅读、修正与复制。" : "候选观察：阅读保持秩序，操作就近展开，变化留下可追溯的关系。"}<span className="rr-session-mobile">演示数据 · 本页内保留操作，刷新后恢复初稿。</span></p>
  </main></MathFontContext.Provider>
}
