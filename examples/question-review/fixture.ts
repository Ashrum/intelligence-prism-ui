import { makeQuestionRecord } from './question-records.ts'
import type { QuestionRecord } from '../../components/prism-next/question-content'
import { computeQuestionAnalysis, sortAnswers } from './analysis.ts'
/** Review host facts. No runtime inference of risk, confirmation or mastery. */
export type Rubric = { id: string; label: string; max: number; knowledge: string[]; rate: number }
export type ReviewQuestion = { record: QuestionRecord; id: string; number: number; type: string; category: 'objective' | 'subjective'; page: number; max: number; rate: number; affected: number; distribution: [number, number, number]; pending: number; highLoss: boolean; tone: 'neutral' | 'warning' | 'destructive'; knowledge: string; weakness: string; prompt: string; answer: string[]; points: Rubric[]; options?: { label: string; count: number; correct: boolean }[] }
export type Knowledge = { id: string; name: string; topic: string; rate: number; affected: number; volume: number; impact: boolean; sufficient: boolean; evidence: { question: string; points: string[] }[] }
const knowledgeSeeds: [string, string, string, number, number][] = [
 ['ellipse-focus','椭圆焦距关系','圆锥曲线',42,21], ['derivative','导数与单调性','函数与导数',55,17], ['parameter','参数方程','圆锥曲线',46,18], ['plane','线面垂直判定','立体几何',61,14], ['probability','条件概率','概率统计',74,9], ['logic','充分必要条件','集合与逻辑',81,6],
 ['sets','集合运算','集合与逻辑',88,4], ['domain','函数定义域','函数与导数',78,8], ['trigonometry','三角恒等变换','三角函数',76,9], ['sequence','等差数列','数列',82,6], ['vector','平面向量','平面解析几何',80,7], ['logarithm','对数运算','函数与导数',83,6], ['parabola','抛物线焦点','圆锥曲线',79,8], ['counting','计数原理','概率统计',75,9], ['extrema','导数与极值','函数与导数',58,18], ['zeros','函数零点','函数与导数',60,16], ['inequality','不等式求解','代数运算',77,9], ['distance','焦距与坐标','圆锥曲线',84,6],
]
const qSeeds: [string, string, string[], string][] = [
 ['logic','设 x∈R，p：x > 1，q：x > 0。p 是 q 的什么条件？',['A. 充分不必要条件；p ⇒ q，q 不能推出 p。'],'充分必要条件'],
 ['logic','设 p：x > 2，q：x > 1，判断 p 与 q 的关系。',['充分不必要条件。'],'逆命题判断'],
 ['sets','集合 A={1,2,3}，B={2,4}，求 A∩B。',['A∩B={2}。'],'集合元素识别'],
 ['domain','求函数 y=√(x−1) 的定义域。',['[1,+∞)。'],'定义域边界'],
 ['trigonometry','若 sin α=3/5 且 α 为锐角，求 cos α。',['cos α=4/5。'],'三角恒等关系'],
 ['derivative','f′(x)=2x−2，填写 f(x) 的单调区间。',['在 (−∞,1) 上递减，在 (1,+∞) 上递增。'],'导数符号判断'],
 ['sequence','等差数列首项为 2，公差为 3，求第 5 项。',['a₅=2+4×3=14。'],'通项公式'],
 ['vector','a=(1,2)，b=(2,1)，求 a·b。',['a·b=1×2+2×1=4。'],'数量积运算'],
 ['logarithm','若 log₂ x=3，求 x。',['x=8。'],'对数与指数互化'],
 ['probability','P(A)=1/2，P(B|A)=1/3，求 P(AB)。',['P(AB)=P(A)P(B|A)=1/6。'],'条件事件识别'],
 ['parabola','求抛物线 y²=4x 的焦点坐标。',['焦点为 (1,0)。'],'焦点参数'],
 ['parameter','已知 x=2cos t，y=sin t（0≤t<2π），求普通方程及焦点。',['x²/4+y²=1；a²=4，b²=1，c²=3。','焦点为 (±√3,0)。'],'参数关系错误'],
 ['counting','从 4 名同学中选 2 人，求不同选法数。',['C₄²=6。'],'组合计数'],
 ['ellipse-focus','椭圆 x²/25+y²/9=1，求焦距并说明理由。',['c²=a²−b²=25−9=16，c=4。','焦距 2c=8。'],'焦距与半焦距混淆'],
 ['inequality','求不等式 x²−3x+2<0 的解集，并写出依据。',['(x−1)(x−2)<0，解集为 (1,2)。'],'符号区间判断'],
 ['derivative','f(x)=x³−3x，求单调区间并讨论函数零点。',['f′(x)=3(x−1)(x+1)。','在 (−∞,−1)、(1,+∞) 递增，在 (−1,1) 递减。','零点为 −√3、0、√3。'],'导数符号与零点讨论'],
 ['ellipse-focus','已知椭圆 C：x²/a²+y²/b²=1（a>b>0），离心率为 √3/2，经过 P(2,1)。求标准方程与两个焦点。',['由 c/a=√3/2 及 a²=b²+c²，得 b²=a²/4。','代入 P(2,1)：4/a²+1/b²=1，得 a²=8，b²=2。','标准方程 x²/8+y²/2=1；焦点 F₁(−√6,0)、F₂(√6,0)。'],'评分点 2 缺失 · 焦点坐标'],
 ['plane','已知 AB⊥AC，AB⊥AD，AC、AD 在平面 ACD 内且相交，证明 AB⊥平面 ACD。',['AC∩AD=A，且两直线均在平面 ACD 内。','AB 同时垂直于 AC、AD，故 AB⊥平面 ACD。'],'证明链不完整'],
 ['probability','P(A)=0.6，P(B|A)=0.4，求 P(AB)，并解释条件事件。',['以 A 为条件事件；P(AB)=P(A)P(B|A)。','代入得 0.6×0.4=0.24。'],'条件概率建模'],
 ['extrema','f(x)=x³−3x，求极值并讨论 f(x)=m 的实根个数。',['极大值为 2，极小值为 −2。','|m|<2 时 3 个实根；|m|=2 时 2 个；|m|>2 时 1 个。'],'极值与交点个数'],
]
const rates = [86,86,89,81,83,72,86,83,89,81,86,41,86,58,61,60,47,61,74,80]
const dist: Record<number, [number,number,number]> = {12:[5,17,14],14:[10,18,8],15:[12,16,8],17:[6,19,11],18:[12,14,10],19:[18,12,6],20:[22,10,4],16:[20,12,4]}
export const reviewQuestions: ReviewQuestion[] = qSeeds.map(([knowledge,prompt,answer,weakness], i) => {
 const number=i+1, subjective=[12,14,15,16,17,18,19,20].includes(number)
 const max=number===16?24:number===19?18:number===2?6:[8,9,11,13].includes(number)?12:subjective?12:4, distribution=dist[number] ?? [Math.round(rates[i]*36/100),0,36-Math.round(rates[i]*36/100)] as [number,number,number]
 const count=number===6?2:[12,16,17,18,19].includes(number)?3:subjective?2:1
 const labels=number===17?['建立离心率关系','联立点 P 与椭圆条件','标准方程与焦点坐标']:number===12?['消去参数','求半轴与焦距关系','写出焦点坐标']:number===18?['识别相交直线','证明两组线线垂直','引用线面垂直判定']:number===6?['判断导数符号','写出单调区间']:Array.from({length:count},(_,p)=>['条件与关系','推导过程','结论与检验'][p])
 const pointMax=number===6?[2,2]:Array.from({length:count},()=>max/count)
 const type=subjective?'解答题':number===6||number===13?'填空题':'选择题'
 return {record:makeQuestionRecord(number,type,max),id:`q${number}`,number,type:subjective?'解答题':number===6||number===13?'填空题':'选择题',category:subjective?'subjective':'objective',page:number<=13?0:1,max,rate:rates[i],distribution,affected:36-distribution[0],pending:2,highLoss:rates[i]<65,tone:rates[i]<45?'destructive':rates[i]<65?'warning':'neutral',knowledge,weakness,prompt,answer,points:labels.map((label,p)=>({id:`p${p+1}`,label,max:pointMax[p],knowledge:[knowledge],rate:rates[i]})), ...(number===1?{options:[{label:'A',count:31,correct:true},{label:'B',count:2,correct:false},{label:'C',count:1,correct:false},{label:'D',count:2,correct:false}]}:{}) }
})
// Explicit evidence references; volume counts each referenced rubric once.
const refs: [number, number[]][][] = [ [[12,[1,2]],[17,[2]],[14,[1]]], [[6,[1,2]],[16,[1,2]]], [[12,[1,2]]], [[18,[1,2,3]]], [[10,[1]],[19,[1,2]]], [[1,[1]],[2,[1]]], [[3,[1]]], [[4,[1]]], [[5,[1]]], [[7,[1]]], [[8,[1]]], [[9,[1]]], [[11,[1]]], [[13,[1]]], [[20,[1,2]]], [[16,[3]],[20,[2]]], [[15,[1,2]]], [[14,[1,2]]] ]
export const knowledgePoints: Knowledge[] = knowledgeSeeds.map(([id,name,topic,rate,affected],i)=>{
 const evidence=refs[i].map(([n,ps])=>({question:`q${n}`,points:ps.map(p=>`p${p}`)}))
 let volume=0
 for(const e of evidence) for(const point of e.points) {const p=reviewQuestions.find(q=>q.id===e.question)!.points.find(p=>p.id===point)!;volume+=p.max;if(!p.knowledge.includes(id))p.knowledge.push(id)}
 return {id,name,topic,rate,affected,evidence,volume,impact:rate<65,sufficient:volume>=12}
})
const seedStudents: [string,string][]=[['0018','张雨桐'],['0020','周可欣'],['0022','陈思远'],['0026','李华'],['0028','王晨'],['0031','林子涵']]
const otherNames=['李思远','陈语安','周子墨','林书宁','王予辰','赵嘉宁','孙悦','吴梓涵','郑宇轩','冯诗涵','蒋明哲','沈若曦','韩沐辰','杨书瑶','朱浩然','秦以安','许思齐','何知远','吕清越','施亦辰','张予安','孔嘉禾','曹明轩','严思宁','华子谦','金雨泽','魏安然','陶心怡','姜亦舟','谢知夏']
export const classStudents=[...seedStudents,...otherNames.map((name,i)=>[String(40+i).padStart(4,'0'),name])].map(([id,name])=>({id:`OLE-ST-${id}`,name,examId:`2026${id}`}))
export type StudentAnswer = {student: typeof classStudents[number]; score:number; status:'满分'|'部分得分'|'零分'; review:'待复核'|'已确认'; points:{id:string;score:number;reason?:string}[]; lines:string[]; annotation:string; option?:string; answerText?:string}
// Ability slots are fixed independently of roster order. Zhang is a middle-level student.
export const abilityOrder = [2,3,5,...Array.from({length:13},(_,i)=>i+6),0,1,4,...Array.from({length:17},(_,i)=>i+19)].map(i=>classStudents[i].id)
// Fixed seed, bounded local variation; two cross-band swaps on subjective questions.
// Q03/Q13 intentionally have weak ability association to demonstrate “待改进”.
const variation=(question:number,rank:number)=>{
 let x=(Math.imul(question+1803,374761393)^Math.imul(rank+1,668265263))>>>0
 x=Math.imul(x^(x>>>13),1274126177)>>>0
 return ((x^(x>>>16))>>>0)/4294967296
}
const profiles=Array.from({length:36},(_,rank)=>({rank,scores:[] as number[]}))
for(const q of reviewQuestions){
 const [full,partial]=q.distribution, remainder=Math.round(q.rate*q.max*36/100)-full*q.max
 const pool=[...Array(full).fill(q.max),...Array.from({length:partial},(_,i)=>Math.floor(remainder/partial)+(i<remainder%partial?1:0)),...Array(36-full-partial).fill(0)]
 const spread=q.number===3||q.number===13?70:q.number===6?20:12
 const order=profiles.map(row=>({row,key:row.rank+(variation(q.number,row.rank)-.5)*spread})).sort((a,b)=>a.key-b.key||a.row.rank-b.row.rank)
 if(partial){
  const high=Array.from({length:10},(_,i)=>i).sort((a,b)=>variation(q.number+40,a)-variation(q.number+40,b))
  const low=Array.from({length:10},(_,i)=>i+26).sort((a,b)=>variation(q.number+80,a)-variation(q.number+80,b))
  for(let i=0;i<2;i++)[order[high[i]],order[low[i]]]=[order[low[i]],order[high[i]]]
 }
 order.forEach(({row},rank)=>row.scores[q.number-1]=pool[rank])
}
// Normalize the generated profiles once to the fixed ability slots; no metric is patched.
profiles.sort((a,b)=>b.scores.reduce((s,n)=>s+n,0)-a.scores.reduce((s,n)=>s+n,0)||a.rank-b.rank)
function generateAnswers(q:ReviewQuestion):StudentAnswer[]{
 const scoreFor=(id:string)=>profiles[abilityOrder.indexOf(id)].scores[q.number-1]
 // Preserve every option histogram, assigning the main distractor to weaker students first.
 const wrong=classStudents.filter(s=>scoreFor(s.id)<q.max).sort((a,b)=>abilityOrder.indexOf(b.id)-abilityOrder.indexOf(a.id))
 const incorrectOptions=q.options?.filter(o=>!o.correct).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)).flatMap(o=>Array(o.count).fill(o.label))
 return classStudents.map((student,i)=>{
  const score=scoreFor(student.id)
  let left=score
  const order=q.number===17?[0,2,1]:q.points.map((_,p)=>p)
  const allocated=q.points.map(()=>0)
  for(const p of order){allocated[p]=Math.min(left,q.points[p].max);left-=allocated[p]}
  const points=q.points.map((p,j)=>({id:p.id,score:allocated[j],...(allocated[j]<p.max?{reason:q.number===17&&j===1?'未把点 P(2,1) 代入，并与 a²=b²+c² 联立，焦点坐标缺少推导依据。':`缺少${p.label}的完整依据。`}:{})}))
  const status=score===q.max?'满分':score===0?'零分':'部分得分'
  const option=q.type==='选择题'?(score===q.max?'A':incorrectOptions![wrong.findIndex(s=>s.id===student.id)]):undefined
  const answerText=q.type==='填空题'?(score===q.max?q.answer.join(' '):q.number===6?['在 (1,+∞) 上递减','在 R 上递增'][i%2]:['8','12'][i%2]):undefined
  const lines=option?[`选择 ${option}${q.number===1&&option==='A'?'：充分不必要条件。':'。'}`]:answerText?[answerText]:score===q.max?q.answer:score===0?(i%2?['设所求结果为 0。','未继续推导。']:['直接写出结论，未列出条件。']):q.number===17?['由 e=c/a=√3/2，得 c=a√3/2。',i%2?'直接令 a=2，故 c=√3。':'取 c=1，焦点为 (±1,0)。','焦点坐标尚缺少联立求解。']:[q.answer[0],i%2?'据此直接得到结论。':'其余条件未继续检验。']
  return {student,score,status,review:i===1||i===4?'待复核':'已确认',points,lines,annotation:score===q.max?(i%2?'推导完整，结论成立。':'条件使用正确。'):points.filter(p=>p.reason).map(p=>p.reason).join(' '),option,answerText}
 })
}
// Capture deterministic per-student facts before deriving aggregate fields.
for(const q of reviewQuestions) if(q.type==='选择题'&&!q.options) q.options=['A','B','C','D'].map(label=>({label,count:label==='A'?q.distribution[0]:Array.from({length:36-q.distribution[0]},(_,i)=>['B','C','D'][(i+q.distribution[0])%3]).filter(value=>value===label).length,correct:label==='A'}))
const answerRecords=Object.fromEntries(reviewQuestions.map(q=>[q.id,generateAnswers(q)]))
export const answersForQuestion=(q:ReviewQuestion):StudentAnswer[]=>answerRecords[q.id]
export const wholePaperTotals=Object.fromEntries(classStudents.map(s=>[s.id,reviewQuestions.reduce((sum,q)=>sum+answerRecords[q.id].find(a=>a.student.id===s.id)!.score,0)]))
export const questionAnalyses=Object.fromEntries(reviewQuestions.map(q=>[q.id,computeQuestionAnalysis(q,answerRecords[q.id],wholePaperTotals)]))
for(const q of reviewQuestions){const stats=questionAnalyses[q.id];Object.assign(q,{rate:stats.rate,distribution:stats.distribution,pending:stats.pending,affected:stats.affected,options:stats.options,highLoss:stats.rate<65,tone:stats.rate<45?'destructive':stats.rate<65?'warning':'neutral'});q.points.forEach(p=>p.rate=stats.pointRates.find(x=>x.id===p.id)!.rate)}
export const questionFilters=[{value:'all',label:'全部',count:20},{value:'subjective',label:'主观题',count:8},{value:'objective',label:'客观题',count:12},{value:'loss',label:'高失分',count:6}]
export const knowledgeFilters=[{value:'all',label:'全部',count:18},{value:'impact',label:'影响较大',count:6},{value:'sufficient',label:'证据充分',count:12},{value:'observe',label:'继续观察',count:6}]
export const filterQuestions=(filter:string)=>reviewQuestions.filter(q=>filter==='all'||filter===q.category||filter==='loss'&&q.highLoss)
export const filterKnowledge=(filter:string)=>knowledgePoints.filter(k=>filter==='all'||filter==='impact'&&k.impact||filter==='sufficient'&&k.sufficient||filter==='observe'&&!k.sufficient)
export const filterAnswers=(answers:StudentAnswer[],filter:string)=>sortAnswers(answers.filter(a=>filter==='all'||filter==='loss'&&a.status!=='满分'||filter==='pending'&&a.review==='待复核'))
export function reviewSelection(params:URLSearchParams){const raw=params.get('question')?.replace(/^q0?/,'');return {question:reviewQuestions.find(q=>String(q.number)===raw)?.id??'q17',student:classStudents.find(s=>s.id===params.get('student'))?.id??classStudents[0].id}}
