"use client"

import { Minus, Plus } from "lucide-react"
import { AgentWell } from "./agent-visual-parts"

export type AgentTextComparison = { before: string; after: string; beforeLabel?: string; afterLabel?: string }
type Segment = { kind: "equal" | "removed" | "added"; text: string }

/** Unicode code-point LCS. Bounded work; no parsing, semantic inference, normalization or data loss. */
export function agentTextDiff(before: string, after: string): Segment[] | null {
  const a = Array.from(before), b = Array.from(after)
  if (a.length > 4000 || b.length > 4000) return null
  let prefix = 0, suffix = 0
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++
  while (suffix < a.length - prefix && suffix < b.length - prefix && a[a.length - suffix - 1] === b[b.length - suffix - 1]) suffix++
  const x = a.slice(prefix, a.length - suffix), y = b.slice(prefix, b.length - suffix)
  if (x.length * y.length > 160000) return null
  const widths = y.length + 1, matrix = new Uint16Array((x.length + 1) * widths)
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--)
    matrix[i * widths + j] = x[i] === y[j] ? 1 + matrix[(i + 1) * widths + j + 1] : Math.max(matrix[(i + 1) * widths + j], matrix[i * widths + j + 1])
  // Very weak alignment is more readable as complete parallel originals.
  if (Math.min(a.length, b.length) > 20 && (prefix + suffix + matrix[0]) / Math.min(a.length, b.length) < 0.2) return null
  const segments: Segment[] = []
  const append = (kind: Segment["kind"], text: string) => {
    if (!text) return
    const last = segments.at(-1)
    if (last?.kind === kind) last.text += text
    else segments.push({ kind, text })
  }
  append("equal", a.slice(0, prefix).join(""))
  let i = 0, j = 0
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) { append("equal", x[i]); i++; j++ }
    else if (i < x.length && (j === y.length || matrix[(i + 1) * widths + j] >= matrix[i * widths + j + 1])) { append("removed", x[i]); i++ }
    else { append("added", y[j]); j++ }
  }
  append("equal", a.slice(a.length - suffix).join(""))
  return segments
}

export function AgentTextDiff({ before, after, beforeLabel = "原稿", afterLabel = "当前草稿" }: AgentTextComparison) {
  const segments = agentTextDiff(before, after)
  return <div className="min-w-0 space-y-2.5" data-agent-text-diff={segments ? "merged" : "parallel"}>
    {segments ? <>
      <AgentWell><p className="whitespace-pre-wrap break-words text-read-body">{segments.map((segment, index) => segment.kind === "removed"
        ? <del key={index} className="bg-destructive/10 text-destructive-foreground" aria-label={`${beforeLabel}删除：${segment.text}`}>{segment.text}</del>
        : segment.kind === "added" ? <ins key={index} className="bg-success/10 text-success-foreground" aria-label={`${afterLabel}新增：${segment.text}`}>{segment.text}</ins>
          : <span key={index}>{segment.text}</span>)}</p></AgentWell>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-ui-meta text-muted-foreground" aria-label="差异图例">
        <span className="inline-flex items-center gap-1"><Minus aria-hidden="true" className="size-3.5" />删除 · {beforeLabel}</span>
        <span className="inline-flex items-center gap-1"><Plus aria-hidden="true" className="size-3.5" />新增 · {afterLabel}</span>
      </div>
    </> : <>
      <p className="text-ui-meta text-muted-foreground">文本较长或难以可靠对齐，保留完整并排对照。</p>
      <dl className="grid min-w-0 gap-2.5 @min-[560px]:grid-cols-2">{[[beforeLabel, before], [afterLabel, after]].map(([label, text], index) => <AgentWell key={index}>
        <dt className="text-ui-action">{label}</dt><dd className="whitespace-pre-wrap break-words text-read-body">{text}</dd>
      </AgentWell>)}</dl>
    </>}
  </div>
}
