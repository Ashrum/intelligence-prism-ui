"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject, type ReactElement } from "react"
import { PanelLeftClose, PanelLeftOpen, ArrowLeft, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, CircleHelp, Scan, RotateCw, Minus, Plus, MoreHorizontal, Sparkles, FileImage, Maximize, Minimize, Layers, ChevronsDown, ArrowLeftRight, PencilLine } from "lucide-react"
import { Button } from "@/components/prism-next/button"
import { Badge } from "@/components/prism-next/badge"
import { paperDimensions, paperZoomPercent, rotatedPaperDimensions, clampPaperZoom, type PaperPreviewZoom, type PaperPreviewRotation } from "@/components/prism-next/paper-preview"
import { ReviewTools } from "@/examples/review-tools/review-tools"
import type { ReviewToolsPosition } from "@/examples/review-tools/review-tools"
import { Toggle } from "@/components/coss/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/components/coss/toolbar"
import { Tooltip, TooltipTrigger, TooltipPopup, TooltipProvider } from "@/components/coss/tooltip"
import { Avatar, AvatarFallback } from "@/components/coss/avatar"
import { Group, GroupSeparator } from "@/components/coss/group"
import { Combobox, ComboboxTrigger, ComboboxPopup, ComboboxInput, ComboboxList, ComboboxGroup, ComboboxGroupLabel, ComboboxCollection, ComboboxItem, ComboboxEmpty } from "@/components/coss/combobox"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { Badge as CossBadge } from "@/components/coss/badge"
import { PAPER_REVIEW_BEST_WIDTH, railBand, railCollapsedForWidth, railPreferenceKeys, readRailPreferences, type RailPreferences } from "./rail-preferences"
import { Kbd } from "@/components/coss/kbd"
import { Frame, FrameHeader, FrameFooter } from "@/components/coss/frame"
import { Meter, MeterTrack, MeterIndicator } from "@/components/coss/meter"
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator } from "@/components/coss/menu"
import { Dialog, DialogPopup, DialogTitle, DialogDescription, DialogHeader, DialogPanel } from "@/components/coss/dialog"
import { ScrollArea } from "@/components/coss/scroll-area"
import { questionsForStudent, students, studentRecords, paperImage, type Question } from "./fixture"
import { dockPaperToolbar } from "./paper-toolbar-layout"
import { linkedPaperRecords, linkedPaperQuestions, linkedPaperImage, questionReviewStudentId } from "../question-review/paper-link"
import { ContinuousPaperCanvas } from "./continuous-paper-canvas"
import "./paper-review.css"

