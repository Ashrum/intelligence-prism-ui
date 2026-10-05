"use client"
import {useId,useRef,useState} from 'react'
import {Separator} from '@/components/coss/separator'
import {StudentControlBar,StudentControlBarRow,StudentControlHome,StudentControlFilters,StudentControlSwitcher,StudentControlScale,StudentIdentity,type StudentControlItem} from '../student-control-bar'
import {DemoSection} from '../demo-parts'
import {ReviewDemoThemes,reviewFormula} from './review-workspace-fixtures'
import {analysisStudents} from './question-analysis-fixtures'
export function StudentControlBarFixture(){const id=useId(),trigger=useRef<HTMLButtonElement>(null),[selected,setSelected]=useState<string|null>(null),[open,setOpen]=useState(false),[filter,setFilter]=useState('all'),[notice,setNotice]=useState('');const items=analysisStudents.filter(i=>filter==='all'||i.id==='a');return <><div className="relative h-32"><StudentControlBar style={{left:0,maxWidth:'100%'}}><StudentControlBarRow><StudentControlHome active={!selected} onHome={()=>setNotice('已请求：回到题目')}/><Separator orientation="vertical"/><StudentControlFilters value={filter} onValueChange={setFilter} items={[{value:'loss',label:'失分',count:1},{value:'all',label:'全部',count:2}]}/><Separator orientation="vertical"/><StudentControlSwitcher items={items} current={items.find(i=>i.id===selected)??null} groups={['待复核','已确认'].map(value=>({value,items:items.filter(i=>i.group===value)}))} max={12} open={open} onOpenChange={setOpen} onSelect={id=>{setSelected(id);setOpen(false)}} triggerRef={trigger} searchId={id}/></StudentControlBarRow><StudentControlScale items={items.map(i=>({id:i.id,tone:i.tickTone,tooltip:<>{i.name} · {i.scoreText} · {reviewFormula}</>}))} selected={selected} summary={filter==='all'?'2 位学生：满分 1、部分 1、零分 0':'1 位学生：满分 0、部分 1、零分 0'} onSelect={setSelected}/></StudentControlBar></div><p role="status" className="text-ui-hint">{notice||'标准控件保持尺寸，窄容器内横向滚动。'}</p></>}
export function StudentControlBarGradedDemo(){return <DemoSection title="学生控制条 · 筛选、切换与全班刻度" description="身份和分布是外部事实；刻度为鼠标辅助，键盘使用切换与搜索。"><ReviewDemoThemes>{()=> <StudentControlBarFixture/>}</ReviewDemoThemes></DemoSection>}

const ungradedStudents:StudentControlItem[]=[
 analysisStudents[0],
 {id:'ungraded',name:'长中文姓名与待人工批阅身份核对',examId:'20260003',score:null,scoreText:'未给分',status:'评分未知',review:'待人工批阅',ratio:null,identityTone:'neutral',tickTone:'neutral',group:'示例学生'},
 analysisStudents[1],
 {id:'zero',name:'零分同学',examId:'20260004',score:0,scoreText:'0 分',status:'零分',review:'已确认',ratio:0,identityTone:'destructive',tickTone:'destructive',group:'示例学生'},
]
export function StudentControlUngradedFixture(){
 const id=useId(),trigger=useRef<HTMLButtonElement>(null)
 const [selected,setSelected]=useState<string|null>('ungraded'),[open,setOpen]=useState(false),[filter,setFilter]=useState('all')
 const items=ungradedStudents.filter(i=>filter==='all'||(filter==='ungraded'?i.score===null:filter==='graded'?i.score!==null:false))
 const current=items.find(i=>i.id===selected)??null
 return <>
  <div className="relative h-32"><StudentControlBar style={{left:0,maxWidth:'100%'}}><StudentControlBarRow>
   <StudentControlFilters value={filter} onValueChange={value=>{setFilter(value);setSelected(null)}} items={[{value:'all',label:'全部',count:4},{value:'ungraded',label:'未给分',count:1},{value:'graded',label:'已给分',count:3},{value:'empty',label:'无匹配',count:0}]}/>
   <Separator orientation="vertical"/>
   <StudentControlSwitcher items={items} groups={[{value:'示例学生',items}]} current={current} max={12} open={open} onOpenChange={setOpen} onSelect={id=>{setSelected(id);setOpen(false)}} triggerRef={trigger} searchId={id}/>
  </StudentControlBarRow><StudentControlScale items={items.map(i=>({id:i.id,tone:i.tickTone,tooltip:<>{i.name} · {i.scoreText} · {reviewFormula}</>}))} selected={current?.id} summary={filter==='all'?'4 位学生：未给分 1、已给分 3':filter==='ungraded'?'1 位学生：未给分':filter==='graded'?'3 位学生：已给分':'没有匹配的学生'} onSelect={setSelected}/></StudentControlBar></div>
  {current&&<StudentIdentity item={current} className="flex flex-wrap items-center gap-2 text-ui-body"/>}
  <p className="text-ui-hint">示例数据：未给分与 0 分分别显示；打开学生面板核对。{reviewFormula}</p>
 </>
}
export function StudentControlBarDemo(){return <><StudentControlBarGradedDemo/><DemoSection title="含未给分学生" description="未知不等于零分；顺序、筛选集合与刻度文案由调用方提供。"><ReviewDemoThemes>{()=> <StudentControlUngradedFixture/>}</ReviewDemoThemes></DemoSection></>}
