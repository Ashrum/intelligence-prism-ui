"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from "react"
import { ArrowLeft, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Check, X, CircleHelp, Scan, RotateCw, Minus, Plus, MoreHorizontal, Sparkles, FileImage } from "lucide-react"
import { Button } from "@/components/prism-next/button"
import { Badge } from "@/components/prism-next/badge"
import { PaperPreview, PaperThumbnail, paperDimensions, paperZoomPercent, rotatedPaperDimensions, clampPaperZoom, type PaperPreviewZoom, type PaperPreviewRotation } from "@/components/prism-next/paper-preview"
import { ThemePicker } from "@/components/prism-next/shell"
import { Toggle } from "@/components/coss/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/components/coss/toolbar"
import { Tooltip, TooltipTrigger, TooltipPopup, TooltipProvider } from "@/components/coss/tooltip"
import { Kbd } from "@/components/coss/kbd"
import { Frame, FrameHeader, FramePanel, FrameFooter } from "@/components/coss/frame"
import { Meter, MeterTrack, MeterIndicator } from "@/components/coss/meter"
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@/components/coss/menu"
import { Dialog, DialogPopup, DialogTitle, DialogDescription, DialogHeader, DialogPanel } from "@/components/coss/dialog"
import { ScrollArea } from "@/components/coss/scroll-area"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { questions, students, paperImage, type Question } from "./fixture"
import "./paper-review.css"

const targets = [{ value: "auto", label: "自适应" }, { value: "1440", label: "1440×900" }, { value: "1920", label: "1920×1080" }]
const shortcuts = [["← / →", "上一页 / 下一页"], ["↑ / ↓", "上一题 / 下一题"], ["Enter", "定位所选题目"], ["N", "下一道错题"], ["+ / − / 0", "放大 / 缩小 / 适合页面"], ["R", "旋转 90°"], ["L", "开关标注层"], ["O（按住）", "临时查看扫描原稿"], ["?", "打开快捷键表"]]
function Tip({ label, keys, children }: { label: string; keys: string; children: ReactElement }) {
  return <Tooltip><TooltipTrigger render={children} /><TooltipPopup><span className="text-ui-hint">{label} <Kbd>{keys}</Kbd></span></TooltipPopup></Tooltip>
}
function Outcome({ question }: { question: Question }) {
  return question.score === question.max ? <Check className="size-4 text-muted-foreground" aria-label="满分" /> : question.score === 0 ? <X className="size-4 text-destructive-foreground" aria-label="零分" /> : <span className="text-ui-body" aria-label="部分得分">◐</span>
}
function ScoreMeter({ value, max, label }: { value: number; max: number; label: string }) {
  return <Meter value={value} max={max} aria-label={label}><MeterTrack><MeterIndicator className="motion-reduce:transition-none" /></MeterTrack></Meter>
}

