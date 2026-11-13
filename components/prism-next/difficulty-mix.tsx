import { Fragment } from "react"
import { cn } from "@/lib/utils"
import "./difficulty-mix.css"

export const difficultySwatches = {
  basic: "color-mix(in srgb, var(--brand-green) 75%, var(--brand-green-text))",
  consolidate: "var(--brand-blue)",
  advance: "var(--brand-blue-text)",
} as const

export type DifficultyMixProps = { basic: number; consolidate: number; advance: number; className?: string }

export function DifficultyMix({ basic, consolidate, advance, className }: DifficultyMixProps) {
  if (basic === 0 && consolidate === 0 && advance === 0) return <span className={cn("difficulty-mix-unknown text-ui-meta", className)}>难度未标注</span>
  const parts = [
    { key: "basic", label: "基础", count: basic },
    { key: "consolidate", label: "巩固", count: consolidate },
    { key: "advance", label: "提升", count: advance },
  ] as const
  return <div className={cn("difficulty-mix", className)} role="img" aria-label={`难度构成：基础 ${basic} 题，巩固 ${consolidate} 题，提升 ${advance} 题`}>
    <span className="difficulty-mix-bar" aria-hidden="true">{parts.filter(part => part.count > 0).map(part => <i key={part.key} style={{ flex: part.count, background: difficultySwatches[part.key] }} />)}</span>
    <span className="difficulty-mix-text text-ui-meta" aria-hidden="true">{parts.map((part, index) => <Fragment key={part.key}>{index > 0 && " · "}<span data-empty={part.count === 0 || undefined}>{part.label} {part.count}</span></Fragment>)}</span>
  </div>
}
