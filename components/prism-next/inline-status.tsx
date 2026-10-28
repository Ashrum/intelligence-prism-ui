"use client"

import type { ComponentProps, ReactNode } from 'react'
import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { Tooltip, TooltipTrigger } from '@/components/coss/tooltip'
import { TooltipPopup } from './scoped-overlays'
import { cn } from '@/lib/utils'

export type InlineStatusProps = Omit<ComponentProps<'span'>, 'children'> & {
  children: ReactNode
  tone?: 'info' | 'warning' | 'destructive'
  /** Optional explanation; the short status remains visible and announced. */
  details?: ReactNode
}
const tones = { info: 'text-info-foreground', warning: 'text-warning-foreground', destructive: 'text-destructive-foreground' }
const icons = { info: Info, warning: TriangleAlert, destructive: CircleAlert }
export function InlineStatus({ children, tone = 'info', details, className, ...props }: InlineStatusProps) {
  const Icon = icons[tone]
  const label = <><Icon aria-hidden="true" className="size-3 shrink-0 self-center" /><span className="min-w-0 break-words">{children}</span></>
  return <span role="status" {...props} data-slot="inline-status" data-tone={tone} className={cn('inline-flex min-w-0 items-baseline gap-1 text-ui-meta', tones[tone], className)}>
    {details ? <Tooltip><TooltipTrigger className="inline-flex min-w-0 items-baseline gap-1 text-left" type="button">{label}</TooltipTrigger><TooltipPopup>{details}</TooltipPopup></Tooltip> : label}
  </span>
}
