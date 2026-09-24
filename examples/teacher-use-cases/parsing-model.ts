import type { ScenarioId } from './data'

export type Stage = 'intake' | 'scope' | 'processing' | 'review' | 'saved' | 'handoff'
export type SourcePage = { id: string; label: string; role: 'questions' | 'answers' | 'student'; quality: 'clear' | 'blurred'; selected: boolean; status: 'waiting' | 'done' | 'failed'; revision: number }
export type Question = { id: string; number: string; stem: string; answer: string; source: string[]; checked: boolean; sourceVersion: string }
export type SavedResult = { title:string; version:number; at:string; bank:string; questions:Question[]; pages:SourcePage[] }
export type ParsingTask = { schema: 1; requirements?: string; id: string; scenario: ScenarioId; stage: Stage; title: string; pages: SourcePage[]; purpose: '' | 'questions' | 'with-answers' | 'student'; grouping: '' | 'one' | 'separate'; phase: number; failure: boolean; retryOnly: boolean; questions: Question[]; bank: string; version: number; savedAt: string | null; savedResult?:SavedResult; previousQuestions?:Question[]; answerLinked: boolean; handoff: boolean }
export const stageIndex: Record<Stage,number> = { intake:0, scope:1, processing:2, review:3, saved:4, handoff:1 }
export const executionLabels = ['材料检查', '题目与公式识别', '题目结构整理']
export function emptyTask(scenario: ScenarioId='images'): ParsingTask {
 return { schema:1,id:`parsing-${scenario}`,scenario,stage:'intake',title:scenario==='single'?'一道函数练习':scenario==='scan'?'纸质练习扫描整理':'函数与不等式 · 课堂练习',pages:[],purpose:'',grouping:'',phase:0,failure:false,retryOnly:false,questions:[],bank:'我的教学题库',version:0,savedAt:null,answerLinked:false,handoff:false }
}
export function sampleTask(scenario: ScenarioId): ParsingTask {
 const count=scenario==='single'?1:scenario==='student'?2:3
 const pages:SourcePage[]=Array.from({length:count},(_,i)=>({id:`p${i+1}`,label:scenario==='answers'&&i===2?'参考答案 · 第 1 页':`练习 · 第 ${i+1} 页`,role:scenario==='answers'&&i===2?'answers':scenario==='student'?'student':'questions',quality:scenario==='scan'&&i===2?'blurred':'clear',selected:true,status:'waiting',revision:1}))
 return {...emptyTask(scenario),stage:'scope',pages,purpose:scenario==='student'?'':scenario==='answers'?'with-answers':'questions',grouping:scenario==='scan'?'':'one'}
}
export function startProblem(task:ParsingTask):string {
 if(!task.title.trim())return '请填写材料名称。'
 if(!task.pages.some(p=>p.selected))return '至少选择一页材料。'
 if(!task.purpose)return '请先确认是提取题目，还是处理学生作答。'
 if(!task.grouping)return '请先确认这些页面属于一份还是多份材料。'
 if(task.grouping==='separate')return '本轮只演示一份材料；请先选择同一份材料的页面。多份独立任务已纳入用例规划。'
 if(task.pages.some(p=>p.selected&&p.quality==='blurred'))return '第 3 页模糊，请替换该页后再开始。'
 if(task.purpose==='with-answers'&&!task.pages.some(p=>p.selected&&p.role==='answers'))return '需要选择参考答案页，或改为仅提取题目。'
 return ''
}
function candidateQuestions(task:ParsingTask):Question[] {
 const success=new Set(task.pages.filter(p=>p.selected&&p.status==='done').map(p=>p.id))
 const answer=task.purpose==='with-answers'&&success.has('p3')
 const seeds=[{id:'q1',number:'1',stem:'已知函数 f(x) = x² − 2x + 1，x ∈ R。求 f(x) 的最小值，并写出取到最小值时 x 的值。',answer:answer?'最小值为 0，此时 x = 1。':'',source:['p1']}, ...(task.scenario==='single'?[]:[{id:'q2',number:'2',stem:'已知函数 g(x) = x² − 4x + 3。\n（1）将 g(x) 写成配方形式。\n（2）当 0 ≤ x ≤ 3 时，求 g(x) 的最小值与最大值。',answer:answer?'（1）g(x) = (x − 2)² − 1。\n（2）最小值为 −1，最大值为 3。':'',source:task.scenario==='answers'||task.scenario==='student'?['p2']:['p2','p3']}])]
 return seeds.filter(q=>q.source.every(id=>success.has(id))).map(q=>{
  const refs=answer?[...q.source,'p3']:q.source
  const sourceVersion=refs.map(id=>`${id}:${task.pages.find(p=>p.id===id)?.revision}`).join('|')
  const old=task.questions.find(x=>x.id===q.id&&x.sourceVersion===sourceVersion)
  return old??{...q,source:refs,checked:false,sourceVersion}
 })
}
export type ParsingAction =
 | {type:'sample';scenario:ScenarioId}
 | {type:'scope';purpose?:ParsingTask['purpose'];grouping?:ParsingTask['grouping'];title?:string;requirements?:string}
 | {type:'select-page';id:string;selected:boolean}
 | {type:'move';id:string;direction:-1|1}
 | {type:'replace';id:string}
 | {type:'failure';value:boolean}
 | {type:'start'} | {type:'advance'} | {type:'retry'} | {type:'back'}
 | {type:'edit';id:string;stem?:string;answer?:string} | {type:'check';id:string}
 | {type:'apply-change';id:string;before:string;after:string}
 | {type:'link-answer';value:boolean} | {type:'bank';value:string}
 | {type:'save';at:string} | {type:'revise'} | {type:'handoff'}
