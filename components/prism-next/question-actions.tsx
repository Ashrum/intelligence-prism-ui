"use client"

import type { ReactNode } from "react"
import { MenuPopup } from "@/components/prism-next/scoped-overlays"
import { Maximize, Layers, Star, MoreHorizontal, Flag, ArrowUp, ArrowDown, Copy, Pencil, X, FolderInput } from "lucide-react"
import { Button } from "@/components/coss/button"
import { ToolbarButton } from "@/components/coss/toolbar"
import { Menu, MenuTrigger, MenuItem, MenuSeparator } from "@/components/coss/menu"

type QuestionActionsProps = {
  title: string; favorite?: boolean; first?: boolean; last?: boolean; removeLabel?: string
  onFavorite?: () => void; onRelated?: () => void; onReport?: () => void; onRead?: () => void
  onMove?: (offset: number) => void; onMoveGroup?: () => void; onRemove?: () => void; onCopy?: () => void; onEdit?: () => void
  collapse?: boolean; leadingItems?: ReactNode; triggerLabelHidden?: boolean
}

export function QuestionActions({ title, favorite, onFavorite, onRelated, onReport, onRead, onMove, onMoveGroup,
  first, last, onRemove, removeLabel, onCopy, onEdit, collapse = false, leadingItems, triggerLabelHidden = false }: QuestionActionsProps) {
  const hasSecondary = !!(onRead || onMove || onMoveGroup || onReport || onEdit || onCopy || onRemove)
  const hasLeading = !!(leadingItems || onRelated || onFavorite)
  if (!hasSecondary && !hasLeading) return null
  const hasWideMenu = hasSecondary || leadingItems || collapse
  const read = onRead && <MenuItem onClick={onRead}><Maximize/>隐藏界面</MenuItem>
  const copy = onCopy && <MenuItem onClick={onCopy}><Copy/>复制为新题</MenuItem>
  const report = onReport && <MenuItem onClick={onReport}><Flag/>纠错</MenuItem>

  return <>
    {!collapse && onRelated && <ToolbarButton className="hidden sm:inline-flex" render={<Button variant="ghost" size="sm"/>} onClick={onRelated}><Layers/>相似题</ToolbarButton>}
    {!collapse && onFavorite && <ToolbarButton className="hidden sm:inline-flex" render={<Button variant="ghost" size="sm"/>} onClick={onFavorite}
      aria-pressed={favorite} aria-label={`${favorite ? "取消收藏" : "收藏"}：${title}`}><Star className={favorite ? "fill-current" : ""}/>{favorite ? "已收藏" : "收藏"}</ToolbarButton>}
    <Menu>
      <MenuTrigger className={hasWideMenu ? undefined : "sm:hidden"} render={<ToolbarButton render={<Button variant="ghost" size="sm"/>}/>} aria-label={`${title}更多操作`}>
        <MoreHorizontal/>{triggerLabelHidden ? <span className="sr-only">更多</span> : "更多"}
      </MenuTrigger>
      <MenuPopup align={collapse || leadingItems || triggerLabelHidden ? "end" : "start"}>
        {leadingItems}
        {!collapse && read}
        {onRelated && <MenuItem className={collapse ? undefined : "sm:hidden"} onClick={onRelated}><Layers/>相似题</MenuItem>}
        {onFavorite && <MenuItem className={collapse ? undefined : "sm:hidden"} onClick={onFavorite}><Star/>{favorite ? "取消收藏" : collapse ? "收藏" : "收藏题目"}</MenuItem>}
        {collapse && <>{hasLeading && hasSecondary && <MenuSeparator/>}{copy}{report}{read}</>}
        {onMove && <><MenuItem disabled={first} onClick={() => onMove(-1)}><ArrowUp/>上移</MenuItem>
          <MenuItem disabled={last} onClick={() => onMove(1)}><ArrowDown/>下移</MenuItem></>}
        {onMoveGroup && <MenuItem onClick={onMoveGroup}><FolderInput/>移至其他题组…</MenuItem>}
        {!collapse && report}
        {onEdit && <MenuItem onClick={onEdit}><Pencil/>编辑题目资料</MenuItem>}
        {!collapse && copy}
        {onRemove && <>{(!collapse || onMove || onEdit || onMoveGroup || onRead || onReport || onCopy) && <MenuSeparator/>}
          <MenuItem onClick={onRemove}><X/>{removeLabel}</MenuItem></>}
      </MenuPopup>
    </Menu>
  </>
}
