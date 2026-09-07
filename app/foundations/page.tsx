import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { foundationItems } from "@/components/prism/catalog"
import { DesignLanguageRecord } from "./design-language"
import "./design-language.css"

export const metadata: Metadata = { title: "Foundations" }

export default function FoundationsOverview() {
  return (
    <div className="components-overview foundations-language-page">
      <header className="component-hero">
        <div className="component-eyebrow">Foundations</div>
        <h1>设计语言与基础规范</h1>
        <p>以共同的阅读、操作与反馈方式连接组件，让清晰、精致和连续性在完整任务中成立。</p>
      </header>
      <nav className="language-page-nav" aria-label="本页内容"><a href="#design-language">设计语言</a><a href="#language-typography">文字与公式</a><a href="#language-visualization">数据与关系</a><a href="#language-validation">验证进度</a><a href="#foundation-catalog">基础规范目录</a></nav>
      <DesignLanguageRecord />
      <section id="foundation-catalog" className="language-foundation-catalog" aria-labelledby="foundation-catalog-title">
      <h2 id="foundation-catalog-title">基础规范目录</h2>
      <p>十项基础规范承接 Token、视觉、布局、动效与无障碍的具体约束。</p>
      <div className="foundation-overview-grid">
        {foundationItems.map((item) => {
          const Icon = item.icon
          return <Link href={item.href} className="foundation-overview-card" key={item.slug}><Icon aria-hidden="true" /><div><strong>{item.title}</strong><small>{item.label}</small><p>{item.summary}</p></div><ArrowRight aria-hidden="true" /></Link>
        })}
      </div>
      </section>
    </div>
  )
}
