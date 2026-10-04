import { QuestionRailMarkerDemo } from "@/components/prism-next/demos/review-compact"
import { AgentSpec } from "@/components/prism-next/agent-spec"
export const metadata = { title: "题目栏图标标记" }
export default function Page() {
  return <div className="prism-content"><div className="prism-page-heading"><h1>题目栏图标标记</h1></div><QuestionRailMarkerDemo /><AgentSpec id="question-rail" /></div>
}
