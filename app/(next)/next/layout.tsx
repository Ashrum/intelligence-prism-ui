import type { Metadata } from "next"
import { Providers } from "@/components/prism-next/providers"
import { Shell } from "@/components/prism-next/shell"
import "./theme.css"

export const metadata:Metadata = {
  title:{default:"智能曜彩 · coss 组件库",template:"%s｜智能曜彩 v1"},
  description:"以 coss UI 为基础，支持浅色、暖纸与深色的智能曜彩组件库。",
  icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},
}

export default function NextRootLayout({children}:{children:React.ReactNode}) {
  return <html lang="zh-CN" data-ui-version="coss-v1" suppressHydrationWarning><body><Providers><Shell>{children}</Shell></Providers></body></html>
}