function QuestionRail({ selected, filter, missing, student, onFilter, onSelect, onLocate }: {
  selected: string; filter: boolean; missing: boolean; student: string
  onFilter: (value: boolean) => void; onSelect: (id: string) => void; onLocate: () => void
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
    const index = Math.max(0, list.findIndex(q => q.id === selected))
    const next = list[Math.max(0, Math.min(list.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1)))]
    onSelect(next.id)
    root.current?.querySelector<HTMLButtonElement>(`[data-question-id="${next.id}"]`)?.focus({ preventScroll: true })
  }
  return <aside ref={root} aria-label="题目栏" data-review-rail className="d1-rail min-h-0 border-r bg-background">
    <header className="space-y-3 px-4 py-4"><div className="flex items-center justify-between"><h2 className="text-block-title">题目</h2><span className="text-ui-hint text-muted-foreground">20 题 · 错 4</span></div>
      <ToggleGroup aria-label="题目筛选" value={[filter ? 'wrong' : 'all']} onValueChange={v => { if (v.length) onFilter(v[0] === 'wrong') }}>
        <ToggleGroupItem className="min-h-11" value="all">全部</ToggleGroupItem><ToggleGroupItem className="min-h-11" value="wrong">仅错题</ToggleGroupItem>
      </ToggleGroup>
    </header>
    <ScrollArea overscrollContain><div role="listbox" aria-label="选择题目" onKeyDown={keyboard} className="pb-4">
      {[0, 1].map(page => <div key={page} role="group" aria-label={`第 ${page + 1} 页题目`}>
        <div className="flex items-center gap-3 px-4 py-3"><div className="h-12 w-9 overflow-hidden shadow-sm" aria-hidden="true">{missing ? <FileImage className="size-6" /> : <PaperThumbnail page={{ id: `p${page}`, imageUrl: paperImage(page, student, false) }} label="" />}</div><div><h3 className="text-ui-body">第 {page + 1} 页</h3><p className="text-ui-hint text-muted-foreground">{missing ? '扫描质量未提供' : '清晰'}</p></div></div>
        {list.filter(q => q.page === page).map(q => <Button key={q.id} role="option" aria-selected={selected === q.id} tabIndex={selected === q.id ? 0 : -1} data-question-id={q.id} aria-label={`第 ${q.number} 题，${q.type}，${q.score}/${q.max} 分`} variant="ghost" onClick={() => onSelect(q.id)} className={`relative h-auto sm:h-auto min-h-11 w-full justify-start gap-3 px-4 ${selected === q.id ? 'bg-accent' : ''}`}>
          {selected === q.id && <span className="absolute inset-y-2 left-0 w-0.5 bg-foreground" aria-hidden="true" />}<span className="w-6 shrink-0 text-ui-action tabular-nums">{q.number}</span><span className="shrink-0 text-ui-hint text-muted-foreground">{q.type}</span><span className="ml-auto grid shrink-0 grid-cols-[1rem_2.75rem_1.75rem] items-center gap-1"><Outcome question={q} /><span className={`text-right text-ui-body tabular-nums ${q.score === q.max ? 'text-muted-foreground' : 'text-foreground'}`}>{q.score}/{q.max}</span><span className="text-right text-ui-hint text-foreground tabular-nums" aria-label={q.score < q.max ? `失分 ${q.max - q.score} 分` : undefined}>{q.score < q.max ? `−${q.max - q.score}` : ''}</span></span>
        </Button>)}
      </div>)}
    </div></ScrollArea>
    <footer className="border-t px-4 py-3 text-ui-hint text-muted-foreground">{missing ? '2 页 · 扫描质量未提供' : '2 页 · 扫描清晰 · 无缺页'}</footer>
  </aside>
}

