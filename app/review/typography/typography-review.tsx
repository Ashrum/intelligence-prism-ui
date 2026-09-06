"use client"

import { createElement as h, useEffect, useState, type CSSProperties, type ReactNode } from "react"
import Link from "next/link"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

const fonts = [
  { id: "noto-sans", name: "Noto Sans CJK SC · 黑体", family: "Prism Review Noto Sans SC", kind: "黑体" },
  { id: "plex", name: "IBM Plex Sans SC", family: "Prism Review Plex Sans SC", kind: "黑体" },
  { id: "noto-serif", name: "Noto Serif CJK SC · 宋体", family: "Prism Review Noto Serif SC", kind: "宋体" },
] as const
type FontId = typeof fonts[number]["id"]
type LoadState = "loading" | "ready" | "failed"
const mathFonts = [
  { id: "stix", name: "STIX Two Math", family: "Prism Review STIX Two Math" },
  { id: "newcm", name: "New Computer Modern Math", family: "Prism Review NewCM Math" },
] as const

const m = (tag: string, ...children: ReactNode[]) => h(tag, null, ...children)
const n = (value: string) => m("mn", value)
const v = (value: string) => m("mi", value)
const op = (value: string) => m("mo", value)
const sub = (value: string, index: string) => m("msub", v(value), n(index))
const sq = (value: string) => m("msup", v(value), n("2"))
function MathText({ children, block = false, label }: { children: ReactNode; block?: boolean; label: string }) {
  return h("math", { xmlns: "http://www.w3.org/1998/Math/MathML", display: block ? "block" : "inline", "aria-label": label }, children)
}
const functionFormula = <MathText label="f(x) 等于 x 的平方减 2x 加 3">{m("mrow", v("f"), op("("), v("x"), op(")"), op("="), sq("x"), op("−"), n("2"), v("x"), op("+"), n("3"))}</MathText>
const interval = <MathText label="区间，一到正无穷">{m("mrow", op("("), n("1"), op(","), op("+"), op("∞"), op(")"))}</MathText>

function Derivation() {
  const fx = (index: string) => m("mrow", v("f"), op("("), sub("x", index), op(")"))
  return <MathText block label="函数值之差等于 x2 减 x1 乘以 x2 加 x1 减 2，大于 0">{h("mtable", { columnalign: "right left", columnspacing: "0.3em" },
    m("mtr", m("mtd", fx("2"), op("−"), fx("1")), m("mtd", op("="), m("msup", sub("x", "2"), n("2")), op("−"), m("msup", sub("x", "1"), n("2")), op("−"), n("2"), op("("), sub("x", "2"), op("−"), sub("x", "1"), op(")"))),
    m("mtr", m("mtd"), m("mtd", op("="), op("("), sub("x", "2"), op("−"), sub("x", "1"), op(")"), op("("), sub("x", "2"), op("+"), sub("x", "1"), op("−"), n("2"), op(")"))),
    m("mtr", m("mtd"), m("mtd", op(">"), n("0"))))}</MathText>
}

