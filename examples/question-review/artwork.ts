import { knowledgePoints, answersForQuestion, type ReviewQuestion, type StudentAnswer } from './fixture.ts'
// Scan-coordinate typography matches paper-review/fixture.ts (794 px source width).
export const PAPER_TYPE = { body:17, secondary:15, heading:20, title:24, handwriting:19, lineHeight:33, score:20, annotation:15 } as const
export const PAPER_WIDTH=794
const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
const text=(x:number,y:number,s:string,size:number=PAPER_TYPE.body,color='#1F2328',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${escape(s)}</text>`
const wrap=(s:string,length=38)=>s.match(new RegExp(`.{1,${length}}`,'gu'))??[]
const lines=(s:string,x:number,y:number,size:number=PAPER_TYPE.body,color='#1F2328',length=38,leading=28)=>wrap(s,length).map((v,i)=>text(x,y+i*leading,v,size,color)).join('')
const uri=(content:string,height:number)=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${PAPER_WIDTH}" height="${height}" viewBox="0 0 ${PAPER_WIDTH} ${height}"><rect width="${PAPER_WIDTH}" height="${height}" fill="#FFFFFF"/><g font-family="Songti SC, STSong, serif">${content}</g></svg>`)}`
export function questionLayout(q:ReviewQuestion){
 const answerY=128+wrap(q.prompt).length*28+(q.number===17?248:24)
 const pointY=answerY+42+q.answer.reduce((sum,s)=>sum+wrap(s).length*28+8,0)+36
 return {width:PAPER_WIDTH,height:pointY+q.points.length*72+28,answerY,pointY}
}
export function questionPointRect(q:ReviewQuestion,index:number):[number,number,number,number]{const l=questionLayout(q);return [6,(l.pointY+12+index*72)/l.height*100,88,65/l.height*100]}
export function answerHeight(q:ReviewQuestion){
 if(q.category==='objective')return q.type==='填空题'?180:120
 const content=Math.max(...answersForQuestion(q).map(a=>54+a.lines.reduce((n,s)=>n+wrap(s,34).length,0)*PAPER_TYPE.lineHeight+36+wrap(a.annotation,43).length*23+28))
 return Math.max(260,Math.min(420,content))
}
export function questionImage(q:ReviewQuestion){
 const l=questionLayout(q),cy=l.answerY-130
 const ellipse=q.number===17?`<g stroke="#1F2328" fill="none"><path d="M155 ${cy}H639 M397 ${cy-112}V${cy+110}"/><ellipse cx="397" cy="${cy}" rx="200" ry="100"/></g>${text(650,cy,'x',15)}${text(402,cy-114,'y',15)}${text(208,cy+25,'F₁',15)}${text(565,cy+25,'F₂',15)}<circle cx="538.4" cy="${cy-70.7}" r="4" fill="#1F2328"/>${text(545,cy-78,'P(2,1)',15)}`:''
 let y=l.answerY+38
 const answer=q.answer.map(s=>{const value=lines(s,52,y);y+=wrap(s).length*28+8;return value}).join('')
 return uri(text(52,48,`第 ${q.number} 题`,PAPER_TYPE.title)+text(52,80,`${q.type} · 满分 ${q.max} 分`,PAPER_TYPE.secondary)+lines(q.prompt,52,124)+ellipse+text(52,l.answerY,'标准答案',PAPER_TYPE.heading,'#1F2328','font-weight="bold"')+answer+text(52,l.pointY,'评分点',PAPER_TYPE.heading,'#1F2328','font-weight="bold"')+q.points.map((p,i)=>text(64,l.pointY+32+i*72,`${i+1}. ${p.label} · ${p.max} 分`)+text(64,l.pointY+57+i*72,p.knowledge.map(id=>knowledgePoints.find(k=>k.id===id)!.name).join(' · '),PAPER_TYPE.secondary)).join(''),l.height)
}
export function answerImage(q:ReviewQuestion,a:StudentAnswer,annotations:boolean,missing:boolean){
 const height=answerHeight(q)
 if(missing)return uri(text(397,height/2,'扫描图像未提供',PAPER_TYPE.body,'#4B5563','text-anchor="middle"'),height)
 let y=54
 const writing=a.lines.map(s=>{const content=lines(s,52,y,PAPER_TYPE.handwriting,'#1769AA',34,PAPER_TYPE.lineHeight);y+=wrap(s,34).length*PAPER_TYPE.lineHeight;return content}).join('')
 const annotation=q.category==='objective'?(a.status==='满分'?'答案正确。':q.weakness):a.annotation
 return uri(`<g font-family="KaiTi, STKaiti, serif" font-style="italic" transform="rotate(${Number(a.student.id.slice(-1))%2?-.5:.5} 397 ${height/2})">${writing}</g>`+(annotations?text(742,30,`${a.status==='满分'?'✓':'×'} ${a.score}/${q.max}`,PAPER_TYPE.score,'#B4233D','text-anchor="end"')+lines(annotation,52,Math.max(y+24,height-28-(wrap(annotation,43).length-1)*23),PAPER_TYPE.annotation,'#B4233D',43,23):''),height)
}
