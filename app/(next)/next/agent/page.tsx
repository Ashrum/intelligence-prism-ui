import { AgentWorkspaceExamples } from '@/components/prism-next/examples/agent-workspace'
export const metadata={title:'Agent 工作区示例 · 智能曜彩'}
export default function AgentPage(){return <div className="prism-content"><header className="prism-page-heading"><p>Agent / 组合示例</p><h1>Agent 工作区示例</h1><span>引导式任务 v0.1.1 · 从材料、必要追问到核对与保存。固定示例，不连接模型或 OCR。</span><a className="mt-2 inline-block text-ui-hint text-info-foreground" href="https://github.com/Ashrum/intelligence-prism-ui/pull/18">查看本候选源码 · PR #18</a></header><AgentWorkspaceExamples/></div>}
