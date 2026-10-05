"use client"
import {useRef,type ReactNode,type RefObject,type CSSProperties} from 'react'
import {ChevronLeft,ChevronRight,ArrowUp} from 'lucide-react'
import {Button} from './button'
import {Badge} from '@/components/coss/badge'
import {Tabs,TabsList,TabsTab} from '@/components/coss/tabs'
import {Group,GroupSeparator} from '@/components/coss/group'
import {ComboboxTrigger} from '@/components/coss/combobox'
import {Avatar,AvatarFallback} from '@/components/coss/avatar'
import {Tooltip,TooltipTrigger,TooltipPopup} from '@/components/coss/tooltip'
import {Kbd} from '@/components/coss/kbd'
import {ReviewSwitcher} from './review-switcher'
import {Tip,ThinBar} from './question-analysis-parts'
import './student-control-bar.css'
export type StudentControlItem={id:string;name:string;examId:string;formValue?:string;score:number|null;scoreText:ReactNode;status:ReactNode;review:ReactNode;ratio:number|null;identityTone:'success'|'warning'|'destructive'|'neutral';tickTone:'neutral'|'warning'|'destructive';group:string}
export function StudentIdentity({item:a,className="flex items-center gap-2 py-2 text-ui-body"}:{item:StudentControlItem;className?:string}) {return <div className={className}><Avatar aria-hidden="true"><AvatarFallback>{a.name[0]}</AvatarFallback></Avatar><span>{a.name}</span><span className="truncate text-ui-meta text-muted-foreground">{a.examId}</span><span className={`size-2 shrink-0 rounded-full ${{success:'bg-success',warning:'bg-warning',destructive:'bg-destructive',neutral:'bg-muted-foreground'}[a.identityTone]}`} aria-label={typeof a.status==='string'?a.status:undefined}/><span className="text-ui-meta">{a.scoreText}</span></div>}
export function StudentControlSwitcher({items,current,groups,max,open,onOpenChange,onSelect,triggerRef,searchId='answer-student-search'}:{items:StudentControlItem[];current:StudentControlItem|null;groups:{value:string;items:StudentControlItem[]}[];max:number;open:boolean;onOpenChange:(open:boolean)=>void;onSelect:(id:string)=>void;triggerRef:RefObject<HTMLButtonElement|null>;searchId?:string}) {
 const index=current?items.findIndex(i=>i.id===current.id):-1,search=useRef<HTMLInputElement>(null)
 return <ReviewSwitcher items={items} groups={groups} current={index} open={open} onOpenChange={onOpenChange} onSelect={index=>onSelect(items[index].id)} itemToStringValue={a=>a.formValue??a.id} itemKey={a=>a.id} itemToStringLabel={a=>`${a.name} ${a.examId} ${a.id}`} triggerRef={triggerRef} searchId={searchId} searchRef={search} searchLabelClassName="text-ui-action" markPanel={false} popupClassName="surface-floating w-96 max-w-[calc(100vw-1rem)]" labels={{navigation:'学生导航',previous:'上一位学生',next:'下一位学生',previousAria:'上一位学生',nextAria:'下一位学生',trigger:'选择学生',panel:'学生跳转面板',search:'姓名或考号',empty:'没有匹配的学生'}} navigation={ <Group className="shrink-0" aria-label="学生导航">
 <Tip label="上一位学生" keys="←"><Button variant="outline" size="icon" aria-label="上一位学生" disabled={index<=0} onClick={()=>onSelect(items[index-1].id)}><ChevronLeft/></Button></Tip><GroupSeparator/>
 <Tip label="选择学生" keys="S"><ComboboxTrigger ref={triggerRef} render={<Button variant="outline"/>} aria-label={current?`选择学生，${current.name}，当前第 ${index+1} / ${items.length} 位`:`选择学生 · ${items.length}`}>
 {current?<><Avatar aria-hidden="true" className="size-6"><AvatarFallback>{current.name[0]}</AvatarFallback></Avatar><span>{current.name}</span><span className="tabular-nums">{index+1} / {items.length}</span></>:<>选择学生 · {items.length}</>}
 </ComboboxTrigger></Tip><GroupSeparator/>
 <Tip label="下一位学生" keys="→"><Button variant="outline" size="icon" aria-label="下一位学生" disabled={index===items.length-1} onClick={()=>onSelect(items[index+1].id)}><ChevronRight/></Button></Tip>
 </Group>} renderItem={a=><div className="min-w-0 flex-1"><StudentIdentity item={a}/><div className="flex items-center gap-2">{a.score!==null&&a.ratio!==null&&<ThinBar value={a.ratio}/>}<span className="text-ui-meta tabular-nums">{a.score===null?a.scoreText:<>{a.score} / {max}</>}</span></div><span className="text-ui-meta text-muted-foreground">{a.review} · {a.status}</span></div>} footer={<p className="p-2 text-ui-meta"><Kbd>↑ ↓</Kbd>选择 <Kbd>Enter</Kbd>跳转 <Kbd>Esc</Kbd>关闭</p>}/>
}
export function StudentControlScale({items,selected,summary,onSelect}:{items:{id:string;tone:StudentControlItem['tickTone'];tooltip:ReactNode}[];selected?:string|null;summary:ReactNode;onSelect:(id:string)=>void}) {return <><p className="sr-only">{summary}</p><div data-student-scale aria-hidden="true" className="flex h-2 items-end gap-0.5 px-2">{items.map(a=><Tooltip key={a.id}><TooltipTrigger render={<span/>} data-student-tick={a.id} onClick={()=>onSelect(a.id)} className={`min-w-0 flex-1 cursor-pointer ${a.id===selected?'h-2 bg-info':`h-1 ${{neutral:'bg-muted-foreground',warning:'bg-warning',destructive:'bg-destructive'}[a.tone]}`}`}/><TooltipPopup className="surface-floating">{a.tooltip}</TooltipPopup></Tooltip>)}</div></>}
export function StudentControlBar({children,style,ref}:{children:ReactNode;style?:CSSProperties;ref?:RefObject<HTMLDivElement|null>}) {return <div ref={ref} data-student-controls aria-label="学生控制条" className="q1-student-controls surface-floating rounded-xl shadow-lg" style={style}>{children}</div>}
export function StudentControlBarRow({children}:{children:ReactNode}) {return <div className="q1-student-controls-row">{children}</div>}
export function StudentControlFilters({value,onValueChange,items}:{value:string;onValueChange:(value:string)=>void;items:{value:string;label:ReactNode;count:ReactNode}[]}) {return <Tabs value={value} onValueChange={onValueChange}><TabsList size="sm" aria-label="学生作答筛选">{items.map(i=><TabsTab key={i.value} value={i.value}>{i.label} <Badge variant="outline">{i.count}</Badge></TabsTab>)}</TabsList></Tabs>}
export function StudentControlHome({active,onHome}:{active:boolean;onHome:()=>void}) {return <Tip label="回到题目" keys="H"><Button variant="ghost" aria-pressed={active} data-pressed={active?'':undefined} onClick={onHome}><ArrowUp/>题目</Button></Tip>}
