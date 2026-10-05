import { ScoreReviewExtensionsDemo } from "@/components/prism-next/demos/score-review-extensions"
import { AgentSpec } from "@/components/prism-next/agent-spec"

export const metadata = { title: "Score Review 评分扩展" }

export default function ScoreReviewExtensionsPage() {
  return <div className="prism-content">
    <div className="prism-page-heading"><h1>Score Review 评分扩展</h1><p>逐点评分、修改理由、未作答与宿主保存门禁。</p></div>
    <ScoreReviewExtensionsDemo />
    <AgentSpec id="score-review" />
  </div>
}
