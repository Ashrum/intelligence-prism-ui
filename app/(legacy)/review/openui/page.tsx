import type { Metadata } from "next"
import { OpenUIReview } from "./review"
import "./review.css"

export const metadata: Metadata = { title: "OpenUI · 证据解释与复核试点", description: "使用预置样例与智能曜彩现有组件，比较阅读顺序与独立复核状态。" }
export default function OpenUIReviewPage() { return <OpenUIReview /> }
