"use client"

import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { ArrowRightLeft, Search, X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/coss/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Separator } from "@/components/coss/separator"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { DialogLayout, DialogSection } from "@/components/prism-next/dialog-layout"
import { useDirectorySelection, type DirectorySelections, type TextbookDefinition, type TextbookDirectoryProps, type DirectoryAllOption } from "@/components/prism-next/textbook-directory"
import type { DirectoryViewProps } from "@/components/prism-next/directory-presentation"
import { directoryLeaves, projectDirectory, summarizeDirectory, type DirectoryData, type DirectoryKind } from "@/lib/prism-next/textbook-directory"
import { DirectoryFacts, DirectoryMarks, OutlineView } from "./textbook-directory-outline"
import "./textbook-directory.css"

const kinds: DirectoryKind[] = ["course", "knowledge"]
const kindTitle = (kind: DirectoryKind) => kind === "course" ? "课程目录" : "知识点目录"
const editionTitle = (book: TextbookDefinition) => book.edition?.trim() || "未提供版本"
export type TextbookSubject = { name: string; teaching?: boolean; editions: { title: string; recent?: boolean }[] }
const hostRank = <T,>(items: T[], item: T) => items.indexOf(item) < 0 ? items.length : items.indexOf(item)
const subjectTitle = (book: TextbookDefinition) => book.subject?.trim() || "未提供学科"
type SelectionChange = Dispatch<SetStateAction<DirectorySelections>>
type Session = { query: string; expandedIds?: string[]; multiple?: boolean }
const noExpansion = (_data: DirectoryData): string[] => []


const bookName = (book: TextbookDefinition) => [book.subject, editionTitle(book), book.volume || book.title].filter(Boolean).join(" · ")

function BookCover({ book, large = false, current = false }: { book: TextbookDefinition; large?: boolean; current?: boolean }) {
  return <span aria-hidden="true" data-slot="textbook-cover" className={`relative ${large ? "h-[74px] w-[56px]" : "h-[60px] w-[46px]"} shrink-0 overflow-hidden rounded-sm border border-border [background:linear-gradient(135deg,color-mix(in_srgb,var(--brand-blue)_12%,var(--background)),color-mix(in_srgb,var(--brand-magenta)_7%,var(--background))_60%,color-mix(in_srgb,var(--brand-green)_12%,var(--background)))]`}>
      <span className="absolute inset-y-0 left-1 w-px bg-[color-mix(in_srgb,var(--brand-blue)_25%,var(--border))]" />
      <span className={`absolute left-3 ${large ? "top-6" : "top-2"} text-ui-hint text-foreground [writing-mode:vertical-rl]`}>{Array.from(book.subject ?? "").slice(0, 2).join("")}</span>
      {current && <span className="absolute right-0 top-0 rounded-sm bg-accent px-1 text-ui-hint text-foreground">当前</span>}
      <span className="absolute bottom-2 left-3 right-2 h-0.5 [background:var(--brand-ai-gradient)]" />
    </span>
}

