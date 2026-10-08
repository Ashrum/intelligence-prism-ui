"use client"

import { useCallback, useId, useMemo, useRef, useState, type ComponentType, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { ArrowRightLeft, Search, X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Label } from "@/components/coss/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/coss/input-group"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { DialogLayout, DialogOptionGrid, DialogOptionGridItem, DialogSection } from "@/components/prism-next/dialog-layout"
import { useDirectorySelection, type DirectorySelections, type TextbookDefinition } from "@/components/prism-next/textbook-directory"
import type { DirectoryViewProps } from "@/components/prism-next/directory-presentation"
import { directoryLeaves, projectDirectory, summarizeDirectory, type DirectoryData, type DirectoryKind } from "@/lib/prism-next/textbook-directory"
import { DirectoryMarks, OutlineView } from "./directory-views"

const kinds: DirectoryKind[] = ["course", "knowledge"]
const kindTitle = (kind: DirectoryKind) => kind === "course" ? "课程目录" : "知识点目录"
const editionTitle = (book: TextbookDefinition) => book.edition?.trim() || "未提供版本"
type SelectionChange = Dispatch<SetStateAction<DirectorySelections>>
type Session = { query: string; expandedIds?: string[] }

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

// Exploration-only composition of the existing embedded book header.
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

function PickerSession({ data, kind, checkedIds, onCheckedChange, View, multiple = false, session, onSessionChange, initialExpanded, searchAction, summary }: {
  data: DirectoryData; kind: DirectoryKind; checkedIds: string[]; onCheckedChange: Dispatch<SetStateAction<string[]>>
  View: ComponentType<DirectoryViewProps>; multiple?: boolean; session: Session; onSessionChange: (patch: Partial<Session>) => void
  initialExpanded: string[]; searchAction?: ReactNode; summary?: ReactNode
}) {
  const inputId = useId(), inputRef = useRef<HTMLInputElement>(null)
  const projection = useMemo(() => projectDirectory(data, session.query), [data, session.query])
  const selectionTree = useDirectorySelection(data, checkedIds, onCheckedChange)
  const entries = summarizeDirectory(data, checkedIds)
  const selected = new Set(entries.map(entry => entry.id))
  const ancestors = new Set(entries.flatMap(entry => data.paths[entry.id].slice(0, -1)))
  const saveExpanded = useCallback((expandedIds: string[]) => onSessionChange({ expandedIds }), [onSessionChange])
  function activate(id: string) {
    if (multiple) { void selectionTree.getItemInstance(id).toggleCheckedState(); return }
    const leaves = directoryLeaves(data, id)
    onCheckedChange(previous => {
      const valid = new Set(previous.filter(value => data.leafIds.includes(value)))
      return valid.size === leaves.length && leaves.every(leaf => valid.has(leaf)) ? [] : leaves
    })
  }
  const clearSearch = () => { onSessionChange({ query: "" }); inputRef.current?.focus() }
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3" data-picker-session>
    <div className="shrink-0"><Label htmlFor={inputId}>搜索当前{kindTitle(kind)}</Label><div className="flex min-w-0 items-center gap-2">
      <InputGroup className="min-w-0 flex-1"><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput id={inputId} ref={inputRef} aria-label={`搜索当前${kindTitle(kind)}`} value={session.query} onChange={event => onSessionChange({ query: event.target.value })} placeholder={kind === "course" ? "章节名称或编号" : "知识点名称"} />{session.query && <InputGroupAddon align="inline-end"><Button variant="ghost" size="icon-xs" aria-label="清除目录搜索" onClick={clearSearch}><X /></Button></InputGroupAddon>}</InputGroup>{searchAction}
    </div></div>
    {summary}
    {projection.normalized && <p role="status" className="text-ui-hint text-muted-foreground">{projection.matchingIds.size} 处匹配 · 搜索不改变已选范围</p>}
    <p id={`${inputId}-help`} className="sr-only">{multiple ? "勾选父级包含全部下级，搜索不会缩小勾选范围。Enter 或空格勾选或取消。" : "点标题只看这一项，再点一次取消；替换当前目录的多选。"}</p>
    <DirectoryMarks.Provider value={multiple ? null : { selected, ancestors }}>
      {projection.nodes[data.rootId].children.length ? <View key={projection.normalized} data={data} projection={projection} selectionTree={selectionTree} currentId="" onCurrentChange={activate} initialExpanded={session.expandedIds ?? initialExpanded} onExpandedChange={saveExpanded} label={kindTitle(kind)} helpId={`${inputId}-help`} titleAction="select" showCheckboxes={multiple} /> : <p className="py-6 text-ui-hint">{projection.normalized ? "没有匹配的目录项。" : "此教材尚未设置目录。"}</p>}
    </DirectoryMarks.Provider>
  </div>
}

export function ExplorationDirectory({ textbooks, selections, onSelectionsChange, kind, onKindChange, View, initialExpanded, onTextbookSwitch }: {
  textbooks: TextbookDefinition[]; selections: DirectorySelections; onSelectionsChange: SelectionChange
  kind: DirectoryKind; onKindChange: (kind: DirectoryKind) => void; View: ComponentType<DirectoryViewProps>
  initialExpanded: (data: DirectoryData) => string[]; onTextbookSwitch?: () => void
}) {
  const [bookId, setBookId] = useState(textbooks[0]?.id ?? "")
  const [sessions, setSessions] = useState<Record<string, Session>>({})
  const [bookDialog, setBookDialog] = useState({ open: false, edition: "", id: "" })
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
  const entries = selectedEntries(textbooks, selections), draftEntries = selectedEntries(textbooks, multiDialog.selections)
  const editions = [...new Set(textbooks.map(editionTitle))]
  const selectedBook = textbooks.find(item => item.id === bookDialog.id && editionTitle(item) === bookDialog.edition)
  const disabledReason = !selectedBook ? "请选择册次。" : selectedBook.id === book.id ? "尚未改变教材选择。" : ""
  const changeChecked = (target: DirectoryKind, change: Dispatch<SetStateAction<DirectorySelections>>): Dispatch<SetStateAction<string[]>> => update => change(previous => {
    const key = `${book.id}:${target}`, data = book.directories[target]
    const ids = typeof update === "function" ? update(previous[key] ?? []) : update
    return { ...previous, [key]: [...new Set(ids)].filter(id => data.leafIds.includes(id)) }
  })
  const closeBook = () => setBookDialog(previous => ({ ...previous, open: false }))
  const closeMulti = () => setMultiDialog(previous => ({ ...previous, open: false }))
  const setDraft: SelectionChange = update => setMultiDialog(previous => ({ ...previous, selections: typeof update === "function" ? update(previous.selections) : update }))
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3" data-exploration-directory>
    <BookHeader book={book}>{(onTextbookSwitch || textbooks.length > 1) && <Button ref={switchRef} variant="outline" size="sm" aria-label="切换教材" aria-haspopup={onTextbookSwitch ? undefined : "dialog"} onClick={() => {
      if (onTextbookSwitch) { onTextbookSwitch(); return }
      setBookDialog({ open: true, edition: editionTitle(book), id: book.id })
    }}><ArrowRightLeft aria-hidden="true" />切换</Button>}</BookHeader>
    <KindTabs kind={kind} onKindChange={onKindChange}>
      <PickerSession key={scope} data={book.directories[kind]} kind={kind} checkedIds={selections[scope] ?? []} onCheckedChange={changeChecked(kind, onSelectionsChange)} View={View} session={sessions[scope] ?? { query: "" }} onSessionChange={patchSession} initialExpanded={initialExpanded(book.directories[kind])}
        searchAction={<Button ref={multiRef} variant="outline" aria-label="多选" aria-haspopup="dialog" onClick={() => { setDraftSessions({}); setMultiDialog({ open: true, kind, selections: structuredClone(selections) }) }}>多选</Button>}
        summary={entries.length > 0 && <div className="flex min-w-0 items-center gap-2 text-ui-hint"><p role="status" className="min-w-0 truncate text-muted-foreground" title={entries.length === 1 ? `已选：${entries[0].title}` : undefined}>{entries.length === 1 ? `已选：${entries[0].title}` : `已选 ${entries.length} 项`}</p><Button variant="ghost" size="sm" aria-label="清空所有教材的已选范围" onClick={() => onSelectionsChange(previous => clearSelections(textbooks, previous))}>清空</Button></div>} />
    </KindTabs>
    <DialogLayout open={bookDialog.open} onOpenChange={open => { if (!open) closeBook() }} title="选择教材版本" closeLabel="关闭教材版本选择" description="选择当前使用的教材版本与册次，确认后同步题目结果。" size="lg" initialFocus={bookFocus} finalFocus={switchRef}
      footerStart={<div className="space-y-1 text-ui-hint text-muted-foreground"><p>确认后将更新当前筛选范围与题目结果。</p>{disabledReason && <p id={reasonId}>{disabledReason}</p>}</div>}
      footerEnd={<div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={closeBook}>取消</Button><Button variant="outline" disabled={!!disabledReason} aria-describedby={disabledReason ? reasonId : undefined} onClick={() => { if (selectedBook && !disabledReason) { setBookId(selectedBook.id); closeBook() } }}>确认选择</Button></div>}>
      <div ref={bookFocus} tabIndex={-1} aria-label="当前教材" className="space-y-2 outline-none"><p className="text-ui-hint text-muted-foreground">当前教材</p><BookHeader book={book} /></div>
      <DialogSection title="1. 选择版本"><DialogOptionGrid label="教材版本" value={bookDialog.edition} onValueChange={edition => setBookDialog(previous => ({ ...previous, edition, id: edition === previous.edition ? previous.id : "" }))}>{editions.map(edition => <DialogOptionGridItem key={edition} value={edition} title={edition} />)}</DialogOptionGrid></DialogSection>
      <DialogSection title="2. 选择册次"><DialogOptionGrid label="教材册次" value={bookDialog.id || null} onValueChange={id => setBookDialog(previous => ({ ...previous, id }))}>{textbooks.filter(item => editionTitle(item) === bookDialog.edition).map(item => <DialogOptionGridItem key={item.id} value={item.id} title={item.volume || item.title} description={item.subject} />)}</DialogOptionGrid></DialogSection>
    </DialogLayout>
    <DialogLayout open={multiDialog.open} onOpenChange={open => { if (!open) closeMulti() }} title="选择目录范围" closeLabel="关闭目录多选" description="可跨课程与知识点选择，确认后同时筛选符合条件的题目。" size="xl" initialFocus={multiFocus} finalFocus={multiRef}
      footerStart={<p className="text-ui-hint text-muted-foreground">确认后将更新筛选范围与题目结果</p>}
      footerEnd={<div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={closeMulti}>取消</Button><Button variant="outline" onClick={() => {
        onSelectionsChange(previous => ({ ...previous, ...Object.fromEntries(textbooks.flatMap(item => kinds.map(type => {
          const key = `${item.id}:${type}`
          return [key, [...new Set(multiDialog.selections[key] ?? [])].filter(id => item.directories[type].leafIds.includes(id))]
        }))) })); onKindChange(multiDialog.kind); closeMulti()
      }}>确认选择（{draftEntries.length}）</Button></div>}>
      <div ref={multiFocus} tabIndex={-1} className="outline-none"><BookHeader book={book} /></div>
      <div className="directory-picker-columns grid min-w-0 gap-5">
        <section aria-label="可选目录" className="min-w-0 space-y-3"><h3 className="text-item-title">可选目录</h3>
          <KindTabs kind={multiDialog.kind} onKindChange={value => setMultiDialog(previous => ({ ...previous, kind: value }))}>
            <PickerSession key={draftScope} data={book.directories[multiDialog.kind]} kind={multiDialog.kind} checkedIds={multiDialog.selections[draftScope] ?? []} onCheckedChange={changeChecked(multiDialog.kind, setDraft)} View={OutlineView} multiple session={draftSessions[draftScope] ?? { query: "" }} onSessionChange={patchDraftSession} initialExpanded={initialExpanded(book.directories[multiDialog.kind])} />
          </KindTabs>
        </section>
        <section aria-label="已选范围" className="min-w-0 space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-item-title">已选 {draftEntries.length} 项</h3><Button variant="ghost" size="sm" disabled={!draftEntries.length} onClick={() => setDraft(previous => clearSelections(textbooks, previous))}>清空已选</Button></div>
          {draftEntries.length ? <ul className="space-y-3">{draftEntries.map(entry => <li key={`${entry.scope}:${entry.id}`} className="flex min-w-0 items-start gap-2" data-directory-selected={entry.id}><div className="min-w-0 flex-1 break-words"><p className="text-ui-body">{entry.title}</p><p className="text-ui-hint text-muted-foreground">{[entry.book.volume || entry.book.title, entry.book.edition, kindTitle(entry.kind)].filter(Boolean).join(" · ")}</p></div><Button variant="ghost" size="icon-sm" aria-label={`移除${entry.title}`} onClick={() => setDraft(previous => ({ ...previous, [entry.scope]: (previous[entry.scope] ?? []).filter(id => !entry.leafIds.includes(id)) }))}><X /></Button></li>)}</ul> : <p className="text-ui-hint text-muted-foreground">从左侧选择一个或多个章节或知识点。</p>}
        </section>
      </div>
    </DialogLayout>
  </div>
}
