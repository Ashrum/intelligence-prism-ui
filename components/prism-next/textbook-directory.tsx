"use client"

import { checkboxesFeature, hotkeysCoreFeature, syncDataLoaderFeature, type TreeInstance } from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { ArrowRightLeft, ChevronRight, Search, X } from "lucide-react"
import { useCallback, useEffect, useId, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import { Button } from "@/components/coss/button"
import { Toggle } from "@/components/coss/toggle"
import { Checkbox } from "@/components/coss/checkbox"
import { Label } from "@/components/coss/label"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { Menu, MenuTrigger, MenuPopup, MenuRadioGroup, MenuRadioItem } from "@/components/coss/menu"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/coss/input-group"
import { ScrollArea } from "@/components/coss/scroll-area"
import { Tooltip, TooltipTrigger, TooltipPopup } from "@/components/coss/tooltip"
import { Tree, TreeItem, TreeItemLabel } from "@/components/prism-next/tree"
import { directoryLeaves, summarizeDirectory, projectDirectory, type DirectoryData, type DirectoryKind, type DirectoryNode } from "@/lib/prism-next/textbook-directory"
import { cn } from "@/lib/utils"

export type TextbookDefinition = { id: string; title: string; volume?: string; subject?: string; edition?: string; directories: Record<DirectoryKind, DirectoryData> }
export type DirectorySelections = Record<string, string[]>
type Session = { query: string; currentId: string; expandedIds?: string[]; multiSelect?: boolean }
const selectionHelp = "箭头展开，标题定位，复选框选择。勾选父级包含全部下级，搜索不会缩小勾选范围。"
const keyboardHelp = "方向键浏览和展开，Enter 定位，空格勾选或取消。"
const selectHelp = "点标题只看这一项，再点一次取消。勾选可以多选，勾选父级包含全部下级。搜索不会改变已选范围。"
const selectKeyboardHelp = "方向键浏览和展开，Enter 选中这一项，空格勾选或取消。"
const singleHelp = "点标题只看这一项，再点一次取消。搜索不会改变已选范围。"
const multiHelp = "点标题或复选框勾选，勾选父级包含全部下级。搜索不会缩小勾选范围。"
type TitleAction = "locate" | "select"
const blankSession: Session = { query: "", currentId: "" }
const kinds: DirectoryKind[] = ["course", "knowledge"]
const kindTitle = (kind: DirectoryKind) => kind === "course" ? "课程目录" : "知识点目录"
const unitTitle = (kind: DirectoryKind) => kind === "course" ? "节课程" : "个知识点"
const scopeKey = (bookId: string, kind: DirectoryKind) => `${bookId}:${kind}`

export function useDirectorySelection(data: DirectoryData, checkedIds: string[], onCheckedChange: Dispatch<SetStateAction<string[]>>) {
  return useTree<DirectoryNode>({
    rootItemId: data.rootId,
    dataLoader: { getItem: id => data.nodes[id], getChildren: id => data.nodes[id].children },
    getItemName: item => item.getItemData().title,
    isItemFolder: item => item.getItemData().children.length > 0,
    propagateCheckedState: true,
    canCheckFolders: false,
    state: { checkedItems: [...new Set(checkedIds)].filter(id => data.leafIds.includes(id)) },
    setCheckedItems: onCheckedChange,
    features: [syncDataLoaderFeature, checkboxesFeature],
  })
}

export function TextbookDirectory({ textbooks, selections, onSelectionsChange, layout = "split", titleAction = "locate", multiSelect = "always", emptySelectionLabel, onTextbookSwitch }: {
  textbooks: TextbookDefinition[]
  selections: DirectorySelections
  onSelectionsChange: Dispatch<SetStateAction<DirectorySelections>>
  layout?: "split" | "embedded"
  titleAction?: TitleAction
  multiSelect?: "always" | "toggle"
  emptySelectionLabel?: string
  onTextbookSwitch?: () => void
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
  const embedded = layout === "embedded"
  const selectedNodes = embedded ? groups.flatMap(group => summarizeDirectory(group.data, group.ids).map(entry => group.data.nodes[entry.id])) : []
  const selectionCount = selectedNodes.length
  const selectionLabel = selectionCount === 1 ? `已选：${selectedNodes[0].title}` : selectionCount > 1 ? `已选 ${selectionCount} 项` : emptySelectionLabel
  if (!book) return <p className="py-6 text-ui-hint text-muted-foreground">暂无可用教材。</p>
  const scope = scopeKey(book.id, kind)
  const session = sessions[scope] ?? blankSession
  const volume = book.volume || book.title
  const details = [book.subject, book.edition].filter(Boolean).join(" · ")
  return <div className={embedded ? "grid min-w-0 grid-cols-1" : "grid min-w-0 gap-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(17rem,.75fr)]"}>
    <div className="min-w-0">
      {embedded ? <div className="mb-3 flex min-w-0 items-center gap-3" data-slot="textbook-header">
        <span aria-hidden="true" data-slot="textbook-cover" className="relative h-[60px] w-[46px] shrink-0 overflow-hidden rounded-sm border border-border [background:linear-gradient(135deg,color-mix(in_srgb,var(--brand-blue)_12%,var(--background)),color-mix(in_srgb,var(--brand-magenta)_7%,var(--background))_60%,color-mix(in_srgb,var(--brand-green)_12%,var(--background)))]">
          <span className="absolute inset-y-0 left-1 w-px bg-[color-mix(in_srgb,var(--brand-blue)_25%,var(--border))]" />
          <span className="absolute left-3 top-2 text-ui-hint text-foreground [writing-mode:vertical-rl]">{Array.from(book.subject ?? "").slice(0, 2).join("")}</span>
          <span className="absolute bottom-2 left-3 right-2 h-0.5 [background:var(--brand-ai-gradient)]" />
        </span>
        <div className="min-w-0 flex-1" role="group" aria-label={[volume, details].filter(Boolean).join(" · ")}>
          <p className="truncate text-block-title text-foreground" title={volume}>{volume}</p>
          {details && <p className="truncate text-ui-hint text-muted-foreground" title={details}>{details}</p>}
        </div>
        {onTextbookSwitch ? <Button variant="outline" size="sm" aria-label="切换教材" onClick={onTextbookSwitch}><ArrowRightLeft aria-hidden="true" />切换</Button> : textbooks.length > 1 && <Menu>
          <MenuTrigger render={<Button variant="outline" size="sm" />} aria-label="切换教材"><ArrowRightLeft aria-hidden="true" />切换</MenuTrigger>
          <MenuPopup align="end" className="max-w-[min(24rem,var(--available-width))]" aria-label="选择教材">
            <MenuRadioGroup value={book.id} onValueChange={value => { if (value) setBookId(value) }}>
              {textbooks.map(item => {
                const label = [item.volume || item.title, item.subject, item.edition].filter(Boolean).join(" · ")
                return <MenuRadioItem key={item.id} value={item.id} aria-label={label} className="grid-cols-[.75rem_minmax(0,1fr)] [&>span]:min-w-0"><span className="block min-w-0 truncate text-ui-body" title={label}>{label}</span></MenuRadioItem>
              })}
            </MenuRadioGroup>
          </MenuPopup>
        </Menu>}
      </div> : <div className="mb-5 max-w-sm"><Label htmlFor={`${controlId}-book`}>教材</Label><Select items={bookOptions} value={book.id} onValueChange={value => { if (value) setBookId(value) }}><SelectTrigger id={`${controlId}-book`}><SelectValue /></SelectTrigger><SelectPopup>{bookOptions.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup></Select></div>}
      <Tabs value={kind} onValueChange={value => setKind(value as DirectoryKind)} className={embedded ? "gap-3" : undefined}>
        {embedded ? <TabsList aria-label="目录类型" className="w-full min-w-0">{kinds.map(type => <TabsTab key={type} value={type} className="min-w-0 flex-1 basis-0"><span className="truncate" title={kindTitle(type)}>{kindTitle(type)}</span></TabsTab>)}</TabsList> : <TabsList aria-label="目录类型">{kinds.map(type => <TabsTab key={type} value={type}>{kindTitle(type)}</TabsTab>)}</TabsList>}
        {kinds.map(type => <TabsPanel key={type} value={type}>{kind === type && <DirectorySession key={scope} titleAction={titleAction} toggleMode={embedded && multiSelect === "toggle"} embedded={embedded} summary={embedded && (selectionCount > 0 || emptySelectionLabel !== undefined) && <div className="flex min-w-0 items-center gap-2 text-ui-hint">
          <p className="min-w-0 truncate text-muted-foreground" role="status" title={selectionCount <= 1 ? selectionLabel : undefined} aria-label={selectionCount === 1 ? selectionLabel : undefined}>{selectionLabel}</p>
          {selectionCount > 0 && <Button variant="ghost" size="sm" className="shrink-0" aria-label="清空所有教材的已选范围" onClick={() => onSelectionsChange(previous => {
            const next = { ...previous }
            for (const item of textbooks) for (const type of kinds) next[scopeKey(item.id, type)] = []
            return next
          })}>清空</Button>}

        </div>} data={book.directories[kind]} kind={kind} scope={scope} session={session} setSessions={setSessions} checkedIds={selections[scope] ?? []} onCheckedChange={update => onSelectionsChange(previous => {
          const ids = typeof update === "function" ? update(previous[scope] ?? []) : update
          return { ...previous, [scope]: [...new Set(ids)].filter(id => book.directories[kind].leafIds.includes(id)) }
        })} />}</TabsPanel>)}
      </Tabs>
    </div>
    {!embedded && <aside aria-label="已选范围" className="min-w-0 border-t pt-5 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-7">
      <h3 className="text-block-title">已选范围</h3>
      <p className="mt-1 text-ui-hint text-muted-foreground" role="status">{courseCount} 节课程 · {knowledgeCount} 个知识点</p>
      <p className="mt-3 text-ui-hint text-muted-foreground">切换教材或目录会保留各自选择。课程与知识点分别记录。</p>
      {groups.length ? <ScrollArea className="mt-4 h-[25rem]" fill><div className="space-y-6 pr-3">{groups.map(group => <section key={group.scope} aria-label={`${group.book.title} / ${kindTitle(group.kind)}已选项`}>
        <h4 className="text-item-title">{group.book.title}</h4><p className="mb-2 mt-1 text-ui-hint text-muted-foreground">{kindTitle(group.kind)} · {group.ids.length} {unitTitle(group.kind)}</p>
        <ul className="space-y-2">{group.ids.map(id => <li key={id} className="flex min-w-0 items-start gap-2"><div className="min-w-0 flex-1"><p className="break-words text-ui-hint">{group.data.nodes[id].title}</p><p className="break-words text-ui-hint text-muted-foreground">{group.data.paths[id].slice(0, -1).map(parent => group.data.nodes[parent].title).join(" / ") || kindTitle(group.kind)}</p></div><Button size="icon-xs" variant="ghost" aria-label={`移除${group.book.title}${kindTitle(group.kind)}的${group.data.nodes[id].title}`} onClick={() => onSelectionsChange(previous => ({ ...previous, [group.scope]: (previous[group.scope] ?? []).filter(value => value !== id) }))}><X /></Button></li>)}</ul>
      </section>)}</div></ScrollArea> : <div className="py-10 text-ui-hint text-muted-foreground">尚未选择内容。<br />勾选左侧目录，选择需要的课程或知识点。</div>}
    </aside>}
  </div>
}

function DirectorySession({ data, kind, scope, session, setSessions, checkedIds, onCheckedChange, embedded, summary, titleAction, toggleMode }: {
  data: DirectoryData; kind: DirectoryKind; scope: string; session: Session
  setSessions: Dispatch<SetStateAction<Record<string, Session>>>
  checkedIds: string[]; onCheckedChange: Dispatch<SetStateAction<string[]>>
  embedded: boolean; summary: React.ReactNode; titleAction: TitleAction; toggleMode: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const helpId = `${inputId}-help`
  const projection = useMemo(() => projectDirectory(data, session.query), [data, session.query])
  const checked = [...new Set(checkedIds)].filter(id => data.leafIds.includes(id))
  // Keep the upstream checkbox propagation on the complete tree. Searching never
  // changes the descendant set to which a parent's checkbox applies.
  const selectionTree = useDirectorySelection(data, checked, onCheckedChange)
  const patch = useCallback((values: Partial<Session>) => setSessions(previous => ({ ...previous, [scope]: { ...(previous[scope] ?? blankSession), ...values } })), [scope, setSessions])
  const saveExpanded = useCallback((expandedIds: string[]) => setSessions(previous => {
    const previousSession = previous[scope] ?? blankSession
    if (previousSession.expandedIds?.join("|") === expandedIds.join("|")) return previous
    return { ...previous, [scope]: { ...previousSession, expandedIds } }
  }), [scope, setSessions])
  const hiddenCount = checked.filter(id => !projection.visibleIds.has(id)).length
  const clearSearch = () => { patch({ query: "" }); inputRef.current?.focus() }
  const selecting = titleAction === "select"
  const selectedEntries = selecting || toggleMode ? summarizeDirectory(data, checked) : []
  const hasMultipleEntries = selectedEntries.length > 1
  const multiple = toggleMode && (session.multiSelect === true || hasMultipleEntries)
  // Remember externally supplied multiselect when it first appears, so reducing
  // it to one node does not unexpectedly remove the checkbox the user is using.
  useEffect(() => {
    if (toggleMode && hasMultipleEntries) patch({ multiSelect: true })
  }, [toggleMode, hasMultipleEntries, patch])
  const showCheckboxes = !toggleMode || multiple
  function changeMultiple(pressed: boolean) {
    patch({ multiSelect: pressed })
    if (!pressed) onCheckedChange(previous => summarizeDirectory(data, previous).length > 1 ? [] : previous)
  }
  const matchesSelection = (id: string, ids: string[]) => {
    const leaves = directoryLeaves(data, id)
    const selected = new Set(ids.filter(value => data.leafIds.includes(value)))
    return leaves.length > 0 && leaves.length === selected.size && leaves.every(leaf => selected.has(leaf))
  }
  const currentId = multiple ? "" : selecting
    ? matchesSelection(session.currentId, checked) ? session.currentId : selectedEntries.length === 1 ? selectedEntries[0].id : ""
    : session.currentId
  function activate(id: string) {
    if (multiple) { void selectionTree.getItemInstance(id).toggleCheckedState(); return }
    patch({ currentId: id })
    if (selecting) onCheckedChange(previous => matchesSelection(id, previous) ? [] : directoryLeaves(data, id))
  }
  const current = data.nodes[currentId]
  const instructions = toggleMode ? multiple ? multiHelp : selecting ? singleHelp : "箭头展开，标题定位。打开多选后可以勾选多个章节或知识点。" : selecting ? selectHelp : selectionHelp
  const keys = toggleMode ? multiple ? "方向键浏览和展开，Enter 或空格勾选或取消。" : selecting ? "方向键浏览和展开，Enter 或空格选中这一项，再次激活取消。" : "方向键浏览和展开，Enter 或空格定位。" : selecting ? selectKeyboardHelp : keyboardHelp
  const search = <InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput id={inputId} ref={inputRef} value={session.query} onChange={event => patch({ query: event.target.value })} placeholder={kind === "course" ? "章节名称或编号" : "知识点名称"} />{session.query && <InputGroupAddon align="inline-end"><Button variant="ghost" size="icon-xs" aria-label="清除目录搜索" onClick={clearSearch}><X /></Button></InputGroupAddon>}</InputGroup>
  return <div className={embedded ? "grid min-w-0 gap-3" : "mt-4 min-w-0"}>
    {embedded ? <div className="min-w-0"><Label htmlFor={inputId}>搜索当前{kindTitle(kind)}</Label><div className="flex min-w-0 items-center gap-2">{search}{toggleMode && <Tooltip>
      <TooltipTrigger render={<Toggle aria-label="多选" pressed={multiple} onPressedChange={changeMultiple} />}>多选</TooltipTrigger>
      <TooltipPopup>打开后可以勾选多个章节或知识点</TooltipPopup>
    </Tooltip>}</div></div> : <Label htmlFor={inputId}>搜索当前{kindTitle(kind)}</Label>}
    {!embedded && search}
    {embedded ? <>{summary}{projection.normalized && <p className="break-words text-ui-hint text-muted-foreground" role="status">{projection.matchingIds.size} 处匹配{hiddenCount > 0 && ` · ${hiddenCount} 项在搜索结果外`}</p>}</> : <div className="my-3 flex flex-wrap items-center justify-between gap-2 text-ui-body"><p className="text-muted-foreground" role="status">已选 {checked.length} {unitTitle(kind)}{projection.normalized && ` · ${projection.matchingIds.size} 处匹配`}{hiddenCount > 0 && ` · ${hiddenCount} 项在搜索结果外`}</p><Button variant="ghost" size="sm" disabled={!checked.length} onClick={() => onCheckedChange([])}>清空当前目录</Button></div>}
    {embedded ? <div className="sr-only"><p id={helpId}>{instructions}</p><p id={`${helpId}-keyboard`}>{keys}</p></div> : selecting ? <><p id={helpId} className="mb-3 text-ui-hint text-muted-foreground">{instructions}</p><p id={`${helpId}-keyboard`} className="sr-only">{keys}</p></> : <p id={helpId} className="mb-3 text-ui-hint text-muted-foreground">{instructions}</p>}
    {projection.nodes[data.rootId].children.length ? <DirectoryTreeView key={`${scope}:${projection.normalized}`} data={data} projection={projection} selectionTree={selectionTree} titleAction={titleAction} showCheckboxes={showCheckboxes} currentId={currentId} onCurrentChange={activate} initialExpanded={session.expandedIds ?? data.nodes[data.rootId].children} onExpandedChange={saveExpanded} label={kindTitle(kind)} helpId={embedded || selecting ? `${helpId} ${helpId}-keyboard` : helpId} /> : <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg bg-muted/40 px-5 text-center"><p className="text-ui-body">{projection.normalized ? "没有匹配的目录项。" : "此教材尚未设置目录。"}</p>{projection.normalized && <Button variant="outline" size="sm" onClick={clearSearch}>清除搜索</Button>}</div>}
    {!selecting && !multiple && <p className={embedded && !current ? "sr-only" : "mt-3 min-h-10 break-words text-ui-hint text-muted-foreground"} role="status">{current ? `当前位置：${data.paths[current.id].map(id => data.nodes[id].title).join(" / ")}` : embedded ? "" : keyboardHelp}</p>}
  </div>
}

function DirectoryTreeView({ data, projection, selectionTree, currentId, onCurrentChange, initialExpanded, onExpandedChange, label, helpId, titleAction, showCheckboxes }: {
  data: DirectoryData; projection: ReturnType<typeof projectDirectory>; selectionTree: TreeInstance<DirectoryNode>
  currentId: string; onCurrentChange: (id: string) => void; initialExpanded: string[]; onExpandedChange: (ids: string[]) => void; label: string; helpId: string; titleAction: TitleAction; showCheckboxes: boolean
}) {
  // This instance navigates only projected children, so hidden matches cannot
  // receive keyboard focus. Remounting on the query preserves the input focus.
  const tree = useTree<DirectoryNode>({
    rootItemId: data.rootId,
    dataLoader: { getItem: id => projection.nodes[id], getChildren: id => projection.nodes[id].children },
    getItemName: item => `${item.getItemData().code ?? ""} ${item.getItemData().title}`.trim(),
    isItemFolder: item => item.getItemData().children.length > 0,
    initialState: { expandedItems: projection.normalized ? data.folderIds.filter(id => projection.visibleIds.has(id)) : initialExpanded },
    onPrimaryAction: item => activate(item.getId()),
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  })
  const expanded = tree.getState().expandedItems
  useEffect(() => { if (!projection.normalized) onExpandedChange(expanded) }, [expanded, onExpandedChange, projection.normalized])
  function activate(id: string) {
    onCurrentChange(id)
    const item = tree.getItemInstance(id)
    if (titleAction === "select" && item.isFolder() && !item.isExpanded()) void item.expand()
  }
  function toggle(id: string) { void selectionTree.getItemInstance(id).toggleCheckedState() }
  return <ScrollArea className="h-[27rem]" fill><Tree tree={tree} aria-label={label} aria-describedby={helpId} className="gap-0.5 p-1 pr-3">
    {tree.getItems().map(item => {
      const id = item.getId(), node = item.getItemData(), checkedState = selectionTree.getItemInstance(id).getCheckedState()
      const focus = () => { item.setFocused(); tree.updateDomFocus() }
      return <TreeItem key={id} item={item} current={currentId === id} aria-current={titleAction === "select" && currentId === id ? "location" : undefined} aria-checked={showCheckboxes ? checkedState === "indeterminate" ? "mixed" : checkedState === "checked" : undefined} onClick={() => { focus(); activate(id) }} onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === " ") { event.preventDefault(); event.stopPropagation(); if (showCheckboxes) toggle(id); else activate(id) }
        if (event.key === "Enter") { event.preventDefault(); event.stopPropagation(); activate(id) }
      }}><TreeItemLabel>
        {item.isFolder() ? <Button variant="ghost" size="icon-xs" tabIndex={-1} aria-label={`${item.isExpanded() ? "收起" : "展开"}${node.title}`} aria-expanded={item.isExpanded()} onClick={event => { event.stopPropagation(); focus(); if (item.isExpanded()) item.collapse(); else item.expand() }} className="-ml-1 -mt-0.5 shrink-0"><ChevronRight className={cn("transition-transform", item.isExpanded() && "rotate-90")} /></Button> : <span className="w-5 shrink-0" aria-hidden="true" />}
        {showCheckboxes && <Checkbox tabIndex={-1} className="mt-1" aria-label={`选择${node.title}`} checked={checkedState === "checked"} indeterminate={checkedState === "indeterminate"} onClick={event => event.stopPropagation()} onCheckedChange={() => { focus(); toggle(id) }} />}
        <span className="min-w-0 flex-1 whitespace-normal break-words leading-6">{node.code && <span className="mr-2 text-muted-foreground prism-numeric">{node.code}</span>}<span className={projection.matchingIds.has(id) ? "rounded-sm bg-accent font-semibold text-accent-foreground" : undefined}>{node.title}</span></span>
      </TreeItemLabel></TreeItem>
    })}
  </Tree></ScrollArea>
}
