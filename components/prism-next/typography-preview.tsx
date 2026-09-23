"use client"
import { useState } from 'react'
import { Button } from '@/components/coss/button'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/coss/select'

const pages=[
  {value:'/next/components/input',label:'短输入控件'},
  {value:'/next/components/textarea',label:'长文本编辑'},
  {value:'/next/components/field',label:'字段说明与错误'},
  {value:'/next/examples/questions',label:'题目阅读'},
  {value:'/next/use-cases/parsing',label:'解析工作区'},
  {value:'/next/agent',label:'Agent 工作区示例'},
  {value:'/next/components/agent-components',label:'Agent 语义组件'},
  {value:'/next/skeletons/agent',label:'Agent 页面骨架'},
  {value:'/next/components/status-composition',label:'分类配色对照'},
  {value:'/next/components/evidence-matrix',label:'连续色阶对照'},
]
/** An actual iframe viewport, not a scaled drawing, exercises native media queries. */
export function TypographyPreview(){
  const[open,setOpen]=useState(false),[width,setWidth]=useState(390),[path,setPath]=useState(pages[0].value)
  return <section className="mt-8 space-y-4" aria-label="响应式字号预览">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-block-title">在窄屏里检查字号</h3><Button variant="outline" onClick={()=>setOpen(!open)}>{open?'关闭字号预览':'打开字号预览'}</Button></div>
    <p className="text-ui-hint text-muted-foreground">预览使用真实视窗宽度。小于 640px 时，短输入控件从 14px 切换到 16px；阅读正文和长编辑区保持 16/28。主题跟随页面，预览不等同于手机真机验证。</p>
    {open&&<><div className="flex flex-wrap items-center gap-3"><div className="w-56"><Select items={pages} value={path} onValueChange={v=>v&&setPath(v)}><SelectTrigger aria-label="字号预览页面"><SelectValue/></SelectTrigger><SelectPopup>{pages.map(p=><SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectPopup></Select></div><div className="flex gap-2" aria-label="预览视窗宽度">{[390,768,1024].map(w=><Button key={w} variant={w===width?'secondary':'outline'} aria-pressed={w===width} onClick={()=>setWidth(w)}>{w}px</Button>)}</div></div><div className="max-w-full overflow-x-auto rounded-lg border bg-secondary p-3"><iframe title="字号响应式验证窗口" src={path} style={{width}} className="box-content h-[42rem] max-w-none rounded-md border bg-background"/></div></>}
  </section>
}
