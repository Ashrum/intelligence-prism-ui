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
import { IconCatalogDemo } from "./icon-catalog"
import { lazy, Suspense } from "react"
const QuestionComponent=lazy(()=>import("./demos/question-component").then(m=>({default:m.QuestionComponentDemo})))
const chartDemos=Object.fromEntries(["metric-summary","trend-chart","comparison-chart","distribution-chart","goal-comparison","status-composition","analysis-filter","evidence-table","evidence-matrix","scatter-chart","box-plot"].map(kind=>[kind,lazy(()=>import("./demos/chart-components").then(m=>({default:()=> <m.ChartComponentDemo kind={kind}/>})))]))
const learningDemos=Object.fromEntries(["evaluation","diagnosis","goals","learning-plan","goal-milestones","workload-calendar","answer-review-map","agent-components"].map(kind=>[kind,lazy(()=>import("./demos/learning-components").then(m=>({default:()=> <m.LearningComponentDemo kind={kind}/>})))]))
export const demos:Record<string,React.ComponentType>={...actionDemos,...formDemos,...contentDemos,...feedbackDemos,...navigationDemos,...overlayDemos,...chartDemos,...learningDemos,icons:IconCatalogDemo,'date-picker':DatePickerDemo,tree:TreeDirectoryDemo,question:QuestionComponent}
const particles:Record<string,React.ComponentType>={select:SelectParticles,combobox:ComboboxParticles,'input-group':SearchInputParticle,'number-field':NumberRangeParticle,table:MaterialTableParticle,dialog:DialogParticles}
export function DemoRenderer({id}:{id:string}) { const Demo=demos[id];const Particles=particles[id];return Demo?<Suspense fallback={<p role="status">正在加载组件…</p>}><Demo/>{Particles&&<Particles/>}</Suspense>:<p>未找到此组件。</p> }
