"use client"
import { Children, Fragment, isValidElement, useEffect, useRef, useState, type CSSProperties, type ReactNode, type SetStateAction } from "react"
import { Printer, Settings } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Label } from "@/components/coss/label"
import { QuestionWorkPanel } from "./question-work-panel"
import { responsePresentation } from "./question-labels"
import { QuestionContent, type QuestionRecord, type ResponseModel } from "./question-content"
import { QuestionSelect } from "./question-controls"
import { entryPoints, type PaperEntry } from "@/lib/prism-next/question-workspace"
import { paginateQuestionUnits } from "@/lib/prism-next/question-pagination"

type PrintMode="paper"|"compact"|"response"|"answers"
export type PrintPreferences={mode:PrintMode;margin:number;fontSize:number;spaces:Record<string,number>;breaks:string[];view?:"fit"|"actual"}
export const createPrintPreferences=():PrintPreferences=>({mode:"paper",margin:16,fontSize:12,spaces:{},breaks:[]})
function readingBlocks(node:ReactNode):ReactNode[] {
  if(isValidElement<{children?:ReactNode;className?:string}>(node)&&(node.type===Fragment||(node.type==="div"&&node.props.className?.includes("space-y"))))return Children.toArray(node.props.children).flatMap(readingBlocks)
  return [node]
}
type PrintUnit={id:string;content:ReactNode;keepWithNext?:boolean;breakBefore?:boolean}
const modes=[{value:"paper",label:"题面与作答区"},{value:"compact",label:"题面 · 不加留白"},{value:"response",label:"配套答题纸"},{value:"answers",label:"教师答案"}]
function AnswerSpace({response,label,height,count=1}:{response?:ResponseModel;label:string;height:number;count?:number}) {
  return <div className="q-answer-region" data-answer-label={label}>
    <p className="q-answer-label">{label}{response==="long"?" · 作答区":""}</p>
    {response==="long"?<div style={{height:`${height}mm`}}/>:<p className="q-response-line">{response==="single"||response==="multiple"?"答案：________":response==="boolean"?"判断：________":Array.from({length:count},(_,i)=>`${count>1?`（${i+1}）`:"答案："}________________`).join("　")}</p>}
  </div>
}
export function QuestionPrint({emptyActions,entries,questions,versions,blocked,title,showPoints=true,description,minutes,preferences,onPreferencesChange,settingsOpen,onSettingsChange}:{emptyActions?:ReactNode;settingsOpen:boolean;onSettingsChange:(open:boolean)=>void;preferences:PrintPreferences;onPreferencesChange:(update:(previous:PrintPreferences)=>PrintPreferences)=>void;entries:PaperEntry[];questions:QuestionRecord[];versions:Record<string,string>;blocked:boolean;title:string;showPoints?:boolean;description?:string;minutes:number}) {
  const {mode,margin,fontSize,spaces,breaks,view="fit"}=preferences
  const preview=useRef<HTMLDivElement>(null),anchor=useRef<{id:string;offset:number}|null>(null)
  const widthMemory=useRef(0),settingsScroll=useRef(0)
  const [previewWidth,setPreviewWidth]=useState(800),[activeUnit,setActiveUnit]=useState<string|null>(null)
  function keepAnchor() {if(anchor.current||!preview.current)return;const top=preview.current.getBoundingClientRect().top;const unit=Array.from(preview.current.querySelectorAll<HTMLElement>("[data-preview-unit]")).find(element=>element.getBoundingClientRect().bottom>top);if(unit)anchor.current={id:unit.dataset.previewUnit!,offset:unit.getBoundingClientRect().top-top}}
  function revealUnit(id:string) {anchor.current={id,offset:24};setActiveUnit(id)}
  function update<K extends keyof PrintPreferences>(key:K,value:SetStateAction<PrintPreferences[K]>) {keepAnchor();onPreferencesChange(previous=>({...previous,[key]:typeof value==="function"?(value as (old:PrintPreferences[K])=>PrintPreferences[K])(previous[key]):value}))}
  const setMode=(value:PrintMode)=>update("mode",value),setMargin=(value:number)=>update("margin",value),setFontSize=(value:number)=>update("fontSize",value)
  const setSpaces=(value:SetStateAction<Record<string,number>>)=>update("spaces",value),setBreaks=(value:SetStateAction<string[]>)=>update("breaks",value)
  const [layout,setLayout]=useState<{pages:string[][];oversized:string[];signature:string}>({pages:[],oversized:[],signature:""})
  const measure=useRef<HTMLDivElement>(null)
  const signature=JSON.stringify({entries,versions,title,description,minutes,mode,margin,fontSize,spaces,breaks,showPoints})
  const contentVersion=JSON.stringify({entries,versions:entries.map(entry=>[entry.id,versions[entry.id]]),title,description,minutes,showPoints})
  let hash=2166136261;for(const character of contentVersion)hash=Math.imul(hash^character.charCodeAt(0),16777619)
  const edition=`D-${(hash>>>0).toString(16).toUpperCase().padStart(8,"0")}`
  const styles={"--q-margin":`${margin}mm`,"--q-font":`${fontSize}pt`,"--q-content-height":`${297-margin*2-16}mm`} as CSSProperties
  const units:PrintUnit[]=[]
  if(entries.length)units.push({id:"cover",keepWithNext:true,content:<header className="q-paper-cover"><p>{modes.find(item=>item.value===mode)?.label}</p><h3>{title}</h3>{description&&<p>{description}</p>}<p>共 {entries.length} 道大题{showPoints&&` · 满分 ${entries.reduce((sum,item)=>sum+entryPoints(item),0)} 分`} · 建议 {minutes} 分钟</p>{mode!=="answers"&&<p className="q-student-fields">姓名：____________　班级：____________　学号：____________</p>}</header>})
  entries.forEach((entry,index)=>{
    const question=questions.find(item=>item.id===entry.id);if(!question)return
    const number=index+1
    const display={...question,parts:undefined}
    const heading=<div className="q-paper-question-heading"><h4>{number}. {question.title}{showPoints&&`（${entryPoints(entry)} 分）`}</h4><p>{question.id} · v{versions[question.id]??"1.0"}</p></div>
    const group=entry.group&&entry.group!==entries[index-1]?.group?<h4 className="q-paper-group">{entry.group}</h4>:null
    if(mode==="answers") {
      const adjusted=entryPoints(entry)!==question.points||Object.entries(entry.partPoints??{}).some(([id,value])=>question.parts?.find(part=>part.id===id)?.points!==value)
      units.push({id:`${entry.id}-answer`,breakBefore:breaks.includes(entry.id),content:<>{group}{heading}{showPoints&&adjusted&&<p className="q-score-note">当前卷面 {entryPoints(entry)} 分；下列原题评分依据按 {question.points} 分保留，需核定后使用。</p>}{!showPoints&&<p className="q-score-note">以下分值为原题评分依据，仅供教师参考。</p>}<div className="question-solution prism-question-copy"><section><h4 className="mb-2 text-item-title">参考答案</h4>{question.answer}</section></div></>})
      readingBlocks(question.explanation).forEach((block,blockIndex)=>units.push({id:`${entry.id}-explanation-${blockIndex}`,content:<div className="question-solution prism-question-copy"><h4 className="mb-2 text-item-title">第 {number} 题 · 解析{blockIndex>0?"（续）":""}</h4>{block}</div>}))
      question.parts?.filter(part=>part.answer).forEach(part=>units.push({id:`${entry.id}-answer-${part.id}`,content:<><h4 className="q-part-heading">第 {number} 题（{part.id}） · 原题 {part.points??"—"} 分</h4><div className="prism-question-copy q-answer-detail">{part.answer}{part.explanation}{part.rubric&&<><h5>评分依据</h5><ul>{part.rubric.map(item=><li key={item.id}>{item.label}（{item.points} 分）</li>)}</ul></>}</div></>}))
      return
    }
    const paperContent=mode!=="response"
    const withSpace=mode!=="compact"
    units.push({id:`${entry.id}-stem`,breakBefore:breaks.includes(entry.id),keepWithNext:!!question.parts,content:<>{group}{heading}{paperContent&&<QuestionContent question={display}/>} {!question.parts&&withSpace&&<AnswerSpace response={question.response} label={`第 ${number} 题`} height={spaces[entry.id]??40} count={question.answerFieldCount}/>}</>})
    question.parts?.forEach(part=>units.push({id:`${entry.id}-part-${part.id}`,content:<><h4 className="q-part-heading">第 {number} 题（{part.id}）{responsePresentation(part.response??question.response)&&` · ${responsePresentation(part.response??question.response)!.label}`}{showPoints&&part.points!==undefined&&` · ${entry.partPoints?.[part.id]??part.points} 分`}</h4>{paperContent&&<div className="prism-question-copy"><div>{part.content}</div>{part.options&&<ol className="q-paper-options">{part.options.map(option=><li key={option.id}><span>{option.id}.</span>{option.content}</li>)}</ol>}</div>}{withSpace&&<AnswerSpace response={part.response??question.response} label={`第 ${number} 题（${part.id}）`} height={spaces[`${entry.id}:${part.id}`]??40}/>}</>}))
  })
  useEffect(()=>{
    let cancelled=false,frame=0
    const calculate=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(cancelled||!measure.current)return;const root=measure.current;const capacity=root.querySelector<HTMLElement>(".q-measure-capacity")!.getBoundingClientRect().height;if(root.getBoundingClientRect().width<=0||capacity<=0)return;const measured=Array.from(root.querySelectorAll<HTMLElement>("[data-print-unit]")).map(element=>({id:element.dataset.printUnit!,height:Math.ceil(element.getBoundingClientRect().height),keepWithNext:element.dataset.keep==="true",breakBefore:element.dataset.break==="true"}));const next=paginateQuestionUnits(measured,Math.floor(capacity)-2);const wide=Array.from(root.querySelectorAll<HTMLElement>("[data-print-unit]")).filter(element=>element.scrollWidth>element.clientWidth+2).map(element=>element.dataset.printUnit!);next.oversized=[...new Set([...next.oversized,...wide])];setLayout(previous=>previous.signature===signature&&JSON.stringify(previous.pages)===JSON.stringify(next.pages)&&JSON.stringify(previous.oversized)===JSON.stringify(next.oversized)?previous:{...next,signature})})}
    const observer=new ResizeObserver(calculate);if(measure.current)observer.observe(measure.current)
    calculate();document.fonts.ready.then(calculate)
    return()=>{cancelled=true;cancelAnimationFrame(frame);observer.disconnect()}
  },[signature])
  const ready=layout.signature===signature&&layout.pages.length>0
  const scale=view==="actual"?1:Math.min(1,Math.max(.1,(previewWidth-32)/(210*96/25.4)))
  useEffect(()=>{if(!preview.current)return;const element=preview.current;let frame=0;const resize=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(element.clientWidth<=0)return;if(widthMemory.current!==element.clientWidth){keepAnchor();widthMemory.current=element.clientWidth;setPreviewWidth(element.clientWidth)}const room=`${Math.max(280,window.innerHeight-Math.max(80,element.getBoundingClientRect().top)-16)}px`;if(element.style.getPropertyValue("--q-preview-room")!==room)element.style.setProperty("--q-preview-room",room)})};const observer=new ResizeObserver(resize);observer.observe(element);resize();window.addEventListener("scroll",resize,{passive:true});window.addEventListener("resize",resize);return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("scroll",resize);window.removeEventListener("resize",resize)}},[entries.length])
  useEffect(()=>{if(!ready||!anchor.current||!preview.current)return;const saved=anchor.current;const element=Array.from(preview.current.querySelectorAll<HTMLElement>("[data-preview-unit]")).find(unit=>unit.dataset.previewUnit===saved.id||unit.dataset.previewUnit?.startsWith(saved.id));if(element){const scroller=preview.current;scroller.scrollTop+=element.getBoundingClientRect().top-scroller.getBoundingClientRect().top-saved.offset}anchor.current=null},[layout,scale,ready,previewWidth])
  useEffect(()=>{if(!activeUnit)return;const timer=window.setTimeout(()=>setActiveUnit(null),2000);return()=>clearTimeout(timer)},[activeUnit])
  const unitMap=new Map(units.map(unit=>[unit.id,unit]))
  const missing=entries.some(entry=>!questions.some(question=>question.id===entry.id))
  const answerFields=entries.flatMap(entry=>{const question=questions.find(item=>item.id===entry.id);if(!question)return[];return question.parts?question.parts.filter(part=>(part.response??question.response)==="long").map(part=>({id:`${entry.id}:${part.id}`,label:`第 ${entries.indexOf(entry)+1} 题（${part.id}）`})):question.response==="long"?[{id:entry.id,label:`第 ${entries.indexOf(entry)+1} 题`}]:[]})
  return <div className="question-print-preview space-y-5" style={styles}>
    <div className="q-no-print flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3"><QuestionSelect label="纸面版本" value={mode} onChange={value=>setMode(value as PrintMode)} items={modes}/><Button variant="outline" aria-expanded={settingsOpen} aria-controls="question-print-settings" onClick={()=>{keepAnchor();onSettingsChange(!settingsOpen)}}><Settings/>{settingsOpen?"收起设置":"排版设置"}</Button><QuestionSelect label="预览显示比例" value={view} onChange={value=>update("view",value as "fit"|"actual")} items={[{value:"fit",label:`适合宽度 · ${Math.round(scale*100)}%`},{value:"actual",label:"原始尺寸 · 100%"}]}/><span role="status" className="text-ui-hint text-muted-foreground">A4 纵向{entries.length?(ready?` · 共 ${layout.pages.length} 页`:" · 正在分页…"):""}</span></div><Button disabled={!ready||blocked||missing||!!layout.oversized.length} onClick={()=>window.print()}><Printer/>打印 / 保存 PDF</Button></div>
    {entries.length>0&&<p className="q-no-print text-ui-hint text-muted-foreground">打印请选择 A4、100% 缩放，并关闭浏览器自带页眉页脚。题面与配套答题纸使用相同内容版次 {edition}。</p>}
    {(blocked||missing)&&<p className="q-no-print text-ui-body text-destructive">{missing?"当前草稿有无法读取的题目。":"当前草稿包含待审核或暂停使用的题目。"}请先修正，再打印。</p>}
    {layout.oversized.length>0&&<p role="alert" className="q-no-print text-ui-body text-destructive">有 {layout.oversized.length} 个内容块超出可打印区域。请调整作答空间或字号；过长的材料、公式或表格需拆分后打印。预览保留完整内容。</p>}
    <div className="q-print-workbench">
      <QuestionWorkPanel open={settingsOpen} id="question-print-settings" scrollMemory={settingsScroll} title="排版设置" description="修改后即时更新纸面。显示比例仅影响屏幕预览。" onClose={()=>{keepAnchor();onSettingsChange(false)}} footer={<Button variant="outline" onClick={()=>{keepAnchor();onPreferencesChange(previous=>({...previous,margin:16,fontSize:12,spaces:{},breaks:[]}))}}>恢复默认</Button>}><div className="space-y-6"><div className="space-y-2"><Label className="block">页边距</Label><QuestionSelect label="页边距" value={String(margin)} items={[{value:"16",label:"标准 · 16 mm"},{value:"20",label:"宽边 · 20 mm"}]} onChange={value=>setMargin(Number(value))}/></div><div className="space-y-2"><Label className="block">正文字号</Label><QuestionSelect label="纸面正文字号" value={String(fontSize)} items={[{value:"11",label:"11 pt"},{value:"12",label:"12 pt"}]} onChange={value=>setFontSize(Number(value))}/></div>{answerFields.length>0&&(mode==="paper"||mode==="response")&&<section className="space-y-3"><h4 className="text-item-title">每小问作答高度</h4>{answerFields.map(field=><div key={field.id} className="flex items-center justify-between gap-3"><Label>{field.label}</Label><QuestionSelect label={`${field.label}作答高度`} value={String(spaces[field.id]??40)} items={[20,40,60,80].map(value=>({value:String(value),label:`${value} mm`}))} onChange={value=>{revealUnit(field.id.includes(":")?field.id.replace(":","-part-"):`${field.id}-stem`);setSpaces(previous=>({...previous,[field.id]:Number(value)}))}}/></div>)}</section>}<section className="space-y-3"><h4 className="text-item-title">指定题目另起一页</h4>{entries.map((entry,index)=><label key={entry.id} className="flex items-start gap-3 text-ui-body"><Checkbox checked={breaks.includes(entry.id)} onCheckedChange={checked=>{revealUnit(entry.id);setBreaks(previous=>checked?[...previous,entry.id]:previous.filter(id=>id!==entry.id))}}/><span>第 {index+1} 题 · {questions.find(question=>question.id===entry.id)?.title}</span></label>)}</section></div></QuestionWorkPanel>
    <div className="q-print-canvas min-w-0">
    {!entries.length?<div className="q-no-print space-y-4 rounded-xl border p-8 text-center"><p className="text-muted-foreground">当前草稿尚无题目。可前往编排区选题，或先查看示例试卷。</p>{emptyActions&&<div className="flex flex-wrap justify-center gap-3">{emptyActions}</div>}</div>:<>
      <div ref={measure} className="q-paper-measure question-print-sheet" aria-hidden="true" inert><div className="q-measure-capacity"/>{units.map(unit=><div className="q-print-unit" data-print-unit={unit.id} data-keep={unit.keepWithNext} data-break={unit.breakBefore} key={unit.id}>{unit.content}</div>)}</div>
      <div ref={preview} className="q-paper-scroll" role="region" tabIndex={0} aria-label="分页预览"><div className="q-paper-pages" style={{zoom:scale}}>{layout.pages.map((page,index)=><section className="q-paper-page question-print-sheet" data-overflow={page.some(id=>layout.oversized.includes(id))||undefined} aria-label={`第 ${index+1} 页，共 ${layout.pages.length} 页`} key={index}><header className="q-page-running"><span>{title}</span><span>{modes.find(item=>item.value===mode)?.label}</span></header><div className="q-page-body">{page.map(id=>{const unit=unitMap.get(id);return unit?<div key={id} data-preview-unit={id} data-highlight={!!activeUnit&&(id===activeUnit||id.startsWith(activeUnit))||undefined} className="q-print-unit">{unit.content}</div>:null})}</div><footer className="q-page-footer"><span>{edition} · 自编演示材料</span><span>第 {index+1} 页 / 共 {layout.pages.length} 页</span></footer></section>)}</div></div>
    </>}
    </div></div>
  </div>
}
