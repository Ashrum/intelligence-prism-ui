import { notFound } from "next/navigation"
import { applicationExamples } from "@/lib/prism-next/catalog"
import { ExampleRenderer } from "@/components/prism-next/example-renderer"
export function generateStaticParams(){return applicationExamples.map(item=>({slug:item.id}))}
export default async function ExamplePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const item=applicationExamples.find(item=>item.id===slug);if(!item)notFound();return <div className="prism-content"><div className="prism-page-heading"><h1>{item.title}</h1><p>{item.summary}</p><p className="!text-sm">应用示例 · 用于验证组件组合，不计入组件数量</p></div><ExampleRenderer id={slug}/></div>}
