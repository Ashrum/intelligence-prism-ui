import { Box, Layers3 } from "lucide-react"

import { catalogStats, componentGroups, foundationItems } from "@/components/prism/catalog"
import { NavLink } from "@/components/prism/nav-link"

const documentLabels: Record<string, string> = {
  "/components/input-field": "Input / Field",
  "/components/badge-labels": "Badge & Labels",
  "/components/choice-controls": "多选 / 单选 / 开关",
  "/components/dialog": "Dialog / Alert Dialog",
}

function CatalogNavigation({ label, foundationsOpen }: { label: string; foundationsOpen: boolean }) {
  const linkedGroups = new Map<string, string>()

  return (
    <nav aria-label={label}>
      <details className="docs-nav-group docs-foundations" open={foundationsOpen}>
        <summary className="docs-nav-label">基础规范 · {catalogStats.foundations}</summary>
        {foundationItems.map((item) => <NavLink exact className="docs-nav-link" href={item.href} key={item.slug}>{item.label}</NavLink>)}
      </details>

      {componentGroups.map((group) => {
        const links = group.items.flatMap((item) => {
          if (!item.href) return []
          const documentHref = item.href.split("#")[0]
          const href = documentLabels[documentHref] ? documentHref : item.href
          if (linkedGroups.has(href)) return []
          linkedGroups.set(href, group.slug)
          return [{ ...item, href, label: documentLabels[href] ?? item.label }]
        })
        if (!links.length) return null
        return (
          <div className="docs-nav-group" key={group.slug}>
            <div className="docs-nav-label">{group.label}</div>
            {links.map((item) => <NavLink exact className="docs-nav-link" href={item.href} key={item.id}>{item.label}</NavLink>)}
          </div>
        )
      })}
    </nav>
  )
}

export function DocsShell({ children, section = "components" }: { children: React.ReactNode; section?: "components" | "foundations" }) {
  return (
    <div className="docs-shell">
      <aside className="docs-sidebar" aria-label="设计系统导航">
        <div className="docs-sidebar-overviews">
          <NavLink href="/foundations" exact className="docs-sidebar-title"><Layers3 aria-hidden="true" />Foundations</NavLink>
          <NavLink href="/components" exact className="docs-sidebar-title"><Box aria-hidden="true" />组件总览</NavLink>
        </div>
        <div className="docs-navigation--desktop"><CatalogNavigation label="基础规范与组件分类" foundationsOpen={section === "foundations"} /></div>
        <details className="docs-navigation-mobile"><summary>浏览规范与组件</summary><CatalogNavigation label="移动端基础规范与组件分类" foundationsOpen={section === "foundations"} /></details>
        <div className="docs-sidebar-footer">
          <NavLink href="/components">完整目录与进度 · {catalogStats.baseComponents + catalogStats.extensions} 项</NavLink>
        </div>
      </aside>
      <main id="main-content" className="docs-content" tabIndex={-1}>{children}</main>
    </div>
  )
}
