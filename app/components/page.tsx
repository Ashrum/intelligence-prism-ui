import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { componentGroups } from "@/components/prism/docs-shell"

export const metadata: Metadata = { title: "组件总览" }

export default function ComponentsOverview() {
  return (
    <div className="components-overview">
      <header className="component-hero">
        <div className="component-eyebrow">Components</div>
        <h1>组件总览</h1>
        <p>六组 Phase 1 基准组件，按真实使用目的分类，而不是按视觉形状堆叠。</p>
      </header>
      <div className="overview-groups">
        {componentGroups.map((group) => (
          <section className="overview-group" key={group.label}>
            <h2>{group.label}</h2>
            <div className="overview-links">
              {group.items.map((item) => {
                const Icon = item.icon
                return <Link href={item.href} key={item.href}><Icon aria-hidden="true" /><span><strong>{item.label}</strong><small>查看 Preview、Usage 与 Accessibility</small></span><ArrowRight aria-hidden="true" /></Link>
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
