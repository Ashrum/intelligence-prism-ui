import type { ReactNode } from "react"
import guide from "@/lib/prism-next/blueprint-guide.json"

type Inline = { type: string; value?: string; children?: Inline[]; href?: string; external?: boolean; download?: boolean; alt?: string }
export type Block = { type: string; children?: Inline[]; level?: number; id?: string; value?: string; ordered?: boolean; start?: number; items?: Inline[][]; headers?: Inline[][]; rows?: Inline[][][] }

function InlineContent({ nodes }: { nodes: Inline[] }): ReactNode {
  return nodes.map((node, index) => {
    if (node.type === "code") return <code key={index} className="break-words font-mono">{node.value}</code>
    if (node.type === "strong") return <strong key={index} className="font-semibold"><InlineContent nodes={node.children ?? []}/></strong>
    if (node.type === "link") return <a key={index} href={node.href} className="prism-link break-words" target={node.external ? "_blank" : undefined} rel={node.external ? "noopener noreferrer" : undefined} download={node.download || undefined}><InlineContent nodes={node.children ?? []}/></a>
    if (node.type === "image") return <a key={index} href={node.href} className="prism-link"><img src={node.href} alt={node.alt ?? ""} loading="lazy" className="my-4 h-auto max-w-full"/></a>
    return <span key={index}>{node.value}</span>
  })
}

export function GuideBlock({ block, index }: { block: Block; index: number }) {
  const content = <InlineContent nodes={block.children ?? []}/>
  if (block.type === "heading") {
    const Tag = `h${Math.min(6, Math.max(2, block.level ?? 2))}` as "h2" | "h3" | "h4" | "h5" | "h6"
    return <Tag id={block.id} className={`scroll-mt-24 ${block.level === 2 ? "text-block-title mt-12 border-t pt-7" : "text-item-title mt-8"}`}>{content}</Tag>
  }
  if (block.type === "table") return <div className="my-5 max-w-full overflow-x-auto" role="region" aria-label={`规范表格 ${index + 1}`} tabIndex={0}>
    <table className="w-full min-w-128 border-collapse text-ui-body">
      <thead><tr>{block.headers?.map((cell, cellIndex) => <th key={cellIndex} scope="col" className="border-b p-3 text-left align-top font-semibold"><InlineContent nodes={cell}/></th>)}</tr></thead>
      <tbody>{block.rows?.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b p-3 align-top break-words"><InlineContent nodes={cell}/></td>)}</tr>)}</tbody>
    </table>
  </div>
  if (block.type === "list") {
    const items = block.items?.map((item, itemIndex) => <li key={itemIndex}><InlineContent nodes={item}/></li>)
    return block.ordered ? <ol start={block.start} className="my-5 list-decimal space-y-3 pl-6">{items}</ol> : <ul className="my-5 list-disc space-y-3 pl-6">{items}</ul>
  }
  if (block.type === "code") return <pre className="my-5 max-w-full overflow-x-auto border p-4 text-ui-body"><code>{block.value}</code></pre>
  if (block.type === "quote") return <blockquote className="my-5 border-l-2 pl-5">{content}</blockquote>
  if (block.type === "rule") return <hr className="my-8"/>
  return <p className="my-5 whitespace-pre-line break-words">{content}</p>
}

export function BlueprintGuide({ showBlueprintDemo = true }: { showBlueprintDemo?: boolean }) {
  return <div className="prism-content min-w-0" data-blueprint-guide-source={guide.sourceSha256}>
    <header className="prism-page-heading"><p>FOUNDATIONS / BLUEPRINT / GUIDE</p><h1>{guide.title}</h1><p className="text-ui-hint text-muted-foreground">来源提炼、主题规范、接入历史与验收边界。</p></header>
    <nav aria-label="蓝图规范相关页面" className="mb-6 flex flex-wrap gap-x-6 gap-y-3 text-ui-action">
      <a className="prism-link" href="/next/foundations">基础规范</a>
      {showBlueprintDemo && <a className="prism-link" href="/next/foundations/blueprint">蓝图组件示例</a>}
      <a className="prism-link" href="/next/experiments/blueprint">轻量页面实验</a>
      <a className="prism-link" href={guide.sourceDownload} download>下载 Markdown 原文</a>
    </nav>
    <p className="mb-7 text-ui-hint text-muted-foreground">本文记录第四主题的规范与验证历史；各项结论以其日期、基线和已验范围为准。第四主题仍为隔离实验候选，轻量页面实验按独立约定运行。</p>
    <details className="mb-8 border-y py-4" open><summary className="cursor-pointer text-ui-action">文档目录</summary><nav aria-label="蓝图规范目录" className="mt-4 grid gap-3 text-ui-hint sm:grid-cols-2">{guide.headings.filter(heading => heading.level === 2).map(heading => <a className="prism-link" key={heading.id} href={`#${heading.id}`}>{heading.text}</a>)}</nav></details>
    <article aria-label={guide.title} className="max-w-5xl min-w-0 text-read-body">{(guide.blocks as Block[]).map((block, index) => <GuideBlock key={index} block={block} index={index}/>)}</article>
    <footer className="mt-10 border-t pt-5 text-ui-meta text-muted-foreground"><p>正文与直接引用的证据由仓库 Markdown 同步。日志和脚本仅作为文本证据提供。</p><p className="mt-2 break-all font-mono">来源 SHA-256：{guide.sourceSha256}</p></footer>
  </div>
}
