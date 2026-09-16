"use client"
import { lazy,Suspense } from "react"
const Questions=lazy(()=>import("./examples/questions").then(m=>({default:m.QuestionsDemo})))
const Analysis=lazy(()=>import("./examples/analytics-workspace").then(m=>({default:m.AnalyticsWorkspace})))
const Matrix=lazy(()=>import("./examples/evidence-matrix").then(m=>({default:m.EvidenceMatrixDemo})))
const Learning=lazy(()=>import("./examples/learning-workspace").then(m=>({default:m.LearningWorkspace})))
const Visual=lazy(()=>import("./examples/learning-visualizations").then(m=>({default:m.LearningVisualizations})))
const Region=lazy(()=>import("./examples/answer-review-map").then(m=>({default:m.AnswerReviewMapDemo})))
export function ExampleRenderer({id}:{id:string}){return <Suspense fallback={<p role="status">正在加载应用示例…</p>}>{id==="questions"?<Questions/>:id==="student-analysis"?<Analysis/>:id==="evidence-matrix"?<Matrix/>:id==="goal-milestones"||id==="workload-calendar"?<Visual view={id}/>:id==="answer-review-map"?<Region/>:<Learning initialStage={id as "evaluation"|"diagnosis"|"goals"|"learning-plan"}/>}</Suspense>}
