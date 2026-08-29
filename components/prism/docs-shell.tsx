import { Box, Layers3 } from "lucide-react"

import { catalogStats, componentGroups, foundationItems } from "@/components/prism/catalog"
import { NavLink } from "@/components/prism/nav-link"

const documentLabels: Record<string, string> = {
  "/components/input-field": "Input / Field",
  "/components/badge-labels": "Badge & Labels",
}

function CatalogNavigation({ label }: { label: string }) {
  const linkedGroups = new Map<string, string>()

  return (
    <nav aria-label={label}>
      <div className="docs-nav-group">
        <div className="docs-nav-label">Foundations · {catalogStats.foundations}</div>
        {foundationItems.map((item) => {
          const Icon = item.icon
          return <NavLink exact className="docs-nav-link" href={item.href} key={item.slug}><Icon aria-hidden="true" />{item.label}</NavLink>
        })}
      </div>

      {componentGroups.map((group) => {
        const Icon = group.icon
        return (
          <div className="docs-nav-group" key={group.slug}>
            <div className="docs-nav-label"><Icon aria-hidden="true" />{group.label}<span>{group.items.length}</span></div>
            {group.items.map((item) => {
              if (!item.href) {
                return <span className="docs-nav-link docs-nav-link--planned" key={item.id}><span className="nav-status-dot" aria-hidden="true" /><span>{item.label}</span><small>规划</small></span>
              }

              const firstGroup = linkedGroups.get(item.href)
              if (firstGroup === group.slug) return null
              if (firstGroup) {
                return <span className="docs-nav-link docs-nav-link--related" key={item.id}><span className="nav-status-dot nav-status-dot--stable" aria-hidden="true" /><span>{item.label}</span><small>同页</small></span>
              }

              linkedGroups.set(item.href, group.slug)
              return <NavLink exact className="docs-nav-link" href={item.href} key={item.id}><span className="nav-status-dot nav-status-dot--stable" aria-hidden="true" /><span>{documentLabels[item.href] ?? item.label}</span></NavLink>
            })}
          </div>
        )
      })}
    </nav>
  )
}

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-shell">
      <aside className="docs-sidebar" aria-label="设计系统导航">
        <div className="docs-sidebar-overviews">
          <NavLink href="/foundations" exact className="docs-sidebar-title"><Layers3 aria-hidden="true" />Foundations</NavLink>
          <NavLink href="/components" exact className="docs-sidebar-title"><Box aria-hidden="true" />组件总览</NavLink>
        </div>
        <div className="docs-navigation--desktop"><CatalogNavigation label="基础规范与组件分类" /></div>
        <details className="docs-navigation-mobile"><summary>浏览完整目录</summary><CatalogNavigation label="移动端基础规范与组件分类" /></details>
        <div className="docs-sidebar-footer">
          <span className="growth-signal" aria-hidden="true" />
          Catalog v0.2 · {catalogStats.baseComponents + catalogStats.extensions} components
        </div>
      </aside>
      <main id="main-content" className="docs-content" tabIndex={-1}>{children}</main>
    </div>
  )
}
