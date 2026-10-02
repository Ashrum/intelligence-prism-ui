"use client"
import { useId, useState } from "react"
import { DemoSection } from "../demo-parts"
import { QuestionRail } from "../question-rail"
import { Button } from "../button"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { ReviewDemoThemes, reviewRailFixture } from "./review-workspace-fixtures"
export function QuestionRailFixture() {
  const id = useId(), [selected, setSelected] = useState('2'), [filter, setFilter] = useState('all'), [sort, setSort] = useState('number'), [notice, setNotice] = useState('')
  const sections = reviewRailFixture.sections.map(section => ({ ...section, pages: section.pages.map(page => ({ ...page, items: page.items.filter(item => filter === 'all' || ['2', '3'].includes(item.id)) })) }))
  if (sort !== 'number') {
    const items = sections.flatMap(section => section.pages.flatMap(page => page.items)).sort((a, b) => Number.parseFloat(String(a.value)) - Number.parseFloat(String(b.value)))
    if (sort === 'desc') items.reverse()
    sections.splice(0, sections.length, { id: 'sorted', label: '按率排序', layout: 'row', pages: [{ id: 'sorted', items }] })
  }
  return <><div className="h-[520px]"><QuestionRail {...reviewRailFixture} panelId={id} sections={sections} selected={selected} filter={filter} onFilterChange={setFilter} onSelect={setSelected} onLocate={() => setNotice(`已请求定位第 ${selected} 题`)} onPage={id => setNotice(`已请求定位页面 ${id}`)} collapse={<Button variant="ghost" onClick={() => setNotice('已请求收起题目栏')}>收起</Button>} sort={<div className="px-3 py-2"><label htmlFor={`${id}-sort`} className="text-ui-action">排序</label><Select value={sort} onValueChange={value => { if (value) setSort(value) }}><SelectTrigger id={`${id}-sort`}><SelectValue /></SelectTrigger><SelectPopup>{[['number','题号'],['asc','正确率升序'],['desc','正确率降序']].map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectPopup></Select></div>} /></div><p role="status" className="text-ui-hint">{notice || '选择题目后按 Enter 请求定位。'}</p></>
}
export function QuestionRailDemo() { return <DemoSection title="全班正确率 · 宿主排序与筛选" description="同一题目栏接收不同口径的外部文字与比例；三种排序由调用方完成。"><ReviewDemoThemes>{() => <QuestionRailFixture />}</ReviewDemoThemes></DemoSection> }
