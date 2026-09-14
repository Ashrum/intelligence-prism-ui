import { AgentWorkspace } from '@/components/prism-next/agent-workspace'
export const metadata={title:'Agent 工作区 · 智能曜彩'}
export default function AgentPage(){return <div className="prism-content"><header className="prism-page-heading"><p>应用模式 / AGENT</p><h1>Agent 工作区</h1><span>围绕任务组织上下文、执行过程与待确认结果。采用 coss 组件和 Motion 动效。</span></header><AgentWorkspace/></div>}
