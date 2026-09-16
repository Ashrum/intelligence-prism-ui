"use client"
import {lazy,Suspense} from "react"
import type {Stage} from "@/lib/prism-next/learning-workflow"
const Questions=lazy(()=>import("./examples/questions").then(m=>({default:m.QuestionsDemo})))
const Learning=lazy(()=>import("./examples/learning-workspace").then(m=>({default:m.LearningExample})))
export function ExampleRenderer({id,stage="evaluation"}:{id:string;stage?:Stage}){
 return <Suspense fallback={<p role="status">正在加载应用示例…</p>}>{id==="questions"?<Questions/>:id==="evaluation"?<Learning key={stage} initialStage={stage}/>:null}</Suspense>
}
