"use client"

import { useEffect, useId, useMemo, useState } from 'react'
import { draftMathErrorLocation, previewDraft, previewFormula, type DraftMathErrorLocation, type DraftPart, type MathRenderer } from '@/lib/prism-next/draft-math'
import { Spinner } from '@/components/coss/spinner'
import { Button } from './button'
import temmlModuleUrl from 'temml/dist/temml.mjs?url'
import './draft-math-preview.css'

// Load the pinned ESM file as an unchanged same-origin asset. Vite 8's optimizer
// rewrites the lexer's lone-surrogate escapes incorrectly when bundling Temml.
let rendererPromise:Promise<MathRenderer>|undefined
const loadRenderer=()=>rendererPromise??=(import(/* @vite-ignore */ temmlModuleUrl) as Promise<typeof import('temml')>).then(module=>module.default.renderToString).catch(error=>{rendererPromise=undefined;throw error})

export type DraftMathPreviewProps = {
 value:string
 label?:string
 /** Single raw expression, without \\( \\) or \\[ \\] delimiters. */
 formulaMode?:'inline'|'block'
 notice?:string|null
 showHelp?:boolean
 onLocateError?:(location:DraftMathErrorLocation)=>void
}

/** Shared error presentation; positions come only from the existing renderer. */
export function DraftMathFeedback({value,parts,onLocateError}:{value:string;parts:readonly DraftPart[];onLocateError?:DraftMathPreviewProps['onLocateError']}) {
 const errors=parts.filter(part=>part.kind==='error')
 return !errors.length?null:<div role="status" className="space-y-2 text-ui-hint text-warning-foreground">{errors.map((error,index)=>{
  const location=draftMathErrorLocation(value,error.position)
  return <div key={index} className="space-y-1">
   <p>{error.message}</p>
   <p>{location?`位置：第 ${location.line} 行，第 ${location.column} 列${location.start===value.length?'（原文末尾）':''}。`:'暂无法确定具体位置，请检查当前公式原文。'}</p>
   {location&&onLocateError&&<Button type="button" variant="outline" size="navigation" onClick={()=>onLocateError(location)}>定位到原文</Button>}
  </div>
 })}</div>
}

export function DraftMathPreview({value,label='当前题干预览',formulaMode,notice='仅预览排版，不校验数学结论。未识别内容按原文显示。',showHelp=true,onLocateError}:DraftMathPreviewProps) {
 const [renderer,setRenderer]=useState<MathRenderer|null>(null),[failed,setFailed]=useState(false)
 useEffect(()=>{let active=true;loadRenderer().then(render=>{if(active)setRenderer(()=>render)}).catch(()=>{if(active)setFailed(true)});return()=>{active=false}},[])
 const id=useId(),parts=useMemo(()=>renderer?(formulaMode?previewFormula(value,renderer,formulaMode==='block'):previewDraft(value,renderer)):[{kind:'text' as const,source:value}],[value,renderer,formulaMode])
 const errors=[...new Set(parts.flatMap(part=>part.kind==='error'?[part.message]:[]))]
 return <section className="prism-draft-preview min-w-0 space-y-3 rounded-lg bg-secondary p-4" aria-labelledby={id}>
  <h4 id={id} className="text-ui-action">{label}</h4>
  <div className="prism-draft-content text-read-body whitespace-pre-wrap break-words">
   {!value.trim()?<p className="text-ui-hint text-muted-foreground">输入内容后，在这里查看排版。</p>:parts.map((part,index)=>part.kind==='math'?<span key={index} className={part.block?'prism-draft-equation prism-draft-block':'prism-draft-equation'} dangerouslySetInnerHTML={{__html:part.html}}/>:<span key={index}>{part.source}</span>)}
  </div>
  {!renderer&&<p role="status" className="flex items-center gap-2 text-ui-hint text-muted-foreground">{!failed&&<Spinner aria-hidden="true" className="size-4 shrink-0 motion-reduce:animate-none"/>}{failed?'公式预览暂不可用，输入已保留。请刷新页面重试。':'正在准备公式预览…'}</p>}
  {formulaMode?<DraftMathFeedback value={value} parts={parts} onLocateError={onLocateError}/>:!!errors.length&&<div role="status" className="space-y-1 text-ui-hint text-warning-foreground">{errors.map(error=><p key={error}>{error}</p>)}</div>}
  {notice&&<p className="text-ui-hint text-muted-foreground">{notice}</p>}
  {showHelp&&<details className="text-ui-hint text-muted-foreground"><summary className="cursor-pointer text-ui-action">复杂公式怎么输入</summary><p className="mt-2">{'常见代数式可直接输入；复杂公式使用 \\(…\\) 或 \\[ … \\]，例如 \\(\\frac{1}{\\sqrt{x^2+1}}\\)。'}</p></details>}
 </section>
}