export function saveProblem(t:ParsingTask):string {
 if(t.stage!=='review')return '请先完成解析与核对。'
 if(missingSource(t))return '跨页题原稿不完整，请补齐第 2、3 页后重新解析。'
 if(t.pages.some(p=>p.selected&&p.status!=='done'))return '仍有页面未完成，请先处理失败或未完成的页面。'
 if(!t.questions.length)return '没有可保存的题目；请返回材料范围补齐题干页。'
 if(t.purpose==='with-answers'&&!t.answerLinked)return '请确认参考答案与题号对应无误。'
 if(t.questions.some(q=>!q.checked||!q.stem.trim()))return '请逐题核对，空题干不能确认。'
 if(!t.bank.trim())return '请选择保存位置。'
 return ''
}
export function missingSource(t:ParsingTask):boolean {
 if(!['images','pdf','scan'].includes(t.scenario))return false
 const ids=t.pages.filter(p=>p.selected).map(p=>p.id)
 return ids.includes('p2')!==ids.includes('p3')
}
export function parsingReducer(t:ParsingTask,a:ParsingAction):ParsingTask {
 if(a.type==='sample')return sampleTask(a.scenario)
 if(a.type==='scope'&&t.stage==='scope')return {...t,...(a.purpose!==undefined?{purpose:a.purpose}:{}),...(a.grouping!==undefined?{grouping:a.grouping}:{}),...(a.title!==undefined?{title:a.title}:{}),...(a.requirements!==undefined?{requirements:a.requirements.slice(0,500)}:{})}
 if(a.type==='select-page'&&t.stage==='scope')return {...t,pages:t.pages.map(p=>p.id===a.id?{...p,selected:a.selected}:p)}
 if(a.type==='move'&&t.stage==='scope'){const i=t.pages.findIndex(p=>p.id===a.id),j=i+a.direction;if(i<0||j<0||j>=t.pages.length)return t;const pages=[...t.pages];[pages[i],pages[j]]=[pages[j],pages[i]];return {...t,pages}}
 if(a.type==='replace'&&(t.stage==='scope'||t.stage==='review')){
  const pages=t.pages.map(p=>p.id===a.id?{...p,quality:'clear' as const,revision:p.revision+1,status:'waiting' as const}:p)
  const questions=t.questions.filter(q=>!q.source.includes(a.id))
  return {...t,pages,questions,previousQuestions:t.questions.filter(q=>q.source.includes(a.id)),answerLinked:false,stage:t.stage==='review'?'processing':'scope',phase:0,retryOnly:t.stage==='review',failure:false}
 }
 if(a.type==='failure'&&t.stage==='scope')return {...t,failure:a.value}
 if(a.type==='start'&&t.stage==='scope'&&!startProblem(t))return t.purpose==='student'?{...t,stage:'handoff',handoff:false}:{...t,stage:'processing',phase:0,questions:[],pages:t.pages.map(p=>({...p,status:'waiting'})),answerLinked:false}
 if(a.type==='advance'&&t.stage==='processing'){
  if(t.phase<2)return {...t,phase:t.phase+1}
  const failPage=t.pages.filter(p=>p.selected)[1]?.id??t.pages.find(p=>p.selected)?.id
  const next={...t,stage:'review' as const,pages:t.pages.map(p=>!p.selected||p.status==='done'?p:{...p,status:t.failure&&!t.retryOnly&&p.id===failPage?'failed' as const:'done' as const})}
  return {...next,questions:candidateQuestions(next)}
 }
 if(a.type==='retry'&&t.stage==='review'&&t.pages.some(p=>p.status==='failed'))return {...t,stage:'processing',phase:1,retryOnly:true,pages:t.pages.map(p=>p.status==='failed'?{...p,status:'waiting'}:p)}
 if(a.type==='back'&&(t.stage==='review'||t.stage==='handoff'))return {...t,stage:'scope',questions:[],pages:t.pages.map(p=>({...p,status:'waiting'})),answerLinked:false}
 if(a.type==='edit'&&t.stage==='review')return {...t,questions:t.questions.map(q=>q.id===a.id?{...q,...(a.stem!==undefined?{stem:a.stem}:{}),...(a.answer!==undefined?{answer:a.answer}:{}),checked:false}:q)}
 if(a.type==='apply-change'&&t.stage==='review'&&a.after.trim())return {...t,questions:t.questions.map(q=>q.id===a.id&&q.stem===a.before?{...q,stem:a.after,checked:false}:q)}
 if(a.type==='check'&&t.stage==='review')return {...t,questions:t.questions.map(q=>q.id===a.id&&q.stem.trim()?{...q,checked:true}:q)}
 if(a.type==='link-answer'&&t.stage==='review')return {...t,answerLinked:a.value,questions:t.questions.map(q=>({...q,checked:false}))}
 if(a.type==='bank'&&t.stage==='review')return {...t,bank:a.value}
 if(a.type==='save'&&!saveProblem(t))return {...t,stage:'saved',version:t.version+1,savedAt:a.at,savedResult:{title:t.title,version:t.version+1,at:a.at,bank:t.bank,questions:t.questions.map(q=>({...q,source:[...q.source]})),pages:t.pages.map(p=>({...p}))}}
 if(a.type==='revise'&&t.stage==='saved')return {...t,stage:'review',questions:t.questions.map(q=>({...q,checked:false}))}
 if(a.type==='handoff'&&t.stage==='handoff')return {...t,handoff:true}
 return t
}
export function taskInstruction(t:ParsingTask):string {
 const purpose=t.purpose==='student'?'将学生作答整理到批阅准备，保留原始材料，不评分':t.purpose==='with-answers'?'提取题目，并单独整理原稿提供的参考答案':'提取题目；排除学生手写作答，不生成参考答案'
 return `请整理「${t.title}」。处理 ${t.pages.filter(p=>p.selected).length} 页，按当前确认的页序作为一份材料。${purpose}。保留题号、跨页与子题关系，并为每题关联原稿页码。不确定内容标为待核对，教师确认后再保存。${t.requirements?.trim()?` 补充要求：${t.requirements.trim()}`:''}`
}
export function restoreTask(raw:string|null):ParsingTask|null {
 try{const t=JSON.parse(raw??'null');if(!t||t.schema!==1||!['single','images','pdf','scan','answers','student'].includes(t.scenario)||!['intake','scope','processing','review','saved','handoff'].includes(t.stage)||!Array.isArray(t.pages)||!Array.isArray(t.questions)||typeof t.title!=='string'||typeof t.bank!=='string'||(t.requirements!==undefined&&(typeof t.requirements!=='string'||t.requirements.length>500))||!Number.isInteger(t.version)||!Number.isInteger(t.phase))return null;if(!t.pages.every((p:SourcePage)=>typeof p.id==='string'&&typeof p.label==='string'&&['questions','answers','student'].includes(p.role)&&['clear','blurred'].includes(p.quality)&&['waiting','done','failed'].includes(p.status)&&typeof p.selected==='boolean'&&Number.isInteger(p.revision))||!t.questions.every((q:Question)=>typeof q.id==='string'&&typeof q.stem==='string'&&typeof q.answer==='string'&&Array.isArray(q.source)&&typeof q.sourceVersion==='string'&&typeof q.checked==='boolean'))return null;return t as ParsingTask}catch{return null}
}
