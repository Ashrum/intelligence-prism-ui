"use client"

import type { ReactNode } from "react"
import { ArrowUpRight, ChevronDown } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/coss/collapsible"

/** Shared presentation options, not a task model or an additional semantic component. */
export type AgentRecordViewProps = {
  view?: "inline" | "workspace"
  density?: "default" | "compact"
  onExpand?: (trigger: HTMLButtonElement) => void
  details?: ReactNode
}

export function RecordDetails({ children }: { children?: ReactNode }) {
  return children == null ? null : <Collapsible defaultOpen={false}>
    <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}><ChevronDown aria-hidden="true" />说明</CollapsibleTrigger>
    <CollapsiblePanel className="motion-reduce:transition-none"><div className="min-w-0 pt-3 text-ui-hint text-muted-foreground">{children}</div></CollapsiblePanel>
  </Collapsible>
}

export function RecordExpand({ view, onExpand }: Pick<AgentRecordViewProps, "view" | "onExpand">) {
  return view === "workspace" || !onExpand ? null : <Button variant="outline" onClick={event => onExpand(event.currentTarget)}>更多<ArrowUpRight aria-hidden="true" /></Button>
}
