import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { foundationItems } from "@/components/prism/catalog"

export const metadata: Metadata = { title: "Foundations" }

export default function FoundationsOverview() {
  return (
    <div className="components-overview">
      <header className="component-hero">
        <div className="component-eyebrow">Foundations</div>
        <h1>基础规范</h1>
        <p>十项基础规范共同约束 Token、视觉、布局、动效和无障碍。组件只能在这些边界内形成差异。</p>
      </header>
      <div className="foundation-overview-grid">
        {foundationItems.map((item) => {
          const Icon = item.icon
          return <Link href={item.href} className="foundation-overview-card" key={item.slug}><Icon aria-hidden="true" /><div><strong>{item.title}</strong><small>{item.label}</small><p>{item.summary}</p></div><ArrowRight aria-hidden="true" /></Link>
        })}
      </div>
    </div>
  )
}