function Inspector({ question: q, onStep, onWrong, onIntent }: { question: Question; onStep: (step: number) => void; onWrong: () => void; onIntent: (action: string) => void }) {
  return <aside aria-label="本题检查器" data-review-inspector className="d1-inspector min-h-0 border-l bg-background">
    <div className="min-h-0 overflow-hidden p-4"><ScrollArea overscrollContain><Frame>
      <FrameHeader className="gap-3"><div className="flex flex-wrap items-center gap-2"><h2 className="text-block-title">第 {q.number} 题</h2><span className="text-ui-hint text-muted-foreground">{q.type}题</span><Badge variant="outline">最终确认</Badge></div>
        <div className="flex items-center gap-1"><Tip label="上一题" keys="↑"><Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="上一题" disabled={q.number === 1} onClick={() => onStep(-1)}><ArrowUp /></Button></Tip><Tip label="下一题" keys="↓"><Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="下一题" disabled={q.number === 20} onClick={() => onStep(1)}><ArrowDown /></Button></Tip><Button variant="ghost" className="ml-auto min-h-11" onClick={onWrong}>下一道错题</Button></div>
      </FrameHeader>
      <FramePanel className="space-y-5">
        <section aria-label="本题得分" className="space-y-3"><div className="flex items-baseline gap-1"><span className="text-stat-display tabular-nums">{q.score}</span><span className="text-ui-body text-muted-foreground">/ {q.max} 分</span><Badge className="ml-auto" variant="outline">{q.score === q.max ? '达成' : '需改进'}</Badge></div><ScoreMeter value={q.score} max={q.max} label="本题得分" /></section>
        <section className="space-y-3 border-t pt-4" aria-label="评分点"><h3 className="text-item-title">评分点</h3><div className="grid grid-cols-[auto_minmax(0,1fr)_1rem_3rem] items-start gap-x-2 gap-y-3 text-ui-body">{q.points.map((point, i) => <div key={point.label} className="col-span-4 grid grid-cols-subgrid gap-y-2"><span className="whitespace-nowrap">评分点 {i + 1} ·</span><span>{point.label}</span>{point.score === point.max ? <Check className="size-4 self-center text-success-foreground" aria-label="达成" /> : <X className="size-4 self-center text-destructive-foreground" aria-label="未达成" />}<span className="text-right tabular-nums">{point.score}/{point.max}</span>{point.reason && <p className="col-span-3 col-start-2 text-ui-hint text-muted-foreground">缺失：{point.reason}</p>}</div>)}</div></section>
        <section className="space-y-2 border-t pt-4" aria-label="AI 判定依据"><h3 className="flex items-center gap-2 text-item-title"><Sparkles className="size-4 text-info" aria-hidden="true" />AI 判定依据</h3><p className="text-ui-body">{q.evidence}</p><p className="text-ui-hint text-muted-foreground">置信度：未提供</p></section>
        <section className="space-y-2 border-t pt-4"><h3 className="text-item-title">知识点</h3><Badge variant="outline" className="h-auto whitespace-normal">{q.knowledge}</Badge></section>
      </FramePanel>
      <FrameFooter className="space-y-3"><h3 className="text-item-title">班级对比</h3><p className="text-ui-body">本题得分率 {q.rate}%</p><ScoreMeter value={q.rate} max={100} label="本题班级得分率" /><p className="text-ui-hint text-muted-foreground">受影响学生 {q.affected} / 36</p></FrameFooter>
    </Frame></ScrollArea></div>
    <footer className="flex gap-3 border-t p-4"><Button className="min-h-11 flex-1" onClick={() => onIntent('更正评分')}>更正评分</Button><Button variant="outline" className="min-h-11 flex-1" onClick={() => onIntent('教师批阅')}>教师批阅</Button></footer>
  </aside>
}

