"use client"
import {QuestionAnalysisGroups} from '@/components/prism-next/question-analysis-groups'
import {objectiveGroups} from './analysis'
import {questionAnalyses,type ReviewQuestion,type StudentAnswer} from './fixture'
import {reviewText} from './question-records'
import {answerImage} from './artwork'
export {PaperPreviewGroup as FullScoreGroup} from '@/components/prism-next/paper-preview-group'
export function makeAnswerGroups({question:q,answers,annotations,missing}:{question:ReviewQuestion;answers:StudentAnswer[];annotations:boolean;missing:boolean}) {
 const groups=objectiveGroups(q,answers,questionAnalyses[q.id])
 return {empty:!answers.length,groups:{correct:groups.correct.map(a=>a.student),correctLabel:groups.correctLabel,errors:groups.errors.map(g=>({label:q.number===6?reviewText(g.label.replace('(1,+∞)','$(1,+\\infty)$').replace(' R ',' $\\mathbb R$ ')):q.number===13&&/^\d+$/.test(g.label)?reviewText(`$${g.label}$`):g.label,students:g.students.map(a=>a.student),image:q.type==='填空题'?{src:answerImage(q,g.students[0],annotations,missing),alt:`${g.students[0].student.name} · 代表性作答裁切`}:undefined}))}}
}
export function AnswerGroups(props:Parameters<typeof makeAnswerGroups>[0]&{selected:string|null;onSelect:(id:string)=>void;onIncludeCorrect:()=>void;filter:string}) {return <QuestionAnalysisGroups {...props} {...makeAnswerGroups(props)}/>}
