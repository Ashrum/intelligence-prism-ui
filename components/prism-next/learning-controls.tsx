"use client"

import { useState, type ReactNode } from "react"
import { CalendarIcon } from "lucide-react"
import { format, parseISO, addDays } from "date-fns"
import { zhCN } from "@daypicker/react/locale"
import { Button } from "@/components/coss/button"
import { Calendar } from "@/components/coss/calendar"
import { Popover, PopoverTrigger, PopoverPopup } from "@/components/coss/popover"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/coss/empty"

export const futureDate = (days: number) => format(addDays(new Date(), days), "yyyy-MM-dd")
export function LearningDate({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const date = value ? parseISO(value) : undefined
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger id={id} render={<Button variant="outline" className="justify-start" />}><CalendarIcon />{date ? format(date, "yyyy年M月d日") : "选择日期"}</PopoverTrigger><PopoverPopup className="w-auto"><Calendar mode="single" locale={zhCN} selected={date} defaultMonth={date} onSelect={next => { if (next) { onChange(format(next, "yyyy-MM-dd")); setOpen(false) } }} /></PopoverPopup></Popover>
}
export function LearningEmpty({ title, children, action }: { title: string; children: ReactNode; action: ReactNode }) {
  return <Empty><EmptyHeader><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{children}</EmptyDescription></EmptyHeader><EmptyContent>{action}</EmptyContent></Empty>
}
export function SourceNotice({ children }: { children: ReactNode }) {
  return <p className="border-l-2 border-warning-foreground bg-warning/8 px-4 py-3 text-ui-hint text-foreground" role="status">{children}</p>
}
