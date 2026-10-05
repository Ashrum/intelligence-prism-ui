import { ErrorCauseReviewCompactDemo } from "@/components/prism-next/demos/review-compact"
import { AgentSpec } from "@/components/prism-next/agent-spec"
export const metadata = { title: "错因核对紧凑密度" }
export default function Page() {
  return <div className="prism-content"><div className="prism-page-heading"><h1>错因核对紧凑密度</h1></div><ErrorCauseReviewCompactDemo /><AgentSpec id="error-cause-review" /></div>
}
