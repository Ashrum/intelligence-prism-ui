import Link from "next/link"
import { FilterAreaExploration } from "@/components/prism-next/explorations/filter-area"

export const metadata = { title: "筛选功能区 · 三版设计探索" }

export default function FilterAreaExplorationPage() {
  return <div className="prism-content">
    <div className="prism-page-heading"><h1>筛选功能区 · 三版设计探索</h1><p>先比较选择成本与阅读路径，再确定正式组件方向。</p></div>
    <nav aria-label="设计探索" className="mb-6 flex flex-wrap gap-4 text-ui-action"><Link href="/next" className="underline">返回组件总览</Link><Link href="/next/explorations/tree-directory" className="underline">教材目录探索</Link></nav>
    <FilterAreaExploration />
  </div>
}
