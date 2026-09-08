import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { catalogMaturityNote, catalogStats, catalogSummary, componentGroups, internalModules, statusLabels } from "@/components/prism/catalog"

export const metadata: Metadata = { title: "组件总览" }

export default function ComponentsOverview() {
  return (
    <div className="components-overview">
      <header className="component-hero">
        <div className="component-eyebrow">Components</div>
        <h1>组件总览</h1>
        <p>完整目录覆盖基础组件与智能曜彩扩展。稳定与待评审项目可以查看已有规范和示例；规划项目只声明位置与进度。</p>
      </header>
      <dl className="catalog-summary-strip catalog-summary-strip--docs" aria-label="组件目录统计">
        {catalogSummary.map((item) => <div key={item.label}><dd>{item.value}</dd><dt>{item.label}</dt></div>)}
      </dl>
      <p className="catalog-integrity-note">{catalogMaturityNote}</p>
      <p className="catalog-integrity-note">当前 {catalogStats.stable + catalogStats.review} 个条目已有示例，映射到 {catalogStats.documentedPages} 组规范页；共享页面用于表达紧密关联的组件语义。</p>
      <p className="catalog-integrity-note catalog-integrity-note--secondary">另有 {internalModules.length} 个内部支持模块并入相应规范，不单独建立顶层组件页：{internalModules.join("、")}。</p>
      <p className="catalog-integrity-note">Select 与 Dialog／Alert Dialog 已有待评审示例，下一组推进 Checkbox、Radio Group 与 Switch；现有扩展组件以完善验证为主。</p>
      <div className="overview-groups">
        {componentGroups.map((group) => (
          <section className="overview-group" id={group.slug} key={group.label}>
            <div className="overview-group-heading"><group.icon aria-hidden="true" /><div><h2>{group.label}</h2><p>{group.description}</p></div><span>{group.items.length}</span></div>
            <div className="catalog-items">
              {group.items.map((item) => {
                if (item.href) {
                  return <Link href={item.href} className={`catalog-item catalog-item--${item.status}`} key={item.id}><span><strong>{item.label}</strong>{item.kind === "extension" && <small>智能曜彩扩展</small>}</span><em>{statusLabels[item.status]}</em><ArrowRight aria-hidden="true" /></Link>
                }
                return <div className="catalog-item catalog-item--planned" key={item.id}><span><strong>{item.label}</strong></span><em>{statusLabels[item.status]}</em></div>
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
