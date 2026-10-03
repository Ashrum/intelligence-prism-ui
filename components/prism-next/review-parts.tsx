"use client"
import type { ReactElement, ReactNode } from "react"
import { Tooltip, TooltipTrigger, TooltipPopup } from "@/components/coss/tooltip"
import { Kbd } from "@/components/coss/kbd"
import { Meter, MeterTrack, MeterIndicator } from "@/components/coss/meter"
import { Badge } from "./badge"
export type ReviewTone = "neutral" | "success" | "warning" | "destructive"
export const reviewToneClass: Record<ReviewTone, string> = { neutral: 'bg-foreground', success: 'bg-success', warning: 'bg-warning', destructive: 'bg-destructive' }
export function ReviewTip({ label, keys, children }: { label: string; keys: string; children: ReactElement }) {
  return <Tooltip><TooltipTrigger render={children} /><TooltipPopup className="surface-floating motion-reduce:transition-none" side="left"><span className="text-ui-hint">{label} <Kbd>{keys}</Kbd></span></TooltipPopup></Tooltip>
}
export function ReviewConfirmation({ children }: { children: ReactNode }) {
  return <Badge variant="outline"><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{children}</Badge>
}
export function ReviewMeter({ value, max, label }: { value: number; max: number; label: string }) {
  return <Meter value={value} max={max} aria-label={label}><MeterTrack><MeterIndicator className="motion-reduce:transition-none" /></MeterTrack></Meter>
}

