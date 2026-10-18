import { notFound } from "next/navigation"
import { LearningAnalysisDoc, learningAnalysisDocuments } from "@/components/prism-next/learning-analysis-doc"
export function generateStaticParams(){return learningAnalysisDocuments.filter(d=>d.slug!=="index").map(d=>({slug:d.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:learningAnalysisDocuments.find(d=>d.slug===slug)?.title??"学情分析设计"}}
export default async function LearningAnalysisPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!learningAnalysisDocuments.some(d=>d.slug===slug))notFound();return <LearningAnalysisDoc slug={slug}/>}
