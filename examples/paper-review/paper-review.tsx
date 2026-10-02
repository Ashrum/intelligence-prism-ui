"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from "react"
import { ArrowLeft, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Check, CircleHelp, Scan, RotateCw, Minus, Plus, MoreHorizontal, Sparkles, FileImage, Maximize, Minimize, Layers, ChevronsDown, ArrowLeftRight, PencilLine } from "lucide-react"
import { Button } from "@/components/prism-next/button"
import { Badge } from "@/components/prism-next/badge"
import { PaperThumbnail, paperDimensions, paperZoomPercent, rotatedPaperDimensions, clampPaperZoom, type PaperPreviewZoom, type PaperPreviewRotation } from "@/components/prism-next/paper-preview"
import { ReviewTools } from "@/examples/review-tools/review-tools"
import type { ReviewToolsPosition } from "@/examples/review-tools/review-tools"
import { Toggle } from "@/components/coss/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/components/coss/toolbar"
import { Tooltip, TooltipTrigger, TooltipPopup, TooltipProvider } from "@/components/coss/tooltip"
import { Avatar, AvatarFallback } from "@/components/coss/avatar"
import { Group, GroupSeparator } from "@/components/coss/group"
import { Popover, PopoverTrigger, PopoverPopup, PopoverTitle } from "@/components/coss/popover"
import { Input } from "@/components/coss/input"
import { Kbd } from "@/components/coss/kbd"
import { Frame, FrameHeader, FrameFooter } from "@/components/coss/frame"
import { Meter, MeterTrack, MeterIndicator } from "@/components/coss/meter"
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@/components/coss/menu"
import { Dialog, DialogPopup, DialogTitle, DialogDescription, DialogHeader, DialogPanel } from "@/components/coss/dialog"
import { ScrollArea } from "@/components/coss/scroll-area"
import { questionsForStudent, students, studentRecords, filterStudents, paperImage, type Question } from "./fixture"
import { ContinuousPaperCanvas } from "./continuous-paper-canvas"
import "./paper-review.css"

