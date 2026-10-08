import Link from "next/link"
import { FilterAreaExploration } from "@/components/prism-next/explorations/filter-area"

export const metadata = { title: "筛选功能区 · 定版探索" }

export default function FilterAreaExplorationPage() {
  return <div className="prism-content">
    <div className="prism-page-heading"><h1>筛选功能区 · 定版探索</h1><p>常用条件直接选择，其余条件通过全部筛选访问。</p></div>
    <nav aria-label="设计探索" className="mb-6 flex flex-wrap gap-4 text-ui-action"><Link href="/next" className="underline">返回组件总览</Link><Link href="/next/explorations/tree-directory" className="underline">教材目录探索</Link></nav>
    <FilterAreaExploration />
  </div>
}