export function PaperReviewDesign() {
  const [device, setDevice] = useState('auto'), [scale, setScale] = useState(1)
  const [selected, setSelected] = useState('q17'), [page, setPage] = useState(1), [filter, setFilter] = useState(false)
  const [studentIndex, setStudentIndex] = useState(0), [missing, setMissing] = useState(false)
  const [zoom, setZoom] = useState<PaperPreviewZoom>('page'), [rotations, setRotations] = useState<Record<string, PaperPreviewRotation>>({})
  const [mode, setMode] = useState('marked'), [layer, setLayer] = useState(true), [holdOriginal, setHoldOriginal] = useState(false)
  const [help, setHelp] = useState(false), [notice, setNotice] = useState(''), [mobilePane, setMobilePane] = useState('canvas')
  const [locateRequest, setLocateRequest] = useState(0)
  const [viewport, setViewport] = useState({ width: 600, height: 650 })
  const stage = useRef<HTMLDivElement>(null), frame = useRef<HTMLElement>(null), canvas = useRef<HTMLDivElement>(null)
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
    const node = canvas.current?.querySelector<HTMLElement>('.paper-preview-viewport')
    if (!node) return
    const measure = () => setViewport({ width: Math.max(1, node.clientWidth - 32), height: Math.max(1, node.clientHeight - 32) })
    measure(); const observer = new ResizeObserver(measure); observer.observe(node)
    return () => observer.disconnect()
  }, [missing])
  useEffect(() => {
    const clear = () => setHoldOriginal(false)
    const up = (event: globalThis.KeyboardEvent) => { if (event.key.toLowerCase() === 'o') clear() }
    window.addEventListener('keyup', up); window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear)
    return () => { window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear) }
  }, [])
  function locate() {
    const region = canvas.current?.querySelector<HTMLElement>(`[data-region="${selected}"]`)
    const node = canvas.current?.querySelector<HTMLElement>('.paper-preview-viewport')
    if (!region || !node) return
    const a = region.getBoundingClientRect(), b = node.getBoundingClientRect()
    const factor = scale || 1
    node.scrollTo({ left: node.scrollLeft + (a.left + a.width / 2 - b.left - b.width / 2) / factor, top: node.scrollTop + (a.top + a.height / 2 - b.top - b.height / 2) / factor, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  useEffect(() => { if (mobilePane === 'canvas') locate() }, [selected, page, mobilePane, missing]) // Host-only positioning; zoom keeps the viewer's gesture anchor.
  useEffect(() => {
    if (!locateRequest) return
    locate()
    const target = canvas.current?.querySelector<HTMLElement>('.paper-preview-viewport') ?? frame.current
    target?.focus({ preventScroll: true })
  }, [locateRequest])
  function select(id: string) { const next = questions.find(item => item.id === id)!; setSelected(id); setPage(next.page) }
  function step(delta: number) { const list = questions.filter(item => !filter || item.score < item.max); const index = list.findIndex(item => item.id === selected); select(list[Math.max(0, Math.min(list.length - 1, index + delta))].id) }
  function wrong() { const wrongs = questions.filter(item => item.score < item.max); select((wrongs.find(item => item.number > q.number) ?? wrongs[0]).id) }
  function changePage(next: number) { if (next < 0 || next > 1 || next === page) return; const list = questions.filter(item => item.page === next && (!filter || item.score < item.max)); select(list[0].id) }
  function rotate() { setRotations(value => ({ ...value, [`p${page}`]: ((rotation + 90) % 360) as PaperPreviewRotation })) }
  function intent(action: string) { setNotice(`已请求：${action} · ${student}${action === '更正评分' || action === '教师批阅' ? ` · 第 ${q.number} 题` : ''}`) }
  function keyboard(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    if (event.defaultPrevented || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey || target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"],[role="menu"]') || (target.closest('[role="listbox"]') && !target.closest('[data-review-rail]'))) return
    const key = event.key.toLowerCase()
    if (key === 'o') { event.preventDefault(); setHoldOriginal(true); return }
    if (missing && ['+', '=', '-', '0', 'r', 'l'].includes(key)) return
    const actions: Record<string, () => void> = { arrowleft: () => changePage(page - 1), arrowright: () => changePage(page + 1), arrowup: () => step(-1), arrowdown: () => step(1), n: wrong, '+': () => setZoom(clampPaperZoom(percent * 1.25)), '=': () => setZoom(clampPaperZoom(percent * 1.25)), '-': () => setZoom(clampPaperZoom(percent * .8)), '0': () => setZoom('page'), r: rotate, l: () => { if (!original && !missing) setLayer(value => !value) }, '?': () => setHelp(true) }
    if (actions[key]) { event.preventDefault(); event.stopPropagation(); if (!event.repeat || ['arrowup', 'arrowdown', '+', '=', '-'].includes(key)) actions[key]() }
  }
  const pages = useMemo(() => [0, 1].map(index => ({ id: `p${index}`, imageUrl: paperImage(index, student, !original && layer), alt: `高一数学期中测试，${student}，第 ${index + 1} 页${original ? '扫描原稿' : '标注效果'}`, regions: questions.filter(item => item.page === index).map(item => ({ id: item.id, label: `第 ${item.number} 题`, rect: item.rect, content: <span aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-white/65 transition-opacity duration-200 motion-reduce:transition-none ${selected === item.id || original ? 'opacity-0' : 'opacity-100'}`} /> })) })), [student, original, layer, selected])
  const tool = (label: string, keys: string, icon: ReactElement, action: () => void, disabled = false) => <Tip label={label} keys={keys}><ToolbarButton render={<Button variant="ghost" size="icon" className="min-h-11 min-w-11" />} aria-label={label} onClick={action} disabled={disabled}>{icon}</ToolbarButton></Tip>

  return <TooltipProvider><main className="d1-review bg-background text-foreground">
    <header className="d1-controls flex items-center gap-3 border-b px-4 [&_button]:min-h-11"><Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="返回设计评审导航" render={<a href="/next" />}><ArrowLeft /></Button><h1 className="shrink-0 text-ui-action">试卷预览框架 · 设计稿</h1><span className="ml-auto text-ui-hint">视口</span><Select value={device} items={targets} onValueChange={value => { if (value) setDevice(value) }}><SelectTrigger className="min-h-11 w-40" aria-label="评审视口"><SelectValue /></SelectTrigger><SelectPopup>{targets.map(item => <SelectItem key={item.value} value={item.value} className="min-h-11">{item.label}</SelectItem>)}</SelectPopup></Select><Toggle className="min-h-11" pressed={missing} onPressedChange={setMissing}>无扫描图像</Toggle><ThemePicker /></header>
    <div ref={stage} className="d1-stage bg-muted">
      <section ref={frame} aria-label="学生试卷预览框架" tabIndex={-1} className="d1-frame bg-background" data-device={device} data-mobile-pane={mobilePane} style={device === 'auto' ? undefined : { width: Number(device), height: device === '1440' ? 900 : 1080, transform: `scale(${scale})` }} onKeyDownCapture={event => { if (!((event.target as HTMLElement).closest('[data-review-rail] [role="listbox"]') && ['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key))) keyboard(event) }} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHoldOriginal(false) }}>
        <header className="d1-topbar flex items-center gap-4 border-b px-4">
          <Button variant="ghost" className="min-h-11" aria-label="返回学生列表" onClick={() => intent('返回学生列表')}><ArrowLeft /><span className="d1-return-label">返回学生列表</span></Button><h2 className="shrink-0 text-block-title">{student}</h2><p className="d1-student-meta text-ui-hint text-muted-foreground">高一（3）班 · 考号 OLE-ST-{String(18 + studentIndex).padStart(4, '0')}</p>
          <div className="ml-auto flex items-center gap-2"><Button variant="outline" className="min-h-11" aria-label="上一位学生" disabled={studentIndex === 0} onClick={() => { setStudentIndex(i => i - 1); setNotice('') }}><ChevronLeft /><span className="d1-student-label">上一位</span></Button><span className="whitespace-nowrap text-ui-hint">第 {studentIndex + 1} / 6 位</span><Button variant="outline" className="min-h-11" aria-label="下一位学生" disabled={studentIndex === 5} onClick={() => { setStudentIndex(i => i + 1); setNotice('') }}><span className="d1-student-label">下一位</span><ChevronRight /></Button></div>
          <div className="d1-total flex items-center gap-3 whitespace-nowrap"><span className="text-ui-hint text-muted-foreground">最终得分</span><span className="text-stat-display tabular-nums">118 / 150</span><Badge variant="outline">已确认</Badge></div>
          <Menu><MenuTrigger render={<Button variant="ghost" size="icon" className="min-h-11 min-w-11" />} aria-label="更多"><MoreHorizontal /></MenuTrigger><MenuPopup align="end"><MenuItem className="min-h-11" onClick={() => intent('打印本学生批注')}>打印本学生批注</MenuItem><MenuItem className="min-h-11" onClick={() => intent('导出')}>导出</MenuItem></MenuPopup></Menu>
        </header>
        <nav className="d1-mobile-nav border-b px-3" aria-label="预览分区"><ToggleGroup value={[mobilePane]} onValueChange={value => { if (value.length) setMobilePane(value[0]) }}>{[['rail', '题目'], ['canvas', '试卷'], ['inspector', '本题反馈']].map(([value, label]) => <ToggleGroupItem key={value} value={value} className="min-h-11">{label}</ToggleGroupItem>)}</ToggleGroup></nav>
        <div className="d1-columns">
          <QuestionRail selected={selected} filter={filter} student={student} missing={missing} onFilter={value => { setFilter(value); if (value && q.score === q.max) wrong() }} onSelect={select} onLocate={() => { setMobilePane('canvas'); setLocateRequest(value => value + 1) }} />
          <section aria-label="试卷画布" data-review-canvas className="d1-canvas bg-border">
            <div ref={canvas} className="d1-paper-host min-h-0 min-w-0 [&_[data-paper-size]]:shadow-2xl [&_[data-region]>button]:border-0! [&_[data-region]>button]:ring-offset-0! [&_[data-region]>button[aria-pressed=false]:hover]:border! [&_[data-region]>button[aria-pressed=false]:hover]:border-info! [&_[data-region]>button[aria-pressed=false]:focus-visible]:ring-1! [&_[data-region]>button[aria-pressed=false]:focus-visible]:ring-info! [&_[data-region]>button[aria-pressed=true]]:ring-2! [&_[data-region]>button[aria-pressed=true]]:ring-info!">
              {missing ? <div className="flex h-full items-center justify-center p-6"><div className="flex aspect-[210/297] h-full max-h-full max-w-full flex-col items-center justify-center gap-4 bg-card p-6 shadow-2xl"><FileImage className="size-10 text-muted-foreground" /><p className="text-ui-body">扫描图像未提供</p><p className="text-ui-hint text-muted-foreground">第 {page + 1} / 2 页</p></div></div> : <PaperPreview variant="canvas" title="试卷" pages={pages} page={page} onPageChange={changePage} zoom={zoom} onZoomChange={setZoom} rotation={rotations} onRotationChange={(id, degrees) => setRotations(value => ({ ...value, [id]: degrees }))} selectedRegionId={selected} onRegionSelect={(_, id) => select(id)} />}
            </div>
            <div className="d1-tool-dock p-3">
              <Toolbar aria-label="试卷悬浮工具条" className="d1-tools mx-auto w-fit max-w-full flex-wrap items-center justify-center rounded-full bg-popover shadow-lg">
                <ToolbarGroup>{tool('上一页', '←', <ChevronLeft />, () => changePage(page - 1), page === 0)}<span className="whitespace-nowrap text-ui-hint">第 {page + 1} / 2 页</span>{tool('下一页', '→', <ChevronRight />, () => changePage(page + 1), page === 1)}</ToolbarGroup><ToolbarSeparator />
                <ToolbarGroup>{tool('缩小', '−', <Minus />, () => setZoom(clampPaperZoom(percent * .8)), missing || percent <= 5)}<output aria-label="缩放比例" className="w-12 text-center text-ui-hint tabular-nums">{missing ? '—' : `${Math.round(percent)}%`}</output>{tool('放大', '+', <Plus />, () => setZoom(clampPaperZoom(percent * 1.25)), missing || percent >= 300)}</ToolbarGroup>
                {tool('适合页面', '0', <Scan />, () => setZoom('page'), missing)}{tool('旋转', 'R', <RotateCw />, rotate, missing)}<ToolbarSeparator />
                <ToggleGroup aria-label="查看版本" value={[original ? 'original' : 'marked']} onValueChange={value => { if (value.length) setMode(value[0]) }}><Tip label="标注效果" keys="Tab / Enter"><ToggleGroupItem className="min-h-11" value="marked">标注效果</ToggleGroupItem></Tip><Tip label="扫描原稿；按住临时查看" keys="O"><ToggleGroupItem className="min-h-11" value="original">扫描原稿</ToggleGroupItem></Tip></ToggleGroup>
                <Tip label={missing ? '扫描图像未提供，标注层不可用' : original ? '扫描原稿不显示标注层' : '开关标注层'} keys="L"><span tabIndex={original || missing ? 0 : undefined} className="inline-flex" aria-label={original ? '扫描原稿不显示标注层' : undefined}><Toggle className="min-h-11" pressed={!original && layer} disabled={original || missing} onPressedChange={setLayer}>标注层</Toggle></span></Tip>
                {tool('快捷键', '?', <CircleHelp />, () => setHelp(true))}
              </Toolbar>
            </div>
          </section>
          <Inspector question={q} onStep={step} onWrong={wrong} onIntent={intent} />
        </div>
        <div role="status" className={notice ? 'd1-notice absolute bottom-20 left-1/2 z-30 max-w-full -translate-x-1/2 bg-popover px-4 py-3 text-ui-hint shadow-lg' : 'sr-only'}>{notice}</div>
      </section>
    </div>
    <Dialog open={help} onOpenChange={setHelp}><DialogPopup className="motion-reduce:transition-none" closeProps={{ 'aria-label': '关闭快捷键表', className: 'absolute end-2 top-2 min-h-11 min-w-11' }}><DialogHeader><DialogTitle>快捷键</DialogTitle><DialogDescription>焦点在试卷预览框架内时可用；输入框与菜单保留自身按键行为。</DialogDescription></DialogHeader><DialogPanel><dl className="space-y-3">{shortcuts.map(([key, label]) => <div key={key} className="flex items-center justify-between gap-4 text-ui-body"><dt>{label}</dt><dd><Kbd>{key}</Kbd></dd></div>)}</dl></DialogPanel></DialogPopup></Dialog>
  </main></TooltipProvider>
}