const shortcuts = [["T", "显示 / 隐藏题目栏"], ["G", "选择学生"], ["[ / ]", "上一位 / 下一位学生"], ["← / →", "上一页 / 下一页"], ["↑ / ↓", "上一题 / 下一题"], ["Enter", "定位所选题目"], ["N", "下一道错题"], ["+ / −", "放大 / 缩小"], ["0", "切换适合宽度 / 适合页面"], ["F / Esc", "切换沉浸 / 退出沉浸"], ["R", "旋转 90°"], ["L", "开关标注层"], ["O（按住）", "临时查看扫描原稿"], ["?", "打开快捷键表"]]
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
const studentOptions = studentRecords.map((student, index) => ({ ...student, index }))
type StudentOption = typeof studentOptions[number]
const studentGroups = ['待复核', '已确认'].map(value => ({ value, items: studentOptions.filter(student => student.status === value) }))
export function StudentPanel({ current, open, onOpenChange, onSelect, triggerRef, records = studentRecords }: {
  records?: typeof studentRecords; current: number; open: boolean; onOpenChange: (open: boolean) => void; onSelect: (index: number) => void; triggerRef: RefObject<HTMLButtonElement | null>
}) {
  const studentOptions = records.map((student, index) => ({ ...student, index }))
  const studentGroups = ['待复核', '已确认'].map(value => ({ value, items: studentOptions.filter(student => student.status === value) }))
  return <Combobox items={studentGroups} value={studentOptions[current]} open={open} onOpenChange={onOpenChange}
    itemToStringLabel={student => `${student.name} ${student.examId}`} onValueChange={student => { if (student) onSelect(student.index) }}>
    <Group className="ml-auto shrink-0" aria-label="学生导航">
      <Button variant="outline" size="default" aria-label="上一位学生" disabled={current === 0} onClick={() => onSelect(current - 1)}><ChevronLeft /><span className="d1-student-label">上一位</span></Button><GroupSeparator />
      <ComboboxTrigger ref={triggerRef} render={<Button variant="outline" size="default" />} aria-label={`选择学生，当前第 ${current + 1} / ${records.length} 位`}>{current + 1} / {records.length}</ComboboxTrigger><GroupSeparator />
      <Button variant="outline" size="default" aria-label="下一位学生" disabled={current === records.length - 1} onClick={() => onSelect(current + 1)}><span className="d1-student-label">下一位</span><ChevronRight /></Button>
    </Group>
    <ComboboxPopup data-student-panel aria-label="选择学生" className="surface-floating w-[360px] max-w-[calc(100vw-1rem)] motion-reduce:transition-none" finalFocus={triggerRef}>
      <div className="space-y-2 border-b p-2"><label htmlFor="student-search" className="block text-ui-action">姓名或考号</label><ComboboxInput id="student-search" size="default" showTrigger={false} /></div>
      <ComboboxEmpty>没有匹配的学生</ComboboxEmpty>
      <ComboboxList>{(group: typeof studentGroups[number]) => <ComboboxGroup key={group.value} items={group.items}>
        <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
        <ComboboxCollection>{(student: StudentOption) => <ComboboxItem key={student.index} value={student}>
          <div className="flex items-center gap-2">
            <Avatar aria-hidden="true"><AvatarFallback>{student.name[0]}</AvatarFallback></Avatar>
            <span className="min-w-0 flex-1"><span className="block text-item-title">{student.name}</span><span className="block text-ui-meta text-muted-foreground">{student.examId}</span></span>
            <span className="grid w-10 shrink-0 justify-items-end gap-1"><span className="text-ui-body tabular-nums">{student.score}</span><ScoreBar value={student.score} max={student.max} /></span>
            <Confirmation>{student.status}</Confirmation>
          </div>
        </ComboboxItem>}</ComboboxCollection>
      </ComboboxGroup>}</ComboboxList>
      <p className="flex flex-wrap items-center gap-2 border-t p-2 text-ui-meta text-muted-foreground"><Kbd>↑ ↓</Kbd>选人 <Kbd>Enter</Kbd>跳转 <Kbd>Esc</Kbd>关闭</p>
    </ComboboxPopup>
  </Combobox>
}
function ScoreMeter({ value, max, label }: { value: number; max: number; label: string }) {
  return <Meter value={value} max={max} aria-label={label}><MeterTrack><MeterIndicator className="motion-reduce:transition-none" /></MeterTrack></Meter>
}

