"use client"
import { Children, Fragment, isValidElement, useRef, useState, type ReactNode } from "react"
import { Check, Copy, MoreHorizontal, Paperclip } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Menu, MenuTrigger, MenuPopup } from "@/components/coss/menu"
import { Tooltip, TooltipTrigger, TooltipPopup } from "@/components/coss/tooltip"
import { cn } from "@/lib/utils"
import { AgentMark } from "./agent-mark"
import "./agent-conversation.css"

export type AgentMessageProps = {
  speaker: "user" | "agent"; children: ReactNode; attachments?: ReactNode; details?: ReactNode; className?: string
  /** Direct prose only. Nested business cards retain their own typography. */
  bodyRole?: "read-body"
  actions?: ReactNode
  /** coss MenuItem children; the component supplies the menu trigger and themed portal. */
  moreActions?: ReactNode
  /** Failure recovery, clarification and other necessary actions never hide. */
  persistentActions?: ReactNode
  actionsVisibility?: "auto" | "always"
  isLast?: boolean
  /** The host performs copying and reports the actual result. */
  copyAction?: { onCopy: () => void; state?: "idle" | "copied" | "error"; disabled?: boolean }
}

function hasSlotContent(slot: ReactNode): boolean {
  return Children.toArray(slot).some(child => isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? hasSlotContent(child.props.children) : child !== "")
}

/** Presentation only. The host owns ordering, message identity and all business cards. */
export function AgentMessage({ speaker, children, attachments, details, className, bodyRole, actions, moreActions, persistentActions, actionsVisibility = "auto", isLast = false, copyAction }: AgentMessageProps) {
  actions = hasSlotContent(actions) ? actions : undefined
  moreActions = hasSlotContent(moreActions) ? moreActions : undefined
  persistentActions = hasSlotContent(persistentActions) ? persistentActions : undefined
  const hasActions = Boolean(actions || moreActions || persistentActions || copyAction)
  const enhanced = bodyRole !== undefined || hasActions
  // Keep the original four-child section tree on the default path (including React SSR IDs).
  const content = <section aria-label={speaker === "user" ? "你说" : "Agent 说"} data-agent-message={speaker} className={cn("min-w-0", speaker === "user" ? "agent-user-message ml-auto rounded-xl bg-foreground px-4 py-3 text-background" : enhanced ? "mr-auto flex w-full flex-col gap-2" : "mr-auto w-full space-y-3", className)}>
    {speaker === "agent" && <div className="flex items-center gap-2 text-ui-action"><AgentMark state="idle" />Agent</div>}
    <div className={cn("agent-message-content min-w-0 whitespace-pre-wrap break-words text-read-body", bodyRole === "read-body" && "[&>p]:text-read-body [&>ul]:text-read-body [&>ol]:text-read-body")}>{children}</div>
    {attachments && <div className={cn(enhanced ? speaker === "user" ? "mt-2 flex min-w-0 flex-wrap gap-2" : "flex min-w-0 flex-wrap gap-2" : "mt-3 flex min-w-0 flex-wrap gap-2")}>{attachments}</div>}
    {details && <div className={enhanced && speaker === "agent" ? "min-w-0" : "mt-2 min-w-0"}>{details}</div>}
  </section>
  return <div className="agent-message-container min-w-0">{hasActions ? <>{content}<MessageActions {...{ speaker, actions, moreActions, persistentActions, actionsVisibility, isLast, copyAction }} /></> : content}</div>
}

function MessageActions({ speaker, actions, moreActions, persistentActions, actionsVisibility, isLast, copyAction }: Omit<AgentMessageProps, "children">) {
  const root = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const copyLabel = copyAction?.state === "copied" ? "已复制" : copyAction?.state === "error" ? "复制失败，请重试" : "复制"
  return <div ref={root} data-message-actions data-actions-visible={isLast || actionsVisibility === "always" || menuOpen || copyAction?.state === "copied" || copyAction?.state === "error"}
    className={cn("mt-1 flex min-w-0 flex-wrap items-center gap-2", speaker === "user" && "justify-end")}>
    {persistentActions && <div className="flex min-w-0 flex-wrap items-center gap-2">{persistentActions}</div>}
    {(actions || moreActions || copyAction) && <div className="agent-message-secondary-actions flex min-w-0 flex-wrap items-center gap-2">
      {actions}
      {copyAction && <>
        <Tooltip><TooltipTrigger render={<Button type="button" variant="ghost" size="icon-sm" className="m-1 min-h-9 min-w-9" aria-label={copyLabel} disabled={copyAction.disabled} onClick={copyAction.onCopy} />}>{copyAction.state === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</TooltipTrigger><TooltipPopup portalProps={{ container: root }}>{copyLabel}</TooltipPopup></Tooltip>
        <span role="status" className="text-ui-hint">{copyAction.state === "copied" ? "已复制" : copyAction.state === "error" ? "复制失败，请重试" : null}</span>
      </>}
      {moreActions && <Menu open={menuOpen} onOpenChange={setMenuOpen}>
        <Tooltip><TooltipTrigger render={<MenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" className="m-1 min-h-9 min-w-9" aria-label="更多消息操作" />} />}><MoreHorizontal aria-hidden="true" /></TooltipTrigger><TooltipPopup portalProps={{ container: root }}>更多消息操作</TooltipPopup></Tooltip>
        <MenuPopup align="end" portalProps={{ container: root }}>{moreActions}</MenuPopup>
      </Menu>}
    </div>}
  </div>
}
export function AgentMessageAttachment({ children }: { children: ReactNode }) {
  return <span data-slot="agent-message-attachment" className="inline-flex max-w-full items-center gap-1 rounded-md border border-current px-2 py-1 text-ui-hint"><Paperclip aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 break-all">{children}</span></span>
}
