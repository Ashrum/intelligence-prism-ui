import Link from "next/link"
import { ArrowRight, Layers3, ShieldCheck, Sparkles } from "lucide-react"

import { componentGroups } from "@/components/prism/docs-shell"

export default function Home() {
  return (
    <main className="intro-page">
      <section className="intro-hero">
        <div className="intro-copy">
          <div className="intro-kicker"><span className="growth-signal" aria-hidden="true" />智能曜彩 UI Design System · v0.1</div>
          <h1>面向教育智能产品的<br />克制型组件系统</h1>
          <p>保留 shadcn/ui 成熟、清晰的组件轮廓，通过曜蓝、智绯、生长荧的严格语义与精确微状态建立识别。</p>
          <div className="intro-actions">
            <Link href="/components" className="intro-primary-link">浏览组件 <ArrowRight aria-hidden="true" /></Link>
            <Link href="/benchmark" className="intro-secondary-link">打开 Benchmark</Link>
          </div>
        </div>
        <div className="intro-principles" aria-label="设计系统原则">
          <div className="principle-card"><Layers3 aria-hidden="true" /><div><strong>中性色主导</strong><span>颜色服从语义，不形成三色拼盘。</span></div></div>
          <div className="principle-card"><ShieldCheck aria-hidden="true" /><div><strong>无障碍基线</strong><span>焦点、键盘和状态说明从组件开始。</span></div></div>
          <div className="principle-card principle-card--ai"><Sparkles aria-hidden="true" /><div><strong>AI 可解释</strong><span>智绯只标注 AI 来源与明确行为。</span></div></div>
        </div>
      </section>

      <section className="intro-section" aria-labelledby="categories-title">
        <div className="intro-section-heading"><div><span>Components</span><h2 id="categories-title">按使用目的组织</h2></div><p>分类结构借鉴 shadcn 的文档导航方式，同时保留智能曜彩自己的组件语义。</p></div>
        <div className="category-grid">
          {componentGroups.map((group) => (
            <section className="category-card" key={group.label}>
              <h3>{group.label}</h3>
              <div className="category-links">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return <Link href={item.href} key={item.href}><Icon aria-hidden="true" /><span>{item.label}</span><ArrowRight aria-hidden="true" /></Link>
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}