export function QuestionRail({ questions, selected, filter, missing, closeRef, onCollapse, onFilter, onSelect, onLocate, onPage }: {
  questions: Question[]; selected: string; filter: boolean; missing: boolean; closeRef: RefObject<HTMLButtonElement | null>; onCollapse: () => void
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
        if (!node?.getClientRects().length || rail.closest('[inert]')) return
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
    const target = event.target as HTMLElement
    // Page buttons retain native Enter activation; question options locate the
    // focused item after Tab navigation without changing selection on focus.
    if (event.key === 'Enter' && target?.closest('[data-page-marker]')) return
    const focused = target?.closest<HTMLElement>('[data-question-id]')?.dataset.questionId
    event.preventDefault(); event.stopPropagation()
    if (event.key === 'Enter') { if (focused && focused !== selected) onSelect(focused); onLocate(); return }
    if (!list.length) return
    const index = Math.max(0, list.findIndex(q => q.id === (focused ?? selected)))
    const next = list[Math.max(0, Math.min(list.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1)))]
    onSelect(next.id)
    root.current?.querySelector<HTMLButtonElement>(`[data-question-id="${next.id}"]`)?.focus({ preventScroll: true })
  }
  const totals = [questions.filter(q => q.score === q.max).length, questions.filter(q => q.score > 0 && q.score < q.max).length, questions.filter(q => q.score === 0).length]
  const status = (q: Question) => q.score === q.max ? '满分' : q.score === 0 ? '零分' : '部分得分'
  return <aside ref={root} aria-label="题目栏" data-review-rail className="d1-rail min-h-0 bg-background">
    <Tabs className="d1-rail-tabs" value={filter ? 'wrong' : 'all'} onValueChange={value => onFilter(value === 'wrong')}>
    <header className="d1-rail-header flex items-center justify-between gap-1 px-3"><h2 className="sr-only">题目</h2>
      <TabsList size="sm" aria-label="题目筛选">
        <TabsTab value="all" aria-controls="question-filter-panel" aria-label={`全部题目，共 ${questions.length} 题`}>全部<CossBadge variant="outline">{questions.length}</CossBadge></TabsTab>
        <TabsTab value="wrong" aria-controls="question-filter-panel" aria-label={`仅看错题，共 ${questions.filter(q => q.score < q.max).length} 题`}>错题<CossBadge variant="outline">{questions.filter(q => q.score < q.max).length}</CossBadge></TabsTab>
      </TabsList>
      <Tip label="收起题目栏" keys="T"><Button ref={closeRef} variant="ghost" size="icon" aria-label="收起题目栏" onClick={onCollapse}><PanelLeftClose /></Button></Tip>
    </header>
    <section aria-label="全卷概览" className="d1-rail-overview space-y-1 px-3 py-1.5">
      <div aria-hidden="true" className="flex h-1 gap-0.5 overflow-hidden rounded-full">{totals.map((count, index) => count > 0 && <span key={index} data-overview-count={count} className={['bg-success', 'bg-warning', 'bg-destructive'][index]} style={{ flex: count }} />)}</div>
      <p className="text-ui-meta tabular-nums text-muted-foreground">满分 {totals[0]} · 部分 {totals[1]} · 零分 {totals[2]}</p>
    </section>
    <TabsPanel id="question-filter-panel" value={filter ? 'wrong' : 'all'} className="min-h-0"><ScrollArea overscrollContain><div role="listbox" aria-label="选择题目" onKeyDown={keyboard} className="space-y-4 px-3 py-2">
      {['选择', '填空', '解答'].map(type => {
        const group = list.filter(q => q.type === type), all = questions.filter(q => q.type === type)
        if (!group.length) return null
        return <div key={type} role="group" aria-label={`${type}题`}>
          <h3 className="mb-1 flex items-center justify-between gap-1 text-ui-meta text-muted-foreground"><span>{type}题 <span className="tabular-nums">{all[0].number}–{all.at(-1)!.number}</span></span><span data-section-total={type} className="text-right tabular-nums">{all.reduce((sum, q) => sum + q.score, 0)} / {all.reduce((sum, q) => sum + q.max, 0)}</span></h3>
          {[...new Set(group.map(q => q.page))].map(page => <div key={page}>
            {list.find(q => q.page === page)?.type === type && <div className="flex items-center gap-2" data-page-marker><span className="h-px flex-1 bg-border" aria-hidden="true" /><Tip label={`定位第 ${page + 1} 页 · ${missing ? '扫描质量未提供' : '清晰'}`} keys="Enter"><Button variant="ghost" className="px-1" aria-label={`定位第 ${page + 1} 页，${missing ? '扫描质量未提供' : '清晰'}`} onClick={() => onPage(page)}><span className="text-ui-meta text-muted-foreground">第 {page + 1} 页</span></Button></Tip></div>}
            <div className={type === '解答' ? 'grid gap-1' : 'grid grid-cols-4 gap-1'}>
              {group.filter(q => q.page === page).map(q => <Tooltip key={q.id}><TooltipTrigger render={<Button role="option" aria-selected={selected === q.id} tabIndex={0} data-question-id={q.id} data-question-layout={type === '解答' ? 'row' : 'cell'} aria-label={`第 ${q.number} 题，${q.type}题，${q.score} / ${q.max} 分，${status(q)}`} variant="ghost" onClick={() => onSelect(q.id)} className={`d1-question h-auto sm:h-auto w-full px-2 transition-shadow duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${type === '解答' ? 'gap-2' : `min-h-11 ${q.score === q.max ? 'bg-muted text-muted-foreground hover:bg-accent' : q.score === 0 ? 'bg-destructive/10 text-foreground hover:bg-destructive/20' : 'bg-warning/10 text-foreground hover:bg-warning/20'}`} ${selected === q.id ? 'ring-2 ring-info focus-visible:ring-info shadow-sm text-foreground' : ''}`} />}>
                <span className={`shrink-0 tabular-nums ${type === '解答' ? 'w-6 text-right text-block-title' : 'text-ui-action'}`}>{q.number}</span>
                {type === '解答' && <><span aria-hidden="true" className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"><span className={`block h-full ${q.score === q.max ? 'bg-foreground' : scoreTone(q.score, q.max)}`} style={{ width: `${q.score / q.max * 100}%` }} /></span><span className="w-16 shrink-0 text-right tabular-nums"><span className="block text-ui-action">{q.score}<span className="text-ui-meta text-muted-foreground"> / {q.max}</span></span>{q.score < q.max && <span className="block text-ui-meta text-muted-foreground">−{q.max - q.score}</span>}</span></>}
              </TooltipTrigger><TooltipPopup className="surface-floating" side="right">第 {q.number} 题 · {q.score} / {q.max} 分</TooltipPopup></Tooltip>)}
            </div>
          </div>)}
        </div>
      })}
      {!list.length && <p className="py-6 text-ui-body text-muted-foreground">没有错题</p>}
    </div><p className="px-3 pb-3 text-ui-meta text-muted-foreground">{missing ? '2 页 · 扫描质量未提供' : '2 页 · 扫描清晰 · 无缺页'}</p></ScrollArea></TabsPanel>
    </Tabs>
  </aside>
}

