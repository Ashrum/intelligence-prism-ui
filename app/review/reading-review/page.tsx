import type { Metadata } from "next"
import { ReadingReview } from "./reading-review"
import "./fonts.css"
import "./reading-review.css"

export const metadata: Metadata = {
  title: "结论复核 · 交互语言候选",
  description: "在中文、数学与证据的连续阅读中，验证智能曜彩的交互语言。",
}

export default function ReadingReviewPage() {
  return <ReadingReview />
}
