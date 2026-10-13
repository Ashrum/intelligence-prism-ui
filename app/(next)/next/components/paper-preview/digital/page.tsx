import { DigitalPaperPreviewDemo } from "@/components/prism-next/demos/paper-preview-digital"
import { AgentSpec } from "@/components/prism-next/agent-spec"
export const metadata = { title: "数字试卷公开属性" }
export default function Page() {
  return <div className="prism-content"><div className="prism-page-heading"><h1>数字试卷公开属性</h1><p>独立组件夹具；整卷接入仍使用全屏 ReviewWorkspace。</p></div><DigitalPaperPreviewDemo /><AgentSpec id="question-rail" /><AgentSpec id="paper-preview" /></div>
}
