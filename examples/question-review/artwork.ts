import { knowledgePoints, type ReviewQuestion, type StudentAnswer } from './fixture.ts'
// Document artwork uses scan coordinates and the frozen paper's light palette.
const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
const text=(x:number,y:number,s:string,size=20,color='#1F2328',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${escape(s)}</text>`
const lines=(s:string,x:number,y:number,size=20,color='#1F2328',length=32)=> (s.match(new RegExp(`.{1,${length}}`,'gu'))??[]).map((v,i)=>text(x,y+i*32,v,size,color)).join('')
const uri=(content:string)=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123" viewBox="0 0 794 1123"><rect width="794" height="1123" fill="#FFFFFF"/><g font-family="Songti SC, STSong, serif">${content}</g></svg>`)}`
export function questionImage(q:ReviewQuestion){
 const ellipse=q.number===17?`<g stroke="#1F2328" fill="none"><path d="M155 362H639 M397 255V467"/><ellipse cx="397" cy="362" rx="220" ry="110"/></g>${text(650,365,'x',18)}${text(402,247,'y',18)}${text(190,390,'F₁',18)}${text(580,390,'F₂',18)}<circle cx="552.6" cy="284.2" r="4" fill="#1F2328"/>${text(559,276,'P(2,1)',18)}`:''
 return uri(text(52,66,`第 ${q.number} 题`,30)+text(52,105,`${q.type} · 满分 ${q.max} 分`,18)+lines(q.prompt,52,160)+ellipse+text(52,520,'标准答案',24)+q.answer.map((s,i)=>lines(s,52,565+i*64,19,'#1F2328',37)).join('')+text(52,780,'评分点',24)+q.points.map((p,i)=>text(64,825+i*85,`${i+1}. ${p.label} · ${p.max} 分`,20)+text(64,855+i*85,p.knowledge.map(id=>knowledgePoints.find(k=>k.id===id)!.name).join(' · '),15)).join(''))
}
export function answerImage(q:ReviewQuestion,a:StudentAnswer,annotations:boolean,missing:boolean){
 if(missing)return uri(text(397,540,'扫描图像未提供',24,'#4B5563','text-anchor="middle"')+text(397,580,`第 ${q.number} 题 · ${a.student.name}`,18,'#4B5563','text-anchor="middle"'))
 return uri(text(52,66,`第 ${q.number} 题 · ${a.student.name}作答`,26)+text(52,105,`考号 ${a.student.examId}`,17)+`<g font-family="KaiTi, STKaiti, serif" font-style="italic" transform="rotate(${Number(a.student.id.slice(-1))%2?-.5:.5} 397 300)">${a.lines.map((s,i)=>lines(s,64,220+i*130,24,'#1769AA',27)).join('')}</g>`+(annotations?text(690,130,`${a.status==='满分'?'✓':'×'} ${a.score}/${q.max}`,28,'#B4233D','text-anchor="end"')+`<path d="M60 692 Q280 685 710 697" fill="none" stroke="#B4233D" stroke-width="2"/>`+lines(a.annotation,60,746,19,'#B4233D',32):''))
}
