import { StudentPaperReportCompactDemo } from "@/components/prism-next/demos/review-compact"
import { AgentSpec } from "@/components/prism-next/agent-spec"
export const metadata = { title: "整卷报告紧凑密度" }
export default function Page() {
  return <div className="prism-content"><div className="prism-page-heading"><h1>整卷报告紧凑密度</h1></div><StudentPaperReportCompactDemo /><AgentSpec id="student-paper-report" /></div>
}
