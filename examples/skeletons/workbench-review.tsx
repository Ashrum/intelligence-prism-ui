"use client"

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, BookOpen, ChartNoAxesCombined, ClipboardCheck, History, School, ShoppingBasket, Sparkles, X } from 'lucide-react'
import { WorkbenchShell, type ShellNavigationItem } from '@/components/prism-next/skeletons/workbench-shell'
import { taskLabels, type TaskState } from '@/components/prism-next/skeletons/workbench-model'
import { Button } from '@/components/coss/button'
import { Badge } from '@/components/prism-next/badge'
import { Label } from '@/components/coss/label'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/coss/select'
import { Switch } from '@/components/coss/switch'
import { QuestionWorkPanel } from '@/components/prism-next/question-work-panel'
import { reviewNotifications, reviewSearch, reviewTasks, reviewUsage } from './workbench-fixtures'
import './workbench-review.css'

const navigation: ShellNavigationItem[] = [
 {id:'agent',label:'Agent',icon:<Sparkles />}, {id:'records',label:'工作记录',icon:<History />}, {id:'grading',label:'批阅与解析',icon:<ClipboardCheck />}, {id:'papers',label:'组卷',icon:<BookOpen />}, {id:'analysis',label:'学情分析',icon:<ChartNoAxesCombined />},
]
export type ReviewBasketAdapter = { open: boolean; position: 'right'|'bottom'; empty: boolean; sampleAction: ReactNode }
export function WorkbenchReview({ returnHref='/next/skeletons', returnLabel='页面骨架', basket: externalBasket }: { returnHref?: string; returnLabel?: string; basket?: ReviewBasketAdapter }) {
 const [active, setActive] = useState('agent')
 const [query, setQuery] = useState('')
 const [notices, setNotices] = useState(reviewNotifications)
 const [taskState, setTaskState] = useState<TaskState>('running')
 const [connection, setConnection] = useState<'connected'|'offline'|'unavailable'>('unavailable')
 const [usageState, setUsageState] = useState<'enabled'|'disabled'|'unavailable'>('disabled')
 const [longName, setLongName] = useState(false)
 const [context, setContext] = useState(false)
 const [dense, setDense] = useState(false)
 const [announcement, setAnnouncement] = useState('')
 const [basketOpen, setBasketOpen] = useState(false)
 const [selected, setSelected] = useState(false)
 const [wide, setWide] = useState(true)
 const launcher = useRef<HTMLButtonElement>(null)
 const sample = useRef<HTMLElement>(null)
 useEffect(() => { const media=window.matchMedia('(min-width:1100px), (min-width:560px) and (max-height:500px)'); const sync=()=>setWide(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync) },[])
 const basket = externalBasket ?? { open:basketOpen, empty:!selected, position:wide?'right' as const:'bottom' as const }
 function choose(id: string) {
  if (id === 'material') { setAnnouncement('已定位本页演示材料。'); sample.current?.scrollIntoView({block:'nearest'}); return }
  setActive(id); setAnnouncement(`当前入口：${navigation.find(item=>item.id===id)?.label}。本轮仅验证导航状态，业务页保持未启动。`)
 }
 const sideContent = (close: () => void) => <nav aria-label="内容样例目录" className="flex flex-col gap-2"><p className="mb-3 px-3 text-xs text-muted-foreground">当前页面</p>{['阅读样例','中文与公式','密集内容'].map((label,index)=><Button key={label} variant="ghost" className="justify-start" onClick={()=>{sample.current?.scrollIntoView({block:'start'});setDense(index===2);setAnnouncement(`已选择${label}。`);close()}}>{label}</Button>)}</nav>
 return <>
 <WorkbenchShell organization={{ name:longName?'启明实验学校教育集团高中部数学教研中心（东湖校区）':'启明实验学校', description:'教师工作台 · 组织示例', mark:<School className="size-6" /> }} user={{name:'王建国',role:'数学教师',initials:'王'}} navigation={navigation} activeId={active} onNavigate={choose} onPersonal={()=>setAnnouncement('个人页面入口已触发。第7项尚未启动，本轮不提供个人页面正文。')}
  search={{query,onQueryChange:setQuery,results:reviewSearch,status:'ready',sourceLabel:'演示数据',scopeLabel:'5 个业务入口与 1 份本页材料',onSelect:choose}}
  notifications={{items:notices,sourceLabel:'仅本次评审的演示通知；已读不改变任务状态。',onRead:id=>setNotices(items=>items.map(item=>item.id===id?{...item,read:true}:item)),onReadAll:()=>setNotices(items=>items.map(item=>({...item,read:true})))}}
  monitor={{tasks:reviewTasks(taskState),connection,sourceLabel:'演示状态 · 未连接真实调度或监控服务'}} usage={{accounts:reviewUsage(usageState),sourceLabel:'全部为展示示例，未接入真实账户或计费。'}} context={context?{label:'内容目录',content:sideContent}:undefined} basket={basket}
  auxiliaryLabel="评审条件" auxiliary={<div className="space-y-5">
    <div className="space-y-4"><div className="flex items-center justify-between gap-3"><Label htmlFor="review-long-organization">长组织名称</Label><Switch id="review-long-organization" aria-label="长组织名称" checked={longName} onCheckedChange={setLongName} /></div><div className="flex items-center justify-between gap-3"><Label htmlFor="review-context">上下文侧栏</Label><Switch id="review-context" aria-label="上下文侧栏" checked={context} onCheckedChange={setContext} /></div><div className="flex items-center justify-between gap-3"><Label htmlFor="review-density">密集内容</Label><Switch id="review-density" aria-label="密集内容" checked={dense} onCheckedChange={setDense} /></div></div>
    <ReviewSelect label="后台任务" value={taskState} options={Object.entries(taskLabels).map(([value,label])=>({value,label}))} onChange={v=>setTaskState(v as TaskState)} />
    <ReviewSelect label="服务连接（演示）" value={connection} options={[{value:'unavailable',label:'未接入'},{value:'connected',label:'已连接'},{value:'offline',label:'已断开'}]} onChange={v=>setConnection(v as typeof connection)} />
    <ReviewSelect label="积分与 token 示例" value={usageState} options={[{value:'disabled',label:'未启用'},{value:'enabled',label:'开启示例数据'},{value:'unavailable',label:'暂不可用'}]} onChange={v=>setUsageState(v as typeof usageState)} />
    <div className="space-y-2"><p className="text-sm font-medium">通知样例</p><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={()=>setNotices([])}>空通知</Button><Button variant="ghost" size="sm" onClick={()=>setNotices(reviewNotifications)}>恢复示例</Button></div></div>
    <p className="text-xs text-muted-foreground leading-relaxed">第1项 · 总骨架 v0.2 候选<br />第2—7项未启动</p>
  </div>}>
   <header className="mb-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" size="sm" render={<a href={returnHref} />}><ArrowLeft />{returnLabel}</Button><Badge variant="outline">演示数据</Badge></div>
    <h1 className="text-2xl font-semibold tracking-tight">教师工作台总骨架</h1>
    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">公共功能使用演示数据，主题设置真实生效。</p>
   </header>
   <p role="status" className={announcement?'mb-5 text-sm text-info-foreground leading-relaxed':'sr-only'}>{announcement}</p>
   <section ref={sample} aria-labelledby="review-sample-title" className="review-material space-y-4">
    <div><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">阅读样例 · 高中数学</p>{externalBasket?.sampleAction ?? <Button size="sm" variant="outline" onClick={()=>setSelected(value=>!value)}>{selected?'移出示例题':'加入示例题'}</Button>}</div><h2 id="review-sample-title" className="text-xl font-semibold leading-relaxed">函数与不等式：从条件整理到结论核对的课堂材料</h2><p className="mt-2 text-xs text-muted-foreground">示例材料 · 2026.09.19</p></div>
    <p className="text-base leading-8">在整理课堂材料时，先明确变量的取值范围，再检查每一次变形是否满足条件。较长的中文说明应该自然换行；公式需要与上下文保持清楚的阅读关系。</p>
    <div className="review-equation py-3" aria-label="已知函数 f(x) 等于 x 的平方减 2x 加 1，且 x 为实数，则 f(x) 大于等于 0。"><math display="block"><mrow><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn><mo>=</mo><msup><mrow><mo>(</mo><mi>x</mi><mo>−</mo><mn>1</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>≥</mo><mn>0</mn></mrow></math></div>
    <div><h3 className="text-sm font-semibold">核对时关注</h3><ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-7"><li>定义域是否在文字与公式中保持一致。</li><li>取等号的条件是否完整，例如本题中 <math><mi>x</mi><mo>=</mo><mn>1</mn></math>。</li><li>结论是否有明确依据，而不是仅依据表面相似的形式。</li></ol></div>
   </section>
   {dense && <section className="review-material mt-6 border-t pt-6"><h2 className="text-sm font-semibold">密集阅读样例</h2><ol className="mt-4 space-y-5">{Array.from({length:8},(_,i)=><li key={i} className="flex gap-4 text-sm leading-7"><span className="shrink-0 min-w-[2ch] text-muted-foreground tabular-nums">{String(i+1).padStart(2,'0')}</span><p><strong className="font-medium">条件、过程与结论的核对。</strong> 这是一段较长的中文说明，用于检验内容区独立滚动、连续阅读和窄屏自然换行。页面不要求所有内容都装入卡片，保持文字与数学表达的清晰关系。</p></li>)}</ol></section>}
 </WorkbenchShell>
 {!externalBasket && <>
  <div className="review-basket-launcher"><Button ref={launcher} size="lg" variant="outline" className="w-36" aria-controls="shell-review-basket" aria-expanded={basketOpen} aria-label={`${basketOpen?'收起':'打开'}试题篮，${selected?1:0} 道题`} onClick={()=>setBasketOpen(value=>!value)}><ShoppingBasket />{basketOpen?'收起题篮':'试题篮'}<Badge variant="info-solid" size="sm">{selected?1:0}</Badge></Button></div>
  <QuestionWorkPanel id="shell-review-basket" open={basketOpen} position={wide?'right':'bottom'} title="试题篮" description="演示题篮 · 可继续在正文选题" initialFocus={false} finalFocus={()=>document.querySelector('.workbench-shell[data-shell-panel]') ? false : launcher.current ?? false} showCloseButton={false} onClose={()=>setBasketOpen(false)} className={`review-basket-panel workbench-basket-panel workbench-basket-${wide?'right':'bottom'}${selected?'':' workbench-basket-empty'}`} footerVariant="bare" footer={<div className="h-10" />}>
   {selected ? <div className="space-y-4"><div className="flex items-center justify-between gap-3"><Badge variant="outline">示例题</Badge><Button size="icon" variant="ghost" aria-label="移出示例题" onClick={()=>{setSelected(false);launcher.current?.focus()}}><X /></Button></div><p className="text-base leading-8">已知 <math><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn></math>，求函数的最小值。</p><p className="text-sm text-muted-foreground">仅验证选题与空间，本页不进入编辑发布流程。</p></div> : <p className="py-2 text-sm text-muted-foreground leading-relaxed">还没有选题。可在正文中加入示例题，页面保持可操作。</p>}
  </QuestionWorkPanel>
 </>}
 </>
}
function ReviewSelect({label,value,options,onChange}:{label:string;value:string;options:{value:string;label:string}[];onChange:(value:string)=>void}) {
 return <div className="space-y-2"><Label>{label}</Label><Select items={options} value={value} onValueChange={next=>{if(next)onChange(next)}}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectPopup>{options.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectPopup></Select></div>
}
