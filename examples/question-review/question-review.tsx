"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from "react"
import { PanelLeftOpen, ArrowLeft, ArrowUp, ChevronLeft, ChevronRight, CircleHelp, Scan, RotateCw, Minus, Plus, MoreHorizontal, FileImage, Maximize, Minimize, Layers, PencilLine } from "lucide-react"
import { Button } from "@/components/prism-next/button"
import { paperDimensions, paperZoomPercent, rotatedPaperDimensions, clampPaperZoom, type PaperPreviewZoom, type PaperPreviewRotation } from "@/components/prism-next/paper-preview"
import { ReviewTools } from "@/examples/review-tools/review-tools"
import type { ReviewToolsPosition } from "@/examples/review-tools/review-tools"
import { Toggle } from "@/components/coss/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/components/coss/toolbar"
import { TooltipProvider } from "@/components/coss/tooltip"
import { Avatar, AvatarFallback } from "@/components/coss/avatar"
import { Tabs, TabsList, TabsTab } from "@/components/coss/tabs"
import { Badge as CossBadge } from "@/components/coss/badge"
import { PAPER_REVIEW_BEST_WIDTH, railBand, railCollapsedForWidth, railPreferenceKeys, readRailPreferences, type RailPreferences } from "./rail-preferences"
import { Kbd } from "@/components/coss/kbd"
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator } from "@/components/coss/menu"
import { Dialog, DialogPopup, DialogTitle, DialogDescription, DialogHeader, DialogPanel } from "@/components/coss/dialog"
import { reviewQuestions, knowledgePoints, classStudents, answersForQuestion, filterAnswers, filterQuestions, filterKnowledge, reviewSelection } from "./fixture"
import { questionImage, answerImage } from "./artwork"
import { QuestionJump, StudentJump, QuestionKnowledgeRail, QuestionInspector, StudentLabel, Tip } from "./parts"
import { dockPaperToolbar } from "../paper-review/paper-toolbar-layout"
import { QuestionPaperCanvas } from "./question-paper-canvas"
import "../paper-review/paper-review.css"
import "./question-review.css"

