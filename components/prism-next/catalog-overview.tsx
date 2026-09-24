"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight,BookOpen,Check,Save } from "lucide-react"
import { Input } from "@/components/coss/input"
import { Button } from "@/components/coss/button"
import { Label } from "@/components/coss/label"
import { StatusBadge } from "./status-badge"
import { BrandMark } from "./shell"
import { QuestionTypeLabel,QuestionPoints } from "./question-labels"
import { componentGroups,components,applicationExamples,agentRelatedPages,searchComponents } from "@/lib/prism-next/catalog"

export function CatalogOverview() {
  const [query,setQuery]=useState(''),[saved,setSaved]=useState(false),[title,setTitle]=useState('二次函数专题练习')
  const match=(text:string)=>text.toLowerCase().includes(query.trim().toLowerCase())
  const count=searchComponents(query).length
  const relatedPages=agentRelatedPages.filter(page=>match(page.title+' '+page.summary))
  return <div className="prism-content">
    <header className="prism-page-heading flex items-center justify-between gap-6">
      <div><div className="mb-3 text-ui-hint  text-muted-foreground">智能曜彩 · INTELLIGENCE PRISM</div><h1>组件总览</h1><p>清晰的内容，有序的交互。为教学、研读与复核构建同一套界面语言。</p></div><div className="flex flex-wrap items-center gap-4"><Button variant="outline" render={<Link href="/next/reading"/>}><BookOpen/>材料研读</Button><BrandMark large/></div>
    </header>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="w-full max-w-md"><Label htmlFor="component-search">查找组件</Label><Input id="component-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="名称或用途，例如：选择、表单、Dialog"/></div>
      <p className="text-ui-hint text-muted-foreground" aria-live="polite">{query?`找到 ${count} 项组件${relatedPages.length?` · ${relatedPages.length} 项骨架与示例`:''}`:`${components.length} 个组件 · 3 套主题 · ${applicationExamples.length} 个应用示例`}</p>
    </div>
    {!query.trim()&&<section className="prism-preview-grid" aria-label="组件交互预览">
      <article className="prism-preview-tile"><div className="prism-preview-stage"><p className="text-ui-hint text-muted-foreground">一个明确的主操作</p><div className="flex flex-wrap items-center gap-2"><Button onClick={()=>setSaved(true)}>{saved?<Check/>:<Save/>}{saved?'已保存':'保存修改'}</Button><Button variant="outline" onClick={()=>setSaved(false)}>重置</Button></div><p className="text-ui-hint text-muted-foreground" role="status">{saved?<StatusBadge tone="complete">已保存</StatusBadge>:'点击按钮，体验操作与反馈。'}</p></div><Link href="/next/components/button">Button 按钮<ArrowUpRight/></Link></article>
      <article className="prism-preview-tile"><div className="prism-preview-stage"><p className="text-ui-hint text-muted-foreground">标签、输入与说明各有位置</p><div className="space-y-2"><Label htmlFor="overview-title">练习名称</Label><Input id="overview-title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={40}/><p className="text-ui-hint text-muted-foreground">用于学生端展示，可直接修改。</p></div></div><Link href="/next/components/form">Form 表单<ArrowUpRight/></Link></article>
      <article className="prism-preview-tile"><div className="prism-preview-stage"><p className="text-ui-hint text-muted-foreground">色彩帮助辨认作答形式</p><div className="flex flex-wrap gap-2"><QuestionTypeLabel label="单选" tone="blue"/><QuestionTypeLabel label="解答" tone="magenta"/><QuestionTypeLabel label="复合" tone="lime"/></div><div className="flex flex-wrap items-center gap-2"><span className="text-ui-action">函数与几何综合</span><QuestionPoints points={16} tone="lime"/></div></div><Link href="/next/components/question">Question 题目<ArrowUpRight/></Link></article>
    </section>}
    <div className={query.trim()?'mt-8':''}>{componentGroups.map(group=>{
      const items=searchComponents(query,group.items)
      const pages=group.id==='agent'?relatedPages:[]
      if(!items.length&&!pages.length)return null
      return <section key={group.id} className="mb-9" aria-labelledby={'group-'+group.id}>
        <h2 id={'group-'+group.id} className="mb-3 flex items-center gap-2 text-section-title">{group.title}<span className="text-ui-hint font-normal text-muted-foreground">{group.id==='agent'?`${items.length} 组组件 · 骨架与示例另计`:items.length}</span></h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2 xl:grid-cols-3">
          {items.map(({item,href})=><Link key={item.id} href={href} className="prism-catalog-link group min-w-0">
            <div className="flex items-center gap-2 text-ui-action text-foreground">{item.title}<ArrowUpRight className="ml-auto size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"/></div>
            <p className="mt-1 text-ui-hint text-muted-foreground">{item.summary}</p>
          </Link>)}
          {pages.map(page=><Link key={page.href} href={page.href} className="group min-w-0 border-b py-4"><div className="flex items-center gap-2 font-medium text-foreground">{page.title}<ArrowUpRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"/></div><p className="mt-1 text-ui-hint text-muted-foreground">{page.summary}</p></Link>)}
        </div>
      </section>
    })}</div>
    {count===0&&relatedPages.length===0&&<div className="py-12 text-center"><p className="mb-4 text-muted-foreground">没有匹配的组件、骨架或示例。</p><Button variant="outline" onClick={()=>setQuery('')}>清除搜索</Button></div>}
    <section className="mt-10"><h2 className="text-section-title">应用示例 · 不计入组件数量</h2><div className="mt-3 grid gap-6 sm:grid-cols-2">{applicationExamples.map(item=><Link key={item.id} href={`/next/examples/${item.id}`} className="prism-catalog-link"><p className="flex items-center justify-between text-ui-action">{item.title}<ArrowUpRight className="size-4"/></p><p className="mt-1 text-ui-hint text-muted-foreground">{item.summary}</p></Link>)}</div></section>
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-ui-hint text-muted-foreground"><p>coss 组件 · 系统字体 · 数学排版</p><Link className="prism-link" href="/next/foundations">查看基础规范 ↗</Link></footer>
  </div>
}
