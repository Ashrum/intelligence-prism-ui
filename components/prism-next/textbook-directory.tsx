"use client"

import { checkboxesFeature, hotkeysCoreFeature, syncDataLoaderFeature, type TreeInstance } from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { ChevronRight, Search, X } from "lucide-react"
import { useCallback, useEffect, useId, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Label } from "@/components/coss/label"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/coss/input-group"
import { ScrollArea } from "@/components/coss/scroll-area"
import { Tree, TreeItem, TreeItemLabel } from "@/components/prism-next/tree"
import { projectDirectory, type DirectoryData, type DirectoryKind, type DirectoryNode } from "@/lib/prism-next/textbook-directory"
import { cn } from "@/lib/utils"

export type TextbookDefinition = { id: string; title: string; directories: Record<DirectoryKind, DirectoryData> }
export type DirectorySelections = Record<string, string[]>
type Session = { query: string; currentId: string; expandedIds?: string[] }
const blankSession: Session = { query: "", currentId: "" }
const kinds: DirectoryKind[] = ["course", "knowledge"]
const kindTitle = (kind: DirectoryKind) => kind === "course" ? "课程目录" : "知识点目录"
const unitTitle = (kind: DirectoryKind) => kind === "course" ? "节课程" : "个知识点"
const scopeKey = (bookId: string, kind: DirectoryKind) => `${bookId}:${kind}`

