"use client"
import {QuestionAnalysisCard,QuestionAnalysisDetails} from '@/components/prism-next/question-analysis-card'
import type {QuestionDetailTab} from '@/components/prism-next/question-details'
import {knowledgePoints,questionAnalyses,type ReviewQuestion,type StudentAnswer} from './fixture'
import {ellipseFigure} from './question-records'
import {makeAnswerGroups} from './answer-groups'
export function ReviewQuestionDetails(props:{question:ReviewQuestion;related:string[];tab:QuestionDetailTab;onTabChange:(tab:QuestionDetailTab)=>void;scoring:React.ReactNode;onKnowledge:(id:string)=>void}) {
 return QuestionAnalysisDetails({...props,related:props.related.map(id=>knowledgePoints.find(k=>k.id===id)!)})
}
export function QuestionDigitalCard(props:{question:ReviewQuestion;answers:StudentAnswer[];selected:string|null;onSelect:(id:string)=>void;missing:boolean;annotations:boolean;onIncludeCorrect:()=>void;filter:string;markedPoints:string[];onKnowledge:(id:string)=>void}) {
 const {question:q,answers}=props,stats=questionAnalyses[q.id]
 return <QuestionAnalysisCard {...props} contentRecord={{...q.record,figure:[12,17].includes(q.number)?ellipseFigure(q.number,'ui'):q.record.figure}} related={[...new Set(q.points.flatMap(p=>p.knowledge))].map(id=>knowledgePoints.find(k=>k.id===id)!)} options={stats.options?.map(o=>({...o,ratio:o.count/answers.length*100,percent:Math.round(o.count/answers.length*100),students:answers.filter(a=>a.option===o.label).map(a=>a.student),distractor:o.label===stats.distractor}))} groups={q.type==='填空题'?{...props,...makeAnswerGroups(props)}:undefined}/>
}
