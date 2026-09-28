"use client"
import {useState} from 'react'
import {useTheme} from 'next-themes'
import {paperCategoryCandidate} from '@/lib/prism-next/chart-color'
import {PaperPaletteReview} from './paper-palette-review'
import {Button} from '@/components/coss/button'
import {QuestionSelect} from '../question-controls'
import {DemoSection} from '../demo-parts'
import {StatusComposition} from '../data-display'
import {PairedDotChart,type PairedRow} from '../charts/paired-dot-chart'
import {QuadrantScatterChart} from '../charts/scatter-chart'
import {ComboChart,type ComboAxis} from '../charts/combo-chart'
import {useChartTheme} from '../charts/chart-theme'
import type {ScatterPoint} from '@/lib/prism-next/chart-data'

const info:Record<string,[string,string,string]>={
 'status-composition':['状态组成','同时呈现数量与占比；选择由外部管理。','<StatusComposition items={items} unit="人"\n  selectedId={selectedId} onSelect={setSelectedId} />'],
 'paired-dot-chart':['成对指标','同一尺度比较两个指标；相等的值仍可通过形状和上下位置区分。','<PairedDotChart data={rows} metrics={metrics}\n  domain={[0, 100]} unit="%" label={label}\n  onSelect={(rowId, metricId) => select(rowId, metricId)} />'],
 'quadrant-chart':['四象限散点','分组、阈值与象限名称均从外部传入。','<QuadrantScatterChart data={points} groups={groups}\n  xDomain={xRange} yDomain={yRange}\n  quadrants={{ x, y, labels }}\n  label={label} xLabel={xLabel} yLabel={yLabel} />'],
 'combo-chart':['柱线组合','共享分类轴；不同单位分别绑定、标注左右坐标轴。','<ComboChart categories={periods} axes={axes}\n  series={series} label={label}\n  onSelect={(categoryId, seriesId) => select(categoryId, seriesId)} />']
}
export function ReferenceChartDemo({kind}:{kind:string}){
 const [source,setSource]=useState('learning'),[empty,setEmpty]=useState(false),[selected,setSelected]=useState(''),[selection,setSelection]=useState('')
 const [candidate,setCandidate]=useState(true);const {theme}=useTheme();const chartTheme=useChartTheme()
 const colors=kind==='status-composition'&&theme==='paper'&&candidate?paperCategoryCandidate:chartTheme.colors
 const [title,description,code]=info[kind],learning=source==='learning',edge=source==='edge'
 const select=(id:string,seriesId?:string)=>{setSelected(id);setSelection(`${id}${seriesId?` · ${seriesId}`:''}`)}
 const composition=(edge?[{id:'zero',label:'零值',value:0},{id:'missing',label:'缺测',value:null}]:learning?[
  {id:'stable',label:'稳定保持',value:10},{id:'consolidating',label:'正在巩固',value:11},{id:'verification',label:'已纠正待验证',value:7},{id:'support',label:'需要支持',value:5},{id:'declining',label:'近期回落',value:2},{id:'insufficient',label:'证据不足',value:7}
 ]:[{id:'done',label:'已完成',value:36},{id:'running',label:'处理中',value:18},{id:'queued',label:'待处理',value:12},{id:'held',label:'已暂停',value:4}]).map((d,i)=>({...d,color:[colors[0],colors[2],colors[4],colors[3],colors[1],colors[5]][i]}))
 const paired:PairedRow[]=edge?[
  {id:'bounds',label:'范围两端',first:0,second:100},{id:'equal',label:'相同数值',first:50,second:50},{id:'close',label:'接近数值',first:50,second:50.1},{id:'missing',label:'单项缺测',first:null,second:35}
 ]:learning?[
  {id:'Q15',label:'Q15 碰撞后速度',first:52,second:44},{id:'Q7',label:'Q7 单摆周期实验',first:45,second:33},{id:'Q12',label:'Q12 多普勒频率变化',first:36,second:25}
 ]:[{id:'device-a',label:'设备 A',first:62,second:84},{id:'device-b',label:'设备 B',first:48,second:55},{id:'device-c',label:'设备 C',first:90,second:90}]
 const scatter:ScatterPoint[]=edge?[
  {id:'threshold',label:'分界点',x:70,y:0,group:'a'},{id:'overlap-a',label:'同坐标 A',x:60,y:3,group:'a'},{id:'overlap-b',label:'同坐标 B',x:60,y:3,group:'b'},{id:'missing',label:'缺少横轴值',x:null,y:-2,group:'b'}
 ]:learning?[
  {id:'course-3',label:'必修三 72%',x:72,y:5,group:'a'},{id:'course-2',label:'必修二 59%',x:59,y:-5.5,group:'a'},{id:'momentum',label:'动量 62%',x:62,y:-3.2,group:'b'},{id:'collision',label:'碰撞 55%',x:55,y:-5.2,group:'b'}
 ]:[{id:'east',label:'东区',x:84,y:4,group:'a'},{id:'west',label:'西区',x:62,y:2,group:'a'},{id:'new',label:'新渠道',x:56,y:-2,group:'b'},{id:'direct',label:'直营',x:78,y:-4,group:'b'}]
 const periods=Array.from({length:8},(_,i)=>({id:`W${i+1}`,label:`W${i+1}`}))
 const bar:(number|null)[]=edge?[0,168,null,248,0,null,284,336]:learning?[0,168,0,248,212,0,284,336]:[120,168,144,220,180,192,284,300]
 const line:(number|null)[]=edge?[0,1,null,2,3,null,4,6]:learning?[0,1,1,2,3,3,4,6]:[2,3,2.5,4,3,3,5,6]
 const axes:[ComboAxis,ComboAxis]=[{id:'count',label:learning||edge?'有效作答':'处理数量',unit:learning||edge?'次':'件',domain:[0,336]},{id:'secondary',label:learning||edge?'累计已解析任务':'处理用时',unit:learning||edge?'份':'小时',domain:[0,6]}]
 return <DemoSection title={title} description={description}>
  <div className="mb-6 flex flex-wrap items-center gap-3"><QuestionSelect label="组件数据集" value={source} items={[{value:'learning',label:'学习数据'},{value:'operations',label:'运营数据'},{value:'edge',label:'边界与缺测'}]} onChange={value=>{setSource(value);setSelected('');setSelection('');setEmpty(false)}}/><Button variant="outline" aria-pressed={empty} onClick={()=>{setEmpty(!empty);setSelected('');setSelection('')}}>{empty?'恢复数据':'查看空数据'}</Button></div>
  {kind==='status-composition'&&<PaperPaletteReview candidate={candidate} onChange={setCandidate}/>}
  <div className="analytics-panel">
   {kind==='status-composition'&&<StatusComposition label={learning?'学生学习进展状态分布':'分类数量分布'} items={empty?[]:composition} unit={learning?'人':'项'} selectedId={selected} onSelect={select}/>}
   {kind==='paired-dot-chart'&&<PairedDotChart label={learning?'错题影响与复现':'双指标对比'} data={empty?[]:paired} metrics={[{id:'first',label:learning?'错误影响':'指标 A',color:colors[1]},{id:'second',label:learning?'错误复现':'指标 B',color:colors[3]}]} unit="%" domain={[0,100]} selectedId={selected} onSelect={select}/>}
   {kind==='quadrant-chart'&&<QuadrantScatterChart label={learning?'课程与知识点聚焦':'表现与变化'} data={empty?[]:scatter} groups={[{id:'a',label:learning?'课程':'分组 A',symbol:'circle',color:colors[0]},{id:'b',label:learning?'知识点':'分组 B',symbol:'diamond',color:colors[3]}]} xLabel={learning?'当前表现':'完成率'} xUnit="%" yLabel="变化" unit="pp" xDomain={[50,90]} yDomain={[-6,6]} quadrants={{x:70,y:0,labels:['较低 · 改善','较高 · 改善','较低 · 回落','较高 · 回落']}} selectedId={selected} onSelect={select}/>}
   {kind==='combo-chart'&&<ComboChart label={learning||edge?'可分析证据趋势':'数量与用时'} categories={empty?[]:periods} axes={axes} series={[{id:'count',label:learning||edge?'新增有效作答':'处理数量',type:'bar',axisId:'count',color:colors[0],data:empty?[]:periods.map((p,i)=>({id:p.id,value:bar[i]}))},{id:'secondary',label:learning||edge?'累计已解析任务':'处理用时',type:'line',axisId:'secondary',color:colors[2],data:empty?[]:periods.map((p,i)=>({id:p.id,value:line[i]}))}]} selectedId={selected} onSelect={select}/>}
  </div>
  <p role="status" className="mt-4 min-h-5 text-ui-hint text-muted-foreground">{selection?`已选项目：${selection}`:'点击图形、分类或数据表，选择结果由外部接收。'}</p>
  {kind==='status-composition'&&<section id="compact-composition" className="mt-6 space-y-4"><h3 className="text-block-title">紧凑状态组成</h3><p className="text-ui-hint text-muted-foreground">只读条保留完整数量和占比说明；可选择条保留操作高度。</p><StatusComposition density="compact" label="紧凑只读分类" items={empty?[]:composition} unit={learning?'人':'项'}/><StatusComposition density="compact" label="紧凑可选分类" items={empty?[]:composition} unit={learning?'人':'项'} selectedId={selected} onSelect={select}/></section>}
  <details className="mt-6 text-ui-body"><summary className="cursor-pointer text-muted-foreground">组件接口与边界</summary><p className="mt-3 leading-7">以上为可替换的演示数据。组件接收数据、标签、单位与回调，不读取业务状态，也不内置跳转、统计结论或诊断。零值与缺测分别处理。</p><pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-4 text-ui-hint">{code}</pre></details>
 </DemoSection>
}
