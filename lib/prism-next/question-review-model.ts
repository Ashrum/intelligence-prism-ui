export type ReviewEditor = { scores: Record<string, number | null>; saved: Record<string, number>; reason: string; record: string; error: string }
export function createReviewEditor(initial:Record<string,number>={}): ReviewEditor {
  return { scores: { ...initial }, saved: { ...initial }, reason: "", record: "", error: "" }
}
