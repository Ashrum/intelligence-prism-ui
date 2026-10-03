import type { RailPreferences } from "@/components/prism-next/review-workspace-layout"
export { PAPER_REVIEW_BEST_WIDTH, railBand, railCollapsedForWidth, type RailPreferences } from "../../components/prism-next/review-workspace-layout.ts"
export const railPreferenceKeys = {
  best: 'prism-paper-review-rail-collapsed-best',
  compact: 'prism-paper-review-rail-collapsed-compact',
} as const
export function readRailPreferences(): RailPreferences {
  const preferences: RailPreferences = {}
  for (const band of Object.keys(railPreferenceKeys) as (keyof RailPreferences)[]) {
    try {
      const value = localStorage.getItem(railPreferenceKeys[band])
      if (value === 'true' || value === 'false') preferences[band] = value === 'true'
    } catch { /* Unavailable storage uses defaults; in-session choices still work. */ }
  }
  return preferences
}
