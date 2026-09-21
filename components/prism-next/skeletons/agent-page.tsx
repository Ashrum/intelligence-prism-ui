"use client"

import { useId, type ReactNode } from 'react'
import { ScrollArea } from '@/components/coss/scroll-area'
import './agent-page.css'

/** Content skeleton extracted from the workbench Agent stage.
 * Compose inside WorkbenchShell contentLayout="workspace"; the application owns
 * conversations, drafts, reply state, history and callbacks. No executor lives here. */
export function AgentPageSkeleton({ title, meta, actions, welcome, messages, composer, suggestions, notice, empty = false }: {
 title: string; meta?: ReactNode; actions?: ReactNode; welcome?: ReactNode;
 messages?: ReactNode; composer: ReactNode; suggestions?: ReactNode;
 notice?: ReactNode; empty?: boolean;
}) {
 const titleId = useId()
 return <section className="agent-page" data-empty={empty} aria-labelledby={titleId}>
  <header className="agent-page-header">
   <div className="min-w-0"><h1 id={titleId} className="text-base font-semibold leading-6 break-words">{title}</h1>{meta && <div className="mt-1 text-xs text-muted-foreground">{meta}</div>}</div>
   <div className="agent-page-actions">{actions}</div>
  </header>
  {notice && <div className="agent-page-notice text-sm text-info-foreground" role="status">{notice}</div>}
  <ScrollArea className="agent-page-scroll" overscrollContain scrollbarGutter>
   <div className="agent-page-reading">{empty ? welcome : messages}</div>
  </ScrollArea>
  <div className="agent-page-compose"><div className="agent-page-compose-inner">{composer}{empty && suggestions}</div></div>
 </section>
}
