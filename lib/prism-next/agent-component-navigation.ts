import { agentComponentRegistry } from "./agent-component-registry"

export const agentOverviewHref = "/next/components/agent-components"
export const agentSemanticHref = (slug: string) => `${agentOverviewHref}/${slug}`
export const agentSemanticTabs = [
  { id: "inline", label: "对话态" }, { id: "workspace", label: "扩展态" },
  { id: "compact", label: "紧凑" }, { id: "states", label: "状态示例" },
  { id: "contract", label: "接口" }, { id: "review", label: "验收" },
] as const
export type AgentSemanticTab = typeof agentSemanticTabs[number]["id"]
export function resolveSemanticTab(hash: string): AgentSemanticTab | undefined {
  let value: string
  try { value = decodeURIComponent(hash.replace(/^#/, "")) } catch { return undefined }
  return agentSemanticTabs.find(tab => tab.id === value)?.id
}
export function semanticNeighbors(slug: string) {
  const entries = [...agentComponentRegistry].sort((a, b) => Number(a.number) - Number(b.number))
  const index = entries.findIndex(entry => entry.slug === slug)
  return index < 0 ? {} : { previous: entries[index - 1], next: entries[index + 1] }
}
