"use client"
import { useEffect, useId, useReducer, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, ChartNoAxesCombined, ClipboardCheck, FileText, History, Plus, School, Settings2, ShieldCheck, Sparkles, SquarePen, X } from 'lucide-react'
import { WorkbenchShell, type ShellNavigationItem } from '@/components/prism-next/skeletons/workbench-shell'
import { AgentPageSkeleton } from '@/components/prism-next/skeletons/agent-page'
import { PrismSignature, ExpressionSwitch } from '@/components/prism-next/expression'
import { AgentComposer } from '@/components/prism-next/agent-components'
import { Button } from '@/components/coss/button'
import { Input } from '@/components/coss/input'
import { Label } from '@/components/coss/label'
import { Badge } from '@/components/prism-next/badge'
import { Spinner } from '@/components/coss/spinner'
import { Switch } from '@/components/coss/switch'
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from '@/components/coss/select'
import { Menu, MenuTrigger, MenuPopup, MenuItem } from '@/components/coss/menu'
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogPanel } from '@/components/coss/dialog'
import { reviewNotifications, reviewUsage } from './workbench-fixtures'
import { useActivityMonitorFixture } from './activity-monitor-fixture'
import { useReviewBasket, type ReviewBasketAdapter } from './review-basket'
import { conversationReducer, demoConversations, demoReply, type DemoConversation } from './agent-review-model'

const navigation:ShellNavigationItem[]=[{id:'agent',label:'Agent',icon:<Sparkles/>},{id:'records',label:'工作记录',icon:<History/>},{id:'grading',label:'批阅与解析',icon:<ClipboardCheck/>},{id:'papers',label:'组卷',icon:<BookOpen/>},{id:'analysis',label:'学情分析',icon:<ChartNoAxesCombined/>}]
const scenarios=[{value:'normal',label:'正常回复'},{value:'failed',label:'失败恢复'},{value:'long',label:'长回复'}]
const starters=['用一道题解释二次函数的最小值','把一段教学说明改成清楚的课堂提问']

