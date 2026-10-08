import Link from "next/link"
import { TreeDirectoryExploration } from "@/components/prism-next/explorations/tree-directory"

export const metadata = { title: "教材目录 · 定版探索" }
export default function TreeDirectoryExplorationPage() {
  return <div className="prism-content">
    <div className="prism-page-heading"><h1>教材目录 · 定版探索</h1><p>在窄栏里验证大纲树的阅读、默认选择与范围记忆。</p></div>
    <Link href="/next/components/tree" className="mb-4 inline-block text-ui-action underline">返回教材目录组件</Link>
    <Link href="/next/explorations/filter-area" className="mb-4 ml-4 inline-block text-ui-action underline">筛选功能区探索</Link>
    <TreeDirectoryExploration />
  </div>
}
