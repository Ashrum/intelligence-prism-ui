import type { Metadata } from "next"
import { OpenUIReview } from "./review"
import "./review.css"

export const metadata: Metadata = { title: "OpenUI · 证据解释与复核试点", description: "使用智能曜彩现有组件，验证受控生成布局与独立复核状态。" }
export default function OpenUIReviewPage() { return <OpenUIReview /> }
