import type { ReactNode } from "react"
import { Select,SelectTrigger,SelectValue,SelectPopup,SelectItem } from "@/components/coss/select"
import { Field,FieldLabel } from "@/components/coss/field"

export function DemoSection({title,description,children,id}:{title:string;description?:string;children:ReactNode;id?:string}) {
  return <section id={id} className="prism-demo-section"><header><h2>{title}</h2>{description&&<p>{description}</p>}</header><div className="prism-demo">{children}</div></section>
}
export function Feedback({children}:{children:ReactNode}) { return <p className="mt-4 min-h-6 text-sm leading-6 text-muted-foreground" role="status" aria-live="polite">{children}</p> }
export const materialTypes=[{value:'example',label:'例题讲解'},{value:'concept',label:'知识梳理'},{value:'practice',label:'练习解析'},{value:'archived',label:'已归档（不可选）',disabled:true}]
export function MaterialSelect({value,onChange,id='material-type',size='default',disabled=false}:{value?:string;onChange?:(value:string)=>void;id?:string;size?:'sm'|'default'|'lg';disabled?:boolean}) {
  return <Select items={materialTypes} value={value} defaultValue={value===undefined?'example':undefined} onValueChange={v=>{if(v)onChange?.(v)}} disabled={disabled}>
    <SelectTrigger id={id} size={size}><SelectValue placeholder="选择材料类型"/></SelectTrigger>
    <SelectPopup>{materialTypes.map(item=><SelectItem key={item.value} value={item.value} disabled={item.disabled}>{item.label}</SelectItem>)}</SelectPopup>
  </Select>
}
export function Labeled({label,id,children}:{label:string;id:string;children:ReactNode}) { return <Field><FieldLabel htmlFor={id}>{label}</FieldLabel>{children}</Field> }
