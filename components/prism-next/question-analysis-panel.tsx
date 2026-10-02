"use client"
import type {ReactNode} from 'react'
import {Sparkles} from 'lucide-react'
import {Button} from './button'
import {Badge} from './badge'
import {Badge as CossBadge} from '@/components/coss/badge'
import {Rate,ThinBar} from './question-analysis-parts'
import {KnowledgeEvidenceList,type KnowledgeEvidence} from './knowledge-rail'
export type QuestionAnalysisPanelProps = {
 knowledge?:{topic:ReactNode;rate:number;affected:ReactNode;volume:ReactNode;status?:ReactNode;evidence:KnowledgeEvidence[]}|null
 total:ReactNode;kind:string;max:ReactNode;statistics:{mean:ReactNode;sd:ReactNode;d:ReactNode;discrimination:ReactNode;fullRate:ReactNode;zeroRate:ReactNode}
 distribution:number[];affected:ReactNode;rate:number;pending:ReactNode;insight?:ReactNode
 errorAnswers?:{text:string;count:number}[];errorAnswersSlot?:ReactNode;reasons:{text:string;count:number}[];related:{id:string;name:string}[]
 onKnowledge:(id:string)=>void;onEvidence:(question:string,points:string[])=>void
}
/** Values, risk bands and AI descriptions are supplied by the host. */
export function QuestionAnalysisPanel({knowledge:k,total,kind,max,statistics,distribution,affected,rate,pending,insight='选项分析未提供',errorAnswers,errorAnswersSlot,reasons,related,onKnowledge,onEvidence}:QuestionAnalysisPanelProps) {return <section className="space-y-4" aria-label={k?'知识点概况':'本题全班概况'}>{k?<><p className="text-ui-meta text-muted-foreground">{k.topic}</p><Rate value={k.rate} label="知识点本次得分率"/><p className="text-ui-body">受影响 {k.affected} / {total} 名学生</p><p className="text-ui-body">{k.volume} 分 · {k.evidence.length} 道证据题</p>{k.status&&<Badge variant="outline">{k.status}</Badge>}<KnowledgeEvidenceList items={k.evidence} onEvidence={onEvidence}/><p className="text-ui-meta text-muted-foreground">单次试卷不表达长期掌握度</p></>:<><dl data-question-statistics className="grid grid-cols-2 gap-x-3 gap-y-4 whitespace-nowrap text-ui-body tabular-nums"><div><dt className="text-ui-meta text-muted-foreground">平均分</dt><dd>{statistics.mean} / {max}</dd></div><div><dt className="text-ui-meta text-muted-foreground">标准差</dt><dd>{statistics.sd}</dd></div><div><dt className="text-ui-meta text-muted-foreground">区分度</dt><dd className="flex items-center gap-1">{statistics.d} <CossBadge size="sm" variant="outline">{statistics.discrimination}</CossBadge></dd></div><div><dt className="text-ui-meta text-muted-foreground">满分率 · 零分率</dt><dd>{statistics.fullRate}% · {statistics.zeroRate}%</dd></div></dl>
 {kind==='选择题'?<p data-option-insight className="text-ui-body">{insight}</p>:kind==='填空题'?<><div className="flex items-center gap-2 text-ui-body"><span>答对 {distribution[0]} · 答错 {affected}</span><ThinBar value={rate}/></div><h3 className="text-ui-action">典型错误答案</h3>{errorAnswersSlot??(errorAnswers?<ul className="space-y-2 text-ui-body">{errorAnswers.map(g=><li key={g.text}>{g.text} · {g.count} 人</li>)}</ul>:<p className="text-ui-body">未提供</p>)}</>:<><div className="flex h-1 gap-0.5 overflow-hidden rounded-full" aria-label="本题得分分布">{distribution.map((n,i)=><span key={i} className={['bg-muted-foreground','bg-warning','bg-destructive'][i]} style={{flex:n}}/>)}</div><p className="text-ui-meta">满分 {distribution[0]} · 部分 {distribution[1]} · 零分 {distribution[2]}</p><Badge variant="outline">待复核 {pending}</Badge><section className="space-y-2"><h3 className="flex items-center gap-2 text-ui-action"><Sparkles className="size-4"/>主要失分原因 <span className="text-ui-meta text-muted-foreground">AI 归纳</span></h3><ul className="space-y-2 text-ui-meta text-muted-foreground">{reasons.map(r=><li key={r.text}>{r.text} · {r.count} 人</li>)}</ul></section></>}
 <div data-related-knowledge><p className="text-ui-meta text-muted-foreground">关联知识点</p><div className="flex flex-wrap gap-1">{related.map(k=><Button key={k.id} variant="link" className="h-auto sm:h-auto whitespace-normal" onClick={()=>onKnowledge(k.id)}>{k.name}</Button>)}</div></div>
</>}</section>}
