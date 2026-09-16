"use client"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { NumberField, NumberFieldGroup, NumberFieldInput, NumberFieldDecrement, NumberFieldIncrement } from "@/components/coss/number-field"

export function QuestionSelect({id,label,value,items,onChange,disabled=false}:{id?:string;disabled?:boolean;label:string;value:string;items:{value:string;label:string}[];onChange:(value:string)=>void}) {
  return <Select disabled={disabled} items={items} value={value} onValueChange={value=>{if(value!==null)onChange(value)}}><SelectTrigger id={id} aria-label={label} className="w-fit max-w-full"><SelectValue/></SelectTrigger><SelectPopup>{items.map(item=><SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup></Select>
}
export function PointsField({label,value,max=100,step=0.5,unit="分",onChange}:{label:string;value:number|null;max?:number;step?:number;unit?:string;onChange:(value:number|null)=>void}) {
  return <NumberField value={value} onValueChange={onChange} min={0} max={max} step={step} smallStep={step} snapOnStep onValueCommitted={next=>{if(next!==null)onChange(Math.round(next/step)*step)}} className="w-32 shrink-0"><NumberFieldGroup><NumberFieldDecrement aria-label={`${label}减少${unit}`}/><NumberFieldInput aria-label={label}/><NumberFieldIncrement aria-label={`${label}增加${unit}`}/></NumberFieldGroup></NumberField>
}
