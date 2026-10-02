/** Best review resolution: 1440×900; only logical container width selects the band. */
export const PAPER_REVIEW_BEST_WIDTH = 1440
export const railPreferenceKeys = {
  best: 'prism-paper-review-rail-collapsed-best',
  compact: 'prism-paper-review-rail-collapsed-compact',
} as const
export type RailPreferences = Partial<Record<keyof typeof railPreferenceKeys, boolean>>
export function railBand(width: number): keyof typeof railPreferenceKeys {
  return width >= PAPER_REVIEW_BEST_WIDTH ? 'best' : 'compact'
}
export function railCollapsedForWidth(width: number, preferences: RailPreferences): boolean {
  const band = railBand(width)
  return preferences[band] ?? (band === 'compact')
}
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
