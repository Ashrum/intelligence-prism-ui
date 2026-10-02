"use client"
import {useState} from 'react'
import {Button} from '../button'
import {QuestionAnalysisPanel} from '../question-analysis-panel'
import {DemoSection} from '../demo-parts'
import {ReviewDemoThemes} from './review-workspace-fixtures'
import {analysisPanel,analysisEvidence} from './question-analysis-fixtures'
export function QuestionAnalysisPanelFixture(){const [knowledge,setKnowledge]=useState(false),[notice,setNotice]=useState('');return <div className="space-y-4"><Button variant="outline" onClick={()=>setKnowledge(!knowledge)}>{knowledge?'本题分析':'知识点概况'}</Button><QuestionAnalysisPanel {...analysisPanel} knowledge={knowledge?{topic:'圆锥曲线与参数范围的完整论证',rate:42,affected:21,volume:12,status:'继续观察',evidence:analysisEvidence}:undefined} onKnowledge={id=>{setKnowledge(true);setNotice(`已请求：${id}`)}} onEvidence={(q,p)=>setNotice(`已请求：${q} · ${p.join('、')}`)}/><p role="status" className="text-ui-hint">{notice}</p></div>}
export function QuestionAnalysisPanelDemo(){return <DemoSection title="本题分析与知识点概况" description="统计、AI 归纳及知识点事实由宿主提供，不从组件交互推定结论。"><ReviewDemoThemes>{()=> <QuestionAnalysisPanelFixture/>}</ReviewDemoThemes></DemoSection>}