export function TextbookDirectory({ textbooks, selections, onSelectionsChange }: {
  textbooks: TextbookDefinition[]
  selections: DirectorySelections
  onSelectionsChange: Dispatch<SetStateAction<DirectorySelections>>
}) {
  const controlId = useId()
  const [bookId, setBookId] = useState(textbooks[0]?.id ?? "")
  const [kind, setKind] = useState<DirectoryKind>("course")
  const [sessions, setSessions] = useState<Record<string, Session>>({})
  const book = textbooks.find(item => item.id === bookId) ?? textbooks[0]
  const bookOptions = textbooks.map(item => ({ value: item.id, label: item.title }))
  const groups = textbooks.flatMap(item => kinds.map(type => {
    const scope = scopeKey(item.id, type), data = item.directories[type]
    const ids = [...new Set(selections[scope] ?? [])].filter(id => data.leafIds.includes(id))
    return { book: item, kind: type, scope, data, ids }
  })).filter(group => group.ids.length)
  const courseCount = groups.filter(group => group.kind === "course").reduce((sum, group) => sum + group.ids.length, 0)
  const knowledgeCount = groups.filter(group => group.kind === "knowledge").reduce((sum, group) => sum + group.ids.length, 0)
  if (!book) return <p className="py-6 text-sm text-muted-foreground">暂无可用教材。</p>
  const scope = scopeKey(book.id, kind)
  const session = sessions[scope] ?? blankSession
  return <div className="grid min-w-0 gap-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(17rem,.75fr)]">
    <div className="min-w-0">
      <div className="mb-5 max-w-sm"><Label htmlFor={`${controlId}-book`}>教材</Label><Select items={bookOptions} value={book.id} onValueChange={value => { if (value) setBookId(value) }}><SelectTrigger id={`${controlId}-book`}><SelectValue /></SelectTrigger><SelectPopup>{bookOptions.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup></Select></div>
      <Tabs value={kind} onValueChange={value => setKind(value as DirectoryKind)}>
        <TabsList aria-label="目录类型">{kinds.map(type => <TabsTab key={type} value={type}>{kindTitle(type)}</TabsTab>)}</TabsList>
        {kinds.map(type => <TabsPanel key={type} value={type}>{kind === type && <DirectorySession key={scope} data={book.directories[kind]} kind={kind} scope={scope} session={session} setSessions={setSessions} checkedIds={selections[scope] ?? []} onCheckedChange={update => onSelectionsChange(previous => {
          const ids = typeof update === "function" ? update(previous[scope] ?? []) : update
          return { ...previous, [scope]: [...new Set(ids)].filter(id => book.directories[kind].leafIds.includes(id)) }
        })} />}</TabsPanel>)}
      </Tabs>
    </div>
    <aside aria-label="已选范围" className="min-w-0 border-t pt-5 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-7">
      <h3 className="text-base font-semibold">已选范围</h3>
      <p className="mt-1 text-sm text-muted-foreground" role="status">{courseCount} 节课程 · {knowledgeCount} 个知识点</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">切换教材或目录会保留各自选择。课程与知识点分别记录。</p>
      {groups.length ? <ScrollArea className="mt-4 h-[25rem]" fill><div className="space-y-6 pr-3">{groups.map(group => <section key={group.scope} aria-label={`${group.book.title} / ${kindTitle(group.kind)}已选项`}>
        <h4 className="text-sm font-medium">{group.book.title}</h4><p className="mb-2 mt-1 text-xs text-muted-foreground">{kindTitle(group.kind)} · {group.ids.length} {unitTitle(group.kind)}</p>
        <ul className="space-y-2">{group.ids.map(id => <li key={id} className="flex min-w-0 items-start gap-2"><div className="min-w-0 flex-1"><p className="break-words text-sm leading-6">{group.data.nodes[id].title}</p><p className="break-words text-xs leading-5 text-muted-foreground">{group.data.paths[id].slice(0, -1).map(parent => group.data.nodes[parent].title).join(" / ") || kindTitle(group.kind)}</p></div><Button size="icon-xs" variant="ghost" aria-label={`移除${group.book.title}${kindTitle(group.kind)}的${group.data.nodes[id].title}`} onClick={() => onSelectionsChange(previous => ({ ...previous, [group.scope]: (previous[group.scope] ?? []).filter(value => value !== id) }))}><X /></Button></li>)}</ul>
      </section>)}</div></ScrollArea> : <div className="py-10 text-sm leading-6 text-muted-foreground">尚未选择内容。<br />勾选左侧目录，选择需要的课程或知识点。</div>}
    </aside>
  </div>
}

function DirectorySession({ data, kind, scope, session, setSessions, checkedIds, onCheckedChange }: {
  data: DirectoryData; kind: DirectoryKind; scope: string; session: Session
  setSessions: Dispatch<SetStateAction<Record<string, Session>>>
  checkedIds: string[]; onCheckedChange: Dispatch<SetStateAction<string[]>>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const helpId = `${inputId}-help`
  const projection = useMemo(() => projectDirectory(data, session.query), [data, session.query])
  const checked = [...new Set(checkedIds)].filter(id => data.leafIds.includes(id))
  // Keep the upstream checkbox propagation on the complete tree. Searching never
  // changes the descendant set to which a parent's checkbox applies.
  const selectionTree = useTree<DirectoryNode>({
    rootItemId: data.rootId,
    dataLoader: { getItem: id => data.nodes[id], getChildren: id => data.nodes[id].children },
    getItemName: item => item.getItemData().title,
    isItemFolder: item => item.getItemData().children.length > 0,
    propagateCheckedState: true,
    canCheckFolders: false,
    state: { checkedItems: checked },
    setCheckedItems: onCheckedChange,
    features: [syncDataLoaderFeature, checkboxesFeature],
  })
  const patch = useCallback((values: Partial<Session>) => setSessions(previous => ({ ...previous, [scope]: { ...(previous[scope] ?? blankSession), ...values } })), [scope, setSessions])
  const saveExpanded = useCallback((expandedIds: string[]) => setSessions(previous => {
    const previousSession = previous[scope] ?? blankSession
    if (previousSession.expandedIds?.join("|") === expandedIds.join("|")) return previous
    return { ...previous, [scope]: { ...previousSession, expandedIds } }
  }), [scope, setSessions])
  const hiddenCount = checked.filter(id => !projection.visibleIds.has(id)).length
  const clearSearch = () => { patch({ query: "" }); inputRef.current?.focus() }
  const current = data.nodes[session.currentId]
  return <div className="mt-4 min-w-0">
    <Label htmlFor={inputId}>搜索当前{kindTitle(kind)}</Label>
    <InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput id={inputId} ref={inputRef} value={session.query} onChange={event => patch({ query: event.target.value })} placeholder={kind === "course" ? "章节名称或编号" : "知识点名称"} />{session.query && <InputGroupAddon align="inline-end"><Button variant="ghost" size="icon-xs" aria-label="清除目录搜索" onClick={clearSearch}><X /></Button></InputGroupAddon>}</InputGroup>
    <div className="my-3 flex flex-wrap items-center justify-between gap-2 text-sm"><p className="text-muted-foreground" role="status">已选 {checked.length} {unitTitle(kind)}{projection.normalized && ` · ${projection.matchingIds.size} 处匹配`}{hiddenCount > 0 && ` · ${hiddenCount} 项在搜索结果外`}</p><Button variant="ghost" size="sm" disabled={!checked.length} onClick={() => onCheckedChange([])}>清空当前目录</Button></div>
    <p id={helpId} className="mb-3 text-xs leading-5 text-muted-foreground">箭头展开，标题定位，复选框选择。勾选父级包含全部下级，搜索不会缩小勾选范围。</p>
    {projection.nodes[data.rootId].children.length ? <DirectoryTreeView key={`${scope}:${projection.normalized}`} data={data} projection={projection} selectionTree={selectionTree} currentId={session.currentId} onCurrentChange={id => patch({ currentId: id })} initialExpanded={session.expandedIds ?? data.nodes[data.rootId].children} onExpandedChange={saveExpanded} label={kindTitle(kind)} helpId={helpId} /> : <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg bg-muted/40 px-5 text-center"><p className="text-sm">{projection.normalized ? "没有匹配的目录项。" : "此教材尚未设置目录。"}</p>{projection.normalized && <Button variant="outline" size="sm" onClick={clearSearch}>清除搜索</Button>}</div>}
    <p className="mt-3 min-h-10 break-words text-xs leading-5 text-muted-foreground" role="status">{current ? `当前位置：${data.paths[current.id].map(id => data.nodes[id].title).join(" / ")}` : "方向键浏览和展开，Enter 定位，空格勾选或取消。"}</p>
  </div>
}

function DirectoryTreeView({ data, projection, selectionTree, currentId, onCurrentChange, initialExpanded, onExpandedChange, label, helpId }: {
  data: DirectoryData; projection: ReturnType<typeof projectDirectory>; selectionTree: TreeInstance<DirectoryNode>
  currentId: string; onCurrentChange: (id: string) => void; initialExpanded: string[]; onExpandedChange: (ids: string[]) => void; label: string; helpId: string
}) {
  // This instance navigates only projected children, so hidden matches cannot
  // receive keyboard focus. Remounting on the query preserves the input focus.
  const tree = useTree<DirectoryNode>({
    rootItemId: data.rootId,
    dataLoader: { getItem: id => projection.nodes[id], getChildren: id => projection.nodes[id].children },
    getItemName: item => `${item.getItemData().code ?? ""} ${item.getItemData().title}`.trim(),
    isItemFolder: item => item.getItemData().children.length > 0,
    initialState: { expandedItems: projection.normalized ? data.folderIds.filter(id => projection.visibleIds.has(id)) : initialExpanded },
    onPrimaryAction: item => onCurrentChange(item.getId()),
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  })
  const expanded = tree.getState().expandedItems
  useEffect(() => { if (!projection.normalized) onExpandedChange(expanded) }, [expanded, onExpandedChange, projection.normalized])
  function toggle(id: string) { void selectionTree.getItemInstance(id).toggleCheckedState() }
  return <ScrollArea className="h-[27rem]" fill><Tree tree={tree} aria-label={label} aria-describedby={helpId} className="gap-0.5 p-1 pr-3">
    {tree.getItems().map(item => {
      const id = item.getId(), node = item.getItemData(), checkedState = selectionTree.getItemInstance(id).getCheckedState()
      const focus = () => { item.setFocused(); tree.updateDomFocus() }
      return <TreeItem key={id} item={item} current={currentId === id} aria-checked={checkedState === "indeterminate" ? "mixed" : checkedState === "checked"} onClick={() => { focus(); onCurrentChange(id) }} onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === " ") { event.preventDefault(); event.stopPropagation(); toggle(id) }
        if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); onCurrentChange(id) }
      }}><TreeItemLabel>
        {item.isFolder() ? <Button variant="ghost" size="icon-xs" tabIndex={-1} aria-label={`${item.isExpanded() ? "收起" : "展开"}${node.title}`} aria-expanded={item.isExpanded()} onClick={event => { event.stopPropagation(); focus(); if (item.isExpanded()) item.collapse(); else item.expand() }} className="-ml-1 -mt-0.5 shrink-0"><ChevronRight className={cn("transition-transform", item.isExpanded() && "rotate-90")} /></Button> : <span className="w-5 shrink-0" aria-hidden="true" />}
        <Checkbox tabIndex={-1} className="mt-1" aria-label={`选择${node.title}`} checked={checkedState === "checked"} indeterminate={checkedState === "indeterminate"} onClick={event => event.stopPropagation()} onCheckedChange={() => { focus(); toggle(id) }} />
        <span className="min-w-0 flex-1 whitespace-normal break-words leading-6">{node.code && <span className="mr-2 text-muted-foreground prism-numeric">{node.code}</span>}<span className={projection.matchingIds.has(id) ? "rounded-sm bg-accent font-semibold text-accent-foreground" : undefined}>{node.title}</span></span>
      </TreeItemLabel></TreeItem>
    })}
  </Tree></ScrollArea>
}