const shortcuts = [["G", "选择学生"], ["[ / ]", "上一位 / 下一位学生"], ["← / →", "上一页 / 下一页"], ["↑ / ↓", "上一题 / 下一题"], ["Enter", "定位所选题目"], ["N", "下一道错题"], ["+ / −", "放大 / 缩小"], ["0", "切换适合宽度 / 适合页面"], ["F / Esc", "切换沉浸 / 退出沉浸"], ["R", "旋转 90°"], ["L", "开关标注层"], ["O（按住）", "临时查看扫描原稿"], ["?", "打开快捷键表"]]
function Tip({ label, keys, children }: { label: string; keys: string; children: ReactElement }) {
  return <Tooltip><TooltipTrigger render={children} /><TooltipPopup className="surface-floating motion-reduce:transition-none" side="left"><span className="text-ui-hint">{label} <Kbd>{keys}</Kbd></span></TooltipPopup></Tooltip>
}
function scoreTone(value: number, max: number) { return value === max ? 'bg-success' : value === 0 ? 'bg-destructive' : 'bg-warning' }
function Outcome({ question }: { question: { score: number; max: number } }) {
  return <span className={`size-2 shrink-0 rounded-full ${scoreTone(question.score, question.max)}`} aria-label={question.score === question.max ? '满分' : question.score === 0 ? '零分' : '部分得分'} />
}
function ScoreBar({ value, max }: { value: number; max: number }) {
  return <span aria-hidden="true" className="block h-1 w-10 overflow-hidden rounded-full bg-muted"><span className={`block h-full ${scoreTone(value, max)}`} style={{ width: `${value / max * 100}%` }} /></span>
}
function Confirmation({ children }: { children: string }) {
  return <Badge variant="outline"><span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{children}</Badge>
}
export function StudentPanel({ current, query, active, onQuery, onActive, onSelect }: {
  current: number; query: string; active: number; onQuery: (value: string) => void; onActive: (value: number) => void; onSelect: (index: number) => void
}) {
  const matches = filterStudents(query)
  const highlighted = matches.find(student => student.index === active) ?? matches[0]
  function keyboard(event: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key) || event.nativeEvent.isComposing) return
    event.preventDefault(); event.stopPropagation()
    if (!highlighted) return
    if (event.key === 'Enter') { onSelect(highlighted.index); return }
    const position = matches.findIndex(student => student.index === highlighted.index)
    const next = matches[Math.max(0, Math.min(matches.length - 1, position + (event.key === 'ArrowUp' ? -1 : 1)))]
    onActive(next.index)
    document.getElementById(`student-option-${next.index}`)?.scrollIntoView({ block: 'nearest' })
  }
  return <div data-student-panel onKeyDown={keyboard} className="space-y-3">
    <PopoverTitle>选择学生</PopoverTitle>
    <label htmlFor="student-search" className="block text-ui-action">姓名或考号</label>
    <Input id="student-search" className="min-h-11" role="combobox" aria-expanded="true" aria-controls="student-options" aria-autocomplete="list" aria-activedescendant={highlighted ? `student-option-${highlighted.index}` : undefined} value={query} onChange={event => onQuery(event.target.value)} />
    <div id="student-options" role="listbox" aria-label="学生" className="max-h-80 overflow-y-auto">
      {['待复核', '已确认'].map(status => {
        const group = matches.filter(student => student.status === status)
        return group.length ? <div key={status} role="group" aria-label={status}><p className="px-2 py-2 text-ui-meta text-muted-foreground">{status}</p>{group.map(student => <Button key={student.index} id={`student-option-${student.index}`} role="option" aria-selected={current === student.index} tabIndex={-1} variant="ghost" onMouseMove={() => onActive(student.index)} onClick={() => onSelect(student.index)} className={`h-auto sm:h-auto min-h-14 w-full justify-start gap-2 px-2 ${highlighted?.index === student.index ? 'bg-accent' : ''}`}>
          <Avatar aria-hidden="true"><AvatarFallback>{student.name[0]}</AvatarFallback></Avatar>
          <span className="min-w-0 flex-1 text-left"><span className="block text-item-title">{student.name}</span><span className="block text-ui-meta text-muted-foreground">{student.examId}</span></span>
          <span className="grid w-10 shrink-0 justify-items-end gap-1"><span className="text-ui-body tabular-nums">{student.score}</span><ScoreBar value={student.score} max={student.max} /></span>
          <Confirmation>{student.status}</Confirmation><span className="w-4 shrink-0">{current === student.index && <Check className="size-4" aria-label="当前学生" />}</span>
        </Button>)}</div> : null
      })}
      {!matches.length && <p role="status" className="py-6 text-center text-ui-body text-muted-foreground">没有匹配的学生</p>}
    </div>
    <p className="flex flex-wrap items-center gap-2 text-ui-meta text-muted-foreground"><Kbd>↑ ↓</Kbd>选人 <Kbd>Enter</Kbd>跳转 <Kbd>Esc</Kbd>关闭</p>
  </div>
}
function ScoreMeter({ value, max, label }: { value: number; max: number; label: string }) {
  return <Meter value={value} max={max} aria-label={label}><MeterTrack><MeterIndicator className="motion-reduce:transition-none" /></MeterTrack></Meter>
}

