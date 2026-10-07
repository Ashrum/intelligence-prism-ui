"use client"

import { useTree } from "@headless-tree/react"
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core"
import { useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, createContext, type CSSProperties } from "react"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Menu, MenuTrigger, MenuPopup, MenuItem } from "@/components/coss/menu"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbLink } from "@/components/coss/breadcrumb"
import { Tree, TreeItem } from "@/components/prism-next/tree"
import type { DirectoryViewProps } from "@/components/prism-next/directory-presentation"
import type { DirectoryData, DirectoryNode } from "@/lib/prism-next/textbook-directory"

export const ExplorationFacts = createContext<{ counts: Record<string, number>; showCounts: boolean; initialPath?: (data: DirectoryData) => string[] }>({ counts: {}, showCounts: true })
export const OutlineView = (props: DirectoryViewProps) => <ExplorationTree {...props} variant="A" />
export const DrillView = (props: DirectoryViewProps) => <ExplorationTree {...props} variant="B" />
export const AncestorView = (props: DirectoryViewProps) => <ExplorationTree {...props} variant="C" />

// Navigation differs; all selection, search and summary callbacks belong to the
// existing DirectorySession and its complete, unfiltered checkbox model.
export function ExplorationTree({ variant, data, projection, selectionTree, currentId, onCurrentChange, initialExpanded, onExpandedChange, label, helpId, showCheckboxes }: DirectoryViewProps & { variant: "A" | "B" | "C" }) {
  const { counts, showCounts, initialPath } = useContext(ExplorationFacts)
  const navigationHelpId = useId()
  const initialParent = projection.normalized ? data.rootId : initialPath?.(data).at(-1) ?? data.rootId
  const [parentId, setParentId] = useState(initialParent)
  const [topId, setTopId] = useState("")
  const viewport = useRef<HTMLDivElement>(null)
  const rows = useRef(new Map<string, HTMLDivElement>())
  const pendingFocus = useRef<string | null>(null)
  const pathFocus = useRef<string | null>(null)
  const drill = variant === "B"
  const parent = projection.nodes[parentId] ? parentId : data.rootId
  const levelIds = projection.nodes[parent].children
  const tree = useTree<DirectoryNode>({
    rootItemId: drill ? parent : data.rootId,
    dataLoader: { getItem: id => projection.nodes[id], getChildren: id => drill && id !== parent ? [] : projection.nodes[id].children },
    getItemName: item => `${item.getItemData().code ?? ""} ${item.getItemData().title}`.trim(),
    isItemFolder: item => !drill && item.getItemData().children.length > 0,
    initialState: { expandedItems: projection.normalized ? data.folderIds.filter(id => projection.visibleIds.has(id)) : initialExpanded },
    onPrimaryAction: item => activate(item.getId()),
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  })
  const expanded = tree.getState().expandedItems
  const items = tree.getItems()
  useEffect(() => { if (!drill && !projection.normalized) onExpandedChange(expanded) }, [expanded, drill, projection.normalized, onExpandedChange])

  function focus(id: string) {
    tree.getItemInstance(id).setFocused()
    tree.updateDomFocus()
  }
  function expand(id: string) {
    void tree.getItemInstance(id).expand()
  }
  function activate(id: string) {
    onCurrentChange(id)
    if (!drill && projection.nodes[id].children.length && !tree.getItemInstance(id).isExpanded()) expand(id)
  }
  function enter(id: string) {
    const children = projection.nodes[id].children
    if (!children.length) return
    pendingFocus.current = children[0]
    setParentId(id)
  }
  function back() {
    if (parent === data.rootId) return
    pendingFocus.current = parent
    setParentId(data.paths[parent].at(-2) ?? data.rootId)
  }
  // Headless Tree's root changes with each drill level; rebuild and restore a
  // visible row instead of leaving focus on a removed enter/return button.
  useLayoutEffect(() => {
    if (!drill) return
    tree.rebuildTree()
  }, [parent, drill, tree])
  useLayoutEffect(() => {
    if (pendingFocus.current && rows.current.has(pendingFocus.current)) {
      focus(pendingFocus.current)
      pendingFocus.current = null
    }
  })

  const readTopRow = useCallback(() => {
    if (variant !== "C" || !viewport.current) return
    const edge = viewport.current.getBoundingClientRect().top
    const first = Array.from(rows.current.entries())
      .filter(([, row]) => row.getBoundingClientRect().bottom > edge + 1)
      .sort((a, b) => a[1].getBoundingClientRect().top - b[1].getBoundingClientRect().top)[0]
    setTopId(first?.[0] ?? "")
  }, [variant])
  useLayoutEffect(() => { readTopRow() }, [readTopRow, expanded, items.length])
  useEffect(() => {
    if (variant !== "C" || !viewport.current || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(readTopRow)
    observer.observe(viewport.current)
    for (const row of rows.current.values()) observer.observe(row)
    return () => observer.disconnect()
  }, [variant, readTopRow, items.length])
  const ancestors = drill ? data.paths[parent] ?? [] : data.paths[topId]?.slice(0, -1) ?? []
  function navigateAncestor(id: string) {
    if (drill) {
      pendingFocus.current = projection.nodes[id].children[0] ?? null
      pathFocus.current = pendingFocus.current
      setParentId(id)
    } else {
      const target = id === data.rootId ? items[0]?.getId() : id
      if (target) {
        pathFocus.current = target
        const row = rows.current.get(target)
        if (row && viewport.current) viewport.current.scrollTo({ top: viewport.current.scrollTop + row.getBoundingClientRect().top - viewport.current.getBoundingClientRect().top, behavior: "instant" })
        focus(target)
        readTopRow()
      }
    }
  }
  const middleAncestors = ancestors.slice(0, -1)
  const lastAncestor = ancestors.at(-1)
  const pathLink = (id: string) => <BreadcrumbLink render={<button type="button" />} className="shrink-0 cursor-pointer whitespace-nowrap py-1 text-ui-hint outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    aria-label={`${drill ? "进入" : "定位"}${data.nodes[id].title}`} aria-current={drill && id === parent ? "location" : undefined} title={data.nodes[id].title} onClick={() => navigateAncestor(id)}>{data.nodes[id].title}</BreadcrumbLink>
  const path = <Breadcrumb aria-label={drill ? "当前目录路径" : "可见节点祖先路径"} className="min-w-0 shrink-0 border-b">
    <BreadcrumbList className="h-9 flex-nowrap gap-1 overflow-hidden text-muted-foreground sm:gap-1">
      <BreadcrumbItem className="shrink-0">{pathLink(data.rootId)}</BreadcrumbItem>
      {middleAncestors.length > 0 && <BreadcrumbItem className="shrink-0 gap-1">
        <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
        <Menu onOpenChange={open => { if (open) pathFocus.current = null }}><MenuTrigger render={<Button variant="ghost" size="icon-sm" className="size-7 sm:size-7 text-muted-foreground" />} aria-label="展开中间目录路径">…</MenuTrigger>
          <MenuPopup align="start" finalFocus={() => pathFocus.current ? rows.current.get(pathFocus.current)?.closest<HTMLElement>('[role="treeitem"]') ?? false : true}>{middleAncestors.map(id => <MenuItem key={id} aria-label={`${drill ? "进入" : "定位"}${data.nodes[id].title}`} onClick={() => navigateAncestor(id)}>{data.nodes[id].title}</MenuItem>)}</MenuPopup>
        </Menu>
      </BreadcrumbItem>}
      {lastAncestor && <BreadcrumbItem className="min-w-0 flex-1 gap-1">
        <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
        <span className="min-w-0 overflow-x-auto whitespace-nowrap" data-directory-path-end>{pathLink(lastAncestor)}</span>
      </BreadcrumbItem>}
    </BreadcrumbList>
  </Breadcrumb>
  return <div data-exploration-view={variant} className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
    <p id={navigationHelpId} className="sr-only">{drill ? "上下方向键浏览同级，右方向键进入下级，左方向键返回上一级。标题或 Enter、空格选择；右侧箭头仅进入，不改变选择。" : "上下方向键浏览，左右方向键展开或收起。标题或 Enter、空格选择。"}</p>
    {(drill || variant === "C") && path}
    {drill && parent !== data.rootId && <Button variant="ghost" size="sm" className="self-start" onClick={back}><ArrowLeft />返回上一级</Button>}
    <div ref={viewport} onScroll={readTopRow} className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-directory-scroll>
      <Tree tree={tree} aria-label={drill ? `${label} · ${data.nodes[parent].title}` : label} aria-describedby={`${helpId} ${navigationHelpId}`} aria-multiselectable={showCheckboxes} className="gap-0.5 p-1">
        {items.map(item => {
          const id = item.getId(), node = item.getItemData(), depth = data.paths[id].length
          const state = selectionTree.getItemInstance(id).getCheckedState()
          const indentation = drill ? 0 : Math.min(depth - 1, 2) * 12
          const folder = node.children.length > 0
          const selected = !showCheckboxes && currentId === id
          const titleRole = selected || depth === 1 ? "text-item-title" : depth <= 3 ? "text-ui-action" : "text-ui-body"
          const parentNode = projection.nodes[data.paths[id].at(-2) ?? data.rootId]
          const lastChild = parentNode.children.at(-1) === id
          return <TreeItem key={id} item={item} current={selected} aria-selected={selected} aria-current={!showCheckboxes && currentId === id ? "location" : undefined}
            aria-level={depth} aria-posinset={drill ? levelIds.indexOf(id) + 1 : undefined} aria-setsize={drill ? levelIds.length : undefined}
            aria-label={`${node.code ? `${node.code} ` : ""}${node.title}${showCounts && counts[id] !== undefined ? `，${counts[id]} 题` : ""}`}
            aria-checked={showCheckboxes ? state === "indeterminate" ? "mixed" : state === "checked" : undefined}
            style={{ "--tree-padding": `${indentation}px` } as CSSProperties} className={`relative cursor-pointer rounded-md hover:bg-muted ${selected ? "bg-accent hover:bg-accent" : ""}`}
            onClick={() => { focus(id); activate(id) }} onKeyDown={event => {
              if (event.target !== event.currentTarget) return
              if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); activate(id) }
              if (!drill && event.key === "ArrowRight" && folder && !item.isExpanded()) { event.preventDefault(); event.stopPropagation(); expand(id) }
              if (drill && ["ArrowRight", "ArrowLeft"].includes(event.key)) {
                event.preventDefault(); event.stopPropagation()
                if (event.key === "ArrowRight") enter(id); else back()
              }
            }}>
            <div ref={element => { if (element) rows.current.set(id, element); else rows.current.delete(id) }} data-directory-id={id} data-directory-level={depth} className="relative flex min-h-9 min-w-0 items-start gap-1 py-1 pl-1 pr-2">
              {!drill && depth > 1 && <span aria-hidden="true" data-directory-guide data-last-child={lastChild} className="pointer-events-none absolute -top-0.5 border-l border-border" style={{ left: -6, bottom: lastChild ? "50%" : -2 }} />}
              {showCheckboxes && <Checkbox className="mt-1.5 shrink-0" tabIndex={-1} aria-label={`选择${node.title}`} checked={state === "checked"} indeterminate={state === "indeterminate"} onClick={event => event.stopPropagation()} onCheckedChange={() => { focus(id); void selectionTree.getItemInstance(id).toggleCheckedState() }} />}
              <span className="flex h-7 w-5 shrink-0 items-center justify-center" data-directory-arrow>
                {!drill && folder && <Button variant="ghost" size="icon-sm" tabIndex={-1} aria-label={`${item.isExpanded() ? "收起" : "展开"}${node.title}`} aria-expanded={item.isExpanded()} className="h-7 w-5 sm:h-7 sm:w-5" onClick={event => { event.stopPropagation(); focus(id); if (item.isExpanded()) item.collapse(); else expand(id) }}><ChevronRight className={`${item.isExpanded() ? "rotate-90" : ""} transition-transform motion-reduce:transition-none`} /></Button>}
              </span>
              {node.code && <span data-directory-code title={node.code} className="w-4 shrink-0 pt-1 text-right text-ui-hint text-muted-foreground tabular-nums" aria-hidden="true">{node.code.match(/^第\s*(\d+)\s*章$/)?.[1] ?? node.code}</span>}
              {!drill && depth > 3 && <span title={`第 ${depth} 级`} aria-hidden="true" className="w-4 shrink-0 pt-1 text-ui-hint text-muted-foreground tabular-nums">{depth}·</span>}
              <span data-directory-title className={`min-w-0 flex-1 py-1 ${titleRole} ${!selected && depth > 3 ? "text-muted-foreground" : "text-foreground"}`} title={`${node.code ? `${node.code} ` : ""}${node.title}`}>
                <span className="line-clamp-2 break-words">{node.title}</span>
              </span>
              {showCounts && counts[id] !== undefined && <span data-directory-count className="w-7 shrink-0 pt-1 text-right text-ui-hint text-muted-foreground tabular-nums" aria-hidden="true">{counts[id]}</span>}
              {drill && (folder ? <Button variant="ghost" size="icon-sm" className="size-7 shrink-0 sm:size-7" aria-label={`进入下级：${node.title}`} onClick={event => { event.stopPropagation(); enter(id) }}><ChevronRight /></Button> : <span className="w-7 shrink-0" aria-hidden="true" />)}
            </div>
          </TreeItem>
        })}
      </Tree>
    </div>
  </div>
}