/** One review fixture, reused by the design-system Site and workbench adapter. */
export function AgentReview({returnHref='/next/skeletons',returnLabel='页面骨架',basket:externalBasket,onNavigate}: {returnHref?:string;returnLabel?:string;basket?:ReviewBasketAdapter;onNavigate?:(id:string)=>void}) {
 const [candidate,setCandidate]=useState(true)
 const monitor = useActivityMonitorFixture()
 const [conversations,dispatch]=useReducer(conversationReducer,demoConversations)
 const [active,setActive]=useState('new'), [historyQuery,setHistoryQuery]=useState(''), [query,setQuery]=useState('')
 const [notices,setNotices]=useState(reviewNotifications), [scenario,setScenario]=useState('normal'), [longName,setLongName]=useState(false)
 const [dialog,setDialog]=useState<'conditions'|'sources'|null>(null), [notice,setNotice]=useState('')
 const sequence=useRef(0), timers=useRef(new Map<string,ReturnType<typeof setTimeout>>()), overlayTrigger=useRef<HTMLButtonElement|null>(null)
 const inputRegion=useRef<HTMLDivElement>(null), end=useRef<HTMLDivElement>(null)
 const current=conversations.find(c=>c.id===active) ?? conversations[0]
 const pending=current.messages.find(m=>m.state==='replying')
 const {basket,sampleAction,panel:basketPanel}=useReviewBasket(externalBasket)
 const shown=conversations.filter(c=>(c.messages.length||c.draft.trim())&&`${c.title} ${c.messages.map(m=>m.text).join(' ')}`.includes(historyQuery.trim()))
 useEffect(()=>{
  const pendingIds=new Set<string>()
  for(const c of conversations)for(const m of c.messages)if(m.state==='replying') {
   pendingIds.add(m.id)
   if(!timers.current.has(m.id))timers.current.set(m.id,setTimeout(()=>dispatch({type:'settle',id:c.id,messageId:m.id,state:scenario==='failed'?'failed':'ready',text:scenario==='failed'?'这次演示回复未能生成。原请求与材料已保留，可重试。':scenario==='long'?Array.from({length:6},(_,i)=>`${i+1}. 条件、理由与结论\n${demoReply}`).join('\n\n'):demoReply}),4000))
  }
  for(const [id,timer] of timers.current)if(!pendingIds.has(id)){clearTimeout(timer);timers.current.delete(id)}
 },[conversations,scenario])
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[])
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'})},[active,current.messages.length])
 const focusInput=()=>requestAnimationFrame(()=>inputRegion.current?.querySelector('textarea')?.focus({preventScroll:true}))
 function suggest(value:string){dispatch({type:'draft',id:current.id,value});focusInput()}
 function newConversation(){const id=`conversation-${++sequence.current}`;dispatch({type:'new',id});setActive(id);setHistoryQuery('');setNotice('');focusInput()}
 function submit(){if(!current.draft.trim()||pending)return;dispatch({type:'send',id:current.id,messageId:`reply-${++sequence.current}`});setNotice('')}
 function openDialog(value:'conditions'|'sources',trigger:HTMLButtonElement){overlayTrigger.current=trigger;setDialog(value)}
 function navigate(id:string){if(id==='agent'){setNotice('当前为 Agent 页面骨架。');return}if(onNavigate)onNavigate(id);else setNotice(`${navigation.find(n=>n.id===id)?.label ?? '个人页面'}沿用原业务入口。本评审仅实现第2项 Agent 骨架。`)}
 const context=(close:()=>void)=><ConversationDirectory shown={shown} active={active} historyQuery={historyQuery} setHistoryQuery={setHistoryQuery} onNew={newConversation} onSelect={id=>{setActive(id);setNotice('')}} close={close}/>
 const messageContent=<div className="space-y-8" aria-label="当前对话消息">{current.messages.map(m=><article key={m.id} aria-label={m.role==='user'?'我的消息':'Agent 回复'} className={m.role==='user'?'ml-auto max-w-[90%] space-y-2':'space-y-3'}>
  <p className="text-ui-hint text-muted-foreground">{m.role==='user'?'我':'Agent · 固定示例回复'}</p>
  {m.state==='replying'?<div role="status" className="flex items-center gap-2 text-ui-hint text-muted-foreground"><Spinner/>正在演示回复…</div>:<p className="text-read-body whitespace-pre-wrap break-words">{m.text}</p>}
  {m.material&&m.role==='user'&&<Badge variant="outline"><FileText/>二次函数课堂材料 · 示例</Badge>}
  {m.role==='assistant'&&m.state==='ready'&&<>
   {m.material&&<div className="space-y-4"><div className="overflow-x-auto py-2" aria-label="f(x) 等于 (x 减 1) 的平方，大于等于 0"><math display="block"><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><msup><mrow><mo>(</mo><mi>x</mi><mo>−</mo><mn>1</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>≥</mo><mn>0</mn></math></div><p className="text-read-body">当 <math><mi>x</mi><mo>=</mo><mn>1</mn></math> 时取等号。此处为已有材料的固定样例，没有生成或发布业务成果。</p>{sampleAction}</div>}
   <Button variant="ghost" size="sm" onClick={e=>openDialog('sources',e.currentTarget)}><ShieldCheck/>{m.material?'查看本轮材料与来源':'本轮未检索业务资料'}</Button>
  </>}
  {(m.state==='failed'||m.state==='stopped')&&<div className="flex flex-wrap items-center gap-3"><Badge variant={m.state==='failed'?'error':'outline'}>{m.state==='failed'?'回复失败':'已停止回复'}</Badge><Button variant="outline" size="sm" disabled={!!pending||!!current.draft.trim()} onClick={()=>{const original=current.messages[current.messages.indexOf(m)-1];setScenario('normal');dispatch({type:'material',id:current.id,value:!!original.material});suggest(original.text)}}>带回原请求</Button></div>}
 </article>)}<div ref={end}/></div>
 const composer=<div ref={inputRegion}><AgentComposer inputSize={current.messages.length?'compact':'default'} variant="conversation" toolbarLayout="inline" label="给 Agent 的消息" value={current.draft} onChange={value=>dispatch({type:'draft',id:current.id,value})} maxLength={4000} running={!!pending} onSubmit={submit} onStop={()=>pending&&dispatch({type:'settle',id:current.id,messageId:pending.id,state:'stopped',text:'回复已停止，未产生业务成果。'})} submitLabel="发送消息" placeholder="说说你想讨论的问题，也可以引用示例材料…"
  attachments={current.material&&<div className="flex min-w-0 gap-2"><Badge variant="outline" className="whitespace-normal"><FileText/>二次函数课堂材料</Badge><Button variant="ghost" size="icon-sm" aria-label="移除本次材料" disabled={!!pending} onClick={()=>dispatch({type:'material',id:current.id,value:false})}><X/></Button></div>}
  tools={<><Menu><MenuTrigger render={<Button variant="ghost" size="icon" aria-label="添加本次材料" disabled={!!pending}/> }><Plus/></MenuTrigger><MenuPopup side="top"><MenuItem onClick={()=>dispatch({type:'material',id:current.id,value:true})}><FileText/>引用示例材料</MenuItem></MenuPopup></Menu><Button variant="ghost" size="sm" onClick={e=>openDialog('sources',e.currentTarget)}>模型未接入</Button></>}
  footerNote={<div className="flex flex-wrap justify-between gap-2"><span>本页演示 · 回复不代表任务完成</span><span>Ctrl / ⌘ + Enter</span></div>}/></div>
 return <><WorkbenchShell contentLayout="workspace" organization={{name:longName?'启明实验学校教育集团高中部数学教研中心（东湖校区）':'启明实验学校',description:'教师工作台 · 组织示例',mark:<School className="size-6"/>}} user={{name:'王建国',role:'数学教师',initials:'王'}} navigation={navigation} activeId="agent" onNavigate={navigate} onPersonal={()=>setNotice('个人页面入口已触发。第7项未启动。')} context={{label:'对话目录',content:context}} basket={basket}
 search={{query,onQueryChange:setQuery,results:conversations.filter(c=>c.messages.length).map(c=>({id:c.id,title:c.title,description:'仅本页示例对话',type:'对话'})),status:'ready',sourceLabel:'演示数据',scopeLabel:'仅本页对话，未检索生产资料',onSelect:id=>{setActive(id);setNotice('已打开示例对话。')}}}
 notifications={{items:notices,sourceLabel:'演示通知 · 与对话状态独立',onRead:id=>setNotices(ns=>ns.map(n=>n.id===id?{...n,read:true}:n)),onReadAll:()=>setNotices(ns=>ns.map(n=>({...n,read:true})))}}
 monitor={monitor} usage={{accounts:reviewUsage('disabled'),sourceLabel:'未接入账户服务，无可核实余额。'}}>
  <AgentPageSkeleton expression={candidate?"candidate":"default"} title={current.messages.length?current.title:'新对话'} meta={current.messages.length?'仅本页演示会话':undefined} empty={!current.messages.length} notice={notice} actions={<><ExpressionSwitch candidate={candidate} onChange={setCandidate}/><Button variant="ghost" size="icon-sm" render={<a href={returnHref}/>} aria-label={returnLabel}><ArrowLeft/></Button><Button variant="ghost" size="icon-sm" aria-label="演示条件" onClick={e=>openDialog('conditions',e.currentTarget)}><Settings2/></Button></>}
   welcome={candidate?<div className="expression-welcome"><div className="expression-welcome-copy"><p className="text-ui-hint text-muted-foreground">王老师，你好</p><h2 className="text-section-title">今天，想从哪件事开始？</h2><p className="text-read-body text-muted-foreground">带上一个问题，或一件想推进的工作。</p></div><PrismSignature/></div>:<div className="space-y-4"><p className="flex items-center gap-2 text-ui-hint text-muted-foreground"><Sparkles className="size-4 text-info-foreground"/>王老师，你好</p><h2 className="text-page-title">今天，想从哪件事开始？</h2><p className="text-ui-hint text-muted-foreground">带上一个问题，或一件想推进的工作。</p></div>}
   messages={messageContent} composer={composer} suggestions={<div className="mt-5 space-y-2" aria-label="开始对话的建议"><p className="text-ui-hint text-muted-foreground">试着这样开始 · 可修改后发送</p><div className={candidate?"expression-starters":"space-y-2"}>{starters.map(s=><Button key={s} variant="ghost" className="h-auto sm:h-auto w-full justify-between gap-3 py-2 whitespace-normal text-left" onClick={()=>suggest(s)}><span>{s}</span><ArrowRight className="shrink-0"/></Button>)}</div></div>}/>
 </WorkbenchShell>{basketPanel}
 <Dialog open={!!dialog} onOpenChange={open=>{if(!open)setDialog(null)}}><DialogPopup data-agent-overlay="true" finalFocus={()=>overlayTrigger.current} closeProps={{'aria-label':'关闭 Agent 面板'}}><DialogHeader><DialogTitle>{dialog==='conditions'?'演示条件':'材料与模型'}</DialogTitle><DialogDescription>{dialog==='conditions'?'第2项 · Agent 页面骨架 v0.1。第3—7项未启动。':'仅使用本页固定样例，不读取组织生产资料。'}</DialogDescription></DialogHeader><DialogPanel>{dialog==='conditions'?<div className="space-y-6"><div className="space-y-2"><Label>下一轮回复</Label><Select items={scenarios} value={scenario} disabled={conversations.some(c=>c.messages.some(m=>m.state==='replying'))} onValueChange={v=>v&&setScenario(v)}><SelectTrigger aria-label="下一轮回复"><SelectValue/></SelectTrigger><SelectPopup>{scenarios.map(s=><SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectPopup></Select></div><div className="flex items-center justify-between gap-4"><Label htmlFor="agent-long-org">长组织名称</Label><Switch id="agent-long-org" checked={longName} onCheckedChange={setLongName}/></div><p className="text-ui-hint text-muted-foreground">发送后演示约 4 秒回复状态，可随时停止。历史选择、输入草稿与材料仅保留在本页会话；刷新恢复初始示例。</p></div>:<dl className="space-y-5 text-ui-hint"><div><dt className="font-medium">可用材料</dt><dd className="text-muted-foreground">二次函数课堂材料 · 人工构造示例。通过输入区加号引用后，随本轮请求呈现。</dd></div><div><dt className="font-medium">模型与处理</dt><dd className="text-muted-foreground">语言模型未接入。回复为本地固定文本，不代表已进行 AI 推理、检索或后台业务执行。</dd></div><div><dt className="font-medium">资料边界</dt><dd className="text-muted-foreground">学校资料、教师真实对话与业务记录均未读取。本页不会创建、保存或发布试卷等业务成果。</dd></div></dl>}</DialogPanel></DialogPopup></Dialog>
 </>
}

function ConversationDirectory({shown,active,historyQuery,setHistoryQuery,onNew,onSelect,close}:{shown:DemoConversation[];active:string;historyQuery:string;setHistoryQuery:(v:string)=>void;onNew:()=>void;onSelect:(id:string)=>void;close:()=>void}) {
 const searchId=useId()
 return <div className="space-y-5">
  <Button variant="ghost" className="w-full justify-start" onClick={()=>{onNew();close()}}><SquarePen/>发起新对话</Button>
  <div className="space-y-2"><Label htmlFor={searchId}>搜索本页对话</Label><Input id={searchId} placeholder="标题或内容" value={historyQuery} onChange={e=>setHistoryQuery(e.target.value)}/></div>
  <nav aria-label="对话列表" className="space-y-2"><p className="px-3 text-ui-hint text-muted-foreground">最近对话 · 本页示例</p>{shown.map(c=><Button key={c.id} variant={c.id===active?'secondary':'ghost'} className="h-auto sm:h-auto w-full justify-start py-2 text-left whitespace-normal" aria-current={c.id===active?'page':undefined} onClick={()=>{onSelect(c.id);close()}}><span className="min-w-0 break-words">{c.title}</span>{c.messages.some(m=>m.state==='replying')&&<Spinner className="shrink-0"/>}</Button>)}{!shown.length&&<p role="status" className="px-3 text-ui-hint text-muted-foreground">没有匹配的对话。</p>}</nav>
  <p className="px-3 text-ui-hint text-muted-foreground">仅本次页面会话，刷新后恢复示例。</p>
 </div>
}
