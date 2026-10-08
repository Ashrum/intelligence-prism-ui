import { directoryDepthExamples } from "@/lib/prism-next/fixtures/directory-depth"
import { createDirectory, type DirectoryBranch, type DirectoryKind } from "@/lib/prism-next/textbook-directory"
import type { TextbookDefinition } from "@/components/prism-next/textbook-directory"
import type { TextbookSubject } from "@/components/prism-next/textbook-directory"

// Host-supplied demonstration facts only; original textbook fixtures stay intact.
export function directoryDemoBooks(depth: string, scale: "small" | "large" = "small"): { books: TextbookDefinition[]; counts: Record<string, number>; subjects: TextbookSubject[] } {
  const source = directoryDepthExamples[depth][0]
  const counts: Record<string, number> = {}
  const editions = ["人教 A 版（2019）", "人教 B 版（2019）", "北师大版"]
  const subjects: TextbookSubject[] = scale === "small" ? [{ name: "数学", editions: editions.map(title => ({ title })) }] : [
    { name: "数学", teaching: true, editions: [...editions, "苏教版", "湘教版", "沪教版", "鲁教版", "冀教版", "华师大版", "浙教版", "粤教版", "北京版"].map((title, index) => ({ title, recent: index < 2 })) },
    { name: "物理", teaching: true, editions: [{ title: "教科版", recent: true }, { title: "人教版" }, { title: "沪科版" }] },
    { name: "语文", editions: [{ title: "统编版" }, { title: "苏教版" }] },
    { name: "英语", editions: [{ title: "外研版", recent: true }, { title: "人教版" }] },
  ]
  const books = subjects.flatMap((subject, subjectIndex) => subject.editions.flatMap(({ title: edition }, editionIndex) => Array.from({ length: scale === "small" ? 2 : 4 + editionIndex % 5 }, (_, i) => i + 1).map(bookNumber => {
    const id = scale === "small" ? `explore-${depth}-${editionIndex * 2 + bookNumber}` : `explore-large-${depth}-${subjectIndex}-${editionIndex}-${bookNumber}`
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
      if (editionIndex === 0) counts[data.rootId] = bookNumber === 1 ? 328 : 0
      return [kind, data]
    })) as TextbookDefinition["directories"]
    const volume = bookNumber <= 2 ? `必修第${bookNumber === 1 ? "一" : "二"}册` : `选择性必修第${["一", "二", "三", "四", "五", "六"][bookNumber - 3]}册`
    return { id, volumeDescription: scale === "large" ? `高${bookNumber < 3 ? "一" : bookNumber < 6 ? "二" : "三"} · ${bookNumber % 2 ? "上" : "下"}学期` : undefined, title: `高中${subject.name} · ${volume}`, volume, subject: subject.name, edition, directories }
  })))
  return { books, counts, subjects }
}
