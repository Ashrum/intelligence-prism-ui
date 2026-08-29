import Link from "next/link"
import { ArrowRight, Layers3, ShieldCheck, Sparkles } from "lucide-react"

import { catalogStats, componentGroups } from "@/components/prism/catalog"

export default function Home() {
  return (
    <main id="main-content" className="intro-page" tabIndex={-1}>
      <section className="intro-hero">
        <div className="intro-copy">
          <div className="intro-kicker"><span className="growth-signal" aria-hidden="true" />智能曜彩 UI Design System · Catalog v0.2</div>
          <h1>面向教育智能产品的<br />克制型组件系统</h1>
          <p>保留 shadcn/ui 成熟、清晰的组件轮廓，通过曜蓝、智绯、生长荧的严格语义与精确微状态建立识别。</p>
          <div className="intro-actions">
            <Link href="/foundations" className="intro-primary-link">查看 Foundations <ArrowRight aria-hidden="true" /></Link>
            <Link href="/components" className="intro-secondary-link">浏览组件</Link>
            <Link href="/benchmark" className="intro-secondary-link">打开 Benchmark</Link>
          </div>
        </div>
        <section className="intro-principles" aria-label="设计系统原则">
          <div className="principle-card"><Layers3 aria-hidden="true" /><div><strong>中性色主导</strong><span>颜色服从语义，不形成三色拼盘。</span></div></div>
          <div className="principle-card"><ShieldCheck aria-hidden="true" /><div><strong>无障碍基线</strong><span>焦点、键盘和状态说明从组件开始。</span></div></div>
          <div className="principle-card principle-card--ai"><Sparkles aria-hidden="true" /><div><strong>AI 可解释</strong><span>智绯只标注 AI 来源与明确行为。</span></div></div>
        </section>
      </section>

      <section className="intro-section" aria-labelledby="categories-title">
        <div className="intro-section-heading"><div><span>System map</span><h2 id="categories-title">完整目录，成熟度透明</h2></div><p>分类结构借鉴 shadcn；已完成内容可以进入详情，规划内容只显示状态，不创建空页面。</p></div>
        <dl className="catalog-summary-strip" aria-label="设计系统目录统计">
          <div><dd>{catalogStats.foundations}</dd><dt>Foundations</dt></div>
          <div><dd>{catalogStats.baseComponents}</dd><dt>基础组件</dt></div>
          <div><dd>{catalogStats.extensions}</dd><dt>智能曜彩扩展</dt></div>
          <div><dd>{catalogStats.documentedPages}</dd><dt>已完成规范页</dt></div>
        </dl>
        <div className="category-grid">
          {componentGroups.map((group) => (
            <section className="category-card" key={group.label}>
              <group.icon aria-hidden="true" />
              <h3>{group.label}</h3>
              <p>{group.description}</p>
              <div className="category-counts"><span>{group.items.filter((item) => item.status === "stable").length} 稳定</span><span>{group.items.filter((item) => item.status === "planned").length} 规划中</span></div>
              <Link href={`/components#${group.slug}`} className="category-summary-link">查看分类 <ArrowRight aria-hidden="true" /></Link>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}
