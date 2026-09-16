"use client"

import { actionDemos } from "./demos/actions"
import { formDemos } from "./demos/forms"
import { contentDemos } from "./demos/content"
import { feedbackDemos } from "./demos/feedback"
import { navigationDemos } from "./demos/navigation"
import { overlayDemos } from "./demos/overlays"
import { SelectParticles, ComboboxParticles } from "./demos/selection-particles"
import { DatePickerDemo } from "./demos/date-particles"
import { SearchInputParticle, NumberRangeParticle } from "./demos/input-particles"
import { MaterialTableParticle } from "./demos/table-particle"
import { DialogParticles } from "./demos/dialog-particles"

import { TreeDirectoryDemo } from "./demos/tree-directory"
import { EvaluationDemo, DiagnosisDemo, GoalsDemo, LearningPlanDemo } from "./learning-workspace"
import { QuestionsDemo } from "./demos/questions"
import { IconCatalogDemo } from "./icon-catalog"
import { lazy, Suspense } from "react"
const analyticsDemos=Object.fromEntries((["student-analysis","metric-summary","trend-chart","comparison-chart","distribution-chart","goal-comparison","status-composition","analysis-filter","evidence-table"] as const).map(view=>[view,lazy(()=>import("./analytics-workspace").then(module=>({default:()=> <module.AnalyticsWorkspace view={view}/>})))]))

const visualDemos = {
  "evidence-matrix": lazy(() => import("./evidence-matrix").then(module => ({ default: module.EvidenceMatrixDemo }))),
  "goal-milestones": lazy(() => import("./learning-visualizations").then(module => ({ default: () => <module.LearningVisualizations view="goal-milestones"/> }))),
  "workload-calendar": lazy(() => import("./learning-visualizations").then(module => ({ default: () => <module.LearningVisualizations view="workload-calendar"/> }))),
  "answer-review-map": lazy(() => import("./answer-review-map").then(module => ({ default: module.AnswerReviewMapDemo }))),
}

export const demos:Record<string,React.ComponentType>={...visualDemos,...actionDemos,...formDemos,...contentDemos,...feedbackDemos,...navigationDemos,...overlayDemos,...analyticsDemos,icons:IconCatalogDemo,'date-picker':DatePickerDemo,tree:TreeDirectoryDemo,question:QuestionsDemo,evaluation:EvaluationDemo,diagnosis:DiagnosisDemo,goals:GoalsDemo,"learning-plan":LearningPlanDemo}
const particles:Record<string,React.ComponentType>={select:SelectParticles,combobox:ComboboxParticles,'input-group':SearchInputParticle,'number-field':NumberRangeParticle,table:MaterialTableParticle,dialog:DialogParticles}
export function DemoRenderer({id}:{id:string}) { const Demo=demos[id];const Particles=particles[id];return Demo?<Suspense fallback={<p role="status">正在加载组件…</p>}><Demo/>{Particles&&<Particles/>}</Suspense>:<p>未找到此组件。</p> }
