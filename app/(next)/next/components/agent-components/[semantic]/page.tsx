import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { agentComponentRegistry } from "@/lib/prism-next/agent-component-registry"
import { AgentComponentPage } from "@/components/prism-next/demos/agent-component-page"
import { getSemanticContract } from "@/lib/prism-next/agent-component-contracts"

export function generateStaticParams() {
  return agentComponentRegistry.map(({ slug }) => ({ semantic: slug }))
}
export async function generateMetadata({ params }: { params: Promise<{ semantic: string }> }): Promise<Metadata> {
  const { semantic } = await params
  const entry = agentComponentRegistry.find(entry => entry.slug === semantic)
  return { title: entry ? `${entry.number} ${entry.name} · Agent 语义组件` : "组件" }
}
export default async function AgentSemanticPage({ params }: { params: Promise<{ semantic: string }> }) {
  const { semantic } = await params
  const entry = agentComponentRegistry.find(entry => entry.slug === semantic)
  if (!entry) notFound()
  return <AgentComponentPage key={entry.slug} entry={entry} contract={getSemanticContract(entry.slug)} />
}
