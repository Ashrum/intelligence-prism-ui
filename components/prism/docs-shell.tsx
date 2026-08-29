import {
  ArrowLeftRight,
  BadgeCheck,
  Box,
  CreditCard,
  MousePointerClick,
  PanelTop,
  TextCursorInput,
} from "lucide-react"

import { NavLink } from "@/components/prism/nav-link"

const groups = [
  {
    label: "操作",
    items: [{ href: "/components/button", label: "Button", icon: MousePointerClick }],
  },
  {
    label: "导航与选择",
    items: [
      { href: "/components/tabs", label: "Tabs", icon: PanelTop },
      { href: "/components/segmented-control", label: "Segmented Control", icon: ArrowLeftRight },
    ],
  },
  {
    label: "数据展示",
    items: [{ href: "/components/card", label: "Card", icon: CreditCard }],
  },
  {
    label: "表单",
    items: [{ href: "/components/input-field", label: "Input / Field", icon: TextCursorInput }],
  },
  {
    label: "状态反馈",
    items: [{ href: "/components/badge-labels", label: "Badge & Labels", icon: BadgeCheck }],
  },
] as const

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-shell">
      <aside className="docs-sidebar" aria-label="组件分类导航">
        <NavLink href="/components" exact className="docs-sidebar-title">
          <Box aria-hidden="true" />
          组件总览
        </NavLink>
        <nav aria-label="组件分类">
          {groups.map((group) => (
            <div className="docs-nav-group" key={group.label}>
              <div className="docs-nav-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink exact className="docs-nav-link" href={item.href} key={item.href}>
                    <Icon aria-hidden="true" />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="docs-sidebar-footer">
          <span className="growth-signal" aria-hidden="true" />
          Phase 1 · v0.1
        </div>
      </aside>
      <main id="main-content" className="docs-content" tabIndex={-1}>{children}</main>
    </div>
  )
}

export { groups as componentGroups }
