"use client"

import { createContext, useContext, useRef, type ReactNode } from "react"

/** Page composition only. Standalone review fixtures retain their full rendering. */
type AgentDemoPresentationValue = {
  previewOnly: boolean
  embedded: boolean
  onExpand?: () => void
  onBack?: () => void
  view?: "inline" | "workspace"
  density?: "default" | "compact"
}
export const AgentDemoPresentation = createContext<AgentDemoPresentationValue>({ previewOnly: false, embedded: false })
export const useAgentDemoPresentation = () => useContext(AgentDemoPresentation)

/** Keep feedback from the interactive preview without repeating its initial fixture instructions. */
export function AgentDemoPreview({ children, feedback }: { children: ReactNode; feedback?: string }) {
  const initialFeedback = useRef(feedback)
  return <div className="min-w-0 space-y-3">{children}{feedback && feedback !== initialFeedback.current && <p role="status" className="text-ui-hint">{feedback}</p>}</div>
}
