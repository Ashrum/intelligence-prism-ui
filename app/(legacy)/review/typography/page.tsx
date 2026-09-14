import type { Metadata } from "next"
import { TypographyReview } from "./typography-review"
import "./typography.css"

export const metadata: Metadata = { title: "中文与数学字体对照" }

export default function TypographyReviewPage() {
  return <TypographyReview />
}
