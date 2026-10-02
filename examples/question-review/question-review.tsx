"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from "react"
import { PanelLeftOpen, ArrowLeft, ArrowUp, CircleHelp, Scan, RotateCw, Minus, Plus, MoreHorizontal, FileImage, Maximize, Minimize, Layers, PencilLine } from "lucide-react"
import { Button } from "@/components/prism-next/button"
import { paperZoomPercent, rotatedPaperDimensions, clampPaperZoom, type PaperPreviewZoom, type PaperPreviewRotation } from "@/components/prism-next/paper-preview"
import { ReviewTools } from "@/examples/review-tools/review-tools"
import type { ReviewToolsPosition } from "@/examples/review-tools/review-tools"
import { Toggle } from "@/components/coss/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/components/coss/toolbar"
import { TooltipProvider } from "@/components/coss/tooltip"
import { Avatar, AvatarFallback } from "@/components/coss/avatar"
import { Separator } from "@/components/coss/separator"
import { Tabs, TabsList, TabsTab } from "@/components/coss/tabs"
import { Badge as CossBadge } from "@/components/coss/badge"
import { PAPER_REVIEW_BEST_WIDTH, railBand, railCollapsedForWidth, railPreferenceKeys, readRailPreferences, type RailPreferences } from "./rail-preferences"
import { Kbd } from "@/components/coss/kbd"
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator } from "@/components/coss/menu"
import { Dialog, DialogPopup, DialogTitle, DialogDescription, DialogHeader, DialogPanel } from "@/components/coss/dialog"
import { reviewQuestions, knowledgePoints, classStudents, answersForQuestion, filterAnswers, filterQuestions, filterKnowledge, reviewSelection } from "./fixture"
import { answerImage, answerHeight, PAPER_WIDTH } from "./artwork"
import { QuestionJump, StudentJump, QuestionKnowledgeRail, QuestionInspector, StudentLabel, StudentScale, Tip } from "./parts"
import { dockPaperToolbar } from "../paper-review/paper-toolbar-layout"
import { FullScoreGroup } from "./answer-groups"
import { questionExcerpts } from './question-records'
import { QuestionDigitalCard } from './question-digital-card'
import { sortQuestions, rateLabel } from "./analysis"
import { questionAnalyses } from "./fixture"
import { QuestionPaperCanvas, type QuestionPaper } from "./question-paper-canvas"
import "../paper-review/paper-review.css"
import "./question-review.css"

