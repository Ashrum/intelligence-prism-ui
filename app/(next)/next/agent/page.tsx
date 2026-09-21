import { AgentWorkspaceExamples } from '@/components/prism-next/examples/agent-workspace'
export const metadata={title:'Agent 工作区 · 智能曜彩'}
export default function AgentPage(){return <div className="prism-content"><header className="prism-page-heading"><p>应用模式 / AGENT</p><h1>Agent 工作区</h1><span>引导式任务 v0.1 · 从材料、必要追问到核对与保存。固定示例，不连接模型或 OCR。</span></header><AgentWorkspaceExamples/></div>}