function QuestionRail({ questions, selected, filter, missing, student, onFilter, onSelect, onLocate, onPage }: {
  questions: Question[]; selected: string; filter: boolean; missing: boolean; student: string
  onFilter: (value: boolean) => void; onSelect: (id: string) => void; onLocate: () => void; onPage: (page: number) => void
}) {
  const list = questions.filter(q => !filter || q.score < q.max)
  const root = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const rail = root.current
    if (!rail) return
    // Wait for the ScrollArea layout, and repeat when a hidden narrow-screen rail reopens.
    let request = 0
    const reveal = () => {
      cancelAnimationFrame(request)
      request = requestAnimationFrame(() => {
        const node = rail.querySelector<HTMLElement>(`[data-question-id="${selected}"]`)
        if (!node?.getClientRects().length) return
        node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
      })
    }
    reveal()
    const observer = new ResizeObserver(reveal)
    observer.observe(rail)
    return () => { cancelAnimationFrame(request); observer.disconnect() }
  }, [selected, filter])
  function keyboard(event: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) return
    event.preventDefault(); event.stopPropagation()
    if (event.key === 'Enter') { onLocate(); return }
    if (!list.length) return
    const index = Math.max(0, list.findIndex(q => q.id === selected))
    const next = list[Math.max(0, Math.min(list.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1)))]
    onSelect(next.id)
    root.current?.querySelector<HTMLButtonElement>(`[data-question-id="${next.id}"]`)?.focus({ preventScroll: true })
  }
  return <aside ref={root} aria-label="题目栏" data-review-rail className="d1-rail min-h-0 bg-background">
    <header className="d1-rail-header flex items-center justify-between gap-2 px-3"><h2 className="shrink-0 text-block-title">题目</h2>
      <ToggleGroup aria-label="题目筛选" value={[filter ? 'wrong' : 'all']} onValueChange={v => { if (v.length) onFilter(v[0] === 'wrong') }}>
        <ToggleGroupItem className="min-h-11 min-w-11" value="all" aria-label={`全部题目，共 ${questions.length} 题`}>全部 {questions.length}</ToggleGroupItem><ToggleGroupItem className="min-h-11 min-w-11" value="wrong" aria-label={`仅看错题，共 ${questions.filter(q => q.score < q.max).length} 题`}>错题 {questions.filter(q => q.score < q.max).length}</ToggleGroupItem>
      </ToggleGroup>
    </header>
    <ScrollArea overscrollContain><div role="listbox" aria-label="选择题目" onKeyDown={keyboard} className="pb-4">
      {['选择', '填空', '解答'].map(type => <div key={type} role="group" aria-label={`${type}题`}>
        <h3 className="px-4 pb-1 pt-4 text-item-title">{type}题 {type === '选择' ? '1–12' : type === '填空' ? '13–16' : '17–20'}</h3>
        {[0, 1].filter(page => list.some(q => q.type === type && q.page === page)).map(page => <div key={page}>
        <Button variant="ghost" className="h-11 sm:h-11 w-full justify-start gap-3 px-4" aria-label={`定位第 ${page + 1} 页`} onClick={() => onPage(page)}><span className="h-8 w-6 shrink-0 overflow-hidden shadow-sm" aria-hidden="true">{missing ? <FileImage className="size-6" /> : <PaperThumbnail page={{ id: `p${page}`, imageUrl: paperImage(page, student, false) }} label="" />}</span><span className="text-ui-meta text-muted-foreground">第 {page + 1} 页 · {missing ? '扫描质量未提供' : '清晰'}</span></Button>
        {list.filter(q => q.page === page && q.type === type).map(q => <Button key={q.id} role="option" aria-selected={selected === q.id} tabIndex={selected === q.id ? 0 : -1} data-question-id={q.id} aria-label={`第 ${q.number} 题，${q.type}，${q.score}/${q.max} 分`} variant="ghost" onClick={() => onSelect(q.id)} className={`relative h-auto sm:h-auto min-h-11 w-full justify-start gap-3 px-4 ${selected === q.id ? 'bg-accent' : ''}`}>
          {selected === q.id && <span className="absolute inset-y-2 left-0 w-0.5 bg-foreground" aria-hidden="true" />}<span className="w-6 shrink-0 text-ui-action tabular-nums">{q.number}</span><span className="ml-auto grid shrink-0 grid-cols-[0.5rem_2.75rem_2.5rem_1.75rem] items-center gap-1"><Outcome question={q} /><span className={`text-right text-ui-body tabular-nums ${q.score === q.max ? 'text-muted-foreground' : 'text-foreground'}`}>{q.score}/{q.max}</span><ScoreBar value={q.score} max={q.max} /><span className="text-right text-ui-meta text-muted-foreground tabular-nums" aria-label={q.score < q.max ? `失分 ${q.max - q.score} 分` : undefined}>{q.score < q.max ? `−${q.max - q.score}` : ''}</span></span>
        </Button>)}
        </div>)}
      </div>)}
      {!list.length && <p className="px-4 py-6 text-ui-body text-muted-foreground">没有错题</p>}
    </div><p className="px-4 pb-3 text-ui-meta text-muted-foreground">{missing ? '2 页 · 扫描质量未提供' : '2 页 · 扫描清晰 · 无缺页'}</p></ScrollArea>
  </aside>
}

