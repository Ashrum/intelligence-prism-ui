/** Pure logical-container defaults. Persistence belongs to the host. */
export const PAPER_REVIEW_BEST_WIDTH = 1440
export type RailPreferences = Partial<Record<"best" | "compact", boolean>>
export function railBand(width: number): "best" | "compact" { return width >= PAPER_REVIEW_BEST_WIDTH ? 'best' : 'compact' }
export function railCollapsedForWidth(width: number, preferences: RailPreferences): boolean {
  const band = railBand(width)
  return preferences[band] ?? (band === 'compact')
}
