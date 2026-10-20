"use client"
import { Children, cloneElement, Fragment, isValidElement, useRef, useState, type ReactNode } from "react"
import { Check, Copy, MoreHorizontal, Paperclip } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Menu, MenuTrigger, MenuPopup } from "@/components/coss/menu"
import { Tooltip, TooltipTrigger, TooltipPopup } from "@/components/coss/tooltip"
import { cn } from "@/lib/utils"
import { formatMessageTime } from "@/lib/prism-next/format-message-time"
import { useMessageTimeClock } from "@/lib/prism-next/message-time-clock"
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
  /** Host-provided absolute ISO time and display text; invalid times are omitted. */
  timestamp?: { dateTime: string; label?: string; title?: string; timeZone?: string; now?: string | number | Date }
  isLast?: boolean
  /** The host performs copying and reports the actual result. */
  copyAction?: { onCopy: () => void; state?: "idle" | "copied" | "error"; disabled?: boolean }
}

function hasSlotContent(slot: ReactNode): boolean {
  return Children.toArray(slot).some(child => isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? hasSlotContent(child.props.children) : child !== "")
}

/** Presentation only. The host owns ordering, message identity and all business cards. */
export function AgentMessage({ speaker, children, attachments, details, className, bodyRole, actions, moreActions, persistentActions, actionsVisibility = "auto", isLast = false, copyAction, timestamp }: AgentMessageProps) {
  actions = hasSlotContent(actions) ? actions : undefined
  moreActions = hasSlotContent(moreActions) ? moreActions : undefined
  persistentActions = hasSlotContent(persistentActions) ? persistentActions : undefined
  const hasActions = Boolean(actions || moreActions || persistentActions || copyAction)
  const formatted = timestamp && formatMessageTime(timestamp.dateTime, timestamp.now ?? timestamp.dateTime, { timeZone: timestamp.timeZone })
  const messageTime = formatted && timestamp ? timestamp : undefined
  const enhanced = bodyRole !== undefined || hasActions || Boolean(messageTime)
  // Keep the original four-child section tree on the default path (including React SSR IDs).
  const content = <section aria-label={speaker === "user" ? "你说" : "Agent 说"} data-agent-message={speaker} className={cn("min-w-0", speaker === "user" ? "agent-user-message ml-auto rounded-xl bg-foreground px-4 py-3 text-background" : enhanced ? "mr-auto flex w-full flex-col gap-2" : "mr-auto w-full space-y-3", className)}>
    {speaker === "agent" && <div className="flex items-center gap-2 text-ui-action"><AgentMark state="idle" />Agent</div>}
    <div className={cn("agent-message-content min-w-0 whitespace-pre-wrap break-words text-read-body", bodyRole === "read-body" && "[&>p]:text-read-body [&>ul]:text-read-body [&>ol]:text-read-body")}>{children}</div>
    {attachments && <div className={cn(enhanced ? speaker === "user" ? "mt-2 flex min-w-0 flex-wrap gap-2" : "flex min-w-0 flex-wrap gap-2" : "mt-3 flex min-w-0 flex-wrap gap-2")}>{attachments}</div>}
    {details && <div className={enhanced && speaker === "agent" ? "min-w-0" : "mt-2 min-w-0"}>{details}</div>}
  </section>
  return <div className="agent-message-container min-w-0">{hasActions || messageTime ? <>{content}<MessageActions {...{ speaker, actions, moreActions, persistentActions, actionsVisibility, isLast, copyAction }} timestamp={messageTime} /></> : content}</div>
}

function MessageActions({ speaker, actions, moreActions, persistentActions, actionsVisibility, isLast, copyAction, timestamp }: Omit<AgentMessageProps, "children">) {
  const root = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const copyLabel = copyAction?.state === "copied" ? "已复制" : copyAction?.state === "error" ? "复制失败，请重试" : "复制"
  const secondaryControls = [
    isValidElement(actions) ? cloneElement(actions, { key: actions.key ?? "actions" }) : actions,
    copyAction && <Fragment key="copy">
        <Tooltip><TooltipTrigger render={<Button type="button" variant="ghost" size="icon-sm" className={timestamp ? "m-1 min-h-9 min-w-9 after:absolute after:-inset-1 text-muted-foreground" : "m-1 min-h-9 min-w-9"} aria-label={copyLabel} disabled={copyAction.disabled} onClick={copyAction.onCopy} />}>{copyAction.state === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}</TooltipTrigger><TooltipPopup portalProps={{ container: root }}>{copyLabel}</TooltipPopup></Tooltip>
        <span role="status" className={timestamp ? "sr-only" : "text-ui-hint"}>{copyAction.state === "copied" ? "已复制" : copyAction.state === "error" ? "复制失败，请重试" : null}</span>
    </Fragment>,
    moreActions && <Menu key="more" open={menuOpen} onOpenChange={setMenuOpen}>
        <Tooltip><TooltipTrigger render={<MenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" className={timestamp ? "m-1 min-h-9 min-w-9 after:absolute after:-inset-1 text-muted-foreground" : "m-1 min-h-9 min-w-9"} aria-label="更多消息操作" />} />}><MoreHorizontal aria-hidden="true" /></TooltipTrigger><TooltipPopup portalProps={{ container: root }}>更多消息操作</TooltipPopup></Tooltip>
        <MenuPopup align="end" portalProps={{ container: root }}>{moreActions}</MenuPopup>
    </Menu>,
  ]
  const controls = [
    persistentActions && <div key="persistent" className="flex min-w-0 flex-wrap items-center gap-2">{persistentActions}</div>,
    (actions || moreActions || copyAction || timestamp) && <div key="secondary" className="agent-message-secondary-actions flex min-w-0 flex-wrap items-center gap-2">
      {timestamp ? [...secondaryControls, <MessageTime key="time" timestamp={timestamp} root={root} />] : secondaryControls}
    </div>,
  ]
  return <div ref={root} data-message-actions data-actions-visible={isLast || actionsVisibility === "always" || menuOpen || copyAction?.state === "copied" || copyAction?.state === "error"}
    className={cn(timestamp ? "mt-2 flex min-w-0 flex-wrap items-center gap-2" : "mt-1 flex min-w-0 flex-wrap items-center gap-2", speaker === "user" && "justify-end")}>
    {controls}
  </div>
}
function MessageTime({ timestamp, root }: { timestamp: NonNullable<AgentMessageProps["timestamp"]>; root: React.RefObject<HTMLDivElement | null> }) {
  const now = useMessageTimeClock(timestamp.now === undefined && !timestamp.label)
  const formatted = formatMessageTime(timestamp.dateTime, timestamp.now ?? (now || timestamp.dateTime), { timeZone: timestamp.timeZone })!
  const title = timestamp.title || formatted.title
  return <Tooltip>
    <TooltipTrigger render={<time dateTime={timestamp.dateTime} tabIndex={0} aria-label={title} className="min-w-0 break-words text-ui-meta text-muted-foreground" />}>{timestamp.label || formatted.label}</TooltipTrigger>
    <TooltipPopup portalProps={{ container: root }} data-agent-preview data-prism-theme="dark">{title}</TooltipPopup>
  </Tooltip>
}
export function AgentMessageAttachment({ children }: { children: ReactNode }) {
  return <span data-slot="agent-message-attachment" className="inline-flex max-w-full items-center gap-1 rounded-md border border-current px-2 py-1 text-ui-hint"><Paperclip aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 break-all">{children}</span></span>
}
