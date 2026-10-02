"use client"
import {QuestionAnalysisCard,QuestionAnalysisDetails,type AnalysisCardQuestion,type AnalysisKnowledgeLink} from '@/components/prism-next/question-analysis-card'
import type {QuestionDetailTab} from '@/components/prism-next/question-details'
import {knowledgePoints,questionAnalyses,type ReviewQuestion,type StudentAnswer} from './fixture'
import {ellipseFigure} from './question-records'
import {makeAnswerGroups} from './answer-groups'
export function ReviewQuestionDetails(props:{question:ReviewQuestion;related:string[];tab:QuestionDetailTab;onTabChange:(tab:QuestionDetailTab)=>void;scoring:React.ReactNode;onKnowledge:(id:string)=>void}) {
 const related=props.related.map(id=>knowledgePoints.find(k=>k.id===id)!)
 return QuestionAnalysisDetails({...props,related,...reviewDetailFields(props.question,related)})
}
export function QuestionDigitalCard(props:{question:ReviewQuestion;answers:StudentAnswer[];selected:string|null;onSelect:(id:string)=>void;missing:boolean;annotations:boolean;onIncludeCorrect:()=>void;filter:string;markedPoints:string[];onKnowledge:(id:string)=>void}) {
 const {question:q,answers}=props,stats=questionAnalyses[q.id]
 const related=[...new Set(q.points.flatMap(p=>p.knowledge))].map(id=>knowledgePoints.find(k=>k.id===id)!)
 return <QuestionAnalysisCard {...props} {...reviewDetailFields(q,related)} contentRecord={{...q.record,figure:[12,17].includes(q.number)?ellipseFigure(q.number,'ui'):q.record.figure}} related={related} options={stats.options?.map(o=>({...o,ratio:o.count/answers.length*100,percent:Math.round(o.count/answers.length*100),students:answers.filter(a=>a.option===o.label).map(a=>a.student),distractor:o.label===stats.distractor}))} groups={q.type==='填空题'?{...props,...makeAnswerGroups(props)}:undefined}/>
}

function reviewDetailFields(q:AnalysisCardQuestion,related:AnalysisKnowledgeLink[]) {
 return {
  teaching:[{label:'核心知识点',value:related.map(k=>k.name).join(' · ')||'未关联'},{label:'教材与章节',value:'尚未关联教材章节'},{label:'考查方法',value:'未关联'},{label:'知识点目录',value:'尚未关联知识点目录'},{label:'认知要求',value:'未关联'},{label:'课程标准',value:'未关联'}],
  archive:[{label:'题目编号',value:q.record.id},{label:'题型与结构',value:`${q.record.kind}${q.record.parts?` · 含 ${q.record.parts.length} 个小问`:''}`},{label:'来源',value:'未提供'},{label:'版本',value:'未提供'},{label:'可用状态',value:'未提供'},{label:'分值',value:`${q.max} 分`}],
 }
}
