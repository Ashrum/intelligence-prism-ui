"use client"

import { useTree } from "@headless-tree/react"
import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core"
import { useContext, useEffect, useId, useLayoutEffect, useRef, createContext, type CSSProperties } from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Tree, TreeItem } from "@/components/prism-next/tree"
import type { DirectoryViewProps } from "@/components/prism-next/directory-presentation"
import type { DirectoryNode } from "@/lib/prism-next/textbook-directory"

export const DirectoryFacts = createContext<{ counts: Readonly<Record<string, number>>; showCounts: boolean }>({ counts: {}, showCounts: true })
export const DirectoryMarks = createContext<{ selected: Set<string>; ancestors: Set<string>; allOption?: { label: string; text: string; selected: boolean; onSelect: () => void } } | null>(null)
export const OutlineView = (props: DirectoryViewProps) => <DirectoryOutlineTree {...props} />

// Selection stays with the controlled host; the tree only owns navigation.
const rowClass = "relative cursor-pointer rounded-md hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
const rowContentClass = "relative flex min-h-9 min-w-0 items-start gap-1 py-1 pl-1 pr-2"
export function DirectoryOutlineTree({ data, projection, selectionTree, currentId, onCurrentChange, initialExpanded, onExpandedChange, label, helpId, showCheckboxes }: DirectoryViewProps) {
  const { counts, showCounts } = useContext(DirectoryFacts)
  const marks = useContext(DirectoryMarks)
  const allOption = marks?.allOption
  const allRef = useRef<HTMLButtonElement>(null)
  const rows = useRef(new Map<string, HTMLDivElement>())
  const navigationHelpId = useId()
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
  const items = tree.getItems()
  useEffect(() => { if (!projection.normalized) onExpandedChange(expanded) }, [expanded, projection.normalized, onExpandedChange])

  function focus(id: string) {
    tree.getItemInstance(id).setFocused()
    tree.updateDomFocus()
  }
  function expand(id: string) {
    void tree.getItemInstance(id).expand()
  }
  function activate(id: string) {
    onCurrentChange(id)
    if (projection.nodes[id].children.length && !tree.getItemInstance(id).isExpanded()) expand(id)
  }
  const selectionKey = JSON.stringify([...(marks?.selected ?? [])])
  const reveal = useRef<string | null>(null)
  useEffect(() => {
    if (projection.normalized) return
    const ids: string[] = JSON.parse(selectionKey)
    for (const id of ids) for (const ancestor of data.paths[id]?.slice(0, -1) ?? []) void tree.getItemInstance(ancestor).expand()
    reveal.current = ids[0] ?? null
    const row = reveal.current ? rows.current.get(reveal.current) : null
    if (row) { row.scrollIntoView({ block: "nearest", behavior: "instant" }); reveal.current = null }
  }, [selectionKey, data, projection.normalized, tree])
  useLayoutEffect(() => {
    const row = reveal.current ? rows.current.get(reveal.current) : null
    if (row) { row.scrollIntoView({ block: "nearest", behavior: "instant" }); reveal.current = null }
  })
  return <div data-directory-outline className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
    <p id={navigationHelpId} className="sr-only">上下方向键浏览，左右方向键展开或收起。标题或 Enter、空格选择。全部行按向下或向右方向键进入目录树。</p>
    {allOption && <div className="shrink-0 border-b p-1 pb-2">
      <button ref={allRef} type="button" data-directory-all aria-label={allOption.label} aria-pressed={allOption.selected}
        className={`w-full text-left ${rowClass} ${allOption.selected ? "bg-accent hover:bg-accent" : ""}`}
        onClick={allOption.onSelect} onKeyDown={event => {
          if ((event.key === "ArrowDown" || event.key === "ArrowRight") && items[0]) { event.preventDefault(); event.stopPropagation(); focus(items[0].getId()) }
        }}>
        <span className={rowContentClass}><span aria-hidden="true" className="h-7 w-5 shrink-0" />
          <span className="min-w-0 flex-1 py-1 text-item-title text-foreground">{allOption.text}</span>
          {showCounts && counts[data.rootId] !== undefined && <span data-directory-count className="w-7 shrink-0 pt-1 text-right text-ui-hint text-muted-foreground tabular-nums">{counts[data.rootId]}</span>}
        </span>
      </button>
    </div>}
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-directory-scroll>
      {!items.length && <p className="py-6 text-ui-hint">{projection.normalized ? "没有匹配的目录项。" : "此教材尚未设置目录。"}</p>}
      <Tree tree={tree} aria-label={label} aria-describedby={`${helpId} ${navigationHelpId}`} aria-multiselectable={showCheckboxes || (marks?.selected.size ?? 0) > 1} className="gap-0.5 p-1">
        {items.map(item => {
          const id = item.getId(), node = item.getItemData(), depth = data.paths[id].length
          const state = selectionTree.getItemInstance(id).getCheckedState()
          const indentation = Math.min(depth - 1, 2) * 12
          const folder = node.children.length > 0
          const selected = !showCheckboxes && (currentId ? currentId === id : marks?.selected.has(id))
          const containsSelected = !showCheckboxes && marks?.ancestors.has(id)
          const titleRole = depth > 3 ? "text-ui-body" : selected || depth === 1 ? "text-item-title" : "text-ui-action"
          const parentNode = projection.nodes[data.paths[id].at(-2) ?? data.rootId]
          const lastChild = parentNode.children.at(-1) === id
          return <TreeItem key={id} item={item} current={selected} aria-selected={selected} aria-current={!showCheckboxes && currentId === id ? "location" : undefined}
            aria-level={depth}
            aria-label={`${node.code ? `${node.code} ` : ""}${node.title}${showCounts && counts[id] !== undefined ? `，${counts[id]} 题` : ""}${containsSelected ? "，包含已选" : ""}`}
            aria-checked={showCheckboxes ? state === "indeterminate" ? "mixed" : state === "checked" : undefined}
            style={{ "--tree-padding": `${indentation}px` } as CSSProperties} className={`${rowClass} ${selected ? "bg-accent hover:bg-accent" : ""}`}
            onClick={() => { focus(id); activate(id) }} onKeyDown={event => {
              if (event.target !== event.currentTarget) return
              if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); if (event.key === " " && showCheckboxes) void selectionTree.getItemInstance(id).toggleCheckedState(); else activate(id) }
              if (event.key === "ArrowRight" && folder && !item.isExpanded()) { event.preventDefault(); event.stopPropagation(); expand(id) }
              if (allOption && (event.key === "Home" || (event.key === "ArrowUp" && id === items[0]?.getId()))) {
                event.preventDefault(); event.stopPropagation(); allRef.current?.focus()
              }
            }}>
            <div ref={element => { if (element) rows.current.set(id, element); else rows.current.delete(id) }} data-directory-id={id} data-directory-level={depth} className={rowContentClass}>
              {depth > 1 && <span aria-hidden="true" data-directory-guide data-last-child={lastChild} className="pointer-events-none absolute -top-0.5 border-l border-border" style={{ left: -6, bottom: lastChild ? "50%" : -2 }} />}
              {showCheckboxes && <Checkbox className="mt-1.5 shrink-0" tabIndex={-1} aria-label={`选择${node.title}`} checked={state === "checked"} indeterminate={state === "indeterminate"} onClick={event => event.stopPropagation()} onCheckedChange={() => { focus(id); void selectionTree.getItemInstance(id).toggleCheckedState() }} />}
              <span className="flex h-7 w-5 shrink-0 items-center justify-center" data-directory-arrow>
                {folder && <Button variant="ghost" size="icon-sm" tabIndex={-1} aria-label={`${item.isExpanded() ? "收起" : "展开"}${node.title}`} aria-expanded={item.isExpanded()} className="h-7 w-5 sm:h-7 sm:w-5" onClick={event => { event.stopPropagation(); focus(id); if (item.isExpanded()) item.collapse(); else expand(id) }}><ChevronRight className={`${item.isExpanded() ? "rotate-90" : ""} transition-transform motion-reduce:transition-none`} /></Button>}
              </span>
              {node.code && <span data-directory-code title={node.code} className="w-4 shrink-0 pt-1 text-right text-ui-hint text-muted-foreground tabular-nums" aria-hidden="true">{node.code.match(/^第\s*(\d+)\s*章$/)?.[1] ?? node.code}</span>}
              <span data-directory-title className={`min-w-0 flex-1 py-1 ${titleRole} ${depth > 3 ? "text-muted-foreground" : "text-foreground"}`} title={`${node.code ? `${node.code} ` : ""}${node.title}`}>
                <span className={depth === 1 ? "block truncate" : "line-clamp-2 break-words"}>{node.title}</span>
              </span>
              {containsSelected && <span aria-hidden="true" data-directory-contains-selected className="mt-3 size-1.5 shrink-0 rounded-full bg-primary" />}
              {showCounts && counts[id] !== undefined && <span data-directory-count className="w-7 shrink-0 pt-1 text-right text-ui-hint text-muted-foreground tabular-nums" aria-hidden="true">{counts[id]}</span>}
            </div>
          </TreeItem>
        })}
      </Tree>
    </div>
  </div>
}
