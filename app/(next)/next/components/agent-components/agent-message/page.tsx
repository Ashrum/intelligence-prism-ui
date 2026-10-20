import { AgentConversationDemo } from "@/components/prism-next/demos/agent-conversation-demo"
import { AgentMessage } from "@/components/prism-next/agent-message"
import { MenuItem } from "@/components/coss/menu"
export const metadata = { title: "Agent 对话气泡 · Agent 组合" }
const now = "2026-10-20T16:00:00+08:00"
const timeCases = [
  { dateTime: "2026-10-20T15:59:30+08:00", speaker: "user" as const, text: "刚刚发送：请帮我整理这份材料。" },
  { dateTime: "2026-10-20T15:58:00+08:00", speaker: "agent" as const, text: "2 分钟前：已整理材料中的主要问题，请核对原文。" },
  { dateTime: "2026-10-20T14:32:09+08:00", speaker: "agent" as const, text: "1 小时前：历史消息悬停或焦点进入时显示底部行。" },
  { dateTime: "2026-10-19T14:32:09+08:00", speaker: "agent" as const, text: "昨天的消息。" },
  { dateTime: "2026-10-17T14:32:09+08:00", speaker: "agent" as const, text: "3 天前的消息。" },
  { dateTime: "2026-10-13T14:32:09+08:00", speaker: "agent" as const, text: "同年日期：10月13日。" },
  { dateTime: "2025-10-19T14:32:09+08:00", speaker: "user" as const, text: "请保留每一步推导，特别是函数 f(x) = x² 的条件与结论，并结合原始材料逐项解释。".repeat(8) },
]
export default function Page() {
  return <div className="prism-content space-y-6"><div className="prism-page-heading"><h1>Agent 对话气泡</h1><p>Agent 对话组合 · 组件候选</p></div><a className="prism-link" href="/next/components/agent-components#agent-message">返回 Agent 组件总览</a><AgentConversationDemo section="agent-message" />
    <section aria-label="消息时间戳示例" className="space-y-4">
      <h2 className="text-block-title">消息时间戳</h2>
      <p className="text-ui-hint text-muted-foreground">固定参考时间：2026年10月20日 16:00（Asia/Taipei）。七档相对时间与长消息；历史消息悬停或键盘焦点进入时显示图标与时间，最后一条及触屏常驻。悬停或聚焦时间显示完整时间。更多菜单仅展示布局。</p>
      {timeCases.map((item, index) => <AgentMessage key={item.dateTime} speaker={item.speaker} isLast={index === timeCases.length - 1} timestamp={{ dateTime: item.dateTime, now }} moreActions={<MenuItem disabled>查看原文（布局示例）</MenuItem>}>{item.text}</AgentMessage>)}
      <AgentMessage speaker="agent" isLast timestamp={{ dateTime: now }}>共享时钟示例：按实际当前时间显示，每分钟刷新；页面隐藏时暂停。</AgentMessage>
    </section>
  </div>
}
