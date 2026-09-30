/** Supplemental combinations, outside the frozen 42 semantics / 80 catalog items. */
export const agentConversationCompositions = [
  { slug: "prompt-bar", name: "Agent 输入框与语音", componentName: "AgentPromptBar / AgentVoiceButtons / AgentVoiceStatus" },
  { slug: "agent-mark", name: "Agent 动效标识", componentName: "AgentMark" },
  { slug: "agent-message", name: "Agent 对话气泡", componentName: "AgentMessage" },
] as const