function ReadingSample({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return <>
    <div className="prism-font-taskbar"><span>九年级数学</span><span>函数 · 例 03</span></div>
    <h3 className="prism-font-sample-title">从函数关系，看清变化的方向</h3>
    <p>已知函数 {functionFormula}。请判断它在区间 {interval} 上的单调性，并说明判断依据。</p>
    <p>观察图像可以帮助我们形成猜想，证明则需要回到函数关系本身。任取区间内的两个自变量，比较它们对应的函数值；保留条件，才能准确说明结论的适用范围。</p>
    <div className="prism-font-evidence"><span>条件</span><MathText label="1 小于 x1 小于 x2">{m("mrow", n("1"), op("<"), sub("x", "1"), op("<"), sub("x", "2"))}</MathText></div>
    <div className="prism-font-read-action"><Button variant="ghost" onClick={onToggle} aria-expanded={expanded}>{expanded ? "收起推导" : "展开推导"}{expanded ? <ChevronUp /> : <ChevronDown />}</Button></div>
    {expanded && <div className="prism-font-proof"><div className="prism-font-proof-label">证明</div><Derivation /><p>两个因式均为正，因此函数值之差大于零。函数在 {interval} 上严格递增。</p></div>}
    <div className="prism-font-result"><Check size={16} aria-hidden="true" /><span>结论已核验</span><span>来源：本例推导</span></div>
    <div className="prism-font-fineprint">对照文字：知识、范围、时间、辨析、复核；“条件成立”与「引用内容」。数字：1,280 · 2026年9月6日 · 86.4%。</div>
  </>
}

function InterfaceSample() {
  return <div className="prism-font-interface">
    <div className="prism-font-taskbar"><span>学习记录</span><span>近 7 天</span></div>
    <h3 className="prism-font-sample-title">函数与图像 · 复核清单</h3>
    <table><caption>相同列宽下的数字与中文扫读</caption><thead><tr><th>知识点</th><th>掌握率</th><th>状态</th></tr></thead><tbody>
      <tr><td>函数的单调性</td><td>86.4%</td><td><Check size={14} aria-hidden="true" />已复核</td></tr>
      <tr><td>二次函数的最值</td><td>72.0%</td><td>待复核</td></tr>
      <tr><td>定义域与值域</td><td>9.8%</td><td>待补充</td></tr>
    </tbody></table>
    <p className="prism-font-character-line">数字辨识：0 O · 1 I l · − – — · × x · μ m · ∑ Σ</p>
  </div>
}

function MathSample() {
  return <>
    <p>当 <MathText label="a 不等于 0">{m("mrow", v("a"), op("≠"), n("0"))}</MathText> 且 <MathText label="判别式大于等于 0">{m("mrow", v("Δ"), op("="), sq("b"), op("−"), n("4"), v("a"), v("c"), op("≥"), n("0"))}</MathText> 时，一元二次方程有实数根：</p>
    <MathText block label="x 等于负 b 加减根号下 b 方减 4ac，再除以 2a">{m("mrow", v("x"), op("="), m("mfrac", m("mrow", op("−"), v("b"), op("±"), m("msqrt", sq("b"), op("−"), n("4"), v("a"), v("c"))), m("mrow", n("2"), v("a"))))}</MathText>
    <p>分式、根号和上下标需要足够的辨识空间。下面同时观察伸展符号与积分上下限：</p>
    <MathText block label="从 0 到 1 对 x 的平方积分，结果为三分之一">{m("mrow", m("msubsup", op("∫"), n("0"), n("1")), sq("x"), h("mspace", { width: ".1667em" }), h("mi", { mathvariant: "normal" }, "d"), v("x"), op("="), m("mfrac", n("1"), n("3")))}</MathText>
    <p className="prism-font-character-line">量与单位：−1.25 × 10³ m·s⁻²；ΔT = 5 K。<br />姓名字形抽查：龘、𠮷、喆、镕、珺。</p>
  </>
}

function FontSelect({ id, value, onChange }: { id: string; value: FontId; onChange: (v: FontId) => void }) {
  return <NativeSelect id={id} value={value} onChange={e => onChange(e.target.value as FontId)}>{fonts.map(f => <NativeSelectOption key={f.id} value={f.id}>{f.name}</NativeSelectOption>)}</NativeSelect>
}

export function TypographyReview() {
  const [left, setLeft] = useState<FontId>("noto-sans")
  const [right, setRight] = useState<FontId>("noto-serif")
  const [size, setSize] = useState("18")
  const [expanded, setExpanded] = useState(true)
  const [load, setLoad] = useState<Record<string, LoadState>>({})
  useEffect(() => {
    let active = true
    for (const font of [...fonts, ...mathFonts]) {
      const text = font.id === "stix" || font.id === "newcm" ? "x∫√∑" : "智能曜彩函数关系"
      document.fonts.load(`400 18px "${font.family}"`, text).then(faces => {
        if (active) setLoad(prev => ({ ...prev, [font.id]: faces.length ? "ready" : "failed" }))
      }).catch(() => { if (active) setLoad(prev => ({ ...prev, [font.id]: "failed" })) })
    }
    return () => { active = false }
  }, [])
  const status = (id: string) => load[id] === "ready" ? "字体已载入" : load[id] === "failed" ? "字体未载入，暂不能据此判断" : "正在载入字体…"
  return <main id="main-content" className="prism-font-review" lang="zh-CN" style={{ "--prism-font-reading-size": `${Number(size) / 16}rem` } as CSSProperties}>
    <Link className="prism-font-back" href="/foundations/typography">字体与排版</Link>
    <header className="prism-font-heading"><div><h1>中文与数学字体对照</h1><p>用同一份中文内容与公式，比较字形、阅读节奏和信息密度。</p></div><span className="prism-font-draft">对照评审 · 尚未替换正式字体</span></header>
    <section aria-labelledby="prism-font-chinese-title">
      <div className="prism-font-section-head"><div><h2 id="prism-font-chinese-title">01 中文与界面</h2><p>两侧保持相同字号、行高与列宽，公式统一使用 STIX Two Math。</p></div><label className="prism-font-size" htmlFor="reading-size">阅读字号<NativeSelect id="reading-size" value={size} onChange={e => setSize(e.target.value)}><NativeSelectOption value="16">16 px</NativeSelectOption><NativeSelectOption value="18">18 px</NativeSelectOption><NativeSelectOption value="20">20 px</NativeSelectOption></NativeSelect></label></div>
      <div className="prism-font-comparison">{[{ id: "left-font", value: left, change: setLeft, label: "左侧字体" }, { id: "right-font", value: right, change: setRight, label: "右侧字体" }].map(side => <section className="prism-font-pane" key={side.id} aria-label={side.label}>
        <div className="prism-font-pane-head"><label htmlFor={side.id}>{side.label}</label><FontSelect id={side.id} value={side.value} onChange={side.change} /><span className="prism-font-load" role="status" data-ready={load[side.value] === "ready"}>{status(side.value)}</span></div>
        <div className="prism-font-specimen" data-font={side.value} data-math="stix"><ReadingSample expanded={expanded} onToggle={() => setExpanded(v => !v)} /><InterfaceSample /></div>
      </section>)}</div>
    </section>
    <section className="prism-font-math-section" aria-labelledby="prism-font-math-title">
      <div className="prism-font-section-head"><div><h2 id="prism-font-math-title">02 数学字体</h2><p>中文统一使用 Noto Sans CJK SC，比较数学字形的黑度、大小、基线与结构。</p></div></div>
      <div className="prism-font-comparison">{mathFonts.map(font => <section className="prism-font-pane" key={font.id} aria-label={font.name}><div className="prism-font-pane-head"><h3>{font.name}</h3><span className="prism-font-load" role="status" data-ready={load[font.id] === "ready"}>{status(font.id)}</span></div><div className="prism-font-specimen" data-font="noto-sans" data-math={font.id}><MathSample /></div></section>)}</div>
    </section>
    <details className="prism-font-standards"><summary>选型依据与本页边界</summary><div>
      <p>候选来自 Noto、IBM Plex、STIX 与 New Computer Modern 的正式字体项目。中文采用简体区域字形；数学采用含 MATH 排版数据的完整字体。W3C 介绍宋体、楷体、黑体、仿宋四种主要类别，并不限定可选字库的数量。本轮先比较黑体与宋体。</p>
      <p>正式选型仍需按适用的 <a href="https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=A1931A578FE14957104988029B0833D3">GB 18030-2022</a> 核验字符覆盖；标点与数字体例参考 GB/T 15834、GB/T 15835；数学与单位按适用的量和单位规范处理。<a href="https://www.w3.org/TR/clreq/">W3C 中文排版需求（草案）</a>与<a href="https://www.w3.org/TR/WCAG22/">WCAG 2.2</a>提供排版及无障碍参考。相关标准不指定字体品牌，本页不代表产品已通过标准符合性检查。</p>
      <p>本页中文字体仅打包对照样本所需字形，数学字体保留完整文件。样本子集与原字库的对应字形轮廓、宽度一致；缺字仍由后备字体补足。例如 IBM Plex 的减号采用 Noto，上标负号采用 STIX，不应将这些字形归因于 IBM Plex。</p>
      <p>面向儿童青少年的纸质教材、教辅与试卷输出，还须按适用的 <a href="https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=3F367939DB5EBBCE6FEF657173DB7618">GB 40070-2021</a> 检查印刷字体、字号与行空；纸质要求不直接换算成网页像素。课堂大屏另核对教学多媒体的显示要求。</p>
      <p>PingFang SC、Microsoft YaHei 保留为相应平台的回退候选；本页不把未安装的系统字体冒充为已对照字体。生僻字抽查不能替代全字集检测。这里的数学排版用于字体观察，尚未决定正式产品的公式渲染方案。</p>
      <p>观察要点：长段落是否容易追行；14 px 的界面标签是否清楚；数字是否便于纵向比较；公式是否显得过轻或过大；换行是否破坏条件与结论的关系。缩放浏览器时也应保留完整内容。</p>
    </div></details>
  </main>
}
