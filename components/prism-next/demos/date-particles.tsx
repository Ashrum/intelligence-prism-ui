"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import type { DateRange } from "@daypicker/react"
import { zhCN } from "@daypicker/react/locale"
import { Button } from "@/components/coss/button"
import { Calendar } from "@/components/coss/calendar"
import { Label } from "@/components/coss/label"
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/coss/popover"
import { DemoSection, Feedback } from "@/components/prism-next/demo-parts"

const dateText = (date: Date) => format(date, "yyyy年M月d日")
const exampleMonth = new Date(2026, 8, 1)

export function DatePickerDemo() {
  const [date, setDate] = useState<Date>()
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange>()
  const [preset, setPreset] = useState<Date>()
  const [month, setMonth] = useState(exampleMonth)
  return <>
    <DemoSection title="单个日期" description="选择日期后收起，可清除并重新选择。" sources={["p-date-picker-6"]}>
      <div className="max-w-72"><Label htmlFor="date-single">复核日期</Label><div className="flex items-center gap-2"><Popover open={open} onOpenChange={setOpen}><PopoverTrigger id="date-single" render={<Button variant="outline" className="min-w-0 flex-1 justify-start" />}><CalendarIcon /><span className="min-w-0 truncate">{date ? dateText(date) : "选择复核日期"}</span></PopoverTrigger><PopoverPopup className="w-auto"><Calendar mode="single" locale={zhCN} selected={date} defaultMonth={date ?? exampleMonth} onSelect={value => { setDate(value); if (value) setOpen(false) }} /></PopoverPopup></Popover><Button variant="ghost" disabled={!date} onClick={() => setDate(undefined)}>清除</Button></div></div>
      <Feedback>{date ? `复核日期：${dateText(date)}` : "尚未选择日期。"}</Feedback>
    </DemoSection>
    <DemoSection title="日期范围" description="依次选择开始与结束日期，用于复核记录和材料清单筛选。" sources={["p-date-picker-2"]}>
      <div className="max-w-md"><Label htmlFor="date-range">记录时间范围</Label><div className="flex flex-wrap items-center gap-2"><Popover><PopoverTrigger id="date-range" render={<Button variant="outline" className="min-w-0 max-w-full justify-start" />}><CalendarIcon /><span className="min-w-0 truncate">{range?.from ? range.to ? `${dateText(range.from)} — ${dateText(range.to)}` : `${dateText(range.from)} — 选择结束日期` : "选择开始与结束日期"}</span></PopoverTrigger><PopoverPopup className="w-auto"><Calendar mode="range" locale={zhCN} selected={range} defaultMonth={range?.from ?? exampleMonth} onSelect={setRange} /></PopoverPopup></Popover><Button variant="ghost" disabled={!range} onClick={() => setRange(undefined)}>清除范围</Button></div></div>
      <Feedback>{range?.from ? range.to ? `筛选范围：${dateText(range.from)}至${dateText(range.to)}。` : "开始日期已选择，请继续选择结束日期。" : "尚未设置时间范围。"}</Feedback>
    </DemoSection>
    <DemoSection title="快捷日期" description="快捷选项与日历保持同步；也可以手动选择其他日期。" sources={["p-date-picker-4"]}>
      <div className="max-w-72"><Label htmlFor="date-preset">下次复核</Label><Popover><PopoverTrigger id="date-preset" render={<Button variant="outline" className="w-full justify-start" />}><CalendarIcon />{preset ? dateText(preset) : "选择下次复核日期"}</PopoverTrigger><PopoverPopup className="w-auto"><div className="flex max-sm:flex-col"><div className="relative py-1 ps-1 max-sm:order-1 max-sm:border-t"><div className="flex h-full flex-col sm:border-e sm:pe-3">{[{ label: "今天", days: 0 }, { label: "明天", days: 1 }, { label: "一周后", days: 7 }].map(item => <Button key={item.days} variant="ghost" size="sm" className="w-full justify-start" onClick={() => { const next = addDays(new Date(), item.days); setPreset(next); setMonth(next) }}>{item.label}</Button>)}</div></div><Calendar mode="single" locale={zhCN} month={month} onMonthChange={setMonth} selected={preset} onSelect={setPreset} /></div></PopoverPopup></Popover></div>
      <Feedback>{preset ? `下次复核：${dateText(preset)}` : "快捷日期以当前日期为基准。"}</Feedback>
    </DemoSection>
  </>
}