function Inspector({ question: q, confirmed, hasWrong, onStep, onWrong, onIntent }: { question: Question; confirmed: boolean; hasWrong: boolean; onStep: (step: number) => void; onWrong: () => void; onIntent: (action: string) => void }) {
  return <aside aria-label="本题检查器" data-review-inspector className="d1-inspector min-h-0 bg-background">
    <FrameHeader className="d1-inspector-header flex-row items-center justify-between gap-1 px-2 py-0"><h2 className="min-w-0 truncate text-block-title" title={`第 ${q.number} 题 · ${q.type}题`}>第 {q.number} 题 · {q.type}题</h2><Confirmation>{confirmed ? '最终确认' : '待复核'}</Confirmation><div className="flex shrink-0"><Tip label="上一题" keys="↑"><Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="上一题" disabled={q.number === 1} onClick={() => onStep(-1)}><ArrowUp /></Button></Tip><Tip label="下一题" keys="↓"><Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="下一题" disabled={q.number === 20} onClick={() => onStep(1)}><ArrowDown /></Button></Tip><Tip label="下一道错题" keys="N"><Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="下一道错题" disabled={!hasWrong} onClick={onWrong}><ChevronsDown /></Button></Tip></div></FrameHeader>
    <div className="min-h-0 overflow-hidden px-4 pb-4"><ScrollArea overscrollContain scrollFade><Frame>
      <div className="space-y-7 px-4 py-5">
        <section aria-label="本题得分" className="space-y-3"><div className="flex items-baseline gap-1"><span className="text-score-display">{q.score}</span><span className="text-ui-body text-muted-foreground">/ {q.max} 分</span><Badge className="ml-auto" variant="outline">{q.score === q.max ? '达成' : '需改进'}</Badge></div><ScoreMeter value={q.score} max={q.max} label="本题得分" /></section>
        <section className="space-y-3" aria-label="评分点"><h3 className="text-block-title">评分点</h3><ul className="space-y-4 text-ui-body">{q.points.map((point, i) => <li key={point.label} className="grid grid-cols-[0.5rem_minmax(0,1fr)_3rem] items-baseline gap-x-3 gap-y-1"><Outcome question={point} /><span><span className="mr-2 text-ui-meta text-muted-foreground">{i + 1}.</span>{point.label}</span><span className="text-right tabular-nums">{point.score}/{point.max}</span>{point.reason && <p className="col-span-2 col-start-2 text-ui-meta text-muted-foreground">缺失：{point.reason}</p>}</li>)}</ul></section>
        <section className="overflow-hidden rounded-lg bg-muted" aria-label="AI 判定依据"><div data-ai-source className="h-0.5" style={{ background: 'var(--brand-ai-gradient)' }} /><div className="space-y-3 p-4"><h3 className="flex items-center gap-2 text-block-title"><Sparkles className="size-4" aria-hidden="true" />AI 判定依据</h3><p className="text-ui-body">{q.evidence}</p><p className="text-ui-meta text-muted-foreground">置信度：未提供</p></div></section>
        <section className="space-y-2"><h3 className="text-block-title">知识点</h3><Badge variant="outline" className="h-auto whitespace-normal">{q.knowledge}</Badge></section>
      </div>
      <FrameFooter className="space-y-3"><h3 className="text-block-title">班级对比</h3><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><p className="text-ui-meta text-muted-foreground">本题得分率</p><p className="text-block-title tabular-nums">{q.rate}%</p><ScoreMeter value={q.rate} max={100} label="本题班级得分率" /></div><div className="space-y-2"><p className="text-ui-meta text-muted-foreground">受影响学生比例</p><p className="text-block-title tabular-nums">{Math.round(q.affected / 36 * 100)}% <span className="text-ui-meta text-muted-foreground">{q.affected} / 36</span></p><ScoreMeter value={q.affected} max={36} label="受影响学生比例" /></div></div></FrameFooter>
    </Frame></ScrollArea></div>
    <footer className="flex gap-3 border-t p-4"><Button className="min-h-11 flex-1" onClick={() => onIntent('更正评分')}>更正评分</Button><Button variant="outline" className="min-h-11 flex-1" onClick={() => onIntent('教师批阅')}>教师批阅</Button></footer>
  </aside>
}

