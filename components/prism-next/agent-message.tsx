"use client"
import type { ReactNode } from "react"
import { Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { AgentMark } from "./agent-mark"
import "./agent-conversation.css"

/** Presentation only. The host owns ordering, message identity and all business cards. */
export function AgentMessage({ speaker, children, attachments, details, className }: {
  speaker: "user" | "agent"; children: ReactNode; attachments?: ReactNode; details?: ReactNode; className?: string
}) {
  return <div className="agent-message-container min-w-0"><section aria-label={speaker === "user" ? "你说" : "Agent 说"} data-agent-message={speaker} className={cn("min-w-0", speaker === "user" ? "agent-user-message ml-auto rounded-xl bg-foreground px-4 py-3 text-background" : "mr-auto w-full space-y-3", className)}>
    {speaker === "agent" && <div className="flex items-center gap-2 text-ui-action"><AgentMark state="idle" />Agent</div>}
    <div className="agent-message-content min-w-0 whitespace-pre-wrap break-words text-read-body">{children}</div>
    {attachments && <div className="mt-3 flex min-w-0 flex-wrap gap-2">{attachments}</div>}
    {details && <div className="mt-2 min-w-0">{details}</div>}
  </section></div>
}
export function AgentMessageAttachment({ children }: { children: ReactNode }) {
  return <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-current px-2 py-1 text-ui-hint"><Paperclip aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 break-all">{children}</span></span>
}
