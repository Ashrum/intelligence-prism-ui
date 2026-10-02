"use client"
import {useId,useState} from 'react'
import {KnowledgeRail,ReviewRailFilter} from '../knowledge-rail'
import {DemoSection} from '../demo-parts'
import {ReviewDemoThemes} from './review-workspace-fixtures'
import {analysisKnowledge} from './question-analysis-fixtures'
export function KnowledgeRailFixture(){const id=useId(),[selected,setSelected]=useState<string|null>('ellipse'),[filter,setFilter]=useState('all'),[notice,setNotice]=useState('');return <><div className="h-[440px]"><KnowledgeRail sections={filter==='empty'?[]:[{id:'conic',label:'圆锥曲线',items:analysisKnowledge}]} selected={selected} onSelect={setSelected} onEvidence={(q,p)=>setNotice(`已请求：${q} · ${p.join('、')}`)} filter={<div className="p-3"><ReviewRailFilter id={id} label="知识点筛选" value={filter} onChange={setFilter} items={[{value:'all',label:'全部',count:1},{value:'empty',label:'无证据',count:0}]}/></div>}/></div><p role="status" className="text-ui-hint">{notice||'↑↓ 选择，Enter 请求定位证据。'}</p></>}
export function KnowledgeRailDemo(){return <DemoSection title="专题与证据 · 受控筛选" description="宿主提供得分率、档位和证据；子行点击只发定位意图。"><ReviewDemoThemes>{()=> <KnowledgeRailFixture/>}</ReviewDemoThemes></DemoSection>}
