import { createReviewEditor as createEditor } from "../question-review-model.ts"
export const initialReviewScores: Record<string, number> = { choice: 4, fill: 0, inequality: 2, solve: 2, domain: 0, maximum: 2 }
export const reviewAttempts: Record<string, string> = {
  "1": "A。",
  "2": "27 L。计算：V(3) − V(0) = 47 − 20 = 27。",
  "3": "① −t² + 12t + 20 ≥ 52，得 (t − 4)(t − 8) ≤ 0，所以 4 ≤ t ≤ 8。② V(t) = 56 − (t − 6)²，t = 6 时最大水量为 56 L。",
}
export const createReviewEditor=()=>createEditor(initialReviewScores)
export type { ReviewEditor } from "../question-review-model.ts"
