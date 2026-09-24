import {notFound,redirect} from "next/navigation"
import {applicationExamples,retiredExampleTargets} from "@/lib/prism-next/catalog"
import type {Stage} from "@/lib/prism-next/learning-workflow"
import {ExampleRenderer} from "@/components/prism-next/example-renderer"
export function generateStaticParams(){return applicationExamples.map(item=>({slug:item.id}))}
export default async function ExamplePage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{stage?:string|string[]}>}){
 const {slug}=await params
 if(Object.hasOwn(retiredExampleTargets,slug))redirect(retiredExampleTargets[slug])
 const item=applicationExamples.find(item=>item.id===slug);if(!item)notFound()
 const requested=(await searchParams)?.stage
 const stage:Stage=typeof requested==="string"&&["evaluation","diagnosis","goals","learning-plan"].includes(requested)?requested as Stage:"evaluation"
 return <div className="prism-content"><div className="prism-page-heading"><h1>{item.title}</h1><p>{item.summary}</p><p className="text-ui-hint">应用示例 · 用于验证组件组合，不计入组件数量</p></div><ExampleRenderer id={slug} stage={stage}/></div>
}