// Measure the natural wrapping using an inert, invisible copy. Hidden choices
// never remain in the active roving-tabindex group.
function EditionOptions({ editions, value, onChange }: { editions: TextbookSubject["editions"]; value: string; onChange: (value: string) => void }) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [limit, setLimit] = useState(editions.length)
  const [expanded, setExpanded] = useState(false)
  const listId = useId()
  useLayoutEffect(() => {
    const element = measureRef.current
    if (!element) return
    const measure = () => {
      const buttons = Array.from(element.querySelectorAll<HTMLElement>('[data-slot="toggle"]'))
      const rows = [...new Set(buttons.map(button => button.offsetTop))].sort((a, b) => a - b)
      setLimit(rows.length > 3 ? buttons.findIndex(button => button.offsetTop === rows[3]) : editions.length)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [editions])
  const selectedOutside = editions.findIndex(edition => edition.title === value) >= limit
  const showAll = expanded || selectedOutside
  const options = (items: TextbookSubject["editions"]) => items.map(edition => <ToggleGroupItem key={edition.title} value={edition.title} title={edition.title} className="max-w-full"><span className="truncate">{edition.title}</span>{edition.recent && <span role="img" aria-label="最近使用" title="最近使用" className="size-1.5 shrink-0 rounded-full bg-current" />}</ToggleGroupItem>)
  return <div className="relative min-w-0">
    <div aria-hidden="true" inert className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden"><div ref={measureRef}>
      <ToggleGroup size="sm" className="w-full flex-wrap" value={[]} tabIndex={-1}>{options(editions)}</ToggleGroup>
    </div></div>
    <ToggleGroup id={listId} aria-label="教材版本" size="sm" className="w-full flex-wrap" multiple={false} value={[value]} onValueChange={values => { if (values[0]) onChange(values[0]) }}>{options(showAll ? editions : editions.slice(0, limit))}</ToggleGroup>
    {limit < editions.length && <Button variant="ghost" size="sm" aria-controls={listId} aria-expanded={showAll} disabled={selectedOutside} onClick={() => setExpanded(previous => !previous)}>{showAll ? "收起版本" : "展开全部"}</Button>}
  </div>
}

// Shared formal embedded presentation; metadata comes only from the host.
function BookHeader({ book, children }: { book: TextbookDefinition; children?: ReactNode }) {
  const volume = book.volume || book.title, details = [book.subject, book.edition].filter(Boolean).join(" · ")
  return <div className="flex min-w-0 items-center gap-3" data-slot="textbook-header">
    <BookCover book={book} />
    <div className="min-w-0 flex-1" role="group" aria-label={[volume, details].filter(Boolean).join(" · ")}>
      <p className="truncate text-block-title text-foreground" title={volume}>{volume}</p>
      {details && <p className="truncate text-ui-hint text-muted-foreground" title={details}>{details}</p>}
    </div>{children}
  </div>
}

function KindTabs({ kind, onKindChange, children }: { kind: DirectoryKind; onKindChange: (kind: DirectoryKind) => void; children: ReactNode }) {
  return <Tabs value={kind} onValueChange={value => onKindChange(value as DirectoryKind)} className="min-h-0 gap-3">
    <TabsList aria-label="目录类型" className="w-full min-w-0">{kinds.map(type => <TabsTab key={type} value={type} className="min-w-0 flex-1 basis-0"><span className="truncate">{kindTitle(type)}</span></TabsTab>)}</TabsList>
    {kinds.map(type => <TabsPanel key={type} value={type}>{kind === type && children}</TabsPanel>)}
  </Tabs>
}

function PickerSession({ data, kind, checkedIds, onCheckedChange, View, multiple = false, session, onSessionChange, initialExpanded, searchAction, summary, currentNode, onCurrentNodeChange, allOption, titleAction = "select", toggleTitles = true, searchable = true, partialProgress = false }: {
  searchable?: boolean; partialProgress?: boolean
  allOption?: DirectoryAllOption; titleAction?: "select" | "locate"; toggleTitles?: boolean
  data: DirectoryData; kind: DirectoryKind; checkedIds: string[]; onCheckedChange: Dispatch<SetStateAction<string[]>>
  View: ComponentType<DirectoryViewProps>; multiple?: boolean; session: Session; onSessionChange: (patch: Partial<Session>) => void
  initialExpanded: string[]; searchAction?: ReactNode; summary?: ReactNode; currentNode?: string; onCurrentNodeChange?: (id?: string) => void
}) {
  const inputId = useId(), inputRef = useRef<HTMLInputElement>(null)
  const projection = useMemo(() => projectDirectory(data, session.query), [data, session.query])
  checkedIds = [...new Set(checkedIds)].filter(id => data.leafIds.includes(id))
  const selectionTree = useDirectorySelection(data, checkedIds, update => { onCurrentNodeChange?.(); onCheckedChange(update) })
  const [locatedId, setLocatedId] = useState("")
  const currentLeaves = currentNode && data.paths[currentNode] ? directoryLeaves(data, currentNode) : []
  const hasCurrent = currentLeaves.length > 0 && currentLeaves.length === checkedIds.length && currentLeaves.every(id => checkedIds.includes(id))
  const entries = hasCurrent ? [{ id: currentNode!, leafIds: checkedIds }] : checkedIds.length === 1 ? [{ id: checkedIds[0], leafIds: checkedIds }] : summarizeDirectory(data, checkedIds)
  const selected = new Set(titleAction === "locate" ? [] : entries.map(entry => entry.id))
  const ancestors = new Set(entries.flatMap(entry => data.paths[entry.id].slice(0, -1)))
  const saveExpanded = useCallback((expandedIds: string[]) => onSessionChange({ expandedIds }), [onSessionChange])
  function activate(id: string) {
    if (multiple && toggleTitles) { void selectionTree.getItemInstance(id).toggleCheckedState(); return }
    if (titleAction === "locate") { setLocatedId(id); return }
    const leaves = directoryLeaves(data, id)
    const next = !allOption && leaves.length === checkedIds.length && leaves.every(leaf => checkedIds.includes(leaf)) ? [] : leaves
    onCurrentNodeChange?.(next.length ? id : undefined)
    onCheckedChange(next)
  }
  const clearSearch = () => { onSessionChange({ query: "" }); inputRef.current?.focus() }
  return <div className={`flex min-h-0 min-w-0 flex-1 flex-col ${allOption ? "gap-2" : "gap-3"}`} data-picker-session>
    {searchable && <div className="flex min-w-0 shrink-0 items-center gap-2">
      <InputGroup className="min-w-0 flex-1"><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput id={inputId} ref={inputRef} aria-label={`搜索当前${kindTitle(kind)}`} value={session.query} onChange={event => onSessionChange({ query: event.target.value })} placeholder={kind === "course" ? "章节名称或编号" : "知识点名称"} />{session.query && <InputGroupAddon align="inline-end"><Button variant="ghost" size="icon-xs" aria-label="清除目录搜索" onClick={clearSearch}><X /></Button></InputGroupAddon>}</InputGroup>{searchAction}
    </div>}
    {summary}
    {projection.normalized && <p role="status" className="text-ui-hint text-muted-foreground">{projection.matchingIds.size} 处匹配 · 搜索不改变已选范围</p>}
    <p id={`${inputId}-help`} className="sr-only">{multiple ? "勾选父级包含全部下级，搜索不会缩小勾选范围。Enter 或空格勾选或取消。" : (titleAction === "locate" ? "标题或 Enter、空格定位，不改变已选范围。" : allOption ? "点标题只看这一项；看全部点“全部”；多选用“多选”按钮。" : "点标题只看这一项，再点取消；多选用多选控件。")}</p>
    <DirectoryMarks.Provider value={{ selected, ancestors, partialCounts: partialProgress ? Object.fromEntries(data.folderIds.map(id => { const leaves = directoryLeaves(data, id); return [id, { selected: leaves.filter(leaf => checkedIds.includes(leaf)).length, total: leaves.length }] })) : undefined, allOption: allOption ? { label: allOption.ariaLabel ?? (kind === "course" ? "全部，整本教材" : "全部知识点"), text: allOption.label ?? "全部", selected: checkedIds.length === 0, selectionCount: entries.length > 1 ? entries.length : undefined, onSelect: () => { onCurrentNodeChange?.(); onCheckedChange([]) } } : undefined }}>
      <View key={projection.normalized} data={data} projection={projection} selectionTree={selectionTree} currentId={titleAction === "locate" ? locatedId : ""} onCurrentChange={activate} initialExpanded={[...new Set([...(session.expandedIds ?? initialExpanded), ...ancestors])]} onExpandedChange={saveExpanded} label={kindTitle(kind)} helpId={`${inputId}-help`} titleAction={titleAction} showCheckboxes={multiple} />
    </DirectoryMarks.Provider>
  </div>
}

export function EmbeddedTextbookDirectory({ textbooks, selections, onSelectionsChange, kind = "course", onKindChange = () => {}, onTextbookSwitch, subjects: hostSubjects = [], currentNodes: controlledNodes, onCurrentNodesChange: onControlledNodesChange, allOption, counts, titleAction = "select", multiSelect = "dialog", emptySelectionLabel, bookId: controlledBookId, onBookChange }: TextbookDirectoryProps) {
  const View = OutlineView
  const initialExpanded = noExpansion
  const [localBookId, setLocalBookId] = useState(textbooks[0]?.id ?? "")
  const bookId = controlledBookId ?? localBookId
  const setBookId = (id: string) => { if (controlledBookId === undefined) setLocalBookId(id); onBookChange?.(id) }
  const [localNodes, setLocalNodes] = useState<Record<string, string>>({})
  const currentNodes = controlledNodes ?? localNodes
  const onCurrentNodesChange: Dispatch<SetStateAction<Record<string, string>>> = update => {
    if (controlledNodes === undefined) setLocalNodes(update)
    onControlledNodesChange?.(update)
  }
  const [sessions, setSessions] = useState<Record<string, Session>>({})
  const [bookDialog, setBookDialog] = useState({ open: false, subject: "", edition: "", id: "" })
  const [multiDialog, setMultiDialog] = useState<{ open: boolean; kind: DirectoryKind; selections: DirectorySelections }>({ open: false, kind, selections: {} })
  const [draftSessions, setDraftSessions] = useState<Record<string, Session>>({})
  const switchRef = useRef<HTMLButtonElement>(null), multiRef = useRef<HTMLButtonElement>(null)
  const bookFocus = useRef<HTMLDivElement>(null), multiFocus = useRef<HTMLDivElement>(null)
  const reasonId = useId()
  const book = textbooks.find(item => item.id === bookId) ?? textbooks[0]
  const scope = `${book?.id}:${kind}`, draftScope = `${book?.id}:${multiDialog.kind}`
  const patchSession = useCallback((patch: Partial<Session>) => setSessions(previous => {
    const current = previous[scope] ?? { query: "" }
    if (patch.expandedIds && patch.expandedIds.join("|") === current.expandedIds?.join("|")) return previous
    return { ...previous, [scope]: { ...current, ...patch } }
  }), [scope])
  const patchDraftSession = useCallback((patch: Partial<Session>) => setDraftSessions(previous => {
    const current = previous[draftScope] ?? { query: "" }
    if (patch.expandedIds && patch.expandedIds.join("|") === current.expandedIds?.join("|")) return previous
    return { ...previous, [draftScope]: { ...current, ...patch } }
  }), [draftScope])
  if (!book) return <p className="text-ui-hint">暂无可用教材。</p>
  const activeIds = [...new Set(selections[scope] ?? [])].filter(id => book.directories[kind].leafIds.includes(id))
  const currentLeaves = currentNodes[scope] && book.directories[kind].paths[currentNodes[scope]] ? directoryLeaves(book.directories[kind], currentNodes[scope]) : []
  const hasCurrent = currentLeaves.length > 0 && currentLeaves.length === activeIds.length && currentLeaves.every(id => activeIds.includes(id))
  const entries = hasCurrent ? [{ id: currentNodes[scope] }] : activeIds.length === 1 ? [{ id: activeIds[0] }] : summarizeDirectory(book.directories[kind], activeIds)
  const draftData = book.directories[multiDialog.kind]
  const draftIds = [...new Set(multiDialog.selections[draftScope] ?? [])].filter(id => draftData.leafIds.includes(id))
  const draftEntries = summarizeDirectory(draftData, draftIds)
  const draftGroups = draftData.nodes[draftData.rootId].children.map(id => ({ id, entries: draftEntries.filter(entry => draftData.paths[entry.id][0] === id) })).filter(group => group.entries.length)
  const draftTotal = counts && draftEntries.every(entry => counts[entry.id] !== undefined) ? draftEntries.reduce((sum, entry) => sum + counts[entry.id], 0) : undefined
  const draftSummary = `已选 ${draftEntries.length} 项${draftTotal === undefined ? "" : ` · 共 ${draftTotal} 题`}`
  // Metadata and order are supplied by the host; never infer recency from clicks.
  const subjects = [...new Set(textbooks.map(subjectTitle))].map(name => hostSubjects.find(item => item.name === name) ?? { name, editions: [] })
    .sort((a, b) => Number(!!b.teaching) - Number(!!a.teaching) || hostRank(hostSubjects, a) - hostRank(hostSubjects, b))
  const editionsFor = (subject: string) => {
    const order = hostSubjects.find(item => item.name === subject)?.editions ?? []
    return [...new Set(textbooks.filter(item => subjectTitle(item) === subject).map(editionTitle))]
      .map(title => order.find(item => item.title === title) ?? { title })
      .sort((a, b) => Number(!!b.recent) - Number(!!a.recent) || hostRank(order, a) - hostRank(order, b))
  }
  const editions = editionsFor(bookDialog.subject)
  const selectedBook = textbooks.find(item => item.id === bookDialog.id && subjectTitle(item) === bookDialog.subject && editionTitle(item) === bookDialog.edition)
  const disabledReason = !selectedBook ? "请选择册次。" : selectedBook.id === book.id ? "尚未改变" : ""
  const changeChecked = (target: DirectoryKind, change: Dispatch<SetStateAction<DirectorySelections>>): Dispatch<SetStateAction<string[]>> => update => change(previous => {
    const key = `${book.id}:${target}`, data = book.directories[target]
    const ids = typeof update === "function" ? update(previous[key] ?? []) : update
    return { ...previous, [key]: [...new Set(ids)].filter(id => data.leafIds.includes(id)) }
  })
  const closeBook = () => setBookDialog(previous => ({ ...previous, open: false }))
  const closeMulti = () => setMultiDialog(previous => ({ ...previous, open: false }))
  const setDraft: SelectionChange = update => setMultiDialog(previous => ({ ...previous, selections: typeof update === "function" ? update(previous.selections) : update }))
  return <DirectoryFacts.Provider value={{ counts: counts ?? {}, showCounts: counts !== undefined }}><div className="textbook-directory-embedded flex min-h-0 min-w-0 flex-1 flex-col gap-3" data-textbook-directory="embedded">
    <BookHeader book={book}>{(onTextbookSwitch || textbooks.length > 1) && <Button ref={switchRef} variant="outline" size="sm" aria-label="切换教材" aria-haspopup={onTextbookSwitch ? undefined : "dialog"} onClick={() => {
      if (onTextbookSwitch) { onTextbookSwitch(); return }
      setBookDialog({ open: true, subject: subjectTitle(book), edition: editionTitle(book), id: book.id })
    }}><ArrowRightLeft aria-hidden="true" />切换</Button>}</BookHeader>
    <KindTabs kind={kind} onKindChange={onKindChange}>
      <PickerSession key={scope} toggleTitles={multiSelect !== "always"} allOption={allOption} titleAction={titleAction} multiple={multiSelect === "always" || (multiSelect === "toggle" && (sessions[scope]?.multiple ?? entries.length > 1))} currentNode={currentNodes[scope]} onCurrentNodeChange={id => onCurrentNodesChange?.(previous => {
        const next = { ...previous }; if (id) next[scope] = id; else delete next[scope]; return next
      })} data={book.directories[kind]} kind={kind} checkedIds={activeIds} onCheckedChange={changeChecked(kind, onSelectionsChange)} View={View} session={sessions[scope] ?? { query: "" }} onSessionChange={patchSession} initialExpanded={initialExpanded(book.directories[kind])}
        searchAction={multiSelect === "toggle" ? <Button variant="outline" aria-pressed={sessions[scope]?.multiple ?? entries.length > 1} onClick={() => { const multiple = !(sessions[scope]?.multiple ?? entries.length > 1); patchSession({ multiple }); if (!multiple && entries.length > 1) { onCurrentNodesChange(previous => { const next = { ...previous }; delete next[scope]; return next }); onSelectionsChange(previous => ({ ...previous, [scope]: [] })) } }}>多选</Button> : multiSelect === "dialog" ? <Button ref={multiRef} variant="outline" aria-label="多选" title="打开对话框选择多个目录范围" aria-haspopup="dialog" onClick={() => { setDraftSessions({}); setMultiDialog({ open: true, kind, selections: structuredClone(selections) }) }}>多选</Button> : undefined}
        summary={!allOption && (entries.length > 1 || (!entries.length && emptySelectionLabel !== undefined)) && <div className="flex min-w-0 items-center gap-2 text-ui-hint"><p role="status" className="min-w-0 truncate text-muted-foreground">{entries.length ? `已选 ${entries.length} 项 ·` : emptySelectionLabel}</p>{entries.length > 0 && <Button variant="ghost" size="sm" aria-label="清空当前目录的已选范围" onClick={() => { onCurrentNodesChange?.(previous => { const next = { ...previous }; delete next[scope]; return next }); onSelectionsChange(previous => ({ ...previous, [scope]: [] })) }}>清空</Button>}</div>} />
    </KindTabs>
    <DialogLayout open={bookDialog.open} onOpenChange={open => { if (!open) closeBook() }} title="选择教材" closeLabel="关闭教材选择" description={`当前：${bookName(book)}`} size="xl" initialFocus={bookFocus} finalFocus={switchRef}
      footerStart={<p id={reasonId} className="text-ui-hint text-muted-foreground">{disabledReason || `确认后切换到 ${selectedBook ? bookName(selectedBook) : ""}`}</p>}
      footerEnd={<div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={closeBook}>取消</Button><Button variant="outline" disabled={!!disabledReason} aria-describedby={reasonId} onClick={() => { if (selectedBook && !disabledReason) { setBookId(selectedBook.id); closeBook() } }}>确认选择</Button></div>}>
      <div ref={bookFocus} tabIndex={-1} aria-label="教材选择" className="textbook-picker-sections space-y-5 outline-none">
        <p className="sr-only">依次选择学科、版本、册次，确认后切换。Tab 切换分段，方向键选择段内选项。</p>
        {subjects.length > 1 && <section aria-label="学科" className="overflow-x-auto overscroll-contain p-1">
          <ToggleGroup aria-label="教材学科" multiple={false} value={[bookDialog.subject]} onValueChange={values => { const subject = values[0]; if (subject && subject !== bookDialog.subject) setBookDialog(previous => ({ ...previous, subject, edition: editionsFor(subject)[0]?.title ?? "", id: "" })) }}>
            {subjects.map((subject, index) => <span key={subject.name} className="flex shrink-0 items-center gap-2">
              {index > 0 && subjects[index - 1].teaching && !subject.teaching && <Separator orientation="vertical" className="mx-1 h-5" />}
              <ToggleGroupItem value={subject.name}>{subject.name}{subject.teaching && <span className="text-ui-hint text-muted-foreground">我的任教</span>}</ToggleGroupItem>
            </span>)}
          </ToggleGroup>
        </section>}
        <DialogSection title="版本"><EditionOptions key={bookDialog.subject} editions={editions} value={bookDialog.edition} onChange={edition => setBookDialog(previous => ({ ...previous, edition, id: edition === previous.edition ? previous.id : "" }))} /></DialogSection>
        <DialogSection title="册次">
          <ToggleGroup aria-label="教材册次" multiple={false} value={bookDialog.id ? [bookDialog.id] : []} onValueChange={values => { if (values[0]) setBookDialog(previous => ({ ...previous, id: values[0] })) }} className="textbook-picker-books w-full" data-scroll={textbooks.filter(item => subjectTitle(item) === bookDialog.subject && editionTitle(item) === bookDialog.edition).length > 12}>
            {textbooks.filter(item => subjectTitle(item) === bookDialog.subject && editionTitle(item) === bookDialog.edition).map(item => <ToggleGroupItem key={item.id} value={item.id} aria-label={[bookName(item), item.volumeDescription, item.id === book.id ? "当前" : undefined].filter(Boolean).join(" · ")} className="h-auto min-w-0 flex-col justify-start gap-2 whitespace-normal p-3 sm:h-auto">
              <BookCover book={item} large current={item.id === book.id} />
              <span className="w-full break-words text-item-title">{item.volume || item.title}</span>
              {item.volumeDescription && <span className="text-ui-hint text-muted-foreground">{item.volumeDescription}</span>}
            </ToggleGroupItem>)}
          </ToggleGroup>
        </DialogSection>
      </div>
    </DialogLayout>
    <DialogLayout open={multiDialog.open} onOpenChange={open => { if (!open) closeMulti() }} title={multiDialog.kind === "course" ? "选择多个章节" : "选择多个知识点"} closeLabel="关闭目录多选" size="xl" initialFocus={multiFocus} finalFocus={multiRef}
      footerStart={<p role="status" className="text-ui-hint text-muted-foreground">{draftSummary}</p>}
      footerEnd={<div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={closeMulti}>取消</Button><Button variant="outline" onClick={() => {
        onCurrentNodesChange?.(previous => {
          const before = selections[draftScope] ?? []
          if (before.length === draftIds.length && before.every(id => draftIds.includes(id))) return previous
          const next = { ...previous }; delete next[draftScope]; return next
        })
        onSelectionsChange(previous => ({ ...previous, [draftScope]: draftIds })); closeMulti()
      }}>确认（{draftEntries.length}）</Button></div>}>
      <div ref={multiFocus} tabIndex={-1} aria-label="目录范围选择" className="directory-picker-columns grid min-h-0 min-w-0 gap-5 outline-none">
        <section aria-label="可选目录" className="directory-picker-tree min-h-0 min-w-0 gap-3">
          <div className="flex shrink-0 items-center gap-2"><h3 className="mr-auto text-item-title">可选</h3><Button variant="ghost" size="sm" disabled={draftIds.length === draftData.leafIds.length} onClick={() => setDraft(previous => ({ ...previous, [draftScope]: [...draftData.leafIds] }))}>全选</Button><Button variant="ghost" size="sm" disabled={!draftIds.length} onClick={() => setDraft(previous => ({ ...previous, [draftScope]: [] }))}>清空</Button></div>
          <PickerSession key={draftScope} data={draftData} kind={multiDialog.kind} checkedIds={draftIds} onCheckedChange={changeChecked(multiDialog.kind, setDraft)} View={OutlineView} multiple searchable={false} partialProgress session={draftSessions[draftScope] ?? { query: "" }} onSessionChange={patchDraftSession} initialExpanded={initialExpanded(draftData)} />
        </section>
        <section aria-label="已选范围" className="directory-picker-selected flex min-h-0 min-w-0 flex-col gap-3 rounded-xl bg-muted p-4">
          <h3 className="shrink-0 text-item-title">已选 {draftEntries.length} 项</h3>
          {draftEntries.length ? <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">{draftGroups.map(group => <section key={group.id} aria-label={draftData.nodes[group.id].title} data-directory-selected-group={group.id} className="space-y-2">
            <h4 className="text-item-title">{draftData.nodes[group.id].title}</h4>
            <ul className="space-y-2">{group.entries.map(entry => <li key={entry.id} className="flex min-w-0 items-start gap-2" data-directory-selected={entry.id}>
              <span className="min-w-0 flex-1 break-words py-1 text-ui-body">{entry.id === group.id && draftData.nodes[entry.id].children.length ? multiDialog.kind === "course" ? "整章" : "整个领域" : draftData.nodes[entry.id].title}</span>
              <Button variant="ghost" size="icon-sm" aria-label={`移除${draftData.nodes[entry.id].title}`} onClick={() => setDraft(previous => ({ ...previous, [draftScope]: (previous[draftScope] ?? []).filter(id => !entry.leafIds.includes(id)) }))}><X /></Button>
            </li>)}</ul>
          </section>)}</div> : <p className="flex flex-1 items-center justify-center text-center text-ui-hint text-muted-foreground">在左侧勾选后，这里列出已选内容</p>}
        </section>
      </div>
    </DialogLayout>
  </div></DirectoryFacts.Provider>
}
