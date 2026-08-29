import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "智能曜彩组件基准",
  description: "智能曜彩 UI Design System v0.1 的六组基准组件交互审核界面。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