export const shortcuts = [["← / →", "上一位 / 下一位学生作答"], ["↑ / ↓", "左栏上一条 / 下一条"], ["Enter", "定位所选条目"], ["N", "下一道高失分题"], ["[ / ]", "上一题 / 下一题"], ["G", "题目跳转面板"], ["S", "学生跳转面板"], ["K", "切换题目 / 知识点视角"], ["H", "回到题目"], ["+ / −", "放大 / 缩小"], ["0", "切换适合宽度 / 适合页面"], ["R", "旋转 90°"], ["L", "开关标注层"], ["O（按住）", "临时查看扫描原稿"], ["F / Esc", "切换沉浸 / 退出沉浸"], ["T", "显示 / 隐藏题目栏"], ["?", "打开快捷键表"]]
export function QuestionReviewDesign() {
 const [device,setDevice]=useState('auto'),[scale,setScale]=useState(1)
 const [selected,setSelected]=useState('q17'),[studentId,setStudentId]=useState(classStudents[0].id)
 const [view,setView]=useState('questions'),[knowledgeId,setKnowledgeId]=useState<string|null>(null),[filter,setFilter]=useState('all'),[answerFilter,setAnswerFilter]=useState('loss')
 const [sort,setSort]=useState('number'),[fullOpen,setFullOpen]=useState(false)
 const [markedPoints,setMarkedPoints]=useState<string[]>([]),[page,setPage]=useState(0),[missing,setMissing]=useState(false)
 const [actualPercent,setActualPercent]=useState<number|null>(null)
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
 const [studentChosen,setStudentChosen]=useState(false)
 const studentControls=useRef<HTMLDivElement>(null)
 const [controlLayout,setControlLayout]=useState({left:8,height:52})
 const [questionHidden,setQuestionHidden]=useState(false)
 const [location,setLocation]=useState({id:'question',request:0})
 const q=reviewQuestions.find(q=>q.id===selected)!,knowledge=view==='knowledge'?knowledgePoints.find(k=>k.id===knowledgeId)??null:null
 const answers=useMemo(()=>answersForQuestion(q),[q]),visibleAnswers=useMemo(()=>filterAnswers(answers,answerFilter),[answers,answerFilter])
 const answer=visibleAnswers.find(a=>a.student.id===studentId)??visibleAnswers[0]??answers[0]
 const original=mode==='original'||holdOriginal
 useEffect(()=>{const params=new URLSearchParams(window.location.search),s=reviewSelection(params);setSelected(s.question);setStudentId(s.student);if(params.has('student')){const initial=answersForQuestion(reviewQuestions.find(q=>q.id===s.question)!).find(a=>a.student.id===s.student);if(initial?.status==='满分'){setAnswerFilter('all');setFullOpen(true)}setStudentChosen(true);setLocation({id:s.student,request:1})}},[])
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
      const papers = [...area.querySelectorAll<HTMLElement>('[data-scan-paper]')].filter(paper=>{const rect=paper.getBoundingClientRect();return rect.bottom>bounds.top+(controlLayout.height+16)*factor&&rect.top<bounds.bottom})
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
  }, [zoom, rotations, viewport, scale, missing, immersive, railCollapsed, mobilePane, selected, answerFilter, studentChosen, fullOpen, controlLayout.height])
  useLayoutEffect(() => {
    const area=canvasArea.current, node=canvas.current, bar=studentControls.current
    if(!area||!node||!bar)return
    const measure=()=>{
      const paper=node.querySelector<HTMLElement>('.d1-paper-column'), bounds=area.getBoundingClientRect()
      if(!paper||!area.clientWidth)return
      const left=Math.max(8,Math.min((paper.getBoundingClientRect().left-bounds.left)/(scale||1),area.clientWidth-80))
      const height=bar.offsetHeight
      setControlLayout(previous=>previous.left===left&&previous.height===height?previous:{left,height})
    }
    measure();const observer=new ResizeObserver(measure)
    observer.observe(area);observer.observe(bar)
    const paper=node.querySelector<HTMLElement>('.d1-paper-column');if(paper)observer.observe(paper)
    node.addEventListener('scroll',measure,{passive:true})
    return()=>{observer.disconnect();node.removeEventListener('scroll',measure)}
  },[scale,zoom,rotations,railCollapsed,immersive,mobilePane])
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
 useEffect(()=>{const request=requestAnimationFrame(()=>{const node=canvas.current,paper=node?.querySelector<HTMLElement>(`[data-page-id="${location.id}"]`);if(node&&paper){node.scrollTo({top:node.scrollTop+((paper.parentElement??paper).getBoundingClientRect().top-node.getBoundingClientRect().top)/scale-(controlLayout.height+16),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}});return()=>cancelAnimationFrame(request)},[location,selected,mobilePane,missing,viewport.width])
 function select(id:string){if(!reviewQuestions.some(q=>q.id===id))return;setSelected(id);setQuestionHidden(false);setActualPercent(null);setAnswerFilter('loss');setFullOpen(false);setStudentChosen(false);setMarkedPoints([]);setQuestionOpen(false);setNotice('');setPage(0);locate('question')}
 function changeStudent(id:string){if(!visibleAnswers.some(a=>a.student.id===id))return;setStudentId(id);setStudentChosen(true);if(visibleAnswers.find(a=>a.student.id===id)?.status==='满分')setFullOpen(true);setStudentOpen(false);setNotice('');locate(id)}
 function changeView(next:string){setView(next);setFilter('all');if(next==='knowledge'&&!knowledgeId)setKnowledgeId(q.knowledge)}
 function selectKnowledge(id:string){setKnowledgeId(id);setView('knowledge')}
 function revealKnowledge(id:string){selectKnowledge(id);setFilter('all');if(railCollapsed)toggleRail();setMobilePane('rail')}
 function evidence(id:string,points:string[]){select(id);setMarkedPoints(points)}
 function stepQuestion(delta:number){const next=reviewQuestions[q.number-1+delta];if(next)select(next.id)}
 function stepStudent(delta:number){const index=studentChosen?visibleAnswers.findIndex(a=>a.student.id===answer.student.id):-1,next=visibleAnswers[index+delta];if(next)changeStudent(next.student.id)}
 function stepRail(delta:number){const list=view==='questions'?sortQuestions(filterQuestions(filter),sort,questionAnalyses):filterKnowledge(filter),id=view==='questions'?q.id:knowledgeId,index=Math.max(0,list.findIndex(x=>x.id===id)),next=list[Math.max(0,Math.min(list.length-1,index+delta))];if(next){if(view==='questions')select(next.id);else selectKnowledge(next.id)}}
 function locateRail(){if(knowledge){const e=knowledge.evidence[0];evidence(e.question,e.points)}else locate('question')}
 function wrong(){const list=reviewQuestions.filter(q=>q.highLoss);select((list.find(item=>item.number>q.number)??list[0]).id)}
 function toggleFit(){setZoom(v=>v==='width'?'page':'width')}
 function rotate(){setRotations(v=>({...v,[scanId]:((rotation+90)%360) as PaperPreviewRotation}))}
 function intent(action:string){setNotice(`已请求：${action} · 第 ${q.number} 题 · ${studentChosen?answer.student.name:'全班'}`)}
 function filterStudents(value:string){setAnswerFilter(value);setFullOpen(false);const list=filterAnswers(answers,value);if(studentChosen&&!list.some(a=>a.student.id===studentId)){setStudentChosen(false);locate('question')}if(!list.length)setStudentChosen(false)}
 function fullGroup(open:boolean){setFullOpen(open);if(!open&&answer.status==='满分'){setStudentChosen(false);locate('full-group')}}

 function keyboard(event:KeyboardEvent){const target=event.target as HTMLElement;if(questionOpen||studentOpen||event.defaultPrevented||event.nativeEvent.isComposing||event.altKey||event.ctrlKey||event.metaKey||target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],[role="menu"]')||(target.closest('[role="listbox"]')&&(!target.closest('[data-review-rail]')||['ArrowUp','ArrowDown','Enter'].includes(event.key))))return;if(target.closest('[role=tablist]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Enter',' '].includes(event.key))return;if(event.key==='Enter'&&target.closest('button,a,[role=tab]'))return;const key=event.key.toLowerCase();const actions:Record<string,()=>void>={arrowleft:()=>stepStudent(-1),arrowright:()=>stepStudent(1),arrowup:()=>stepRail(-1),arrowdown:()=>stepRail(1),enter:locateRail,n:wrong,'[':()=>stepQuestion(-1),']':()=>stepQuestion(1),g:()=>{setImmersive(false);setQuestionOpen(true)},s:()=>{setMobilePane('canvas');setStudentOpen(true)},k:()=>changeView(view==='questions'?'knowledge':'questions'),h:()=>locate('question'),'+':()=>setZoom(clampPaperZoom(percent*1.25)),'=':()=>setZoom(clampPaperZoom(percent*1.25)),'-':()=>setZoom(clampPaperZoom(percent*.8)),'0':toggleFit,r:rotate,l:()=>{if(!original&&!missing)setLayer(v=>!v)},o:()=>setHoldOriginal(true),f:()=>setImmersive(v=>!v),escape:()=>setImmersive(false),t:()=>{if(!immersive)toggleRail()},'?':()=>setHelp(true)};if(actions[key]){event.preventDefault();event.stopPropagation();if(!event.repeat||['arrowup','arrowdown','+','=','-','o'].includes(key))actions[key]()}}
 const crop=(a:typeof answer):QuestionPaper=>({id:a.student.id,width:PAPER_WIDTH,height:answerHeight(q),imageUrl:answerImage(q,a,!original&&layer,missing),alt:`第 ${q.number} 题 · ${a.student.name} · ${a.score} / ${q.max} · ${missing?'扫描图像未提供':original?'扫描原稿':'标注效果'}`,regions:[{id:a.student.id,label:`选择 ${a.student.name} 的作答`,rect:[0,0,100,100]}]})
 const questionPaper:QuestionPaper={id:'question',width:PAPER_WIDTH,height:1,content:<QuestionDigitalCard key={q.id} question={q} answers={answers} selected={studentChosen?answer.student.id:null} onSelect={changeStudent} missing={missing} annotations={!original&&layer} filter={answerFilter} onIncludeCorrect={()=>filterStudents('all')} markedPoints={markedPoints} onKnowledge={revealKnowledge}/>}
 const fullAnswers=visibleAnswers.filter(a=>a.status==='满分')
 const pages:QuestionPaper[]=q.category==='objective'?[questionPaper,...(studentChosen?[crop(answer)]:[])]:[questionPaper,...visibleAnswers.filter(a=>a.status!=='满分').map(crop),...(fullAnswers.length?[{id:'full-group',width:PAPER_WIDTH,height:80,alt:`满分 ${fullAnswers.length} 人`,content:<FullScoreGroup count={fullAnswers.length} open={fullOpen} onOpenChange={fullGroup}/>}]:[]),...(fullOpen?fullAnswers.map(crop):[])]
 const pageId=pages[page]?.id??'question', scanId=pages.find(p=>p.id===pageId&&!p.content)?.id??pages.find(p=>!p.content)?.id??answer.student.id,rotation=rotations[scanId]??0
 const currentPaper=pages.find(p=>p.id===scanId)??crop(answer)
 const percent=(pages[page]?.content?null:actualPercent)??paperZoomPercent(zoom,viewport,rotatedPaperDimensions(currentPaper,rotation))
 const headers=Object.fromEntries(visibleAnswers.map(a=>[a.student.id,<div key={a.student.id}><StudentLabel answer={a}/>{q.category==='objective'&&<Button variant="link" render={<a href={`/next/reviews/paper-review?question=${q.id}&student=${a.student.id}&source=question-review`}/>}>查看整卷 →</Button>}</div>]))
 const tool=(label:string,keys:string,icon:ReactElement,action:()=>void,disabled=false)=><Tip label={label} keys={keys}><ToolbarButton render={<Button variant="ghost" size="icon"/>} aria-label={label} onClick={action} disabled={disabled}>{icon}</ToolbarButton></Tip>
 return <TooltipProvider><main className="d1-review q1-review bg-background text-foreground"><ReviewTools device={device} onDeviceChange={setDevice} missing={missing} onMissingChange={setMissing} defaultPosition={reviewPosition} onResetRailPreferences={resetRailPreferences}/><div ref={stage} className="d1-stage bg-muted"><section ref={frame} aria-label="题目与知识点预览框架" tabIndex={-1} className="d1-frame bg-background" data-device={device} data-mobile-pane={mobilePane} data-immersive={immersive} data-rail-collapsed={railCollapsed} data-rail-ready={railState.ready} data-rail-animate={railState.animate} style={device==='auto'?undefined:{width:Number(device),height:device==='1440'?900:1080,transform:`scale(${scale})`}} onKeyDownCapture={keyboard} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setHoldOriginal(false)}}>
 <header className="d1-topbar flex items-center gap-4 border-b px-4"><Button variant="ghost" onClick={()=>intent('返回题目列表')} aria-label="返回题目列表"><ArrowLeft/><span className="d1-return-label">返回题目列表</span></Button><Avatar aria-hidden="true"><AvatarFallback>{q.number}</AvatarFallback></Avatar><div className="min-w-0"><h1 className="truncate text-section-title" title={`第 ${q.number} 题 · ${knowledgePoints.find(k=>k.id===q.knowledge)!.name}`}>第 {q.number} 题 <span className="d1-student-meta">· {knowledgePoints.find(k=>k.id===q.knowledge)!.name}</span></h1><p className="d1-student-meta text-ui-meta text-muted-foreground">{q.category==='subjective'?'主观题':q.type} · 满分 {q.max} 分 · {q.affected} / 36 名学生失分</p></div><QuestionJump current={q} open={questionOpen} onOpenChange={setQuestionOpen} onSelect={select} triggerRef={questionTrigger}/><div className="flex shrink-0 items-center gap-2"><span className="text-score-display">{q.rate}%</span><span className="d1-student-meta text-ui-meta text-muted-foreground">全班{rateLabel(q)}</span></div><Menu><MenuTrigger render={<Button variant="ghost" size="icon"/>} aria-label="更多"><MoreHorizontal/></MenuTrigger><MenuPopup className="surface-floating" align="end"><MenuItem onClick={()=>intent('导出')}>导出</MenuItem><MenuSeparator/><MenuItem onClick={()=>setHelp(true)}><CircleHelp/>快捷键表<Kbd>?</Kbd></MenuItem></MenuPopup></Menu></header>
 <nav ref={mobileNav} className="d1-mobile-nav border-b px-3" aria-label="预览分区"><ToggleGroup value={[mobilePane]} onValueChange={v=>{if(v.length){if(v[0]==='rail'&&railCollapsed)toggleRail();else setMobilePane(v[0])}}}>{[['rail','题目'],['canvas','作答'],['inspector','检查器']].map(([value,label])=><ToggleGroupItem key={value} value={value}>{label}</ToggleGroupItem>)}</ToggleGroup></nav>
 <div className="d1-columns"><div className="d1-rail-shell" inert={railCollapsed}><QuestionKnowledgeRail view={view} onView={changeView} question={q} knowledge={knowledge} filter={filter} onFilter={setFilter} sort={sort} onSort={setSort} onQuestion={select} onKnowledge={selectKnowledge} onEvidence={evidence} onLocate={locateRail} onCollapse={toggleRail} closeRef={closeRail}/></div><section ref={canvasArea} data-review-canvas aria-label="题目与作答画布" className="d1-canvas bg-border"><div ref={studentControls} data-student-controls aria-label="学生控制条" className="q1-student-controls surface-floating rounded-xl shadow-lg" style={{left:controlLayout.left,maxWidth:`calc(100% - ${controlLayout.left+64}px)`}}>
 <div className="q1-student-controls-row"><Tip label="回到题目" keys="H"><Button variant="ghost" aria-pressed={page===0} data-pressed={page===0?'':undefined} onClick={()=>locate('question')}><ArrowUp/>题目</Button></Tip><Separator orientation="vertical"/>
 <Tabs value={answerFilter} onValueChange={filterStudents}><TabsList size="sm" aria-label="学生作答筛选"><TabsTab value="loss">{q.category==='objective'?'答错':'失分'} <CossBadge variant="outline">{q.affected}</CossBadge></TabsTab>{q.category==='subjective'&&<TabsTab value="pending">待复核 <CossBadge variant="outline">{q.pending}</CossBadge></TabsTab>}<TabsTab value="all">全部 <CossBadge variant="outline">{answers.length}</CossBadge></TabsTab></TabsList></Tabs><Separator orientation="vertical"/>
 <StudentJump answers={visibleAnswers} current={studentChosen?answer:null} max={q.max} open={studentOpen} onOpenChange={setStudentOpen} onSelect={changeStudent} triggerRef={studentTrigger}/>
 {railCollapsed&&!immersive&&<><Separator orientation="vertical"/><Tip label="展开题目栏" keys="T"><Button ref={openRail} variant="ghost" onClick={toggleRail} aria-label="展开题目栏"><PanelLeftOpen/>题目栏</Button></Tip></>}
 </div><StudentScale answers={visibleAnswers} current={studentChosen?answer:null} max={q.max} onSelect={changeStudent}/>{questionHidden&&<div data-question-sticky-summary className="px-2 pt-1"><Button variant="ghost" className="h-auto sm:h-auto whitespace-normal text-left" onClick={()=>locate('question')}><span className="text-ui-body">第 {q.number} 题 · {questionExcerpts[q.number-1]}</span> <CossBadge variant="outline">节选</CossBadge></Button></div>}</div>
 <div className="d1-paper-host min-h-0 min-w-0 [&_[data-region]>button]:border-0! [&_[data-region]>button]:ring-offset-0!"><QuestionPaperCanvas viewportRef={canvas} topInset={controlLayout.height+16} pages={pages} zoom={zoom} rotations={rotations} selected={answer.student.id} onQuestionHidden={setQuestionHidden} answerLabel={`学生作答 · ${answerFilter==='loss'?'失分':answerFilter==='pending'?'待复核':'全部'} ${visibleAnswers.length}`} activePage={studentChosen?answer.student.id:'question'} scale={scale} headers={headers} onSelect={id=>{if(id.startsWith('p'))setMarkedPoints([id]);else changeStudent(id)}} onZoom={setZoom} onVisiblePage={(next,actual)=>{setPage(next);if(actual!==undefined)setActualPercent(actual);const id=pages[next]?.id;if(q.category==='subjective'&&visibleAnswers.some(a=>a.student.id===id)){setStudentId(id);setStudentChosen(true)}}} onViewport={setViewport}/></div>
 <div className="d1-tool-dock rounded-r-xl shadow-lg" style={dockPosition}><div className="d1-tool-scroll"><Toolbar ref={toolbar} orientation="vertical" aria-label="作答侧签工具条" className="d1-tools surface-floating rounded-l-none rounded-r-xl flex-col items-center"><ToolbarGroup aria-label="视图" className="flex-col gap-0">{tool('放大','+',<Plus/>,()=>setZoom(clampPaperZoom(percent*1.25)),percent>=300)}<output aria-label="缩放比例" className="text-ui-meta tabular-nums">{Math.round(percent)}%</output>{tool('缩小','−',<Minus/>,()=>setZoom(clampPaperZoom(percent*.8)),percent<=5)}{tool(zoom==='width'?'适合页面':'适合宽度','0',<Scan/>,toggleFit)}{tool('旋转当前纸张','R',<RotateCw/>,rotate)}</ToolbarGroup><ToolbarSeparator orientation="horizontal"/><ToolbarGroup aria-label="图层" className="flex-col gap-0"><ToggleGroup orientation="vertical" className="flex-col" aria-label="查看版本" value={[original?'original':'marked']} onValueChange={v=>{if(v.length)setMode(v[0])}}><Tip label="标注效果" keys="Tab / Enter"><ToggleGroupItem size="default" value="marked" aria-label="标注效果"><PencilLine/></ToggleGroupItem></Tip><Tip label="扫描原稿；按住临时查看" keys="O"><ToggleGroupItem size="default" value="original" aria-label="扫描原稿"><FileImage/></ToggleGroupItem></Tip></ToggleGroup><Tip label="开关标注层" keys="L"><span className="inline-flex" tabIndex={original||missing?0:undefined}><Toggle size="default" aria-label="标注层" pressed={!original&&layer} disabled={original||missing} onPressedChange={setLayer}><Layers/></Toggle></span></Tip></ToolbarGroup><ToolbarSeparator orientation="horizontal"/><ToolbarGroup aria-label="沉浸视图"><Tip label={immersive?'退出沉浸':'沉浸'} keys="F"><ToolbarButton render={<Toggle size="default" pressed={immersive} onPressedChange={setImmersive}/>} aria-label="沉浸">{immersive?<Minimize/>:<Maximize/>}</ToolbarButton></Tip></ToolbarGroup></Toolbar></div></div></section><QuestionInspector question={q} answer={studentChosen?answer:null} knowledge={knowledge} onKnowledge={revealKnowledge} onEvidence={evidence} onIntent={intent}/></div><div role="status" className={notice?'absolute bottom-20 left-1/2 z-30 max-w-full -translate-x-1/2 surface-floating px-4 py-3 text-ui-hint':'sr-only'}>{notice}</div>
 </section></div><Dialog open={help} onOpenChange={setHelp}><DialogPopup className="surface-floating motion-reduce:transition-none" closeProps={{'aria-label':'关闭快捷键表'}}><DialogHeader><DialogTitle>快捷键</DialogTitle><DialogDescription>焦点在题目与知识点预览框架内时可用；输入框、菜单与跳转面板保留自身按键行为。</DialogDescription></DialogHeader><DialogPanel><dl className="space-y-3">{shortcuts.map(([key,label])=><div key={key} className="flex items-center justify-between gap-4 text-ui-body"><dt>{label}</dt><dd><Kbd>{key}</Kbd></dd></div>)}</dl></DialogPanel></DialogPopup></Dialog></main></TooltipProvider>
}