export const shortcuts = [["← / →", "上一位 / 下一位学生作答"], ["↑ / ↓", "左栏上一条 / 下一条"], ["Enter", "定位所选条目"], ["N", "下一道高失分题"], ["[ / ]", "上一题 / 下一题"], ["G", "题目跳转面板"], ["S", "学生跳转面板"], ["K", "切换题目 / 知识点视角"], ["H", "回到题目页"], ["+ / −", "放大 / 缩小"], ["0", "切换适合宽度 / 适合页面"], ["R", "旋转 90°"], ["L", "开关标注层"], ["O（按住）", "临时查看扫描原稿"], ["F / Esc", "切换沉浸 / 退出沉浸"], ["T", "显示 / 隐藏题目栏"], ["?", "打开快捷键表"]]
export function QuestionReviewDesign() {
 const [device,setDevice]=useState('auto'),[scale,setScale]=useState(1)
 const [selected,setSelected]=useState('q17'),[studentId,setStudentId]=useState(classStudents[0].id)
 const [view,setView]=useState('questions'),[knowledgeId,setKnowledgeId]=useState<string|null>(null),[filter,setFilter]=useState('all'),[answerFilter,setAnswerFilter]=useState('all')
 const [markedPoints,setMarkedPoints]=useState<string[]>([]),[page,setPage]=useState(0),[missing,setMissing]=useState(false)
 const [zoom,setZoom]=useState<PaperPreviewZoom>('width'),[rotations,setRotations]=useState<Record<string,PaperPreviewRotation>>({})
 const [mode,setMode]=useState('marked'),[layer,setLayer]=useState(true),[holdOriginal,setHoldOriginal]=useState(false)
 const [help,setHelp]=useState(false),[notice,setNotice]=useState(''),[mobilePane,setMobilePane]=useState('canvas'),[immersive,setImmersive]=useState(false)
 const [viewport,setViewport]=useState({width:600,height:650}),[reviewPosition,setReviewPosition]=useState<ReviewToolsPosition>()
 const [questionOpen,setQuestionOpen]=useState(false),[studentOpen,setStudentOpen]=useState(false)
 const questionTrigger=useRef<HTMLButtonElement>(null),studentTrigger=useRef<HTMLButtonElement>(null)
 const [railState,setRailState]=useState<{width:number;preferences:RailPreferences;ready:boolean;animate:boolean}>({width:PAPER_REVIEW_BEST_WIDTH,preferences:{},ready:false,animate:false})
 const railCollapsed=railCollapsedForWidth(railState.width,railState.preferences)
 const closeRail=useRef<HTMLButtonElement>(null),openRail=useRef<HTMLButtonElement>(null),railFocus=useRef(false)
 const [dockPosition,setDockPosition]=useState({left:0,top:8,maxHeight:600})
 const canvasArea=useRef<HTMLElement>(null),toolbar=useRef<HTMLDivElement>(null),mobileNav=useRef<HTMLElement>(null)
 const stage=useRef<HTMLDivElement>(null),frame=useRef<HTMLElement>(null),canvas=useRef<HTMLDivElement>(null)
 const [location,setLocation]=useState({id:'question',request:0})
 const q=reviewQuestions.find(q=>q.id===selected)!,knowledge=view==='knowledge'?knowledgePoints.find(k=>k.id===knowledgeId)??null:null
 const answers=useMemo(()=>answersForQuestion(q),[q]),visibleAnswers=useMemo(()=>filterAnswers(answers,answerFilter),[answers,answerFilter])
 const answer=visibleAnswers.find(a=>a.student.id===studentId)??visibleAnswers[0]
 const original=mode==='original'||holdOriginal
 const pageId=page===0?'question':visibleAnswers[page-1]?.student.id??'question'
 const rotation=rotations[pageId]??0,percent=paperZoomPercent(zoom,viewport,rotatedPaperDimensions(paperDimensions(),rotation))
 useEffect(()=>{const params=new URLSearchParams(window.location.search),s=reviewSelection(params);setSelected(s.question);setStudentId(s.student);if(params.has('student'))setLocation({id:s.student,request:1})},[])
  useLayoutEffect(() => {
    const node = stage.current
    if (!node) return
    const measure = () => setScale(device === 'auto' ? 1 : Math.min(1, node.clientWidth / Number(device), node.clientHeight / (device === '1440' ? 900 : 1080)))
    measure(); const observer = new ResizeObserver(measure); observer.observe(node)
    return () => observer.disconnect()
  }, [device])
  useLayoutEffect(() => {
    const dock = canvasArea.current, nav = mobileNav.current
    if (!dock || !nav) return
    const measure = () => {
      const rect = dock.getBoundingClientRect()
      // The narrow layout hides the canvas on other panes; use reserved nav space there.
      const fallback = nav.getBoundingClientRect()
      const triggerSize = document.querySelector<HTMLElement>('.review-tools-trigger')?.offsetWidth ?? 32
      const next: ReviewToolsPosition = { horizontal: 'right', vertical: 'bottom', offsetX: window.innerWidth - (rect.width ? rect.right - 16 : fallback.right - 16), offsetY: window.innerHeight - (rect.height ? rect.bottom - 16 : fallback.top + (fallback.height + triggerSize) / 2) }
      setReviewPosition(previous => previous?.offsetX === next.offsetX && previous?.offsetY === next.offsetY ? previous : next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(dock); observer.observe(nav); observer.observe(stage.current!)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [device, scale, immersive, mobilePane, railCollapsed])
  useLayoutEffect(() => {
    const node = frame.current
    if (!node) return
    const preferences = readRailPreferences()
    const measure = () => {
      // clientWidth is the logical frame width, independent of device-preview scale.
      const width = node.clientWidth
      setRailState(previous => ({ ...previous, width, preferences: previous.ready ? previous.preferences : preferences, ready: true, animate: railBand(previous.width) === railBand(width) && previous.animate }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [device])
  function resetRailPreferences() {
    for (const key of Object.values(railPreferenceKeys)) {
      try { localStorage.removeItem(key) } catch { /* Optional storage. */ }
    }
    setRailState(previous => ({ ...previous, preferences: {}, animate: false }))
    setMobilePane('canvas')
  }
  function toggleRail() {
    railFocus.current = true
    const next = !railCollapsed, band = railBand(railState.width)
    setRailState(previous => ({ ...previous, preferences: { ...previous.preferences, [band]: next }, animate: true }))
    setMobilePane(next ? 'canvas' : 'rail')
    try { localStorage.setItem(railPreferenceKeys[band], String(next)) } catch { /* Rendering never depends on storage. */ }
  }
  useLayoutEffect(() => {
    if (railCollapsed) setMobilePane(previous => previous === 'rail' ? 'canvas' : previous)
    if (railFocus.current && !immersive) {
      ;(railCollapsed ? openRail.current : closeRail.current)?.focus({ preventScroll: true })
      railFocus.current = false
    }
  }, [railCollapsed, immersive])
  useLayoutEffect(() => {
    const area = canvasArea.current, node = canvas.current, bar = toolbar.current
    if (!area || !bar) return
    const measure = () => {
      const bounds = area.getBoundingClientRect(), factor = scale || 1
      const papers = [...area.querySelectorAll<HTMLElement>('[data-review-page], [data-missing-paper]')]
      const right = papers.length ? Math.max(...papers.map(paper => paper.getBoundingClientRect().right)) : bounds.right - 64 * factor
      const size = dockPaperToolbar({ canvasWidth: area.clientWidth, paperRight: (right - bounds.left) / factor, toolbarWidth: bar.offsetWidth })
      const height = area.clientHeight, maxHeight = Math.max(44, height - 88 / factor - 16)
      const top = Math.max(8, Math.min((height - bar.offsetHeight) / 2, height - 88 / factor - 8 - bar.offsetHeight))
      setDockPosition(previous => previous.left === size.left && previous.top === top && previous.maxHeight === maxHeight ? previous : { left: size.left, top, maxHeight })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(area); observer.observe(bar)
    area.querySelectorAll<HTMLElement>('[data-review-page], [data-missing-paper]').forEach(paper => observer.observe(paper))
    node?.addEventListener('scroll', measure, { passive: true })
    return () => { observer.disconnect(); node?.removeEventListener('scroll', measure) }
  }, [zoom, rotations, viewport, scale, missing, immersive, railCollapsed, mobilePane, selected, answerFilter])
  useLayoutEffect(() => {
    // F may originate from a pane that immersion hides; retain keyboard ownership.
    if (immersive) (canvas.current ?? frame.current)?.focus({ preventScroll: true })
  }, [immersive])
  useEffect(() => {
    const clear = () => setHoldOriginal(false)
    const up = (event: globalThis.KeyboardEvent) => { if (event.key.toLowerCase() === 'o') clear() }
    window.addEventListener('keyup', up); window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear)
    return () => { window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear) }
  }, [])
 function locate(id:string){setMobilePane('canvas');setLocation(v=>({id,request:v.request+1}))}
 useEffect(()=>{const request=requestAnimationFrame(()=>{const node=canvas.current,paper=node?.querySelector<HTMLElement>(`[data-page-id="${location.id}"]`);if(node&&paper){node.scrollTo({top:node.scrollTop+(paper.getBoundingClientRect().top-node.getBoundingClientRect().top)/scale-56,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}});return()=>cancelAnimationFrame(request)},[location,selected,mobilePane,missing,viewport.width,viewport.height])
 function select(id:string){if(!reviewQuestions.some(q=>q.id===id))return;setSelected(id);setMarkedPoints([]);setQuestionOpen(false);setNotice('');setPage(0);locate('question')}
 function changeStudent(id:string){if(!visibleAnswers.some(a=>a.student.id===id))return;setStudentId(id);setStudentOpen(false);locate(id)}
 function changeView(next:string){setView(next);setFilter('all');if(next==='knowledge'&&!knowledgeId)setKnowledgeId(q.knowledge)}
 function selectKnowledge(id:string){setKnowledgeId(id);setView('knowledge')}
 function revealKnowledge(id:string){selectKnowledge(id);setFilter('all');if(railCollapsed)toggleRail();setMobilePane('rail')}
 function evidence(id:string,points:string[]){select(id);setMarkedPoints(points)}
 function stepQuestion(delta:number){const next=reviewQuestions[q.number-1+delta];if(next)select(next.id)}
 function stepStudent(delta:number){const index=visibleAnswers.findIndex(a=>a.student.id===answer.student.id),next=visibleAnswers[index+delta];if(next)changeStudent(next.student.id)}
 function stepRail(delta:number){const list=view==='questions'?filterQuestions(filter):filterKnowledge(filter),id=view==='questions'?q.id:knowledgeId,index=Math.max(0,list.findIndex(x=>x.id===id)),next=list[Math.max(0,Math.min(list.length-1,index+delta))];if(next){if(view==='questions')select(next.id);else selectKnowledge(next.id)}}
 function locateRail(){if(knowledge){const e=knowledge.evidence[0];evidence(e.question,e.points)}else locate('question')}
 function wrong(){const list=reviewQuestions.filter(q=>q.highLoss);select((list.find(item=>item.number>q.number)??list[0]).id)}
 function toggleFit(){setZoom(v=>v==='width'?'page':'width')}
 function rotate(){setRotations(v=>({...v,[pageId]:((rotation+90)%360) as PaperPreviewRotation}))}
 function intent(action:string){setNotice(`已请求：${action} · 第 ${q.number} 题 · ${answer.student.name}`)}
 function filterStudents(value:string){setAnswerFilter(value);const list=filterAnswers(answers,value);if(!list.some(a=>a.student.id===studentId)){setStudentId(list[0].student.id);locate(list[0].student.id)}}
 function keyboard(event:KeyboardEvent){const target=event.target as HTMLElement;if(questionOpen||studentOpen||event.defaultPrevented||event.nativeEvent.isComposing||event.altKey||event.ctrlKey||event.metaKey||target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],[role="menu"]')||(target.closest('[role="listbox"]')&&(!target.closest('[data-review-rail]')||['ArrowUp','ArrowDown','Enter'].includes(event.key))))return;if(target.closest('[role=tablist]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Enter',' '].includes(event.key))return;if(event.key==='Enter'&&target.closest('button,a,[role=tab]'))return;const key=event.key.toLowerCase();const actions:Record<string,()=>void>={arrowleft:()=>stepStudent(-1),arrowright:()=>stepStudent(1),arrowup:()=>stepRail(-1),arrowdown:()=>stepRail(1),enter:locateRail,n:wrong,'[':()=>stepQuestion(-1),']':()=>stepQuestion(1),g:()=>{setImmersive(false);setQuestionOpen(true)},s:()=>{setMobilePane('canvas');setStudentOpen(true)},k:()=>changeView(view==='questions'?'knowledge':'questions'),h:()=>locate('question'),'+':()=>setZoom(clampPaperZoom(percent*1.25)),'=':()=>setZoom(clampPaperZoom(percent*1.25)),'-':()=>setZoom(clampPaperZoom(percent*.8)),'0':toggleFit,r:rotate,l:()=>{if(!original&&!missing)setLayer(v=>!v)},o:()=>setHoldOriginal(true),f:()=>setImmersive(v=>!v),escape:()=>setImmersive(false),t:()=>{if(!immersive)toggleRail()},'?':()=>setHelp(true)};if(actions[key]){event.preventDefault();event.stopPropagation();if(!event.repeat||['arrowup','arrowdown','+','=','-','o'].includes(key))actions[key]()}}
 const pages=useMemo(()=>[{id:'question',imageUrl:questionImage(q),alt:`第 ${q.number} 题题目页、标准答案与评分点`,regions:q.points.map((p,i)=>({id:p.id,label:`评分点 ${i+1} · ${p.label}`,rect:[6,71+i*7.57,88,7] as [number,number,number,number],content:<span aria-hidden="true" className={`absolute inset-0 pointer-events-none ${markedPoints.includes(p.id)?'ring-2 ring-info':''}`}/>}))},...visibleAnswers.map(a=>({id:a.student.id,imageUrl:answerImage(q,a,!original&&layer,missing),alt:`第 ${q.number} 题 · ${a.student.name} · ${a.score} / ${q.max} · ${missing?'扫描图像未提供':original?'扫描原稿':'标注效果'}`,regions:[{id:a.student.id,label:`选择 ${a.student.name} 的作答`,rect:[0,0,100,100] as [number,number,number,number]}]}))],[q,visibleAnswers,markedPoints,original,layer,missing])
 const headers=useMemo(()=>Object.fromEntries(visibleAnswers.map(a=>[a.student.id,<StudentLabel key={a.student.id} answer={a}/>])),[visibleAnswers])
 const tool=(label:string,keys:string,icon:ReactElement,action:()=>void,disabled=false)=><Tip label={label} keys={keys}><ToolbarButton render={<Button variant="ghost" size="icon"/>} aria-label={label} onClick={action} disabled={disabled}>{icon}</ToolbarButton></Tip>
 return <TooltipProvider><main className="d1-review q1-review bg-background text-foreground"><ReviewTools device={device} onDeviceChange={setDevice} missing={missing} onMissingChange={setMissing} defaultPosition={reviewPosition} onResetRailPreferences={resetRailPreferences}/><div ref={stage} className="d1-stage bg-muted"><section ref={frame} aria-label="题目与知识点预览框架" tabIndex={-1} className="d1-frame bg-background" data-device={device} data-mobile-pane={mobilePane} data-immersive={immersive} data-rail-collapsed={railCollapsed} data-rail-ready={railState.ready} data-rail-animate={railState.animate} style={device==='auto'?undefined:{width:Number(device),height:device==='1440'?900:1080,transform:`scale(${scale})`}} onKeyDownCapture={keyboard} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setHoldOriginal(false)}}>
 <header className="d1-topbar flex items-center gap-4 border-b px-4"><Button variant="ghost" onClick={()=>intent('返回题目列表')} aria-label="返回题目列表"><ArrowLeft/><span className="d1-return-label">返回题目列表</span></Button><Avatar aria-hidden="true"><AvatarFallback>{q.number}</AvatarFallback></Avatar><div className="min-w-0"><h1 className="truncate text-section-title" title={`第 ${q.number} 题 · ${knowledgePoints.find(k=>k.id===q.knowledge)!.name}`}>第 {q.number} 题 <span className="d1-student-meta">· {knowledgePoints.find(k=>k.id===q.knowledge)!.name}</span></h1><p className="d1-student-meta text-ui-meta text-muted-foreground">{q.category==='subjective'?'主观题':q.type} · 满分 {q.max} 分 · {q.affected} / 36 名学生失分</p></div><QuestionJump current={q} open={questionOpen} onOpenChange={setQuestionOpen} onSelect={select} triggerRef={questionTrigger}/><div className="flex shrink-0 items-center gap-2"><span className="text-score-display">{q.rate}%</span><span className="d1-student-meta text-ui-meta text-muted-foreground">全班得分率</span></div><Menu><MenuTrigger render={<Button variant="ghost" size="icon"/>} aria-label="更多"><MoreHorizontal/></MenuTrigger><MenuPopup className="surface-floating" align="end"><MenuItem onClick={()=>intent('导出')}>导出</MenuItem><MenuSeparator/><MenuItem onClick={()=>setHelp(true)}><CircleHelp/>快捷键表<Kbd>?</Kbd></MenuItem></MenuPopup></Menu></header>
 <nav ref={mobileNav} className="d1-mobile-nav border-b px-3" aria-label="预览分区"><ToggleGroup value={[mobilePane]} onValueChange={v=>{if(v.length){if(v[0]==='rail'&&railCollapsed)toggleRail();else setMobilePane(v[0])}}}>{[['rail','题目'],['canvas','作答'],['inspector','检查器']].map(([value,label])=><ToggleGroupItem key={value} value={value}>{label}</ToggleGroupItem>)}</ToggleGroup></nav>
 <div className="d1-columns"><div className="d1-rail-shell" inert={railCollapsed}><QuestionKnowledgeRail view={view} onView={changeView} question={q} knowledge={knowledge} filter={filter} onFilter={setFilter} onQuestion={select} onKnowledge={selectKnowledge} onEvidence={evidence} onLocate={locateRail} onCollapse={toggleRail} closeRef={closeRail}/></div><section ref={canvasArea} data-review-canvas aria-label="题目与作答画布" className="d1-canvas bg-border"><div className="q1-canvas-controls absolute left-2 top-2 z-20 flex flex-wrap items-center gap-2">{railCollapsed&&!immersive&&<Tip label="展开题目栏" keys="T"><Button ref={openRail} variant="ghost" className="surface-floating" onClick={toggleRail} aria-label="展开题目栏"><PanelLeftOpen/>题目</Button></Tip>}<Tabs value={answerFilter} onValueChange={filterStudents} className="surface-floating"><TabsList size="sm" aria-label="学生作答筛选"><TabsTab value="all">全部 <CossBadge variant="outline">36</CossBadge></TabsTab><TabsTab value="loss">失分 <CossBadge variant="outline">{q.affected}</CossBadge></TabsTab><TabsTab value="pending">待复核 <CossBadge variant="outline">{q.pending}</CossBadge></TabsTab></TabsList></Tabs></div>
 <div className="d1-paper-host min-h-0 min-w-0 [&_[data-region]>button]:border-0! [&_[data-region]>button]:ring-offset-0!"><QuestionPaperCanvas viewportRef={canvas} pages={pages} zoom={zoom} rotations={rotations} selected={answer.student.id} activePage={answer.student.id} scale={scale} headers={headers} onSelect={id=>{if(id.startsWith('p'))setMarkedPoints([id]);else{setStudentId(id);setNotice('')}}} onZoom={setZoom} onVisiblePage={next=>{setPage(next);if(next>0&&visibleAnswers[next-1])setStudentId(visibleAnswers[next-1].student.id)}} onViewport={setViewport}/></div>
 <div className="d1-tool-dock rounded-r-xl shadow-lg" style={dockPosition}><div className="d1-tool-scroll"><Toolbar ref={toolbar} orientation="vertical" aria-label="作答侧签工具条" className="d1-tools surface-floating rounded-l-none rounded-r-xl flex-col items-center"><ToolbarGroup aria-label="题目与学生导航" className="flex-col gap-0">{tool('回到题目页','H',<ArrowUp/>,()=>locate('question'))}{tool('上一位学生','←',<ChevronLeft/>,()=>stepStudent(-1),visibleAnswers.indexOf(answer)===0)}<StudentJump answers={visibleAnswers} current={answer} open={studentOpen} onOpenChange={setStudentOpen} onSelect={changeStudent} triggerRef={studentTrigger}/>{tool('下一位学生','→',<ChevronRight/>,()=>stepStudent(1),visibleAnswers.indexOf(answer)===visibleAnswers.length-1)}</ToolbarGroup><ToolbarSeparator orientation="horizontal"/><ToolbarGroup aria-label="视图" className="flex-col gap-0">{tool('放大','+',<Plus/>,()=>setZoom(clampPaperZoom(percent*1.25)),percent>=300)}<output aria-label="缩放比例" className="text-ui-meta tabular-nums">{Math.round(percent)}%</output>{tool('缩小','−',<Minus/>,()=>setZoom(clampPaperZoom(percent*.8)),percent<=5)}{tool(zoom==='width'?'适合页面':'适合宽度','0',<Scan/>,toggleFit)}{tool('旋转当前纸张','R',<RotateCw/>,rotate)}</ToolbarGroup><ToolbarSeparator orientation="horizontal"/><ToolbarGroup aria-label="图层" className="flex-col gap-0"><ToggleGroup orientation="vertical" className="flex-col" aria-label="查看版本" value={[original?'original':'marked']} onValueChange={v=>{if(v.length)setMode(v[0])}}><Tip label="标注效果" keys="Tab / Enter"><ToggleGroupItem size="default" value="marked" aria-label="标注效果"><PencilLine/></ToggleGroupItem></Tip><Tip label="扫描原稿；按住临时查看" keys="O"><ToggleGroupItem size="default" value="original" aria-label="扫描原稿"><FileImage/></ToggleGroupItem></Tip></ToggleGroup><Tip label="开关标注层" keys="L"><span className="inline-flex" tabIndex={original||missing?0:undefined}><Toggle size="default" aria-label="标注层" pressed={!original&&layer} disabled={original||missing} onPressedChange={setLayer}><Layers/></Toggle></span></Tip></ToolbarGroup><ToolbarSeparator orientation="horizontal"/><ToolbarGroup aria-label="沉浸视图"><Tip label={immersive?'退出沉浸':'沉浸'} keys="F"><ToolbarButton render={<Toggle size="default" pressed={immersive} onPressedChange={setImmersive}/>} aria-label="沉浸">{immersive?<Minimize/>:<Maximize/>}</ToolbarButton></Tip></ToolbarGroup></Toolbar></div></div></section><QuestionInspector question={q} answer={answer} knowledge={knowledge} onKnowledge={revealKnowledge} onEvidence={evidence} onIntent={intent}/></div><div role="status" className={notice?'absolute bottom-20 left-1/2 z-30 max-w-full -translate-x-1/2 surface-floating px-4 py-3 text-ui-hint':'sr-only'}>{notice}</div>
 </section></div><Dialog open={help} onOpenChange={setHelp}><DialogPopup className="surface-floating motion-reduce:transition-none" closeProps={{'aria-label':'关闭快捷键表'}}><DialogHeader><DialogTitle>快捷键</DialogTitle><DialogDescription>焦点在题目与知识点预览框架内时可用；输入框、菜单与跳转面板保留自身按键行为。</DialogDescription></DialogHeader><DialogPanel><dl className="space-y-3">{shortcuts.map(([key,label])=><div key={key} className="flex items-center justify-between gap-4 text-ui-body"><dt>{label}</dt><dd><Kbd>{key}</Kbd></dd></div>)}</dl></DialogPanel></DialogPopup></Dialog></main></TooltipProvider>
}
