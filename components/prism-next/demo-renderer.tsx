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
import { StepperDemo } from "./demos/stepper"
const QuestionComponent=lazy(()=>import("./demos/question-component").then(m=>({default:m.QuestionComponentDemo})))
const chartDemos=Object.fromEntries(["metric-summary","trend-chart","comparison-chart","distribution-chart","goal-comparison","status-composition","analysis-filter","evidence-table","evidence-matrix","scatter-chart","box-plot","paired-dot-chart","quadrant-chart","combo-chart"].map(kind=>[kind,lazy(()=>import("./demos/chart-components").then(m=>({default:()=> <m.ChartComponentDemo kind={kind}/>})))]))
const learningDemos=Object.fromEntries(["evaluation","diagnosis","goals","learning-plan","goal-milestones","workload-calendar","answer-review-map"].map(kind=>[kind,lazy(()=>import("./demos/learning-components").then(m=>({default:()=> <m.LearningComponentDemo kind={kind}/>})))]))
export const demos:Record<string,React.ComponentType>={"segmented-bar":lazy(()=>import("./demos/segmented-bar").then(m=>({default:m.SegmentedBarDemo}))),"error-cause-review":lazy(()=>import("./demos/error-cause-review").then(m=>({default:m.ErrorCauseReviewDemo}))),"student-paper-report":lazy(()=>import("./demos/student-paper-report").then(m=>({default:m.StudentPaperReportDemo}))),"dialog-layout":lazy(()=>import("./demos/dialog-layout").then(m=>({default:m.DialogLayoutDemo}))),"review-tools":lazy(()=>import("./demos/review-tools").then(m=>({default:m.ReviewToolsDemo}))),"knowledge-rail":lazy(()=>import("./demos/knowledge-rail").then(m=>({default:m.KnowledgeRailDemo}))),"student-control-bar":lazy(()=>import("./demos/student-control-bar").then(m=>({default:m.StudentControlBarDemo}))),"question-analysis-card":lazy(()=>import("./demos/question-analysis-card").then(m=>({default:m.QuestionAnalysisCardDemo}))),"question-analysis-panel":lazy(()=>import("./demos/question-analysis-panel").then(m=>({default:m.QuestionAnalysisPanelDemo}))),"question-inspector":lazy(()=>import("./demos/question-inspector").then(m=>({default:m.QuestionInspectorDemo}))),"review-switcher":lazy(()=>import("./demos/review-switcher").then(m=>({default:m.ReviewSwitcherDemo}))),"question-rail":lazy(()=>import("./demos/question-rail").then(m=>({default:m.QuestionRailDemo}))),"review-workspace":lazy(()=>import("./demos/review-workspace").then(m=>({default:m.ReviewWorkspaceDemo}))),"record-list":lazy(()=>import("./demos/record-list").then(m=>({default:m.RecordListDemo}))),"score-review":lazy(()=>import("./demos/score-review").then(m=>({default:m.ScoreReviewDemo}))),"queue-board":lazy(()=>import("./demos/queue-board").then(m=>({default:m.QueueBoardDemo}))),"data-station":lazy(()=>import("./demos/data-station").then(m=>({default:m.DataStationDemo}))),"material-intake":lazy(()=>import("./demos/material-intake").then(m=>({default:m.MaterialIntakeDemo}))),attachment:lazy(()=>import("./demos/attachment").then(m=>({default:m.AttachmentDemo}))),"instrument-panel":lazy(()=>import("./demos/instrument-panel").then(m=>({default:m.InstrumentPanelDemo}))),stepper:StepperDemo,"paper-preview":lazy(()=>import("./demos/paper-preview").then(m=>({default:m.PaperPreviewDemo}))),...actionDemos,...formDemos,...contentDemos,...feedbackDemos,...navigationDemos,...overlayDemos,...chartDemos,...learningDemos,'agent-components':lazy(()=>import('./demos/agent-components-page').then(m=>({default:m.AgentComponentsPage}))),icons:IconCatalogDemo,'date-picker':DatePickerDemo,tree:TreeDirectoryDemo,question:QuestionComponent}
const particles:Record<string,React.ComponentType>={select:SelectParticles,combobox:ComboboxParticles,'input-group':SearchInputParticle,'number-field':NumberRangeParticle,table:MaterialTableParticle,dialog:DialogParticles}
export function DemoRenderer({id}:{id:string}) { const Demo=demos[id];const Particles=particles[id];return Demo?<Suspense fallback={<p role="status">正在加载组件…</p>}><Demo/>{Particles&&<Particles/>}</Suspense>:<p>未找到此组件。</p> }
