"use client"
import { useId } from "react"
import { RadioGroup,Radio } from "@/components/coss/radio-group"
import { Checkbox } from "@/components/coss/checkbox"
import { Input } from "@/components/coss/input"
import { Textarea } from "@/components/coss/textarea"
import type { QuestionRecord,QuestionPart } from "./question-content"
export type ResponseValue=string|string[]
export function QuestionResponse({question,value,onChange,disabled=false,label="我的作答"}:{question:Pick<QuestionRecord,"response"|"options"|"answerFieldCount">|QuestionPart;value:ResponseValue;onChange:(value:ResponseValue)=>void;disabled?:boolean;label?:string}){
 const id=useId(),model=question.response??"long",options=model==="boolean"?[{id:"true",content:"正确"},{id:"false",content:"错误"}]:question.options??[]
 if(model==="single"||model==="boolean")return <RadioGroup aria-label={label} value={typeof value==="string"?value:""} onValueChange={v=>onChange(String(v))} disabled={disabled}>{options.map(option=><label key={option.id} className="flex items-start gap-3 text-sm leading-6"><Radio value={option.id} className="mt-1"/><span>{option.id=== "true"||option.id==="false"?"":`${option.id}. `}{option.content}</span></label>)}</RadioGroup>
 if(model==="multiple")return <fieldset disabled={disabled} className="space-y-3"><legend className="mb-3 text-sm font-medium">{label}</legend>{options.map(option=><label key={option.id} className="flex items-start gap-3 text-sm leading-6"><Checkbox checked={Array.isArray(value)&&value.includes(option.id)} onCheckedChange={checked=>onChange(checked?[...new Set([...(Array.isArray(value)?value:[]),option.id])]:(Array.isArray(value)?value:[]).filter(id=>id!==option.id))}/><span>{option.id}. {option.content}</span></label>)}</fieldset>
 if(model==="fill"){const count="answerFieldCount" in question?question.answerFieldCount??1:1;return <div className="flex flex-wrap gap-3">{Array.from({length:count},(_,i)=><label key={i} className="grid gap-2 text-sm">{label} · 第 {i+1} 空<Input disabled={disabled} value={Array.isArray(value)?value[i]??"":i===0?value:""} onChange={e=>{const next=Array.isArray(value)?[...value]:[value];next[i]=e.target.value;onChange(next)}}/></label>)}</div>}
 return <label htmlFor={id} className="grid gap-2 text-sm">{label}<Textarea id={id} disabled={disabled} value={typeof value==="string"?value:value.join("\n")} onChange={e=>onChange(e.target.value)}/></label>
}
