import { questions as frozenQuestions, type Question } from '../paper-review/fixture.ts'
import { reviewQuestions, classStudents, answersForQuestion, knowledgePoints } from './fixture.ts'
/** Parameter-only adapter; the frozen page's default facts and markup are untouched. */
export const linkedPaperRecords=classStudents.map((student,index)=>({name:student.name,examId:student.id,score:reviewQuestions.reduce((sum,q)=>sum+answersForQuestion(q).find(a=>a.student.id===student.id)!.score,0),max:reviewQuestions.reduce((sum,q)=>sum+q.max,0),status:index===1||index===4?'待复核' as const:'已确认' as const}))
export function linkedPaperQuestions(index:number):Question[]{return reviewQuestions.map((q,i)=>{const a=answersForQuestion(q)[index];return {...frozenQuestions[i],type:q.type.replace('题',''),max:q.max,score:a.score,prompt:q.prompt,answer:a.lines,points:q.points.map((p,j)=>({label:p.label,max:p.max,score:a.points[j].score,reason:a.points[j].reason})),knowledge:knowledgePoints.find(k=>k.id===q.knowledge)!.name,evidence:a.annotation,rate:q.rate,affected:q.affected}})}
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
export function linkedPaperImage(page:number,index:number,annotations:boolean){
 const record=linkedPaperRecords[index],qs=linkedPaperQuestions(index),text=(x:number,y:number,s:string,size=16,color='#1F2328')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${esc(s)}</text>`
 const body=qs.filter(q=>q.page===page).map(q=>{const x=q.rect[0]*7.94+10,y=q.rect[1]*11.23;return text(x,y+20,`${q.number}. ${q.knowledge}`,page?19:15)+text(x,y+53,q.answer[0].slice(0,page?36:18),page?18:15,'#1769AA')+(annotations?text(x,y+83,`${q.score===q.max?'✓':'×'} ${q.score}/${q.max}`,17,'#B4233D'):'')}).join('')
 return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123"><rect width="794" height="1123" fill="#FFFFFF"/><g font-family="Songti SC, STSong, serif">${text(52,60,'高一数学期中测试',28)}${text(52,100,`姓名：${record.name} · 考号 ${record.examId}`)}${body}${text(330,1090,`第 ${page+1} / 2 页`)}</g></svg>`)}`
}

export function questionReviewStudentId(name:string,fallback:string){return classStudents.find(student=>student.name===name)?.id??fallback}
