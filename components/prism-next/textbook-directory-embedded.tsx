"use client"

import { useCallback, useId, useMemo, useRef, useState, type ComponentType, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { ArrowRightLeft, Search, X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/coss/input-group"
import { Label } from "@/components/coss/label"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { DialogLayout, DialogOptionGrid, DialogOptionGridItem, DialogSection, DialogChoiceList, DialogChoice } from "@/components/prism-next/dialog-layout"
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


function selectedEntries(books: TextbookDefinition[], selections: DirectorySelections) {
  return books.flatMap(book => kinds.flatMap(kind => {
    const scope = `${book.id}:${kind}`, data = book.directories[kind]
    return summarizeDirectory(data, selections[scope] ?? []).map(entry => ({ ...entry, scope, book, kind, title: data.nodes[entry.id].title }))
  }))
}
function clearSelections(books: TextbookDefinition[], selections: DirectorySelections) {
  const next = { ...selections }
  for (const book of books) for (const kind of kinds) next[`${book.id}:${kind}`] = []
  return next
}

// Shared formal embedded presentation; metadata comes only from the host.
function BookHeader({ book, children }: { book: TextbookDefinition; children?: ReactNode }) {
  const volume = book.volume || book.title, details = [book.subject, book.edition].filter(Boolean).join(" · ")
  return <div className="flex min-w-0 items-center gap-3" data-slot="textbook-header">
    <span aria-hidden="true" data-slot="textbook-cover" className="relative h-[60px] w-[46px] shrink-0 overflow-hidden rounded-sm border border-border [background:linear-gradient(135deg,color-mix(in_srgb,var(--brand-blue)_12%,var(--background)),color-mix(in_srgb,var(--brand-magenta)_7%,var(--background))_60%,color-mix(in_srgb,var(--brand-green)_12%,var(--background)))]">
      <span className="absolute inset-y-0 left-1 w-px bg-[color-mix(in_srgb,var(--brand-blue)_25%,var(--border))]" />
      <span className="absolute left-3 top-2 text-ui-hint text-foreground [writing-mode:vertical-rl]">{Array.from(book.subject ?? "").slice(0, 2).join("")}</span>
      <span className="absolute bottom-2 left-3 right-2 h-0.5 [background:var(--brand-ai-gradient)]" />
    </span>
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

function PickerSession({ data, kind, checkedIds, onCheckedChange, View, multiple = false, session, onSessionChange, initialExpanded, searchAction, summary, currentNode, onCurrentNodeChange, allOption, titleAction = "select", toggleTitles = true }: {
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
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3" data-picker-session>
    <div className="flex min-w-0 shrink-0 items-center gap-2">
      <InputGroup className="min-w-0 flex-1"><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput id={inputId} ref={inputRef} aria-label={`搜索当前${kindTitle(kind)}`} value={session.query} onChange={event => onSessionChange({ query: event.target.value })} placeholder={kind === "course" ? "章节名称或编号" : "知识点名称"} />{session.query && <InputGroupAddon align="inline-end"><Button variant="ghost" size="icon-xs" aria-label="清除目录搜索" onClick={clearSearch}><X /></Button></InputGroupAddon>}</InputGroup>{searchAction}
    </div>
    {summary}
    {projection.normalized && <p role="status" className="text-ui-hint text-muted-foreground">{projection.matchingIds.size} 处匹配 · 搜索不改变已选范围</p>}
    <p id={`${inputId}-help`} className="sr-only">{multiple ? "勾选父级包含全部下级，搜索不会缩小勾选范围。Enter 或空格勾选或取消。" : (titleAction === "locate" ? "标题或 Enter、空格定位，不改变已选范围。" : allOption ? "点标题只看这一项；看全部点“全部”；多选用“多选”按钮。" : "点标题只看这一项，再点取消；多选用多选控件。")}</p>
    <DirectoryMarks.Provider value={{ selected, ancestors, allOption: allOption ? { label: allOption.ariaLabel ?? (kind === "course" ? "全部，整本教材" : "全部知识点"), text: allOption.label ?? "全部", selected: checkedIds.length === 0, onSelect: () => { onCurrentNodeChange?.(); onCheckedChange([]) } } : undefined }}>
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
  const [bookDialog, setBookDialog] = useState({ open: false, subject: "", edition: "", id: "", subjectQuery: "", editionQuery: "" })
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
  const draftEntries = selectedEntries(textbooks, multiDialog.selections)
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
  const matches = (title: string, query: string) => title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  const visibleSubjects = subjects.filter(item => matches(item.name, bookDialog.subjectQuery))
  const visibleEditions = editions.filter(item => matches(item.title, bookDialog.editionQuery))
  const selectedBook = textbooks.find(item => item.id === bookDialog.id && subjectTitle(item) === bookDialog.subject && editionTitle(item) === bookDialog.edition)
  const disabledReason = !selectedBook ? "请选择册次。" : selectedBook.id === book.id ? "尚未改变教材选择。" : ""
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
      setBookDialog({ open: true, subject: subjectTitle(book), edition: editionTitle(book), id: book.id, subjectQuery: "", editionQuery: "" })
    }}><ArrowRightLeft aria-hidden="true" />切换</Button>}</BookHeader>
    <KindTabs kind={kind} onKindChange={onKindChange}>
      <PickerSession key={scope} toggleTitles={multiSelect !== "always"} allOption={allOption} titleAction={titleAction} multiple={multiSelect === "always" || (multiSelect === "toggle" && (sessions[scope]?.multiple ?? entries.length > 1))} currentNode={currentNodes[scope]} onCurrentNodeChange={id => onCurrentNodesChange?.(previous => {
        const next = { ...previous }; if (id) next[scope] = id; else delete next[scope]; return next
      })} data={book.directories[kind]} kind={kind} checkedIds={activeIds} onCheckedChange={changeChecked(kind, onSelectionsChange)} View={View} session={sessions[scope] ?? { query: "" }} onSessionChange={patchSession} initialExpanded={initialExpanded(book.directories[kind])}
        searchAction={multiSelect === "toggle" ? <Button variant="outline" aria-pressed={sessions[scope]?.multiple ?? entries.length > 1} onClick={() => { const multiple = !(sessions[scope]?.multiple ?? entries.length > 1); patchSession({ multiple }); if (!multiple && entries.length > 1) { onCurrentNodesChange(previous => { const next = { ...previous }; delete next[scope]; return next }); onSelectionsChange(previous => ({ ...previous, [scope]: [] })) } }}>多选</Button> : multiSelect === "dialog" ? <Button ref={multiRef} variant="outline" aria-label="多选" title="打开对话框选择多个目录范围" aria-haspopup="dialog" onClick={() => { setDraftSessions({}); setMultiDialog({ open: true, kind, selections: structuredClone(selections) }) }}>多选</Button> : undefined}
        summary={(entries.length > 1 || (!entries.length && emptySelectionLabel !== undefined)) && <div className="flex min-w-0 items-center gap-2 text-ui-hint"><p role="status" className="min-w-0 truncate text-muted-foreground">{entries.length ? `已选 ${entries.length} 项 ·` : emptySelectionLabel}</p>{entries.length > 0 && <Button variant="ghost" size="sm" aria-label="清空当前目录的已选范围" onClick={() => { onCurrentNodesChange?.(previous => { const next = { ...previous }; delete next[scope]; return next }); onSelectionsChange(previous => ({ ...previous, [scope]: [] })) }}>清空</Button>}</div>} />
    </KindTabs>
    <DialogLayout open={bookDialog.open} onOpenChange={open => { if (!open) closeBook() }} title="选择教材" closeLabel="关闭教材选择" description="选择学科、版本与册次，确认后切换当前教材。" size="xl" initialFocus={bookFocus} finalFocus={switchRef}
      footerStart={<div className="space-y-1 text-ui-hint text-muted-foreground"><p>确认后切换当前教材，保留各目录选择。</p>{disabledReason && <p id={reasonId}>{disabledReason}</p>}</div>}
      footerEnd={<div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={closeBook}>取消</Button><Button variant="outline" disabled={!!disabledReason} aria-describedby={disabledReason ? reasonId : undefined} onClick={() => { if (selectedBook && !disabledReason) { setBookId(selectedBook.id); closeBook() } }}>确认选择</Button></div>}>
      <div ref={bookFocus} tabIndex={-1} aria-label="当前教材" className="shrink-0 outline-none"><p className="text-ui-hint text-muted-foreground">当前：{[book.subject, editionTitle(book), book.volume || book.title].filter(Boolean).join(" · ")}</p></div>
      <div className="textbook-picker-columns" data-subjects={subjects.length > 1}>
        {subjects.length > 1 && <section aria-label="学科" className="textbook-picker-column">
          <Label htmlFor={`${reasonId}-subject-search`}>搜索学科</Label>
          <InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput id={`${reasonId}-subject-search`} aria-label="搜索学科" value={bookDialog.subjectQuery} onChange={event => setBookDialog(previous => ({ ...previous, subjectQuery: event.target.value }))} /></InputGroup>
          <div className="textbook-picker-list"><DialogChoiceList label="教材学科" value={bookDialog.subject} onValueChange={subject => setBookDialog(previous => ({ ...previous, subject, edition: editionsFor(subject)[0]?.title ?? "", id: "", editionQuery: "" }))}>
            {visibleSubjects.map(subject => <DialogChoice key={subject.name} value={subject.name} title={subject.name} description={subject.teaching ? "我的任教学科" : undefined} />)}
          </DialogChoiceList>{!visibleSubjects.length && <p role="status" className="text-ui-hint">没有匹配的学科。</p>}</div>
        </section>}
        <section aria-label="版本" className="textbook-picker-column">
          <Label htmlFor={`${reasonId}-edition-search`}>搜索版本</Label>
          <InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput id={`${reasonId}-edition-search`} aria-label="搜索版本" value={bookDialog.editionQuery} onChange={event => setBookDialog(previous => ({ ...previous, editionQuery: event.target.value }))} /></InputGroup>
          <div className="textbook-picker-list"><DialogChoiceList label="教材版本" value={bookDialog.edition} onValueChange={edition => setBookDialog(previous => ({ ...previous, edition, id: edition === previous.edition ? previous.id : "" }))}>
            {visibleEditions.map(edition => <DialogChoice key={edition.title} value={edition.title} title={edition.title} description={edition.recent ? "最近使用" : undefined} />)}
          </DialogChoiceList>{!visibleEditions.length && <p role="status" className="text-ui-hint">没有匹配的版本。</p>}</div>
        </section>
        <section aria-label="册次" className="textbook-picker-column textbook-picker-volumes"><DialogSection title="册次"><DialogOptionGrid label="教材册次" columns={2} value={bookDialog.id || null} onValueChange={id => setBookDialog(previous => ({ ...previous, id }))}>
          {textbooks.filter(item => subjectTitle(item) === bookDialog.subject && editionTitle(item) === bookDialog.edition).map(item => <DialogOptionGridItem key={item.id} value={item.id} title={item.volume || item.title} description={item.volumeDescription} status={item.id === book.id ? { label: "当前" } : undefined} />)}
        </DialogOptionGrid></DialogSection></section>
      </div>
    </DialogLayout>
    <DialogLayout open={multiDialog.open} onOpenChange={open => { if (!open) closeMulti() }} title="选择目录范围" closeLabel="关闭目录多选" description="可跨课程与知识点选择，确认后提交所选范围。" size="xl" initialFocus={multiFocus} finalFocus={multiRef}
      footerStart={<p className="text-ui-hint text-muted-foreground">确认后提交所选目录范围</p>}
      footerEnd={<div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={closeMulti}>取消</Button><Button variant="outline" onClick={() => {
        onCurrentNodesChange?.(previous => Object.fromEntries(Object.entries(previous).filter(([scope]) => {
          const before = selections[scope] ?? [], after = multiDialog.selections[scope] ?? []
          return before.length === after.length && before.every(id => after.includes(id))
        })))
        onSelectionsChange(previous => ({ ...previous, ...Object.fromEntries(textbooks.flatMap(item => kinds.map(type => {
          const key = `${item.id}:${type}`
          return [key, [...new Set(multiDialog.selections[key] ?? [])].filter(id => item.directories[type].leafIds.includes(id))]
        }))) })); onKindChange(multiDialog.kind); closeMulti()
      }}>确认选择（{draftEntries.length}）</Button></div>}>
      <div ref={multiFocus} tabIndex={-1} aria-label="目录范围选择" className="directory-picker-columns grid min-h-0 min-w-0 gap-5 outline-none">
        <section aria-label="可选目录" className="directory-picker-tree min-h-0 min-w-0">
          <KindTabs kind={multiDialog.kind} onKindChange={value => setMultiDialog(previous => ({ ...previous, kind: value }))}>
            <PickerSession key={draftScope} data={book.directories[multiDialog.kind]} kind={multiDialog.kind} checkedIds={multiDialog.selections[draftScope] ?? []} onCheckedChange={changeChecked(multiDialog.kind, setDraft)} View={OutlineView} multiple session={draftSessions[draftScope] ?? { query: "" }} onSessionChange={patchDraftSession} initialExpanded={initialExpanded(book.directories[multiDialog.kind])} />
          </KindTabs>
        </section>
        <section aria-label="已选范围" className="directory-picker-selected flex min-h-0 min-w-0 flex-col gap-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-item-title">已选 {draftEntries.length} 项</h3><Button variant="ghost" size="sm" disabled={!draftEntries.length} onClick={() => setDraft(previous => clearSelections(textbooks, previous))}>清空已选</Button></div>
          {draftEntries.length ? <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain">{draftEntries.map(entry => <li key={`${entry.scope}:${entry.id}`} className="flex min-w-0 items-start gap-2" data-directory-selected={entry.id}><div className="min-w-0 flex-1 break-words"><p className="text-ui-body">{entry.title}</p><p className="text-ui-hint text-muted-foreground">{[entry.book.volume || entry.book.title, entry.book.edition, kindTitle(entry.kind)].filter(Boolean).join(" · ")}</p></div><Button variant="ghost" size="icon-sm" aria-label={`移除${entry.title}`} onClick={() => setDraft(previous => ({ ...previous, [entry.scope]: (previous[entry.scope] ?? []).filter(id => !entry.leafIds.includes(id)) }))}><X /></Button></li>)}</ul> : <p className="text-ui-hint text-muted-foreground">从左侧选择一个或多个章节或知识点。</p>}
        </section>
      </div>
    </DialogLayout>
  </div></DirectoryFacts.Provider>
}
