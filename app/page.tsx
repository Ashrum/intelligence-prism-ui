import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { catalogMaturityNote, catalogStats, catalogSummary, componentGroups, formatCatalogCounts } from "@/components/prism/catalog"
import { HomeControlPreview } from "@/components/prism/control-examples"

export default function Home() {
  return (
    <main id="main-content" className="intro-page" tabIndex={-1}>
      <section className="intro-hero">
        <div className="intro-copy">
          <div className="intro-kicker">智能曜彩 UI Design System · Catalog v0.2</div>
          <h1>教育智能产品的<br />组件与交互规范</h1>
          <p>查看可操作的组件示例，以及配色、中文排版和状态反馈的使用规则。</p>
          <dl className="intro-color-roles" aria-label="三种品牌源色的语义">
            <div><dt><i className="intro-swatch--knowledge" aria-hidden="true" />曜蓝</dt><dd>主要操作</dd></div>
            <div><dt><i className="intro-swatch--ai" aria-hidden="true" />智绯</dt><dd>AI 来源与明确行为</dd></div>
            <div><dt><i className="intro-swatch--growth" aria-hidden="true" />生长荧</dt><dd>成长与达成 · 场景待验证</dd></div>
          </dl>
          <div className="intro-actions">
            <Link href="/components" className="intro-primary-link">浏览组件 <ArrowRight aria-hidden="true" /></Link>
            <Link href="/foundations" className="intro-secondary-link">查看 Foundations</Link>
            <Link href="/benchmark" className="intro-secondary-link">打开 Benchmark</Link>
          </div>
        </div>
        <HomeControlPreview />
      </section>

      <section className="intro-section" aria-labelledby="categories-title">
        <div className="intro-section-heading"><div><span>System map</span><h2 id="categories-title">完整目录，成熟度透明</h2></div><p>{catalogStats.foundations} 项基础规范、{catalogStats.documentedPages} 组组件示例页。AI 对话、复杂浮层等能力仍按目录标明进度。</p></div>
        <dl className="catalog-summary-strip" aria-label="设计系统目录统计">
          {catalogSummary.map((item) => <div key={item.label}><dd>{item.value}</dd><dt>{item.label}</dt></div>)}
        </dl>
        <p className="catalog-integrity-note">{catalogMaturityNote}</p>
        <div className="category-grid">
          {componentGroups.map((group) => (
            <section className="category-card" key={group.label}>
              <group.icon aria-hidden="true" />
              <h3>{group.label}</h3>
              <p>{group.description}</p>
              <div className="category-counts">{formatCatalogCounts(group.items)}</div>
              <Link href={`/components#${group.slug}`} className="category-summary-link">查看分类 <ArrowRight aria-hidden="true" /></Link>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}
