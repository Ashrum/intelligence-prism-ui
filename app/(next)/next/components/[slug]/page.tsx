import { redirect,notFound } from "next/navigation"
import type { Metadata } from "next"
import { findComponent,components } from "@/lib/prism-next/catalog"
import { DemoRenderer } from "@/components/prism-next/demo-renderer"
import { StatusBadge } from "@/components/prism-next/status-badge"
import { DESIGN_STATUS } from "@/lib/prism-next/config"

export function generateStaticParams(){return components.map(item=>({slug:item.id}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const{slug}=await params;return{title:findComponent(slug)?.title??'组件'}}
export default async function ComponentPage({params}:{params:Promise<{slug:string}>}){
  const{slug}=await params;if(slug==="student-analysis")redirect("/next#group-analytics");const item=findComponent(slug);if(!item)notFound()
  return <div className="prism-content"><div className="prism-page-heading"><div className="prism-heading-meta"><h1>{item.title}</h1><span className="prism-component-kind">{item.kind==='extension'?'可复用扩展组件':item.kind==='pattern'?'可复用组合组件':'coss 原始组件'}</span><StatusBadge tone="complete">{DESIGN_STATUS}</StatusBadge></div><p>{item.summary}</p></div><DemoRenderer id={slug}/><footer className="prism-source mt-10 border-t pt-5">实现基于 <a href={item.sourceUrl??('https://coss.com/ui/docs/components/'+slug)} target="_blank" rel="noreferrer">{item.sourceLabel??(item.kind==='extension'?'组件参考':'coss '+slug+' 官方文档')} ↗</a></footer></div>
}
