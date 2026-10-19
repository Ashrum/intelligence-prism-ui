"use client"
// Review-only mount, fetched by Supervisor from the existing Vite server. No route or catalog entry.
import { useState } from "react"
import { createRoot } from "react-dom/client"
import { ShellNavFixture } from "../shell-nav-20261016/fixture"
import { AgentMark } from "@/components/prism-next/agent-mark"
import { AgentPromptBar } from "@/components/prism-next/agent-prompt-bar"
import { BlueprintSheet, BpFrameCard, BpSectionCard, BpCodebox } from "@/components/prism-next/blueprint/blueprint"
import { Button } from "@/components/prism-next/button"
import type { PrismTheme } from "@/lib/prism-next/config"
import { AgentRelationGraph, type AgentRelationCapabilities } from "@/components/prism-next/agent-relation-graph"
import { AgentStructureArranger } from "@/components/prism-next/agent-structure-arranger"
import { coverageNodes, coverageEdges } from "@/components/prism-next/demos/agent-relation-graph"
import { arrangementExamples } from "@/components/prism-next/demos/agent-structure-arranger"
function Objects() {
 return <>{(["default","compact"] as const).flatMap(density=>(["inline","workspace"] as const).flatMap(view=>["current","historical"].flatMap(era=>["empty","reason","unavailable"].map(mode=>{
 const capabilities=Object.fromEntries(["view","filter","edit-node","edit-edge","layout"].map(k=>[k,mode==="unavailable"?{supported:false,reason:"资料不可用，保留原因"}:mode==="reason"?{supported:true,reason:"已提供能力说明"}:{supported:true}])) as AgentRelationCapabilities
 return <section key={`${density}-${view}-${era}-${mode}`} data-object-pair={`${density}-${view}-${era}-${mode}`}>
 <AgentRelationGraph title="关系图长中文标题与原始资料" graphId="review" version="v1" versionLabel="示例 v1" nodes={coverageNodes} edges={coverageEdges} capabilities={capabilities} readOnlyReason={era==="historical"?"历史关系快照只读。":undefined} density={density} view={view}/>
 <AgentStructureArranger structure={{id:"review",title:"编排长中文标题与材料",version:{id:"v1",label:"示例 v1"},snapshot:era==="historical"?"历史编排快照只读。":undefined}} items={arrangementExamples.paper.items} groups={arrangementExamples.paper.groups} validation={[]} density={density} view={view}/>
 </section>
 }))))}</>
}
function Glyph() {
 const [size,setSize]=useState<"inline"|"glyph"|"loading">("inline")
 return <><div>{(["inline","glyph","loading"] as const).map(s=><Button key={s} onClick={()=>setSize(s)}>{s}</Button>)}</div><AgentMark state="working" size={size} startedAt={0} label="自定义运行状态" /></>
}
function Prompt() {
 const [value,setValue]=useState("保留草稿 f(x)=x²"),[reason,setReason]=useState("暂时无法连接服务，草稿仍可编辑；连接恢复后可提交。")
 const [announce,setAnnounce]=useState(true),[variant,setVariant]=useState<"Rounded"|"Pill">("Rounded")
 return <><Button onClick={()=>setReason(reason?"":"暂时无法连接服务，草稿仍可编辑；连接恢复后可提交。")}>切换原因</Button><Button onClick={()=>setAnnounce(!announce)}>切换播报</Button><Button onClick={()=>setVariant(variant==="Rounded"?"Pill":"Rounded")}>切换变体</Button><AgentPromptBar value={value} onValueChange={setValue} onIntent={()=>{}} sources={[]} commands={[]} models={[]} dictation={{state:"idle"}} voice={{state:"idle"}} variant={variant} sendDisabledReason={reason} announceDisabledReason={announce}/></>
}
function Cards() {
 return <><div data-review-omitted><BpFrameCard title="仅标题"><p>无状态或动作。</p></BpFrameCard><BpSectionCard title="无序号分节"><BpCodebox file="代码片段">{`const material = "${"long_file_name_".repeat(15)}"`}</BpCodebox></BpSectionCard></div>{(["success","warning","danger","info","neutral"] as const).map(tone=><BpFrameCard key={tone} title={`状态样例 ${tone}`} status={{tone,label:`外部事实 ${tone}`}}>中文状态文字</BpFrameCard>)}<div data-review-folio><BlueprintSheet title="旧序列" sheetNo="1 / 4"/><BlueprintSheet title="版本优先" sheetNo="1 / 4" folio={{kind:"rev",value:"v2"}}/><BlueprintSheet title="空版本优先" sheetNo="1 / 4" folio={{kind:"rev",value:""}}/><BlueprintSheet title="无定位事实"/><BlueprintSheet title="有等价标题版本 V2" folio={{kind:"rev",value:"v2"}} folioAriaHidden/></div></>
}
export function mount(container:HTMLElement,kind:string,theme:PrismTheme,outerTheme:PrismTheme=theme) {
 const root=createRoot(container)
 root.render(<section data-bpm-review={kind} data-agent-preview data-prism-theme={theme} className="min-w-0 space-y-4 bg-background p-3 text-foreground">{kind==="objects"?<Objects/>:kind==="shell"?<ShellNavFixture theme={theme} outerTheme={outerTheme}/>:kind==="glyph"?<Glyph/>:kind==="prompt"?<Prompt/>:<Cards/>}</section>)
 return ()=>root.unmount()
}
// Read the renderer's real data/coordinate conversion; the caller still performs a real pointer click.
export async function zeroCell(element:HTMLElement) {
 const {getInstanceByDom}=await import('echarts/core')
 const chart=getInstanceByDom(element)
 if(!chart)throw Error('Heatmap instance not ready')
 const option=chart.getOption() as {series:{data:{value:number[];rawLabel:string}[]}[]}
 const zero=option.series[0].data.find(d=>d.value[2]===0&&d.rawLabel==='0')
 if(!zero)throw Error('Zero cell missing')
 return {point:chart.convertToPixel({seriesIndex:0},zero.value.slice(0,2)),data:zero}
}
