import { ScoreReviewCompactDemo } from "@/components/prism-next/demos/review-compact"
import { AgentSpec } from "@/components/prism-next/agent-spec"
export const metadata = { title: "人工评分紧凑密度" }
export default function Page() {
  return <div className="prism-content"><div className="prism-page-heading"><h1>人工评分紧凑密度</h1></div><ScoreReviewCompactDemo /><AgentSpec id="score-review" /></div>
}
