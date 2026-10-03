"use client"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from "react"
import { PanelLeftOpen, ArrowLeft, ArrowUp, ArrowDown, CircleHelp, Scan, RotateCw, Minus, Plus, MoreHorizontal, FileImage, Maximize, Minimize, Layers, ArrowLeftRight, PencilLine } from "lucide-react"
import { Button } from "@/components/prism-next/button"
import { paperDimensions, paperZoomPercent, rotatedPaperDimensions, clampPaperZoom, PaperPreview, PaperPreviewSurface, locatePaperTarget, type PaperPreviewZoom, type PaperPreviewRotation } from "@/components/prism-next/paper-preview"
import { ReviewWorkspace, ReviewWorkspaceShortcuts } from "@/components/prism-next/review-workspace"
import { QuestionInspector } from "@/components/prism-next/question-inspector"
import { ReviewTip as Tip, ReviewConfirmation as Confirmation } from "@/components/prism-next/review-parts"
import { ReviewTools } from "@/examples/review-tools/review-tools"
import type { ReviewToolsPosition } from "@/examples/review-tools/review-tools"
import { Toggle } from "@/components/coss/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from "@/components/coss/toolbar"
import { TooltipProvider } from "@/components/coss/tooltip"
import { Avatar, AvatarFallback } from "@/components/coss/avatar"
import { PAPER_REVIEW_BEST_WIDTH, railBand, railCollapsedForWidth, railPreferenceKeys, readRailPreferences, type RailPreferences } from "./rail-preferences"
import { Kbd } from "@/components/coss/kbd"
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator } from "@/components/coss/menu"
import { questionsForStudent, studentRecords, paperImage } from "./fixture"
import { linkedPaperRecords, linkedPaperQuestions, linkedPaperImage, questionReviewStudentId } from "../question-review/paper-link"
import { StudentPanel, QuestionRail, paperInspectorData } from "./review-data"
export { StudentPanel, QuestionRail } from "./review-data"
import "./paper-review.css"

