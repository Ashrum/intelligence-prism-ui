import type { ReactNode } from "react"

export type FilterOption = { id: string; label: string; count?: number }
export type FilterDimension = {
  id: string
  label: string
  mode: "single" | "multiple"
  options: readonly FilterOption[]
  description?: string
  common?: boolean
}
export type ResourceFilterValue = {
  filters: Readonly<Record<string, readonly string[]>>
  sort: string
  favoritesOnly: boolean
  search: string
}
export type ResourceFilterIntent =
  | { type: "filter"; dimensionId: string; values: string[] }
  | { type: "sort"; value: string }
  | { type: "favorites"; value: boolean }
  | { type: "search"; value: string }
  | { type: "reset" }
export type ResourceFilterAreaProps = {
  variant: "A" | "B" | "C"
  dimensions: readonly FilterDimension[]
  value: ResourceFilterValue
  sortItems: readonly { id: string; label: string }[]
  resultCount?: number
  favoriteCount?: number
  endSlot?: ReactNode
  onIntent: (intent: ResourceFilterIntent) => void
}

export function dimensionSelection(dimension: FilterDimension, values: readonly string[]) {
  return values.map(id => dimension.options.find(option => option.id === id)?.label ?? id).join("、")
}

/** Keep host option order for identical intent payloads across presentation variants. */
export function filterIntent(dimension: FilterDimension, values: readonly string[]): ResourceFilterIntent {
  const ordered = dimension.options.filter(option => values.includes(option.id)).map(option => option.id)
  return { type: "filter", dimensionId: dimension.id, values: dimension.mode === "single" ? ordered.slice(0, 1) : ordered }
}

/** The first measured item is “不限”; remaining items are host options. */
export function fittingOptions(width: number, itemWidths: readonly number[], gap = 2) {
  let used = itemWidths[0] ?? 0
  let count = 0
  for (const itemWidth of itemWidths.slice(1)) {
    if (used + gap + itemWidth > width) break
    used += gap + itemWidth
    count++
  }
  return Math.max(1, count)
}