function Inspector({ question: q, studentId, confirmed, hasWrong, onStep, onWrong, onIntent }: { question: Question; studentId: string; confirmed: boolean; hasWrong: boolean; onStep: (step: number) => void; onWrong: () => void; onIntent: (action: string) => void }) {
  return <aside aria-label="本题检查器" data-review-inspector className="d1-inspector min-h-0 bg-background">
    <FrameHeader className="d1-inspector-header flex-row items-center justify-between gap-1 px-2 py-0"><h2 className="min-w-0 truncate text-block-title" title={`第 ${q.number} 题 · ${q.type}题`}>第 {q.number} 题 · {q.type}题</h2><Confirmation>{confirmed ? '最终确认' : '待复核'}</Confirmation><div className="flex shrink-0"><Tip label="上一题" keys="↑"><Button variant="ghost" size="icon" aria-label="上一题" disabled={q.number === 1} onClick={() => onStep(-1)}><ArrowUp /></Button></Tip><Tip label="下一题" keys="↓"><Button variant="ghost" size="icon" aria-label="下一题" disabled={q.number === 20} onClick={() => onStep(1)}><ArrowDown /></Button></Tip><Tip label="下一道错题" keys="N"><Button variant="ghost" size="icon" aria-label="下一道错题" disabled={!hasWrong} onClick={onWrong}><ChevronsDown /></Button></Tip></div></FrameHeader>
    <div className="min-h-0 overflow-hidden px-4 pb-4"><ScrollArea overscrollContain scrollFade><Frame>
      <div className="space-y-7 px-4 py-5">
        <section aria-label="本题得分" className="space-y-3"><div className="flex items-baseline gap-1"><span className="text-score-display">{q.score}</span><span className="text-ui-body text-muted-foreground">/ {q.max} 分</span><Badge className="ml-auto" variant="outline">{q.score === q.max ? '达成' : '需改进'}</Badge></div><ScoreMeter value={q.score} max={q.max} label="本题得分" /></section>
        <section className="space-y-3" aria-label="评分点"><h3 className="text-block-title">评分点</h3><ul className="space-y-4 text-ui-body">{q.points.map((point, i) => <li key={point.label} className="grid grid-cols-[0.5rem_minmax(0,1fr)_3rem] items-baseline gap-x-3 gap-y-1"><Outcome question={point} /><span><span className="mr-2 text-ui-meta text-muted-foreground">{i + 1}.</span>{point.label}</span><span className="text-right tabular-nums">{point.score}/{point.max}</span>{point.reason && <p className="col-span-2 col-start-2 text-ui-meta text-muted-foreground">缺失：{point.reason}</p>}</li>)}</ul></section>
        <section className="overflow-hidden rounded-lg bg-muted" aria-label="AI 判定依据"><div data-ai-source className="h-0.5" style={{ background: 'var(--brand-ai-gradient)' }} /><div className="space-y-3 p-4"><h3 className="flex items-center gap-2 text-block-title"><Sparkles className="size-4" aria-hidden="true" />AI 判定依据</h3><p className="text-ui-body">{q.evidence}</p><p className="text-ui-meta text-muted-foreground">置信度：未提供</p></div></section>
        <section className="space-y-2"><h3 className="text-block-title">知识点</h3><Badge variant="outline" className="whitespace-normal">{q.knowledge}</Badge></section>
      </div>
      <FrameFooter className="space-y-3"><h3 className="text-block-title">班级对比<Button data-question-review-link variant="link" className="ml-2" render={<a href={`/next/reviews/question-review?question=${q.id}&student=${studentId}`} />}>看全班此题 →</Button></h3><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><p className="text-ui-meta text-muted-foreground">本题得分率</p><p className="text-block-title tabular-nums">{q.rate}%</p><ScoreMeter value={q.rate} max={100} label="本题班级得分率" /></div><div className="space-y-2"><p className="text-ui-meta text-muted-foreground">受影响学生比例</p><p className="text-block-title tabular-nums">{Math.round(q.affected / 36 * 100)}% <span className="text-ui-meta text-muted-foreground">{q.affected} / 36</span></p><ScoreMeter value={q.affected} max={36} label="受影响学生比例" /></div></div></FrameFooter>
    </Frame></ScrollArea></div>
    <footer className="flex gap-3 border-t p-4"><Button className="flex-1" onClick={() => onIntent('更正评分')}>更正评分</Button><Button variant="outline" className="flex-1" onClick={() => onIntent('教师批阅')}>教师批阅</Button></footer>
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
  const [studentOpen, setStudentOpen] = useState(false)
  const studentTrigger = useRef<HTMLButtonElement>(null)
  const [railState, setRailState] = useState<{ width: number; preferences: RailPreferences; ready: boolean; animate: boolean }>({ width: PAPER_REVIEW_BEST_WIDTH, preferences: {}, ready: false, animate: false })
  const railCollapsed = railCollapsedForWidth(railState.width, railState.preferences)
  const closeRail = useRef<HTMLButtonElement>(null), openRail = useRef<HTMLButtonElement>(null), railFocus = useRef(false)
  const [dockPosition, setDockPosition] = useState({ left: 0, top: 8, maxHeight: 600 })
  const canvasArea = useRef<HTMLElement>(null), toolbar = useRef<HTMLDivElement>(null)
  const mobileNav = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null), frame = useRef<HTMLElement>(null), canvas = useRef<HTMLDivElement>(null)
  const [linked, setLinked] = useState(false)
  const activeRecords = linked ? linkedPaperRecords : studentRecords
  const availableNames = activeRecords.map(record => record.name)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const useLinked = params.get('source') === 'question-review'
    const records = useLinked ? linkedPaperRecords : studentRecords
    const index = records.findIndex(record => record.examId === params.get('student'))
    if (index >= 0) { setLinked(useLinked); setStudentIndex(index) }
    const requested = params.get('question')?.replace(/^q0?/, 'q')
    if (questionsForStudent(0).some(q => q.id === requested)) { setSelected(requested!); setSelectionRequest(value => value + 1) }
  }, [])
  const questions = useMemo(() => linked ? linkedPaperQuestions(studentIndex) : questionsForStudent(studentIndex), [studentIndex, linked])
  const record = activeRecords[studentIndex]
  const q = questions.find(item => item.id === selected)!, student = availableNames[studentIndex]
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
  }, [zoom, rotations, viewport, scale, missing, immersive, railCollapsed, mobilePane])
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
    if (index < 0 || index >= availableNames.length) return
    setStudentIndex(index); setNotice(''); setStudentOpen(false)
    const nextQuestions = linked ? linkedPaperQuestions(index) : questionsForStudent(index)
    if (filter && nextQuestions.find(item => item.id === selected)?.score === nextQuestions.find(item => item.id === selected)?.max) {
      const nextWrong = nextQuestions.find(item => item.score < item.max)
      if (nextWrong) { setSelected(nextWrong.id); if (missing) setPage(nextWrong.page); setSelectionRequest(value => value + 1) }
    }
  }
  function openStudents() { setImmersive(false); setStudentOpen(true) }
  function toggleFit() { setZoom(value => value === 'width' ? 'page' : 'width') }

  function rotate() { setRotations(value => ({ ...value, [`p${page}`]: ((rotation + 90) % 360) as PaperPreviewRotation })) }
  function intent(action: string) { setNotice(`已请求：${action} · ${student}${action === '更正评分' || action === '教师批阅' ? ` · 第 ${q.number} 题` : ''}`) }
  function keyboard(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    if (studentOpen || event.defaultPrevented || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey || target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],[role="menu"]') || (target.closest('[role="listbox"]') && !target.closest('[data-review-rail]'))) return
    if (target.closest('[role=tablist]') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' '].includes(event.key)) return
    const key = event.key.toLowerCase()
    if (key === 'o') { event.preventDefault(); setHoldOriginal(true); return }
    if (missing && ['+', '=', '-', '0', 'r', 'l'].includes(key)) return
    const actions: Record<string, () => void> = { t: () => { if (!immersive) toggleRail() }, g: openStudents, '[': () => changeStudent(studentIndex - 1), ']': () => changeStudent(studentIndex + 1), arrowleft: () => changePage(page - 1), arrowright: () => changePage(page + 1), arrowup: () => step(-1), arrowdown: () => step(1), n: wrong, '+': () => setZoom(clampPaperZoom(percent * 1.25)), '=': () => setZoom(clampPaperZoom(percent * 1.25)), '-': () => setZoom(clampPaperZoom(percent * .8)), '0': toggleFit, f: () => setImmersive(value => !value), escape: () => setImmersive(false), r: rotate, l: () => { if (!original && !missing) setLayer(value => !value) }, '?': () => setHelp(true) }
    if (actions[key]) { event.preventDefault(); event.stopPropagation(); if (!event.repeat || ['arrowup', 'arrowdown', '+', '=', '-'].includes(key)) actions[key]() }
  }
  const pages = useMemo(() => [0, 1].map(index => ({ id: `p${index}`, imageUrl: linked ? linkedPaperImage(index, studentIndex, !original && layer) : paperImage(index, student, !original && layer), alt: `高一数学期中测试，${student}，第 ${index + 1} 页${original ? '扫描原稿' : '标注效果'}`, regions: questions.filter(item => item.page === index).map(item => ({ id: item.id, label: `第 ${item.number} 题`, rect: item.rect, content: <span aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-white/65 transition-opacity duration-200 motion-reduce:transition-none ${selected === item.id || original ? 'opacity-0' : 'opacity-100'}`} /> })) })), [student, original, layer, selected, questions])
  const tool = (label: string, keys: string, icon: ReactElement, action: () => void, disabled = false) => <Tip label={label} keys={keys}><ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label={label} onClick={action} disabled={disabled}>{icon}</ToolbarButton></Tip>

  return <TooltipProvider><main className="d1-review bg-background text-foreground">
    <ReviewTools device={device} onDeviceChange={setDevice} missing={missing} onMissingChange={setMissing} defaultPosition={reviewPosition} onResetRailPreferences={resetRailPreferences} />
    <div ref={stage} className="d1-stage bg-muted">
      <section ref={frame} aria-label="学生试卷预览框架" tabIndex={-1} className="d1-frame bg-background" data-device={device} data-mobile-pane={mobilePane} data-immersive={immersive} data-rail-collapsed={railCollapsed} data-rail-ready={railState.ready} data-rail-animate={railState.animate} style={device === 'auto' ? undefined : { width: Number(device), height: device === '1440' ? 900 : 1080, transform: `scale(${scale})` }} onKeyDownCapture={event => { if (!((event.target as HTMLElement).closest('[data-review-rail] [role="listbox"]') && ['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key))) keyboard(event) }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHoldOriginal(false) }}>
        <header className="d1-topbar flex items-center gap-4 border-b px-4">
          <Button variant="ghost" aria-label="返回学生列表" onClick={() => intent('返回学生列表')}><ArrowLeft /><span className="d1-return-label">返回学生列表</span></Button><Avatar aria-hidden="true"><AvatarFallback>{student[0]}</AvatarFallback></Avatar><h2 className="shrink-0 text-section-title">{student}</h2><p className="d1-student-meta text-ui-meta text-muted-foreground">高一（3）班 · 考号 {record.examId}</p>
          <StudentPanel records={activeRecords} current={studentIndex} open={studentOpen} onOpenChange={open => { if (open) openStudents(); else setStudentOpen(false) }} onSelect={changeStudent} triggerRef={studentTrigger} />
          <div className="d1-total flex items-center gap-3 whitespace-nowrap"><span className="text-ui-meta text-muted-foreground">最终得分</span><span className="flex items-baseline gap-1"><span className="text-score-display">{record.score}</span><span className="text-ui-body text-muted-foreground">/ {record.max}</span></span><Confirmation>{record.status}</Confirmation></div>
          <Menu><MenuTrigger render={<Button variant="ghost" size="icon" />} aria-label="更多"><MoreHorizontal /></MenuTrigger><MenuPopup className="surface-floating motion-reduce:transition-none" align="end"><MenuItem onClick={() => intent('打印本学生批注')}>打印本学生批注</MenuItem><MenuItem onClick={() => intent('导出')}>导出</MenuItem><MenuSeparator /><MenuItem onClick={() => setHelp(true)}><CircleHelp />快捷键表<Kbd>?</Kbd></MenuItem></MenuPopup></Menu>
        </header>
        <nav ref={mobileNav} className="d1-mobile-nav border-b px-3" aria-label="预览分区"><ToggleGroup value={[mobilePane]} onValueChange={value => { if (value.length) { if (value[0] === 'rail' && railCollapsed) toggleRail(); else setMobilePane(value[0]) } }}>{[['rail', '题目'], ['canvas', '试卷'], ['inspector', '本题反馈']].map(([value, label]) => <ToggleGroupItem key={value} value={value}>{label}</ToggleGroupItem>)}</ToggleGroup></nav>
        <div className="d1-columns">
          <div className="d1-rail-shell" inert={railCollapsed}><QuestionRail questions={questions} selected={selected} filter={filter} missing={missing} closeRef={closeRail} onCollapse={toggleRail} onFilter={value => { setFilter(value); if (value && q.score === q.max) wrong() }} onSelect={select} onPage={changePage} onLocate={() => { setMobilePane('canvas'); setLocateRequest(value => value + 1) }} /></div>
          <section ref={canvasArea} aria-label="试卷画布" data-review-canvas className="d1-canvas bg-border">
            {railCollapsed && !immersive && <Tip label="展开题目栏" keys="T"><Button ref={openRail} variant="ghost" aria-label="展开题目栏" className="absolute left-2 top-2 z-20 surface-floating" onClick={toggleRail}><PanelLeftOpen />题目 · 错 {questions.filter(item => item.score < item.max).length}</Button></Tip>}
            <div className="d1-paper-host min-h-0 min-w-0 [&_[data-paper-size]]:shadow-2xl [&_[data-region]>button]:border-0! [&_[data-region]>button]:ring-offset-0! [&_[data-region]>button[aria-pressed=false]:hover]:border! [&_[data-region]>button[aria-pressed=false]:hover]:border-info! [&_[data-region]>button[aria-pressed=false]:focus-visible]:ring-1! [&_[data-region]>button[aria-pressed=false]:focus-visible]:ring-info! [&_[data-region]>button[aria-pressed=true]]:ring-2! [&_[data-region]>button[aria-pressed=true]]:ring-info!">
              {missing ? <div className="flex h-full items-center justify-center p-2 pr-16"><div data-missing-paper className="flex aspect-[210/297] h-full max-h-full max-w-full flex-col items-center justify-center gap-4 bg-card p-6 shadow-2xl"><FileImage className="size-10 text-muted-foreground" /><p className="text-ui-body">扫描图像未提供</p><p className="text-ui-hint text-muted-foreground">第 {page + 1} / 2 页</p></div></div> : <ContinuousPaperCanvas viewportRef={canvas} pages={pages} zoom={zoom} rotations={rotations} selected={selected} scale={scale} onSelect={select} onZoom={setZoom} onVisiblePage={setPage} onViewport={setViewport} />}

            </div>
            <div className="d1-tool-dock rounded-r-xl shadow-lg" style={dockPosition}>
              <div className="d1-tool-scroll">
              <Toolbar ref={toolbar} orientation="vertical" aria-label="试卷悬浮工具条" className="d1-tools surface-floating rounded-l-none rounded-r-xl flex-col items-center">
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
                  <ToggleGroup aria-label="查看版本" orientation="vertical" className="flex-col" value={[original ? 'original' : 'marked']} onValueChange={value => { if (value.length) setMode(value[0]) }}><Tip label="标注效果" keys="Tab / Enter"><ToggleGroupItem size="default" aria-label="标注效果" value="marked"><PencilLine /></ToggleGroupItem></Tip><Tip label="扫描原稿；按住临时查看" keys="O"><ToggleGroupItem size="default" aria-label="扫描原稿" value="original"><FileImage /></ToggleGroupItem></Tip></ToggleGroup>
                  <Tip label={missing ? '扫描图像未提供，标注层不可用' : original ? '扫描原稿不显示标注层' : '开关标注层'} keys="L"><span tabIndex={original || missing ? 0 : undefined} className="inline-flex" aria-label={original ? '扫描原稿不显示标注层' : undefined}><Toggle size="default" aria-label="标注层" pressed={!original && layer} disabled={original || missing} onPressedChange={setLayer}><Layers /></Toggle></span></Tip>
                </ToolbarGroup>
                <ToolbarSeparator orientation="horizontal" /><ToolbarGroup aria-label="沉浸视图" className="w-full flex-col gap-0"><Tip label={immersive ? '退出沉浸' : '沉浸'} keys="F"><ToolbarButton render={<Toggle size="default" pressed={immersive} onPressedChange={setImmersive} />} aria-label="沉浸">{immersive ? <Minimize /> : <Maximize />}</ToolbarButton></Tip></ToolbarGroup>
              </Toolbar>
              </div>
            </div>
          </section>
          <Inspector studentId={linked ? record.examId : questionReviewStudentId(record.name, record.examId)} question={q} confirmed={record.status === '已确认'} hasWrong={questions.some(item => item.score < item.max)} onStep={step} onWrong={wrong} onIntent={intent} />
        </div>
        <div role="status" className={notice ? 'd1-notice absolute bottom-20 left-1/2 z-30 max-w-full -translate-x-1/2 surface-floating px-4 py-3 text-ui-hint' : 'sr-only'}>{notice}</div>
      </section>
    </div>
    <Dialog open={help} onOpenChange={setHelp}><DialogPopup className="surface-floating motion-reduce:transition-none" closeProps={{ 'aria-label': '关闭快捷键表', className: 'absolute end-2 top-2' }}><DialogHeader><DialogTitle>快捷键</DialogTitle><DialogDescription>焦点在试卷预览框架内时可用；输入框与菜单保留自身按键行为。</DialogDescription></DialogHeader><DialogPanel><dl className="space-y-3">{shortcuts.map(([key, label]) => <div key={key} className="flex items-center justify-between gap-4 text-ui-body"><dt>{label}</dt><dd><Kbd>{key}</Kbd></dd></div>)}</dl></DialogPanel></DialogPopup></Dialog>
  </main></TooltipProvider>
}
