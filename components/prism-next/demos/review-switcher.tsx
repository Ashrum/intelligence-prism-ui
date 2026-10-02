"use client"
import { useId, useRef, useState } from "react"
import { DemoSection } from "../demo-parts"
import { ReviewSwitcher } from "../review-switcher"
import { Badge } from "../badge"
import { Avatar, AvatarFallback } from "@/components/coss/avatar"
import { ReviewDemoThemes, reviewFormula } from "./review-workspace-fixtures"
export const switcherItems = [{ id: 'q1', name: '第 1 题 · 函数关系与完整适用条件核对', value: '86%', group: '待核对' }, { id: 'q2', name: '第 2 题 · 椭圆焦距关系与参数范围', value: '47%', group: '已确认' }]
export function ReviewSwitcherFixture() {
  const searchId = useId(), ref = useRef<HTMLButtonElement>(null), [current, setCurrent] = useState(0), [open, setOpen] = useState(false)
  return <ReviewSwitcher items={switcherItems} groups={['待核对','已确认'].map(value => ({ value, items: switcherItems.filter(item => item.group === value) }))} current={current} open={open} onOpenChange={setOpen} onSelect={index => { setCurrent(index); setOpen(false) }} triggerRef={ref} searchId={searchId} itemKey={item => item.id} itemToStringLabel={item => `${item.id} ${item.name}`} labels={{ navigation: '题目导航', previous: '上一题', next: '下一题', previousAria: '上一题', nextAria: '下一题', trigger: `选择题目，当前 ${current + 1} / 2`, panel: '选择题目', search: '题号或内容', empty: '没有匹配的题目' }}
    renderItem={item => <div className="flex min-w-0 items-center gap-2"><Avatar aria-hidden="true"><AvatarFallback>{item.id}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block text-item-title">{item.name}</span><span className="block text-ui-meta text-muted-foreground">{reviewFormula}</span></span><span className="text-ui-body tabular-nums">{item.value}</span><Badge variant="outline">{item.group}</Badge></div>} />
}
export function ReviewSwitcherDemo() { return <DemoSection title="题目切换与分组跳转" description="搜索 q1、q2 或中文内容；coss 负责方向键、当前标记及关闭后返回触发器。学生导航使用相同接口。"><ReviewDemoThemes>{() => <ReviewSwitcherFixture />}</ReviewDemoThemes></DemoSection> }
