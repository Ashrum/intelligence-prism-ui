import type { Options } from 'temml'

export type DraftPart = { kind:'text'; source:string } | { kind:'math'; source:string; html:string; block:boolean } | { kind:'error'; source:string; message:string }
export type MathRenderer = (expression:string,options?:Options)=>string
const plainMath = /[A-Za-z0-9α-ωΑ-Ω+\-−=<>≤≥≠≈∈∉×÷·∞π.,()[\]{}^_⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾₀₁₂₃₄₅₆₇₈₉ \t]+/gu
const presentation = /\\(?:color|textcolor|colorbox|fcolorbox|definecolor|bbox|fontsize|tiny|scriptsize|footnotesize|small|large|Large|LARGE|huge|Huge|href|url|includegraphics|html\w*|class|style|id|def|gdef|newcommand|renewcommand)\b/

function render(renderer:MathRenderer,source:string, expression:string, block=false):DraftPart {
 if(expression.length>1000)return {kind:'error',source,message:'这段公式过长，暂不预览；请拆分后再检查。'}
 if(presentation.test(expression))return {kind:'error',source,message:'预览不支持链接、自定义宏或颜色与字号命令；请保留数学表达式。'}
 try {
  const html=renderer(expression,{displayMode:block,throwOnError:true,strict:true,trust:false,maxExpand:200,maxSize:[5,5],annotate:true})
  return {kind:'math',source,html,block}
 } catch {
  return {kind:'error',source,message:'公式未能排版，请检查命令、参数和花括号。输入已保留。'}
 }
}

/** Only recognize conservative algebra runs. Plain prose is never treated as TeX. */
function plainParts(value:string,renderer:MathRenderer):DraftPart[] {
 const parts:DraftPart[]=[]
 let cursor=0
 for(const match of value.matchAll(plainMath)){
  const start=match.index,raw=match[0],expression=raw.trim()
  if(start>cursor)parts.push({kind:'text',source:value.slice(cursor,start)})
  const words=expression.match(/[A-Za-z]+/g)??[]
  const eligible=words.every(word=>word.length===1)&&/[A-Za-zα-ωΑ-Ω]/u.test(expression)&&!expression.includes('..')
  if(eligible){
   const leading=raw.length-raw.trimStart().length,trailing=raw.length-raw.trimEnd().length
   if(leading)parts.push({kind:'text',source:raw.slice(0,leading)})
   parts.push(render(renderer,expression,expression))
   if(trailing)parts.push({kind:'text',source:raw.slice(raw.length-trailing)})
  }else parts.push({kind:'text',source:raw})
  cursor=start+raw.length
 }
 if(cursor<value.length)parts.push({kind:'text',source:value.slice(cursor)})
 return parts
}

/** Display projection only: never normalizes or writes back the teacher's draft. */
export function previewDraft(value:string,renderer:MathRenderer):DraftPart[] {
 if(value.length>12000)return [{kind:'error',source:value,message:'内容较长，暂不生成公式预览；原始输入完整保留。'}]
 const parts:DraftPart[]=[]
 let cursor=0
 const delimiter=/\\[()[\]]/g
 while(cursor<value.length){
  delimiter.lastIndex=cursor
  const start=delimiter.exec(value)
  if(!start){parts.push(...plainParts(value.slice(cursor),renderer));break}
  parts.push(...plainParts(value.slice(cursor,start.index),renderer))
  const opener=start[0]
  if(opener==='\\)'||opener==='\\]'){
   parts.push({kind:'error',source:opener,message:'缺少公式起始标记。请使用成对的 \\(…\\) 或 \\[ … \\]。'})
   cursor=start.index+2;continue
  }
  const closer=opener==='\\('?'\\)':'\\]',end=value.indexOf(closer,start.index+2)
  if(end<0){parts.push({kind:'error',source:value.slice(start.index),message:`公式标记未闭合，请补上 ${closer}。`});break}
  const source=value.slice(start.index,end+2),expression=value.slice(start.index+2,end)
  parts.push(expression.trim()?render(renderer,source,expression,opener==='\\['):{kind:'error',source,message:'公式内容为空，请补充表达式。'})
  cursor=end+2
 }
 return parts
}
