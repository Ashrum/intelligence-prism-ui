import { StudentPaperReportPendingDemo } from "@/components/prism-next/demos/student-paper-report"
import { AgentSpec } from "@/components/prism-next/agent-spec"
export const metadata = { title: "整卷报告待办入口" }
export default function Page() {
  return <div className="prism-content"><div className="prism-page-heading"><h1>整卷报告待办入口</h1></div><StudentPaperReportPendingDemo /><AgentSpec id="student-paper-report" /></div>
}
