import Link from "next/link"
import { TreeDirectoryExploration } from "@/components/prism-next/explorations/tree-directory"

export const metadata = { title: "教材目录 · 三版设计探索" }
export default function TreeDirectoryExplorationPage() {
  return <div className="prism-content">
    <div className="prism-page-heading"><h1>教材目录 · 三版设计探索</h1><p>在窄栏里比较五级目录的阅读、定位与选择。</p></div>
    <Link href="/next/components/tree" className="mb-4 inline-block text-ui-action underline">返回教材目录组件</Link>
    <Link href="/next/explorations/filter-area" className="mb-4 ml-4 inline-block text-ui-action underline">筛选功能区探索</Link>
    <TreeDirectoryExploration />
  </div>
}
