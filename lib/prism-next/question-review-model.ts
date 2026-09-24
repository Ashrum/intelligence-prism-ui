export type ReviewConfirmationStatus = "pending" | "confirmed" | "unknown"
export type ReviewEditor = { scores: Record<string, number | null>; saved: Record<string, number>; reason: string; record: string; error: string }
export function createReviewEditor(initial:Record<string,number>={}): ReviewEditor {
  return { scores: { ...initial }, saved: { ...initial }, reason: "", record: "", error: "" }
}

/** Current edits are compared with the last confirmed criteria, never just totals. */
export function getReviewStatus(editor: ReviewEditor, limits: Record<string, number>, confirmation: ReviewConfirmationStatus = "pending") {
  const ids = Object.keys(limits)
  const changed = ids.filter(id => editor.scores[id] !== editor.saved[id])
  const missing = ids.filter(id => editor.scores[id] == null)
  const invalid = ids.filter(id => {
    const value = editor.scores[id]
    return value == null || !Number.isFinite(value) || value < 0 || value > limits[id] || !Number.isInteger(value * 2)
  })
  const state = missing.length ? "incomplete" : invalid.length ? "invalid" : changed.length ? "changed" : editor.reason.trim() ? "note" : confirmation
  return { state, changed, missing, invalid } as const
}
