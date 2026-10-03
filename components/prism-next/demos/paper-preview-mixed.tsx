"use client"
import {useRef,useState} from 'react'
import {PaperPreviewMixed,PaperPreviewGroup,type PaperPreviewMixedPage,type PaperPreviewZoom} from '../paper-preview'
import {QuestionAnalysisCard} from '../question-analysis-card'
import {DemoSection} from '../demo-parts'
import {Button} from '../button'
import {ReviewDemoThemes} from './review-workspace-fixtures'
import {analysisQuestion,analysisKnowledge} from './question-analysis-fixtures'
export function MixedPreviewFixture(){const viewport=useRef<HTMLDivElement>(null),[open,setOpen]=useState(false),[zoom,setZoom]=useState<PaperPreviewZoom>('width'),[notice,setNotice]=useState('');const pages:PaperPreviewMixedPage[]=[{id:'question',width:794,height:1,content:<QuestionAnalysisCard question={analysisQuestion} related={analysisKnowledge} selected={null} onSelect={id=>setNotice(id)} onIncludeCorrect={()=>setOpen(true)} filter="all" markedPoints={[]} onKnowledge={id=>setNotice(id)}/>},{id:'full-group',width:794,height:1,content:<PaperPreviewGroup count={1} open={open} onOpenChange={setOpen}/>}];if(open)pages.push({id:'student',width:794,height:273,alt:'扫描图像未提供'});return <><Button variant="outline" onClick={()=>setZoom(zoom==='width'?'page':'width')}>切换适合页面 / 宽度</Button><div className="h-[560px] min-w-0 overflow-hidden"><PaperPreviewMixed viewportRef={viewport} pages={pages} zoom={zoom} rotations={{}} selected="student" scale={1} activePage="student" topInset={68} headers={{student:<p className="text-ui-body">长中文姓名 · 纸外身份</p>}} answerLabel="学生作答 · 全部 1" onSelect={setNotice} onZoom={setZoom} onVisiblePage={()=>{}} onViewport={()=>{}} beforeContent={<p className="text-ui-meta">前置内容 · 按完整证据核对</p>}/></div><p role="status" className="text-ui-hint">{notice}</p></>}
export function MixedPaperPreviewDemo(){return <DemoSection title="数字题目与扫描混排" description="数字内容不跟随扫描旋转；折叠由宿主控制，保留纸外身份、分段标题和浮动栏高度避让。"><ReviewDemoThemes>{()=> <MixedPreviewFixture/>}</ReviewDemoThemes></DemoSection>}