export function PaperReviewDesign() {
  const [device, setDevice] = useState('auto'), [scale, setScale] = useState(1)
  const [selected, setSelected] = useState('q17'), [page, setPage] = useState(1), [filter, setFilter] = useState(false)
  const [studentIndex, setStudentIndex] = useState(0), [missing, setMissing] = useState(false)
  const [zoom, setZoom] = useState<PaperPreviewZoom>('width'), [rotations, setRotations] = useState<Record<string, PaperPreviewRotation>>({})
  const [mode, setMode] = useState('marked'), [layer, setLayer] = useState(true), [holdOriginal, setHoldOriginal] = useState(false)
  const [help, setHelp] = useState(false), [notice, setNotice] = useState(''), [mobilePane, setMobilePane] = useState('canvas')
  const [locateRequest, setLocateRequest] = useState(0), [immersive, setImmersive] = useState(false), [selectionRequest, setSelectionRequest] = useState(0)
  const [viewport, setViewport] = useState({ width: 600, height: 650 })
  const [reviewPosition, setReviewPosition] = useState<ReviewToolsPosition>()
  const [studentOpen, setStudentOpen] = useState(false), [studentQuery, setStudentQuery] = useState(''), [activeStudent, setActiveStudent] = useState(0)
  const studentTrigger = useRef<HTMLButtonElement>(null)
  const toolDock = useRef<HTMLDivElement>(null), mobileNav = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null), frame = useRef<HTMLElement>(null), canvas = useRef<HTMLDivElement>(null)
  const dockWidth = Math.max(72, 72 / scale)
  const questions = useMemo(() => questionsForStudent(studentIndex), [studentIndex])
  const record = studentRecords[studentIndex]
  const q = questions.find(item => item.id === selected)!, student = students[studentIndex]
  const original = mode === 'original' || holdOriginal
  const rotation = rotations[`p${page}`] ?? 0
  const percent = paperZoomPercent(zoom, viewport, rotatedPaperDimensions(paperDimensions(), rotation))
  useLayoutEffect(() => {
    const node = stage.current
    if (!node) return
    const measure = () => setScale(device === 'auto' ? 1 : Math.min(1, node.clientWidth / Number(device), node.clientHeight / (device === '1440' ? 900 : 1080)))
    measure(); const observer = new ResizeObserver(measure); observer.observe(node)
    return () => observer.disconnect()
  }, [device])
  useLayoutEffect(() => {
    const dock = toolDock.current, nav = mobileNav.current
    if (!dock || !nav) return
    const measure = () => {
      const rect = dock.getBoundingClientRect()
      // The narrow layout hides the canvas on other panes; use reserved nav space there.
      const fallback = nav.getBoundingClientRect()
      const x = rect.width ? rect.left + rect.width / 2 - 28 : fallback.right - 64
      const y = rect.height ? rect.bottom - 16 - 56 : fallback.top + (fallback.height - 56) / 2
      const next: ReviewToolsPosition = { horizontal: 'right', vertical: 'bottom', offsetX: window.innerWidth - x - 56, offsetY: window.innerHeight - y - 56 }
      setReviewPosition(previous => previous?.offsetX === next.offsetX && previous?.offsetY === next.offsetY ? previous : next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(dock); observer.observe(nav); observer.observe(stage.current!)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [device, scale, immersive, mobilePane])
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
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animation = canvas.current?.parentElement?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' })
    return () => animation?.cancel()
  }, [studentIndex])
  function locate() {
    const region = canvas.current?.querySelector<HTMLElement>(`[data-region="${selected}"]`)
    const node = canvas.current
    if (!region || !node) return
    const a = region.getBoundingClientRect(), b = node.getBoundingClientRect()
    const factor = scale || 1
    node.scrollTo({ left: node.scrollLeft + (a.left + a.width / 2 - b.left - b.width / 2) / factor, top: node.scrollTop + (a.top + a.height / 2 - b.top - b.height / 2) / factor, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  useEffect(() => { if (mobilePane !== 'canvas') return; const request = requestAnimationFrame(locate); return () => cancelAnimationFrame(request) }, [selected, selectionRequest, mobilePane, missing, immersive, viewport.width, viewport.height]) // Host-only positioning; zoom keeps the viewer's gesture anchor.
  useEffect(() => {
    if (!locateRequest) return
    const request = requestAnimationFrame(locate)
    const target = canvas.current ?? frame.current
    target?.focus({ preventScroll: true })
    return () => cancelAnimationFrame(request)
  }, [locateRequest])
  function select(id: string) { const next = questions.find(item => item.id === id)!; setSelected(next.id); if (missing) setPage(next.page); setMobilePane('canvas'); setSelectionRequest(value => value + 1) }
  function step(delta: number) { const list = questions.filter(item => !filter || item.score < item.max); const index = list.findIndex(item => item.id === selected); if (!list.length) return; select(list[Math.max(0, Math.min(list.length - 1, index + delta))].id) }
  function wrong() { const wrongs = questions.filter(item => item.score < item.max); const next = wrongs.find(item => item.number > q.number) ?? wrongs[0]; if (next) select(next.id) }
  function changePage(next: number) {
    if (next < 0 || next > 1) return
    if (missing) setPage(next)
    setMobilePane('canvas')
    requestAnimationFrame(() => {
      const node = canvas.current, paper = node?.querySelector<HTMLElement>(`[data-review-page="${next}"]`)
      if (!node || !paper) return
      node.scrollTo({ top: node.scrollTop + (paper.getBoundingClientRect().top - node.getBoundingClientRect().top) / scale - 8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    })
  }
  function changeStudent(index: number) {
    if (index < 0 || index >= students.length) return
    setStudentIndex(index); setNotice(''); setStudentOpen(false)
    const nextQuestions = questionsForStudent(index)
    if (filter && nextQuestions.find(item => item.id === selected)?.score === nextQuestions.find(item => item.id === selected)?.max) {
      const nextWrong = nextQuestions.find(item => item.score < item.max)
      if (nextWrong) { setSelected(nextWrong.id); if (missing) setPage(nextWrong.page); setSelectionRequest(value => value + 1) }
    }
  }
  function openStudents() { setImmersive(false); setStudentQuery(''); setActiveStudent(studentIndex); setStudentOpen(true) }
  function toggleFit() { setZoom(value => value === 'width' ? 'page' : 'width') }

  function rotate() { setRotations(value => ({ ...value, [`p${page}`]: ((rotation + 90) % 360) as PaperPreviewRotation })) }
  function intent(action: string) { setNotice(`已请求：${action} · ${student}${action === '更正评分' || action === '教师批阅' ? ` · 第 ${q.number} 题` : ''}`) }
  function keyboard(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    if (studentOpen || event.defaultPrevented || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey || target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],[role="menu"]') || (target.closest('[role="listbox"]') && !target.closest('[data-review-rail]'))) return
    const key = event.key.toLowerCase()
    if (key === 'o') { event.preventDefault(); setHoldOriginal(true); return }
    if (missing && ['+', '=', '-', '0', 'r', 'l'].includes(key)) return
    const actions: Record<string, () => void> = { g: openStudents, '[': () => changeStudent(studentIndex - 1), ']': () => changeStudent(studentIndex + 1), arrowleft: () => changePage(page - 1), arrowright: () => changePage(page + 1), arrowup: () => step(-1), arrowdown: () => step(1), n: wrong, '+': () => setZoom(clampPaperZoom(percent * 1.25)), '=': () => setZoom(clampPaperZoom(percent * 1.25)), '-': () => setZoom(clampPaperZoom(percent * .8)), '0': toggleFit, f: () => setImmersive(value => !value), escape: () => setImmersive(false), r: rotate, l: () => { if (!original && !missing) setLayer(value => !value) }, '?': () => setHelp(true) }
    if (actions[key]) { event.preventDefault(); event.stopPropagation(); if (!event.repeat || ['arrowup', 'arrowdown', '+', '=', '-'].includes(key)) actions[key]() }
  }
  const pages = useMemo(() => [0, 1].map(index => ({ id: `p${index}`, imageUrl: paperImage(index, student, !original && layer), alt: `高一数学期中测试，${student}，第 ${index + 1} 页${original ? '扫描原稿' : '标注效果'}`, regions: questions.filter(item => item.page === index).map(item => ({ id: item.id, label: `第 ${item.number} 题`, rect: item.rect, content: <span aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-white/65 transition-opacity duration-200 motion-reduce:transition-none ${selected === item.id || original ? 'opacity-0' : 'opacity-100'}`} /> })) })), [student, original, layer, selected, questions])
  const tool = (label: string, keys: string, icon: ReactElement, action: () => void, disabled = false) => <Tip label={label} keys={keys}><ToolbarButton render={<Button variant="ghost" size="icon" className="min-h-11 min-w-11" />} aria-label={label} onClick={action} disabled={disabled}>{icon}</ToolbarButton></Tip>

  return <TooltipProvider><main className="d1-review bg-background text-foreground">
    <ReviewTools device={device} onDeviceChange={setDevice} missing={missing} onMissingChange={setMissing} defaultPosition={reviewPosition} />
    <div ref={stage} className="d1-stage bg-muted">
      <section ref={frame} aria-label="学生试卷预览框架" tabIndex={-1} className="d1-frame bg-background" data-device={device} data-mobile-pane={mobilePane} data-immersive={immersive} style={device === 'auto' ? undefined : { width: Number(device), height: device === '1440' ? 900 : 1080, transform: `scale(${scale})` }} onKeyDownCapture={event => { if (!((event.target as HTMLElement).closest('[data-review-rail] [role="listbox"]') && ['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key))) keyboard(event) }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHoldOriginal(false) }}>
        <header className="d1-topbar flex items-center gap-4 border-b px-4">
          <Button variant="ghost" className="min-h-11" aria-label="返回学生列表" onClick={() => intent('返回学生列表')}><ArrowLeft /><span className="d1-return-label">返回学生列表</span></Button><Avatar aria-hidden="true"><AvatarFallback>{student[0]}</AvatarFallback></Avatar><h2 className="shrink-0 text-section-title">{student}</h2><p className="d1-student-meta text-ui-meta text-muted-foreground">高一（3）班 · 考号 OLE-ST-{String(18 + studentIndex).padStart(4, '0')}</p>
          <Popover open={studentOpen} onOpenChange={open => { if (open) openStudents(); else setStudentOpen(false) }}><Group className="ml-auto shrink-0" aria-label="学生导航"><Button variant="outline" className="min-h-11" aria-label="上一位学生" disabled={studentIndex === 0} onClick={() => changeStudent(studentIndex - 1)}><ChevronLeft /><span className="d1-student-label">上一位</span></Button><GroupSeparator /><PopoverTrigger ref={studentTrigger} render={<Button variant="outline" className="min-h-11" />} aria-label={`选择学生，当前第 ${studentIndex + 1} / 6 位`} aria-haspopup="dialog">{studentIndex + 1} / 6</PopoverTrigger><GroupSeparator /><Button variant="outline" className="min-h-11" aria-label="下一位学生" disabled={studentIndex === 5} onClick={() => changeStudent(studentIndex + 1)}><span className="d1-student-label">下一位</span><ChevronRight /></Button></Group>
            <PopoverPopup className="surface-floating w-[360px] max-w-[calc(100vw-1rem)] motion-reduce:transition-none" initialFocus={() => document.getElementById('student-search')} finalFocus={studentTrigger}><StudentPanel current={studentIndex} query={studentQuery} active={activeStudent} onQuery={value => { setStudentQuery(value); setActiveStudent(-1) }} onActive={setActiveStudent} onSelect={changeStudent} /></PopoverPopup>
          </Popover>
          <div className="d1-total flex items-center gap-3 whitespace-nowrap"><span className="text-ui-meta text-muted-foreground">最终得分</span><span className="flex items-baseline gap-1"><span className="text-score-display">{record.score}</span><span className="text-ui-body text-muted-foreground">/ 150</span></span><Confirmation>{record.status}</Confirmation></div>
          <Menu><MenuTrigger render={<Button variant="ghost" size="icon" className="min-h-11 min-w-11" />} aria-label="更多"><MoreHorizontal /></MenuTrigger><MenuPopup className="surface-floating motion-reduce:transition-none" align="end"><MenuItem className="min-h-11" onClick={() => intent('打印本学生批注')}>打印本学生批注</MenuItem><MenuItem className="min-h-11" onClick={() => intent('导出')}>导出</MenuItem></MenuPopup></Menu>
        </header>
        <nav ref={mobileNav} className="d1-mobile-nav border-b px-3" aria-label="预览分区"><ToggleGroup value={[mobilePane]} onValueChange={value => { if (value.length) setMobilePane(value[0]) }}>{[['rail', '题目'], ['canvas', '试卷'], ['inspector', '本题反馈']].map(([value, label]) => <ToggleGroupItem key={value} value={value} className="min-h-11">{label}</ToggleGroupItem>)}</ToggleGroup></nav>
        <div className="d1-columns">
          <QuestionRail questions={questions} selected={selected} filter={filter} student={student} missing={missing} onFilter={value => { setFilter(value); if (value && q.score === q.max) wrong() }} onSelect={select} onPage={changePage} onLocate={() => { setMobilePane('canvas'); setLocateRequest(value => value + 1) }} />
          <section aria-label="试卷画布" data-review-canvas className="d1-canvas bg-border" style={{ gridTemplateColumns: `minmax(0,1fr) ${dockWidth}px` }}>
            <div className="d1-paper-host min-h-0 min-w-0 [&_[data-paper-size]]:shadow-2xl [&_[data-region]>button]:border-0! [&_[data-region]>button]:ring-offset-0! [&_[data-region]>button[aria-pressed=false]:hover]:border! [&_[data-region]>button[aria-pressed=false]:hover]:border-info! [&_[data-region]>button[aria-pressed=false]:focus-visible]:ring-1! [&_[data-region]>button[aria-pressed=false]:focus-visible]:ring-info! [&_[data-region]>button[aria-pressed=true]]:ring-2! [&_[data-region]>button[aria-pressed=true]]:ring-info!">
              {missing ? <div className="flex h-full items-center justify-center p-6"><div className="flex aspect-[210/297] h-full max-h-full max-w-full flex-col items-center justify-center gap-4 bg-card p-6 shadow-2xl"><FileImage className="size-10 text-muted-foreground" /><p className="text-ui-body">扫描图像未提供</p><p className="text-ui-hint text-muted-foreground">第 {page + 1} / 2 页</p></div></div> : <ContinuousPaperCanvas viewportRef={canvas} pages={pages} zoom={zoom} rotations={rotations} selected={selected} scale={scale} onSelect={select} onZoom={setZoom} onVisiblePage={setPage} onViewport={setViewport} />}

            </div>
            <div ref={toolDock} className="d1-tool-dock" style={{ width: dockWidth, gridTemplateRows: `minmax(0,1fr) ${88 / scale}px` }}>
              <div className="d1-tool-scroll">
              <Toolbar orientation="vertical" aria-label="试卷悬浮工具条" className="d1-tools surface-floating flex-col items-center">
                <ToolbarGroup aria-label="翻页" className="w-full flex-col gap-0">
                  {tool('上一页', '←', <ArrowUp />, () => changePage(page - 1), page === 0)}
                  <output aria-label="当前页" className="text-ui-meta tabular-nums">{page + 1} / 2</output>
                  {tool('下一页', '→', <ArrowDown />, () => changePage(page + 1), page === 1)}
                </ToolbarGroup><ToolbarSeparator orientation="horizontal" />
                <ToolbarGroup aria-label="视图" className="w-full flex-col gap-0">
                  {tool('放大', '+', <Plus />, () => setZoom(clampPaperZoom(percent * 1.25)), missing || percent >= 300)}
                  <output aria-label="缩放比例" className="text-ui-meta tabular-nums">{missing ? '—' : `${Math.round(percent)}%`}</output>
                  {tool('缩小', '−', <Minus />, () => setZoom(clampPaperZoom(percent * .8)), missing || percent <= 5)}
                  {tool(zoom === 'width' ? '适合页面' : '适合宽度', '0', zoom === 'width' ? <Scan /> : <ArrowLeftRight />, toggleFit, missing)}
                  {tool('旋转当前页', 'R', <RotateCw />, rotate, missing)}
                </ToolbarGroup><ToolbarSeparator orientation="horizontal" />
                <ToolbarGroup aria-label="图层" className="w-full flex-col gap-0">
                  <ToggleGroup aria-label="查看版本" orientation="vertical" className="flex-col" value={[original ? 'original' : 'marked']} onValueChange={value => { if (value.length) setMode(value[0]) }}><Tip label="标注效果" keys="Tab / Enter"><ToggleGroupItem aria-label="标注效果" className="min-h-11 min-w-11" value="marked"><PencilLine /></ToggleGroupItem></Tip><Tip label="扫描原稿；按住临时查看" keys="O"><ToggleGroupItem aria-label="扫描原稿" className="min-h-11 min-w-11" value="original"><FileImage /></ToggleGroupItem></Tip></ToggleGroup>
                  <Tip label={missing ? '扫描图像未提供，标注层不可用' : original ? '扫描原稿不显示标注层' : '开关标注层'} keys="L"><span tabIndex={original || missing ? 0 : undefined} className="inline-flex" aria-label={original ? '扫描原稿不显示标注层' : undefined}><Toggle aria-label="标注层" className="min-h-11 min-w-11" pressed={!original && layer} disabled={original || missing} onPressedChange={setLayer}><Layers /></Toggle></span></Tip>
                </ToolbarGroup>
                <Menu><MenuTrigger render={<Button variant="ghost" size="icon" className="min-h-11 min-w-11" />} aria-label="更多视图操作"><MoreHorizontal /></MenuTrigger><MenuPopup className="surface-floating motion-reduce:transition-none" side="left"><MenuItem aria-label="沉浸" className="min-h-11" onClick={() => setImmersive(value => !value)}>{immersive ? <Minimize /> : <Maximize />}{immersive ? '退出沉浸' : '沉浸'}<Kbd>F</Kbd></MenuItem><MenuItem className="min-h-11" onClick={() => setHelp(true)}><CircleHelp />快捷键表<Kbd>?</Kbd></MenuItem></MenuPopup></Menu>
              </Toolbar>
              </div>
            </div>
          </section>
          <Inspector question={q} confirmed={record.status === '已确认'} hasWrong={questions.some(item => item.score < item.max)} onStep={step} onWrong={wrong} onIntent={intent} />
        </div>
        <div role="status" className={notice ? 'd1-notice absolute bottom-20 left-1/2 z-30 max-w-full -translate-x-1/2 surface-floating px-4 py-3 text-ui-hint' : 'sr-only'}>{notice}</div>
      </section>
    </div>
    <Dialog open={help} onOpenChange={setHelp}><DialogPopup className="surface-floating motion-reduce:transition-none" closeProps={{ 'aria-label': '关闭快捷键表', className: 'absolute end-2 top-2 min-h-11 min-w-11' }}><DialogHeader><DialogTitle>快捷键</DialogTitle><DialogDescription>焦点在试卷预览框架内时可用；输入框与菜单保留自身按键行为。</DialogDescription></DialogHeader><DialogPanel><dl className="space-y-3">{shortcuts.map(([key, label]) => <div key={key} className="flex items-center justify-between gap-4 text-ui-body"><dt>{label}</dt><dd><Kbd>{key}</Kbd></dd></div>)}</dl></DialogPanel></DialogPopup></Dialog>
  </main></TooltipProvider>
}
