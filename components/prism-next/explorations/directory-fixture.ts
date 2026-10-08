import { directoryDepthExamples } from "@/lib/prism-next/fixtures/directory-depth"
import { createDirectory, type DirectoryBranch, type DirectoryKind } from "@/lib/prism-next/textbook-directory"
import type { TextbookDefinition } from "@/components/prism-next/textbook-directory"

// Host-supplied demonstration facts only; original textbook fixtures stay intact.
export function explorationBooks(depth: string): { books: TextbookDefinition[]; counts: Record<string, number> } {
  const source = directoryDepthExamples[depth][0]
  const counts: Record<string, number> = {}
  const editions = ["人教 A 版（2019）", "人教 B 版（2019）", "北师大版"]
  const books = editions.flatMap((edition, editionIndex) => [1, 2].map(bookNumber => {
    const id = `explore-${depth}-${editionIndex * 2 + bookNumber}`
    const directories = Object.fromEntries((["course", "knowledge"] as DirectoryKind[]).map(kind => {
      const original = source.directories[kind]
      function copy(nodeId: string, chapter: number): DirectoryBranch {
        const node = original.nodes[nodeId]
        const level = original.paths[nodeId].length
        return {
          id: `${chapter}-${nodeId}`, code: level === 1 ? `第 ${chapter} 章` : undefined,
          title: node.children.length ? node.title : nodeId.endsWith("0")
            ? "从图像与代数表达式理解函数性质及其在真实情境中的综合应用（含 f(x) = x² + 2x + 1）"
            : `${node.title}：f(x) = (x² − 1) / (x − 1)，x ≠ 1`,
          children: node.children.map(child => copy(child, chapter)),
        }
      }
      const roots = original.nodes[original.rootId].children
      const branches = Array.from({ length: 8 }, (_, index) => copy(roots[index % roots.length], index + 1))
      const data = createDirectory(`${id}:${kind}`, branches)
      Object.keys(data.nodes).filter(nodeId => nodeId !== data.rootId).forEach((nodeId, index) => {
        // Deliberately include missing counts and numeric zero; never invent totals in the view.
        if (index % 4 !== 1) counts[nodeId] = [0, 0, 24, 136][index % 4]
      })
      return [kind, data]
    })) as TextbookDefinition["directories"]
    return { id, title: `高中数学 · 必修第${bookNumber === 1 ? "一" : "二"}册`, volume: `必修第${bookNumber === 1 ? "一" : "二"}册`, subject: "数学", edition, directories }
  }))
  return { books, counts }
}
