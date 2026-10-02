import type { ReviewQuestion, StudentAnswer } from './fixture.ts'

export const rateLabel = (q: Pick<ReviewQuestion, 'category'>) => q.category === 'objective' ? '正确率' : '得分率'
export const discriminationLabel = (d: number) => d >= .4 ? '优秀' : d >= .3 ? '良好' : d >= .2 ? '尚可' : '待改进'
const round1 = (n: number) => Math.round(n * 10) / 10
export function computeQuestionAnalysis(q: ReviewQuestion, answers: StudentAnswer[], totals: Record<string, number>) {
 const n = answers.length, sum = answers.reduce((s,a)=>s+a.score,0), mean = sum/n
 // Whole-paper rank; equal totals use stable exam IDs. Round 27% to nearest integer.
 const ranked = [...answers].sort((a,b)=>totals[b.student.id]-totals[a.student.id] || a.student.id.localeCompare(b.student.id))
 const groupSize = Math.max(1,Math.round(n*.27)), high = ranked.slice(0,groupSize), low = ranked.slice(-groupSize)
 const d = (high.reduce((s,a)=>s+a.score,0)-low.reduce((s,a)=>s+a.score,0))/(groupSize*q.max)
 const distribution = [answers.filter(a=>a.score===q.max).length,answers.filter(a=>a.score>0&&a.score<q.max).length,answers.filter(a=>a.score===0).length] as [number,number,number]
 const options = q.options?.map(o=>({...o,count:answers.filter(a=>a.option===o.label).length,high:high.filter(a=>a.option===o.label).length,low:low.filter(a=>a.option===o.label).length}))
 const distractor = options?.filter(o=>!o.correct).sort((a,b)=>b.count-a.count || a.label.localeCompare(b.label))[0]?.label
 const errors = answers.filter(a=>a.score<q.max)
 const errorAnswers = q.type!=='填空题'||errors.some(a=>a.answerText===undefined)?undefined:[...new Set(errors.map(a=>a.answerText!))].map(text=>({text,students:errors.filter(a=>a.answerText===text)})).sort((a,b)=>b.students.length-a.students.length || a.text.localeCompare(b.text))
 const reasons = [...new Set(answers.flatMap(a=>a.points.flatMap(p=>p.reason?[p.reason]:[])))].map(text=>({text,count:answers.filter(a=>a.points.some(p=>p.reason===text)).length})).sort((a,b)=>b.count-a.count)
 return {rate:Math.round((q.category==='objective'?distribution[0]/n:mean/q.max)*100),mean:round1(mean),sd:round1(Math.sqrt(answers.reduce((s,a)=>s+(a.score-mean)**2,0)/n)),d,discrimination:discriminationLabel(d),groupSize,high:high.map(a=>a.student.id),low:low.map(a=>a.student.id),fullRate:round1(distribution[0]/n*100),zeroRate:round1(distribution[2]/n*100),distribution,pending:answers.filter(a=>a.review==='待复核').length,affected:errors.length,options,distractor,errorAnswers,reasons,pointRates:q.points.map(p=>({id:p.id,rate:Math.round(answers.reduce((s,a)=>s+(a.points.find(x=>x.id===p.id)?.score??0),0)/(n*p.max)*100)}))}
}
export type QuestionAnalysis = ReturnType<typeof computeQuestionAnalysis>
export const questionSorts = [{value:'number',label:'按题号'},{value:'rate',label:'按正确率从低到高'},{value:'discrimination',label:'按区分度从低到高'}]
export function sortQuestions(questions: ReviewQuestion[], mode: string, analyses: Record<string,QuestionAnalysis>) {
 return [...questions].sort((a,b)=>(mode==='rate'?analyses[a.id].rate-analyses[b.id].rate:mode==='discrimination'?analyses[a.id].d-analyses[b.id].d:0)||a.number-b.number)
}
export function sortAnswers(answers: StudentAnswer[]) {
 const rank=(a:StudentAnswer)=>a.review==='待复核'?0:a.status==='零分'?1:a.status==='部分得分'?2:3
 return [...answers].sort((a,b)=>rank(a)-rank(b)||a.student.id.localeCompare(b.student.id))
}
export function objectiveGroups(q: ReviewQuestion, answers: StudentAnswer[], analysis: QuestionAnalysis) {
 const correct=answers.filter(a=>a.score===q.max), wrong=answers.filter(a=>a.score<q.max)
 const errors=q.type==='选择题'?(analysis.options??[]).filter(o=>!o.correct).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)).map(o=>({label:o.label+(o.label===analysis.distractor?' · 主要干扰项':''),students:wrong.filter(a=>a.option===o.label)})):analysis.errorAnswers?.map(g=>({label:g.text,students:wrong.filter(a=>a.answerText===g.text)}))??[{label:'答错学生 · 答案归类未提供',students:wrong}]
 return {errors:errors.filter(g=>g.students.length),correct,correctLabel:q.type==='选择题'?`${analysis.options?.find(o=>o.correct)?.label??'未提供'} · 正确`:'答对'}
}
