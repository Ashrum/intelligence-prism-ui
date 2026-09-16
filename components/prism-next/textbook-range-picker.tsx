"use client"

import { useEffect, useId, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { Check, ChevronRight, ListChecks, Search, X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/coss/dialog"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/coss/input-group"
import { Label } from "@/components/coss/label"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { useDirectorySelection, type TextbookDefinition, type DirectorySelections } from "@/components/prism-next/textbook-directory"
import { directoryLeaves, projectDirectory, summarizeDirectory, type DirectoryData, type DirectoryKind } from "@/lib/prism-next/textbook-directory"
import { cn } from "@/lib/utils"

const kinds: DirectoryKind[] = ["course", "knowledge"]
const kindName = (kind: DirectoryKind) => kind === "course" ? "课程目录" : "知识点目录"
const unit = (kind: DirectoryKind) => kind === "course" ? "节课程" : "个知识点"
const scopeKey = (bookId: string, kind: DirectoryKind) => `${bookId}:${kind}`
const copySelections = (value: DirectorySelections): DirectorySelections => Object.fromEntries(Object.entries(value).map(([scope, ids]) => [scope, [...ids]]))
type Context = { bookId: string; kind: DirectoryKind; nodeId: string }
type BrowseSession = { chapterId?: string; query?: string; targetId?: string }

function selectionGroups(textbooks: TextbookDefinition[], selections: DirectorySelections) {
  return textbooks.flatMap(book => kinds.map(kind => {
    const scope = scopeKey(book.id, kind), data = book.directories[kind]
    const ids = [...new Set(selections[scope] ?? [])].filter(id => data.leafIds.includes(id))
    return { book, kind, scope, data, ids }
  })).filter(group => group.ids.length)
}
function countLabel(textbooks: TextbookDefinition[], selections: DirectorySelections) {
  const groups = selectionGroups(textbooks, selections)
  const courses = groups.filter(group => group.kind === "course").reduce((sum, group) => sum + group.ids.length, 0)
  const knowledge = groups.filter(group => group.kind === "knowledge").reduce((sum, group) => sum + group.ids.length, 0)
  return `${courses} 节课程 · ${knowledge} 个知识点`
}

export function TextbookRangePicker({ textbooks, selections, onSelectionsChange, compactTrigger = false, triggerLabel = "选择范围" }: {
  textbooks: TextbookDefinition[]; selections: DirectorySelections; onSelectionsChange: Dispatch<SetStateAction<DirectorySelections>>; compactTrigger?: boolean; triggerLabel?: string
}) {
  const controlId = useId()
  const [open, setOpen] = useState(false)
  const [bookId, setBookId] = useState(textbooks[0]?.id ?? "")
  const [kind, setKind] = useState<DirectoryKind>("course")
  const [view, setView] = useState<"browse" | "selected">("browse")
  const [draft, setDraft] = useState<DirectorySelections>({})
  const [sessions, setSessions] = useState<Record<string, BrowseSession>>({})
  const [status, setStatus] = useState("")
  const [undo, setUndo] = useState<{ scope: string; ids: string[] } | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const book = textbooks.find(item => item.id === bookId) ?? textbooks[0]
  if (!book) return <p className="text-sm text-muted-foreground">暂无可用教材。</p>
  const scope = scopeKey(book.id, kind)
  const bookOptions = textbooks.map(item => ({ value: item.id, label: item.title }))
  function initialize() { setDraft(copySelections(selections)); setView("browse"); setStatus(""); setUndo(null) }
  function adjust(context: Context) {
    const data = textbooks.find(item => item.id === context.bookId)!.directories[context.kind]
    setBookId(context.bookId); setKind(context.kind); setView("browse")
    setSessions(previous => ({ ...previous, [scopeKey(context.bookId, context.kind)]: { chapterId: data.paths[context.nodeId][0], targetId: context.nodeId, query: "" } }))
  }
  function launch(nextView: "browse" | "selected", source: HTMLElement, context?: Context) {
    returnFocus.current = source
    initialize()
    if (context) adjust(context)
    else setView(nextView)
    setOpen(true)
  }
  function removeApplied(groupScope: string, ids: string[]) {
    setUndo({ scope: groupScope, ids })
    onSelectionsChange(previous => ({ ...previous, [groupScope]: (previous[groupScope] ?? []).filter(id => !ids.includes(id)) }))
    setStatus(`已移除 ${ids.length} 项。`)
  }
  const hasApplied = selectionGroups(textbooks, selections).length > 0
  return <div className="min-w-0" data-range-picker>
    <Dialog open={open} onOpenChange={next => { if (next) initialize(); setOpen(next) }}>
      {compactTrigger ? <DialogTrigger ref={triggerRef} render={<Button variant="outline" size="sm" />} onClick={event => { returnFocus.current = event.currentTarget }}><ListChecks />{triggerLabel}</DialogTrigger> : <><div className="flex flex-wrap items-end gap-3">
        <div className="grid w-full max-w-72 gap-2"><Label htmlFor={`${controlId}-book`}>教材</Label><Select items={bookOptions} value={book.id} onValueChange={value => { if (value) setBookId(value) }}><SelectTrigger id={`${controlId}-book`}><SelectValue /></SelectTrigger><SelectPopup>{bookOptions.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup></Select></div>
        <div><Label className="mb-2 block">选择内容</Label><Tabs value={kind} onValueChange={value => setKind(value as DirectoryKind)}><TabsList aria-label="选择的目录类型">{kinds.map(type => <TabsTab value={type} key={type}>{kindName(type)}</TabsTab>)}</TabsList></Tabs></div>
        <DialogTrigger ref={triggerRef} render={<Button variant="outline" />} onClick={event => { returnFocus.current = event.currentTarget }}><ListChecks />选择范围</DialogTrigger>
      </div>
      <section className="mt-6" aria-label="已应用范围">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">已应用范围</h3><p className="mt-1 text-sm text-muted-foreground" data-applied-count>{countLabel(textbooks, selections)}</p></div>{hasApplied && <Button size="sm" variant="ghost" onClick={event => launch("selected", event.currentTarget)}>查看全部与调整</Button>}</div>
        {hasApplied ? <SelectionSummary textbooks={textbooks} selections={selections} compact onRemove={removeApplied} onAdjust={(context, source) => launch("browse", source, context)} onShowAll={source => launch("selected", source)} /> : <p className="rounded-lg bg-muted/50 px-4 py-5 text-sm leading-6 text-muted-foreground">尚未选择范围。选择后，这里会保留具体名称和来源，方便随时调整。</p>}
        <div className="mt-2 flex min-h-7 items-center gap-2 text-sm text-muted-foreground" role="status">{status}{undo && <Button size="sm" variant="ghost" onClick={() => { onSelectionsChange(previous => ({ ...previous, [undo.scope]: [...new Set([...(previous[undo.scope] ?? []), ...undo.ids])] })); setUndo(null); setStatus("已恢复移除的内容。") }}>撤销</Button>}</div>
      </section></>}
      <DialogPopup className="max-w-4xl h-[min(45rem,calc(100dvh-3rem))]" closeProps={{ "aria-label": "取消并关闭选择器" }} finalFocus={() => returnFocus.current?.isConnected ? returnFocus.current : triggerRef.current}>
        <DialogHeader className="shrink-0 pb-4"><DialogTitle>选择课程与知识点</DialogTitle><DialogDescription>跨教材保留选择，应用后更新页面范围。</DialogDescription></DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col px-4 sm:px-6">
          <div className="flex shrink-0 flex-wrap items-end gap-3 pb-4">
            <div className="grid w-full max-w-72 gap-2"><Label htmlFor={`${controlId}-popup-book`}>教材</Label><Select items={bookOptions} value={book.id} onValueChange={value => { if (value) { setBookId(value); setView("browse") } }}><SelectTrigger id={`${controlId}-popup-book`}><SelectValue /></SelectTrigger><SelectPopup>{bookOptions.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup></Select></div>
            <Button variant={view === "selected" ? "secondary" : "outline"} onClick={() => setView(view === "selected" ? "browse" : "selected")} className="sm:ml-auto"><ListChecks />{view === "selected" ? "返回目录" : "查看已选"}</Button>
          </div>
          {view === "selected" ? <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5" aria-label="检查待应用的选择"><h3 className="mb-1 text-base font-semibold">已选明细</h3><p className="mb-4 text-sm text-muted-foreground">按教材和目录分别列出。可移除整组，或返回对应位置细调。</p><SelectionSummary textbooks={textbooks} selections={draft} onRemove={(groupScope, ids) => setDraft(previous => ({ ...previous, [groupScope]: (previous[groupScope] ?? []).filter(id => !ids.includes(id)) }))} onAdjust={context => adjust(context)} /></div> : <Tabs className="min-h-0 flex-1 gap-3" value={kind} onValueChange={value => setKind(value as DirectoryKind)}>
            <TabsList aria-label="面板目录类型">{kinds.map(type => <TabsTab value={type} key={type}>{kindName(type)}</TabsTab>)}</TabsList>
            {kinds.map(type => <TabsPanel key={type} value={type} className="min-h-0">{kind === type && <DirectoryChoices key={scope} data={book.directories[kind]} kind={kind} session={sessions[scope] ?? {}} onSessionChange={patch => setSessions(previous => ({ ...previous, [scope]: { ...previous[scope], ...patch } }))} checkedIds={draft[scope] ?? []} onCheckedChange={update => setDraft(previous => ({ ...previous, [scope]: typeof update === "function" ? update(previous[scope] ?? []) : update }))} />}</TabsPanel>)}
          </Tabs>}
        </div>
        <DialogFooter className="mt-3 shrink-0 flex-row flex-wrap items-center justify-between gap-3 sm:justify-between"><div className="text-sm" role="status"><span className="mr-2 text-muted-foreground">待应用</span><span className="font-medium">{countLabel(textbooks, draft)}</span></div><div className="flex gap-2"><Button variant="outline" onClick={() => setOpen(false)}>取消</Button><Button onClick={() => { onSelectionsChange(copySelections(draft)); setStatus("选择已应用。"); setOpen(false) }}><Check />应用选择</Button></div></DialogFooter>
      </DialogPopup>
    </Dialog>
  </div>
}

function SelectionSummary({ textbooks, selections, compact = false, onRemove, onAdjust, onShowAll }: {
  textbooks: TextbookDefinition[]; selections: DirectorySelections; compact?: boolean
  onRemove: (scope: string, ids: string[]) => void
  onAdjust: (context: Context, source: HTMLElement) => void
  onShowAll?: (source: HTMLElement) => void
}) {
  const groups = selectionGroups(textbooks, selections)
  if (!groups.length) return <p className="py-8 text-sm text-muted-foreground">尚未选择内容，可返回目录继续选择。</p>
  return <div className="space-y-5">{groups.map(group => {
    const entries = summarizeDirectory(group.data, group.ids)
    return <section key={group.scope} aria-label={`${group.book.title} / ${kindName(group.kind)}选择摘要`}>
      <h4 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">{group.book.title}<span className="font-normal text-muted-foreground">{kindName(group.kind)} · {group.ids.length} {unit(group.kind)}</span></h4>
      <ul className="mt-2 space-y-1">{(compact ? entries.slice(0, 3) : entries).map(entry => {
        const node = group.data.nodes[entry.id], isGroup = node.children.length > 0
        const parentPath = group.data.paths[entry.id].slice(0, -1).map(id => group.data.nodes[id].title).join(" / ")
        return <li key={entry.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted/45 px-3 py-2">
          <div className="min-w-0 flex-[1_1_12rem]"><p className="break-words text-sm leading-6">{node.title}{isGroup && <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">全部 {entry.leafIds.length} {unit(group.kind)}</span>}</p>{parentPath && <p className="break-words text-xs leading-5 text-muted-foreground">{parentPath}</p>}</div>
          <div className="ml-auto flex shrink-0 gap-1"><Button variant="ghost" size="sm" aria-label={`调整${group.book.title}${kindName(group.kind)}的${node.title}`} onClick={event => onAdjust({ bookId: group.book.id, kind: group.kind, nodeId: entry.id }, event.currentTarget)}>调整</Button><Button variant="ghost" size="icon-sm" aria-label={`移除${group.book.title}${kindName(group.kind)}的${node.title}${isGroup ? `全部${entry.leafIds.length}项` : ""}`} onClick={() => onRemove(group.scope, entry.leafIds)}><X /></Button></div>
        </li>
      })}</ul>
      {compact && entries.length > 3 && <Button variant="ghost" size="sm" className="mt-1" onClick={event => onShowAll?.(event.currentTarget)}>还有 {entries.length - 3} 组选项，查看全部<ChevronRight /></Button>}
    </section>
  })}</div>
}

function DirectoryChoices({ data, kind, session, onSessionChange, checkedIds, onCheckedChange }: {
  data: DirectoryData; kind: DirectoryKind; session: BrowseSession; onSessionChange: (patch: Partial<BrowseSession>) => void
  checkedIds: string[]; onCheckedChange: Dispatch<SetStateAction<string[]>>
}) {
  const inputId = useId(), inputRef = useRef<HTMLInputElement>(null), targetRef = useRef<HTMLDivElement>(null)
  const chapterIds = data.nodes[data.rootId].children
  const chapterId = chapterIds.includes(session.chapterId ?? "") ? session.chapterId! : chapterIds[0]
  const query = session.query ?? ""
  const projection = useMemo(() => projectDirectory(data, query), [data, query])
  const selectionTree = useDirectorySelection(data, checkedIds, onCheckedChange)
  const checked = new Set(checkedIds)
  const matchingLeaves = data.leafIds.filter(id => projection.matchingIds.has(id))
  const matchingFolders = data.folderIds.filter(id => projection.matchingIds.has(id))
  const countIn = (id: string) => directoryLeaves(data, id).filter(leafId => checked.has(leafId)).length
  useEffect(() => { if (session.targetId && !query) { targetRef.current?.scrollIntoView({ block: "nearest" }); targetRef.current?.focus({ preventScroll: true }) } }, [session.targetId, query, chapterId])
  const clearSearch = () => { onSessionChange({ query: "" }); inputRef.current?.focus() }
  const maxDepth = Math.max(0, ...Object.values(data.paths).map(path => path.length))
  function row(id: string): React.ReactNode {
    const node = data.nodes[id], folder = node.children.length > 0
    const checkedState = selectionTree.getItemInstance(id).getCheckedState()
    return <div key={id}>
      <div ref={session.targetId === id ? targetRef : undefined} tabIndex={session.targetId === id ? -1 : undefined} data-directory-level={data.paths[id].length} className={cn("flex min-w-0 items-start gap-2 rounded-md px-2 py-2 outline-none focus:ring-2 focus:ring-ring", session.targetId === id && "bg-accent text-accent-foreground", folder && "mt-2 first:mt-0")}>
        <Checkbox id={`${inputId}-${id}`} className="mt-1 shrink-0" aria-label={`选择${node.title}`} checked={checkedState === "checked"} indeterminate={checkedState === "indeterminate"} onCheckedChange={() => { void selectionTree.getItemInstance(id).toggleCheckedState() }} />
        <div className="min-w-0 flex-1"><Label htmlFor={`${inputId}-${id}`} className={cn("block w-full cursor-pointer break-words text-left text-sm font-normal leading-6", folder && "font-medium")}>{node.code && <span className="mr-2 font-normal text-muted-foreground prism-numeric">{node.code}</span>}{node.title}</Label>{folder && <p className="text-xs leading-5 text-muted-foreground">分组 · 已选 {countIn(id)} / {directoryLeaves(data, id).length} {unit(kind)}</p>}</div>
        <span className="shrink-0 pt-0.5 text-xs leading-5 text-muted-foreground">第 {data.paths[id].length} 级</span>
      </div>
      {folder && <div className="ml-4 border-l border-border/60 pl-1 sm:ml-5">{node.children.map(child => row(child))}</div>}
    </div>
  }
  return <div className="flex h-full min-h-0 flex-col">
    <p className="mb-3 shrink-0 text-xs text-muted-foreground">当前{kindName(kind)}最深 {maxDepth} 级 · 首层为第 1 级 · 分组勾选包含全部下级</p>
    <div className="grid shrink-0 gap-2"><Label htmlFor={inputId}>搜索当前教材的{kindName(kind)}</Label><InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput ref={inputRef} id={inputId} value={query} onChange={event => onSessionChange({ query: event.target.value, targetId: undefined })} placeholder="搜索名称或编号，无需逐层查找" />{query && <InputGroupAddon align="inline-end"><Button size="icon-xs" variant="ghost" aria-label="清除范围搜索" onClick={clearSearch}><X /></Button></InputGroupAddon>}</InputGroup></div>
    {projection.normalized ? <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3" aria-label="范围搜索结果">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted-foreground" role="status">{matchingLeaves.length} 个可选项 · {matchingFolders.length} 个分组</p><Button size="sm" variant="outline" disabled={!matchingLeaves.length} onClick={() => onCheckedChange(previous => [...new Set([...previous, ...matchingLeaves])])}>选择搜索结果（{matchingLeaves.length}）</Button></div>
      <p className="mb-3 text-xs leading-5 text-muted-foreground">只批量选择下方命中的具体项，其他已选内容保持不变。</p>
      {matchingLeaves.map(id => <div key={id} className="flex min-w-0 items-start gap-2 rounded-md px-2 py-2 hover:bg-muted/50"><Checkbox className="mt-1" aria-label={`选择搜索结果${data.nodes[id].title}`} checked={checked.has(id)} onCheckedChange={() => { void selectionTree.getItemInstance(id).toggleCheckedState() }} /><div className="min-w-0"><p className="break-words text-sm leading-6">{data.nodes[id].title}</p><p className="break-words text-xs leading-5 text-muted-foreground">{data.paths[id].slice(0, -1).map(parent => data.nodes[parent].title).join(" / ")}</p></div></div>)}
      {matchingFolders.map(id => <div key={id} className="flex min-w-0 items-center gap-2 px-2 py-2"><div className="min-w-0 flex-1"><p className="break-words text-sm leading-6">{data.nodes[id].title}</p><p className="break-words text-xs leading-5 text-muted-foreground">分组 · {data.paths[id].slice(0, -1).map(parent => data.nodes[parent].title).join(" / ") || kindName(kind)}</p></div><Button size="sm" variant="ghost" onClick={() => onSessionChange({ chapterId: data.paths[id][0], query: "", targetId: id })}>进入分组<ChevronRight /></Button></div>)}
      {!matchingLeaves.length && !matchingFolders.length && <div className="py-8 text-center"><p className="mb-3 text-sm text-muted-foreground">没有匹配项，已选内容仍然保留。</p><Button size="sm" variant="outline" onClick={clearSearch}>清除搜索</Button></div>}
    </div> : chapterId ? <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="章节定位" className="hidden min-h-0 space-y-1 overflow-y-auto overscroll-contain border-r pr-3 pb-3 sm:block">{chapterIds.map(id => <Button key={id} variant="ghost" className={cn("h-auto sm:h-auto min-h-10 w-full justify-start whitespace-normal px-3 py-2 text-left", chapterId === id && "bg-accent text-accent-foreground")} aria-current={chapterId === id ? "location" : undefined} onClick={() => onSessionChange({ chapterId: id, targetId: undefined })}><span className="min-w-0 flex-1"><span className="block break-words text-sm leading-6">{data.nodes[id].code && <span className="mr-2 text-muted-foreground">{data.nodes[id].code}</span>}{data.nodes[id].title}</span><span className="block text-xs font-normal leading-5 text-muted-foreground">已选 {countIn(id)} / {directoryLeaves(data, id).length}</span></span><ChevronRight className="shrink-0" /></Button>)}</nav>
      <div className="min-h-0 flex flex-col"><div className="mb-2 shrink-0 sm:hidden"><Label htmlFor={`${inputId}-chapter`}>章节定位</Label><Select items={chapterIds.map(id => ({ value: id, label: data.nodes[id].title }))} value={chapterId} onValueChange={value => { if (value) onSessionChange({ chapterId: value, targetId: undefined }) }}><SelectTrigger id={`${inputId}-chapter`}><SelectValue /></SelectTrigger><SelectPopup>{chapterIds.map(id => <SelectItem key={id} value={id}>{data.nodes[id].title}</SelectItem>)}</SelectPopup></Select></div><div key={chapterId} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3 pr-1" aria-label="当前章节选项">{row(chapterId)}</div></div>
    </div> : <p className="py-8 text-sm text-muted-foreground">此教材尚未设置目录。</p>}
  </div>
}
