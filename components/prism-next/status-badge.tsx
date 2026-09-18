"use client"

import type { ReactNode } from "react"
import { Check, Circle, CircleAlert, CircleDot, Clock3, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/coss/badge"
import { cn } from "@/lib/utils"

export type StatusTone = "neutral" | "pending" | "active" | "complete" | "warning" | "error"
const icons = { neutral: Circle, pending: Clock3, active: CircleDot, complete: Check, warning: TriangleAlert, error: CircleAlert }

/** Workflow state is explicit; category labels continue to use their own mapping. */
export function StatusBadge({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  const Icon = icons[tone]
  return <Badge variant="outline" size="lg" data-status-tone={tone} className={cn("prism-status", className)}><Icon aria-hidden="true" className="size-3.5"/>{children}</Badge>
}
