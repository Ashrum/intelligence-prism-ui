"use client"
import { BookOpen, Layers, Star, MoreHorizontal, Flag, ArrowUp, ArrowDown, Copy, Pencil, X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { ToolbarButton } from "@/components/coss/toolbar"
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuSeparator } from "@/components/coss/menu"
import type { QuestionDetailTab } from "./question-details"

export function QuestionActions({title,favorite,onFavorite,onRelated,onReport,onRead,onDetail,onMove,first,last,onRemove,removeLabel,onCopy,onEdit}:{
 title:string;favorite:boolean;onFavorite:()=>void;onRelated:()=>void;onReport:()=>void;onRead:()=>void;onDetail:(tab:QuestionDetailTab)=>void
 onMove?:(offset:number)=>void;first?:boolean;last?:boolean;onRemove?:()=>void;removeLabel?:string;onCopy?:()=>void;onEdit?:()=>void
}) {
 return <><ToolbarButton className="hidden sm:inline-flex" render={<Button variant="ghost" size="sm"/>} onClick={onRelated}><Layers/>相似题</ToolbarButton><ToolbarButton className="hidden sm:inline-flex" render={<Button variant="ghost" size="sm"/>} onClick={onFavorite} aria-pressed={favorite} aria-label={`${favorite?"取消收藏":"收藏"}：${title}`}><Star className={favorite?"fill-current":""}/>{favorite?"已收藏":"收藏"}</ToolbarButton><Menu><MenuTrigger render={<ToolbarButton render={<Button variant="ghost" size="sm"/>}/>} aria-label={`${title}更多操作`}><MoreHorizontal/>更多</MenuTrigger><MenuPopup align="start"><MenuItem onClick={onRead}><BookOpen/>展开研读</MenuItem><MenuItem onClick={()=>onDetail("answer")}>答案与解析</MenuItem><MenuItem onClick={()=>onDetail("teaching")}>教学定位</MenuItem><MenuItem onClick={()=>onDetail("archive")}>题目档案</MenuItem><MenuSeparator/><MenuItem className="sm:hidden" onClick={onRelated}><Layers/>相似题</MenuItem><MenuItem onClick={onFavorite}><Star/>{favorite?"取消收藏":"收藏题目"}</MenuItem>{onMove&&<><MenuItem disabled={first} onClick={()=>onMove(-1)}><ArrowUp/>上移</MenuItem><MenuItem disabled={last} onClick={()=>onMove(1)}><ArrowDown/>下移</MenuItem></>}<MenuItem onClick={onReport}><Flag/>纠错</MenuItem>{onEdit&&<MenuItem onClick={onEdit}><Pencil/>编辑题目资料</MenuItem>}{onCopy&&<MenuItem onClick={onCopy}><Copy/>复制为新题</MenuItem>}{onRemove&&<><MenuSeparator/><MenuItem onClick={onRemove}><X/>{removeLabel}</MenuItem></>}</MenuPopup></Menu></>
}
