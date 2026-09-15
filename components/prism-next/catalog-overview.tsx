"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight,BookOpen,MessageSquare,Search } from "lucide-react"
import { Input } from "@/components/coss/input"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/coss/badge"
import { Label } from "@/components/coss/label"
import { componentGroups,components } from "@/lib/prism-next/catalog"

export function CatalogOverview() {
  const [query,setQuery]=useState('')
  const match=(text:string)=>text.toLowerCase().includes(query.trim().toLowerCase())
  const count=components.filter(item=>match(item.title+' '+item.summary)).length
  return <div className="prism-content">
    <div className="prism-page-heading flex flex-wrap items-start justify-between gap-5">
      <div><h1>组件总览</h1><p>从可操作的组件开始，查看它们在三套主题中的表现。</p></div>
      <div className="flex gap-2"><Button variant="outline" render={<Link href="/next/reading"/>}><BookOpen/>材料研读</Button><Button render={<Link href="/next/agent"/>}><MessageSquare/>Agent 工作区</Button></div>
    </div>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="w-full max-w-sm"><Label htmlFor="component-search">查找组件</Label><Input id="component-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="名称或用途，例如：选择、表单、Dialog"/></div>
      <p className="text-sm text-muted-foreground" aria-live="polite">{query?`找到 ${count} 项`:`${components.length} 项 coss 组件 · 3 套主题`}</p>
    </div>
    {componentGroups.map(group=>{
      const items=group.items.filter(item=>match(item.title+' '+item.summary))
      if(!items.length)return null
      return <section key={group.id} className="mb-9" aria-labelledby={'group-'+group.id}>
        <h2 id={'group-'+group.id} className="mb-3 flex items-center gap-2 text-sm font-semibold">{group.title}<span className="text-xs font-normal text-muted-foreground">{items.length}</span></h2>
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3">
          {items.map(item=><Link key={item.id} href={'/next/components/'+item.id} className="group min-w-0 border-b py-4">
            <div className="flex items-center gap-2 font-medium text-foreground">{item.title}<ArrowUpRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"/></div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.summary}</p>
          </Link>)}
        </div>
      </section>
    })}
    {count===0&&<div className="py-12 text-center"><p className="mb-4 text-muted-foreground">没有匹配的组件。</p><Button variant="outline" onClick={()=>setQuery('')}>清除搜索</Button></div>}
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-sm text-muted-foreground"><p>coss 原始组件 · 系统字体 · 清晰的数学排版</p><a href="/" className="prism-link">查看已过期的旧版与评审记录 →</a></footer>
  </div>
}
