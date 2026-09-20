"use client"
import { useEffect, useState } from 'react'
import { Check, FileText } from 'lucide-react'
import { Button } from '@/components/coss/button'
import { Input } from '@/components/coss/input'
import { Textarea } from '@/components/coss/textarea'
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/coss/field'
import { Form } from '@/components/coss/form'
import { NumberField, NumberFieldGroup, NumberFieldInput, NumberFieldDecrement, NumberFieldIncrement } from '@/components/coss/number-field'
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/coss/tabs'
import { Badge } from '@/components/prism-next/badge'
import { MaterialSelect } from '@/components/prism-next/demo-parts'
import { MathContent } from '@/components/prism-next/math-content'
import { AgentWorkspace } from '@/components/prism-next/examples/agent-workspace'
import { initialMaterial, isMaterial, validateMaterial, appendReviewNotes, reviewAdoptionState, type Material } from '@/lib/prism-next/review'
const storageKey='prism-v1-reading'
const emptyErrors={title:'',minutes:'',notes:''}
export function ReadingWorkspace() {
  const [saved,setSaved]=useState<Material>(initialMaterial)
  const [draft,setDraft]=useState<Material>(initialMaterial)
  const [errors,setErrors]=useState(emptyErrors)
  const [message,setMessage]=useState('')
  const [tab,setTab]=useState('metadata')
  useEffect(()=>{try{const raw=localStorage.getItem(storageKey);if(raw){const value:unknown=JSON.parse(raw);if(isMaterial(value)){setSaved(value);setDraft(value)}else setMessage('之前保存的数据格式已变化，已载入默认材料。')}}catch{setMessage('暂时无法读取本地记录，仍可编辑当前材料。')}},[])
  const dirty=JSON.stringify(saved)!==JSON.stringify(draft)
  function change<K extends keyof Material>(key:K,value:Material[K]){setDraft(v=>({...v,[key]:value}));setErrors(v=>({...v,[key]:''}));setMessage('')}
  function save(){const result=validateMaterial(draft);setErrors(result);if(Object.values(result).some(Boolean)){setMessage('请修正标出的内容。');return}const value={...draft,title:draft.title.trim()};try{localStorage.setItem(storageKey,JSON.stringify(value));setSaved(value);setDraft(value);setMessage('已保存到当前浏览器。')}catch{setMessage('保存失败：当前浏览器无法写入存储，请保留页面后重试。')}}
  return <div className="prism-content"><header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-5"><div className="flex items-center gap-3"><FileText className="size-5 text-muted-foreground"/><div><h1 className="font-semibold">材料研读与编辑</h1><p className="mt-1 text-ui-hint text-muted-foreground">浅色、暖纸与深色共享同一份内容</p></div></div><Badge variant={dirty?'warning':'outline'}>{dirty?'有未保存修改':'草稿 · 本地保存'}</Badge></header>
    <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1.62fr)_minmax(18rem,1fr)]"><div className="min-w-0"><MathContent title={saved.title}/><div className="mt-8 flex flex-wrap items-center gap-4 border-t pt-5 text-ui-hint text-muted-foreground"><span>预计研读 {saved.minutes} 分钟</span><a className="text-(--link) underline underline-offset-4" href="/next/foundations#mathematics">查看数学排版规范 →</a></div></div>
    <aside aria-label="材料编辑与助手" className="min-w-0 xl:border-l xl:pl-8"><Tabs value={tab} onValueChange={v=>setTab(String(v))}><TabsList variant="underline"><TabsTab value="metadata">材料信息</TabsTab><TabsTab value="agent">复核助手</TabsTab></TabsList><TabsPanel value="metadata" className="pt-6"><Form noValidate className="space-y-6" onSubmit={e=>{e.preventDefault();save()}}>
      <Field invalid={!!errors.title}><FieldLabel htmlFor="reading-material-title">材料标题</FieldLabel><Input id="reading-material-title" value={draft.title} maxLength={80} onChange={e=>change('title',e.target.value)} aria-invalid={!!errors.title}/><FieldError match={!!errors.title}>{errors.title}</FieldError></Field>
      <Field className="max-w-48"><FieldLabel htmlFor="reading-material-kind">材料类型</FieldLabel><MaterialSelect id="reading-material-kind" value={draft.kind} onChange={v=>change('kind',v)}/></Field>
      <Field invalid={!!errors.minutes} className="max-w-44"><FieldLabel htmlFor="reading-material-minutes">预计时长（分钟）</FieldLabel><NumberField value={draft.minutes} min={1} max={120} onValueChange={v=>change('minutes',v)}><NumberFieldGroup><NumberFieldDecrement aria-label="减少研读时长"/><NumberFieldInput id="reading-material-minutes" aria-invalid={!!errors.minutes}/><NumberFieldIncrement aria-label="增加研读时长"/></NumberFieldGroup></NumberField><FieldError match={!!errors.minutes}>{errors.minutes}</FieldError></Field>
      <Field invalid={!!errors.notes}><FieldLabel htmlFor="reading-material-notes">修订备注</FieldLabel><Textarea id="reading-material-notes" value={draft.notes} maxLength={500} onChange={e=>change('notes',e.target.value)} aria-invalid={!!errors.notes}/><FieldDescription>{draft.notes.length} / 500 字</FieldDescription><FieldError match={!!errors.notes}>{errors.notes}</FieldError></Field>
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={!dirty}>保存修改</Button><Button variant="ghost" disabled={!dirty} onClick={()=>{setDraft(saved);setErrors(emptyErrors);setMessage('已取消本次修改。')}}>取消</Button></div><p className="min-h-6 text-ui-hint text-muted-foreground" role="status" aria-live="polite">{message||(dirty?'保存后更新左侧材料信息。':'修改会保存在当前浏览器。')}</p>
    </Form></TabsPanel><TabsPanel value="agent" keepMounted className="pt-6"><AgentWorkspace compact adoptionState={reviewAdoptionState(draft.notes,saved.notes)} onApply={suggestion=>{const result=appendReviewNotes(draft.notes,suggestion);setTab('metadata');if(result.error){setMessage(result.error);return false}change('notes',result.notes);setMessage('已追加复核建议，原备注保留。点击保存修改后生效。');return true}}/></TabsPanel></Tabs></aside></div>
  </div>
}
