import type { Metadata } from "next"
import Link from "next/link"

import { NavLink } from "@/components/prism/nav-link"

import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "智能曜彩 UI Design System",
    template: "%s｜智能曜彩",
  },
  description: "智能曜彩 UI Design System 的 Foundations、组件目录与交互基准站点。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <a className="skip-link" href="#main-content">跳到主要内容</a>
        <header className="site-header">
          <Link href="/" className="site-brand" aria-label="智能曜彩首页">
            <span className="site-brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span><strong>智能曜彩</strong><small>UI Design System</small></span>
          </Link>
          <nav className="site-nav" aria-label="主导航">
            <NavLink href="/" exact>介绍</NavLink>
            <NavLink href="/foundations">Foundations</NavLink>
            <NavLink href="/components">组件</NavLink>
            <NavLink href="/benchmark" exact>Benchmark</NavLink>
            <NavLink href="/review/button" exact>设计评审</NavLink>
            <a href="https://github.com/Ashrum/intelligence-prism-ui" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
