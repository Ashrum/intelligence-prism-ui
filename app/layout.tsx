import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: "智能曜彩 UI Design System",
  description: "智能曜彩 UI Design System v0.1 的组件文档与交互基准站点。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <Link href="/" className="site-brand" aria-label="智能曜彩首页">
            <span className="site-brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span><strong>智能曜彩</strong><small>UI Design System</small></span>
          </Link>
          <nav className="site-nav" aria-label="主导航">
            <Link href="/">介绍</Link>
            <Link href="/components">组件</Link>
            <Link href="/benchmark">Benchmark</Link>
            <a href="https://github.com/Ashrum/intelligence-prism-ui" target="_blank" rel="noreferrer">GitHub</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