const shortcuts = [["T", "显示 / 隐藏题目栏"], ["G", "选择学生"], ["[ / ]", "上一位 / 下一位学生"], ["← / →", "上一页 / 下一页"], ["↑ / ↓", "上一题 / 下一题"], ["Enter", "定位所选题目"], ["N", "下一道错题"], ["+ / −", "放大 / 缩小"], ["0", "切换适合宽度 / 适合页面"], ["F / Esc", "切换沉浸 / 退出沉浸"], ["R", "旋转 90°"], ["L", "开关标注层"], ["O（按住）", "临时查看扫描原稿"], ["?", "打开快捷键表"]]
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
  function locate() { locatePaperTarget(canvas.current, { regionId: selected }, scale) }
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
    requestAnimationFrame(() => locatePaperTarget(canvas.current, { pageId: `p${next}` }, scale))
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
  function keyboard(key: string) {
    if (key === 'o') { setHoldOriginal(true); return }
    const actions: Record<string, () => void> = { t: () => { if (!immersive) toggleRail() }, g: openStudents, '[': () => changeStudent(studentIndex - 1), ']': () => changeStudent(studentIndex + 1), arrowleft: () => changePage(page - 1), arrowright: () => changePage(page + 1), arrowup: () => step(-1), arrowdown: () => step(1), n: wrong, '+': () => setZoom(clampPaperZoom(percent * 1.25)), '=': () => setZoom(clampPaperZoom(percent * 1.25)), '-': () => setZoom(clampPaperZoom(percent * .8)), '0': toggleFit, f: () => setImmersive(value => !value), escape: () => setImmersive(false), r: rotate, l: () => { if (!original && !missing) setLayer(value => !value) }, '?': () => setHelp(true) }
    actions[key]?.()
  }
  const shortcutBindings = ['t','g','[',']','arrowleft','arrowright','arrowup','arrowdown','n','+','=','-','0','f','escape','r','l','?','o'].map(key => ({ key, intent: key, repeat: ['arrowup','arrowdown','+','=','-','o'].includes(key), disabled: missing && ['+','=','-','0','r','l'].includes(key) }))
  const pages = useMemo(() => [0, 1].map(index => ({ id: `p${index}`, imageUrl: linked ? linkedPaperImage(index, studentIndex, !original && layer) : paperImage(index, student, !original && layer), alt: `高一数学期中测试，${student}，第 ${index + 1} 页${original ? '扫描原稿' : '标注效果'}`, regions: questions.filter(item => item.page === index).map(item => ({ id: item.id, label: `第 ${item.number} 题`, rect: item.rect })) })), [student, original, layer, selected, questions])
  const tool = (label: string, keys: string, icon: ReactElement, action: () => void, disabled = false) => <Tip label={label} keys={keys}><ToolbarButton render={<Button variant="ghost" size="icon" />} aria-label={label} onClick={action} disabled={disabled}>{icon}</ToolbarButton></Tip>

  return <TooltipProvider><main className="d1-review bg-background text-foreground">
    <ReviewTools device={device} onDeviceChange={setDevice} missing={missing} onMissingChange={setMissing} defaultPosition={reviewPosition} onResetRailPreferences={resetRailPreferences} />
    <div ref={stage} className="d1-stage bg-muted">
      <ReviewWorkspace frameRef={frame} label="学生试卷预览框架" device={device} pane={mobilePane} immersive={immersive} open={!railCollapsed} onOpenChange={toggleRail} ready={railState.ready} animate={railState.animate} style={device === 'auto' ? undefined : { width: Number(device), height: device === '1440' ? 900 : 1080, transform: `scale(${scale})` }} shortcuts={shortcutBindings} shortcutsDisabled={studentOpen} onShortcut={keyboard} onBlurOutside={() => setHoldOriginal(false)} mobileNavRef={mobileNav} onPaneChange={setMobilePane}
        topbar={<header className="d1-topbar flex items-center gap-4 border-b px-4">
          <Button variant="ghost" aria-label="返回学生列表" onClick={() => intent('返回学生列表')}><ArrowLeft /><span className="d1-return-label">返回学生列表</span></Button><Avatar aria-hidden="true"><AvatarFallback>{student[0]}</AvatarFallback></Avatar><h2 className="shrink-0 text-section-title">{student}</h2><p className="d1-student-meta text-ui-meta text-muted-foreground">高一（3）班 · 考号 {record.examId}</p>
          <StudentPanel records={activeRecords} current={studentIndex} open={studentOpen} onOpenChange={open => { if (open) openStudents(); else setStudentOpen(false) }} onSelect={changeStudent} triggerRef={studentTrigger} />
          <div className="d1-total flex items-center gap-3 whitespace-nowrap"><span className="text-ui-meta text-muted-foreground">最终得分</span><span className="flex items-baseline gap-1"><span className="text-score-display">{record.score}</span><span className="text-ui-body text-muted-foreground">/ {record.max}</span></span><Confirmation>{record.status}</Confirmation></div>
          <Menu><MenuTrigger render={<Button variant="ghost" size="icon" />} aria-label="更多"><MoreHorizontal /></MenuTrigger><MenuPopup className="surface-floating motion-reduce:transition-none" align="end"><MenuItem onClick={() => intent('打印本学生批注')}>打印本学生批注</MenuItem><MenuItem onClick={() => intent('导出')}>导出</MenuItem><MenuSeparator /><MenuItem onClick={() => setHelp(true)}><CircleHelp />快捷键表<Kbd>?</Kbd></MenuItem></MenuPopup></Menu>
        </header>}
        rail={<QuestionRail questions={questions} selected={selected} filter={filter} missing={missing} closeRef={closeRail} onCollapse={toggleRail} onFilter={value => { setFilter(value); if (value && q.score === q.max) wrong() }} onSelect={select} onPage={changePage} onLocate={() => { setMobilePane('canvas'); setLocateRequest(value => value + 1) }} />}
        canvas={<PaperPreviewSurface bottomInset={88} canvasRef={canvasArea} viewportRef={canvas} toolbarRef={toolbar} scale={scale} layoutKey={`${immersive}:${railCollapsed}:${mobilePane}`} missing={missing} emptyImageDetail={<>第 {page + 1} / 2 页</>} overlay={railCollapsed && !immersive && <Tip label="展开题目栏" keys="T"><Button ref={openRail} variant="ghost" aria-label="展开题目栏" className="absolute left-2 top-2 z-20 surface-floating" onClick={toggleRail}><PanelLeftOpen />题目 · 错 {questions.filter(item => item.score < item.max).length}</Button></Tip>} toolbar={<Toolbar ref={toolbar} orientation="vertical" aria-label="试卷悬浮工具条" className="d1-tools surface-floating rounded-l-none rounded-r-xl flex-col items-center">
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
              </Toolbar>}>
          <PaperPreview layout="continuous" pages={pages} zoom={zoom} rotation={rotations} selectedRegionId={selected} onRegionSelect={(_page, id) => select(id)} onZoomChange={setZoom} continuous={{ viewportRef: canvas, scale, onVisiblePage: setPage, onViewport: setViewport, spotlight: true, original }} />
        </PaperPreviewSurface>}
        inspector={<QuestionInspector {...paperInspectorData(q, linked ? record.examId : questionReviewStudentId(record.name, record.examId), record.status === '已确认', questions.some(item => item.score < item.max))} onStep={step} onWrong={wrong} onIntent={intent} />}>
        <div role="status" className={notice ? 'd1-notice absolute bottom-20 left-1/2 z-30 max-w-full -translate-x-1/2 surface-floating px-4 py-3 text-ui-hint' : 'sr-only'}>{notice}</div>
      </ReviewWorkspace>
    </div>
    <ReviewWorkspaceShortcuts open={help} onOpenChange={setHelp} entries={shortcuts} />
  </main></TooltipProvider>
}
