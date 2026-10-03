"use client"
import {useState} from 'react'
import {Button} from '../button'
import {QuestionAnalysisPanel} from '../question-analysis-panel'
import {DemoSection} from '../demo-parts'
import {ReviewDemoThemes} from './review-workspace-fixtures'
import {analysisPanel,analysisEvidence} from './question-analysis-fixtures'
export function QuestionAnalysisPanelFixture(){const [knowledge,setKnowledge]=useState(false),[notice,setNotice]=useState('');return <div className="space-y-4"><Button variant="outline" onClick={()=>setKnowledge(!knowledge)}>{knowledge?'本题分析':'知识点概况'}</Button><QuestionAnalysisPanel {...analysisPanel} knowledge={knowledge?{topic:'圆锥曲线与参数范围的完整论证',rate:42,affected:21,volumeText:'12 分 · 1 道证据题',status:'继续观察',evidence:analysisEvidence}:undefined} onKnowledge={id=>{setKnowledge(true);setNotice(`已请求：${id}`)}} onEvidence={(q,p)=>setNotice(`已请求：${q} · ${p.join('、')}`)}/><p role="status" className="text-ui-hint">{notice}</p></div>}
export function QuestionAnalysisPanelDemo(){return <><DemoSection title="本题分析与知识点概况" description="统计、AI 归纳及知识点事实由宿主提供，不从组件交互推定结论。"><ReviewDemoThemes>{()=> <QuestionAnalysisPanelFixture/>}</ReviewDemoThemes></DemoSection><DemoSection title="数据不全" description="统计值、失分原因与知识点关联均可未知；知识点概况不绘制假零值。"><ReviewDemoThemes>{()=> <QuestionAnalysisPanelIncompleteFixture/>}</ReviewDemoThemes></DemoSection></>}

export const incompleteAnalysisPanel={...analysisPanel,statistics:{mean:'未提供',sd:'未提供',d:'未提供',discrimination:'未提供',fullRate:'未提供',zeroRate:'未提供'},reasons:[],related:[],reasonsEmptyText:'失分原因未提供',relatedEmptyText:'本题尚未关联知识点',evidenceEmptyText:'证据清单未提供'}
export function QuestionAnalysisPanelIncompleteFixture(){const [knowledge,setKnowledge]=useState(false);return <div className="space-y-4"><Button variant="outline" onClick={()=>setKnowledge(!knowledge)}>{knowledge?'本题分析':'知识点概况'}</Button><QuestionAnalysisPanel {...incompleteAnalysisPanel} knowledge={knowledge?{topic:'知识点关联信息待补全',rate:null,rateEmptyText:'得分率未提供',affected:'未提供',volumeText:'证据量未提供',evidence:[]}:undefined} onKnowledge={()=>{}} onEvidence={()=>{}}/></div>}
