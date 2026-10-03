"use client"
import {Button} from './button'
import {Collapsible,CollapsibleTrigger,CollapsiblePanel} from '@/components/coss/collapsible'
export function PaperPreviewGroup({count,open,onOpenChange}:{count:number;open:boolean;onOpenChange:(open:boolean)=>void}) {
 return <Collapsible data-full-score-group open={open} onOpenChange={onOpenChange} className="p-4"><CollapsibleTrigger render={<Button variant="ghost"/>}>满分 {count} 人</CollapsibleTrigger><CollapsiblePanel className="motion-reduce:transition-none"><p className="text-ui-meta text-muted-foreground">满分作答已展开，见下方纸张。</p></CollapsiblePanel></Collapsible>
}
