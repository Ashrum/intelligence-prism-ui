"use client"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { NumberField, NumberFieldGroup, NumberFieldInput, NumberFieldDecrement, NumberFieldIncrement } from "@/components/coss/number-field"

export function QuestionSelect({label,value,items,onChange}:{label:string;value:string;items:{value:string;label:string}[];onChange:(value:string)=>void}) {
  return <Select items={items} value={value} onValueChange={value=>{if(value!==null)onChange(value)}}><SelectTrigger aria-label={label} className="w-fit max-w-full"><SelectValue/></SelectTrigger><SelectPopup>{items.map(item=><SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup></Select>
}
export function PointsField({label,value,max=100,onChange}:{label:string;value:number|null;max?:number;onChange:(value:number|null)=>void}) {
  return <NumberField value={value} onValueChange={onChange} min={0} max={max} step={0.5} smallStep={0.5} snapOnStep onValueCommitted={next=>{if(next!==null)onChange(Math.round(next*2)/2)}} className="w-32 shrink-0"><NumberFieldGroup><NumberFieldDecrement aria-label={`${label}减分`}/><NumberFieldInput aria-label={label}/><NumberFieldIncrement aria-label={`${label}加分`}/></NumberFieldGroup></NumberField>
}
