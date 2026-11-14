"use client"
import {useRef,useState} from 'react'
import {PaperPreview,PaperPreviewMixed,PaperPreviewGroup,locatePaperTarget,type PaperPreviewMixedPage,type PaperPreviewZoom} from '../paper-preview'
import {QuestionAnalysisCard} from '../question-analysis-card'
import {DemoSection} from '../demo-parts'
import {Button} from '../button'
import {ReviewDemoThemes} from './review-workspace-fixtures'
import {continuousPreviewPages} from './paper-preview-continuous'
import {analysisQuestion,analysisKnowledge} from './question-analysis-fixtures'
export function MixedPreviewFixture(){const viewport=useRef<HTMLDivElement>(null),[open,setOpen]=useState(false),[zoom,setZoom]=useState<PaperPreviewZoom>('width'),[notice,setNotice]=useState('');const pages:PaperPreviewMixedPage[]=[{id:'question',width:794,height:1,content:<QuestionAnalysisCard question={analysisQuestion} related={analysisKnowledge} selected={null} onSelect={id=>setNotice(id)} onIncludeCorrect={()=>setOpen(true)} filter="all" markedPoints={[]} onKnowledge={id=>setNotice(id)}/>},{id:'full-group',width:794,height:1,content:<PaperPreviewGroup count={1} open={open} onOpenChange={setOpen}/>}];if(open)pages.push({id:'student',width:794,height:273,alt:'扫描图像未提供'});return <><Button variant="outline" onClick={()=>setZoom(zoom==='width'?'page':'width')}>切换适合页面 / 宽度</Button><div className="h-[560px] min-w-0 overflow-hidden"><PaperPreviewMixed viewportRef={viewport} pages={pages} zoom={zoom} rotations={{}} selected="student" scale={1} activePage="student" topInset={68} headers={{student:<p className="text-ui-body">长中文姓名 · 纸外身份</p>}} answerLabel="学生作答 · 全部 1" onSelect={setNotice} onZoom={setZoom} onVisiblePage={()=>{}} onViewport={()=>{}} beforeContent={<p className="text-ui-meta">前置内容 · 按完整证据核对</p>}/></div><p role="status" className="text-ui-hint">{notice}</p></>}
export function MixedPaperPreviewDemo(){return <><DemoSection title="数字题目与扫描混排" description="数字内容不跟随扫描旋转；折叠由宿主控制，保留纸外身份、分段标题和浮动栏高度避让。"><ReviewDemoThemes>{()=> <MixedPreviewFixture/>}</ReviewDemoThemes></DemoSection><DemoSection title="原件题框" description="数字原文与扫描原件共用题框；选择跨页题会同时标出两段，待处理题保留紫红虚线。"><OriginalRegionFixture/><ReviewDemoThemes>{()=> <OriginalRegionFixture/>}</ReviewDemoThemes></DemoSection></>}

export function OriginalRegionFixture() {
 const viewportRef=useRef<HTMLDivElement>(null)
 const [selectedRegionIds,setSelectedRegionIds]=useState<readonly string[]>(['q7-start','q7-end'])
 const [notice,setNotice]=useState('第 7 题 · 两段同时选中')
 const pages:PaperPreviewMixedPage[]=[
  {id:'original-word',width:794,height:600,content:<article className="grid h-[600px] grid-rows-3 gap-8 bg-card px-8 py-12 text-read-body"><p>1．阅读下面的材料，概括作者提出的主要观点，并说明判断依据。</p><p>2．已知 x² + y² = 1，请结合原文条件求解。答案识别不清，待逐题核对。</p><p>3．根据给出的条件列出计算步骤，保留推导过程与最终结论。</p></article>,regions:[
   {id:'q1',label:'第 1 题',tag:'1',rect:[6,7,88,24]},
   {id:'q2',label:'第 2 题，待处理',tag:'2',tone:'pending',rect:[6,38,88,24]},
   {id:'q3',label:'第 3 题',tag:'3',tone:'default',rect:[6,69,88,24]},
  ]},
  {id:'original-scan-1',width:600,height:820,imageUrl:continuousPreviewPages[0].imageUrl,alt:'合成扫描原件，第 7 题起始页',regions:[{id:'q7-start',label:'第 7 题起始段',tag:'7',tone:'default',rect:[6,90,88,9]}]},
  {id:'original-scan-2',width:600,height:820,imageUrl:continuousPreviewPages[0].imageUrl,alt:'合成扫描原件，第 7 题续页',regions:[{id:'q7-end',label:'第 7 题续段',tag:'7 续',tone:'default',rect:[6,2,88,8]}]},
 ]
 function select(id:string) { setSelectedRegionIds(id.startsWith('q7-')?['q7-start','q7-end']:[id]);setNotice(id.startsWith('q7-')?'第 7 题 · 两段同时选中':id==='q2'?'第 2 题 · 当前且待处理':'已定位原件题框') }
 function selectAndLocate(id:string) {
  select(id)
  const viewport=viewportRef.current
  if(id==='q2') { locatePaperTarget(viewport,{regionId:id});return }
  const start=viewport?.querySelector<HTMLElement>('[data-region="q7-start"]')
  const end=viewport?.querySelector<HTMLElement>('[data-region="q7-end"]')
  if(!viewport||!start||!end)return
  const top=start.getBoundingClientRect().top,bottom=end.getBoundingClientRect().bottom
  viewport.scrollTop+=(top+bottom)/2-viewport.getBoundingClientRect().top-viewport.clientHeight/2
 }
 return <div className="min-w-0 space-y-3"><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>selectAndLocate('q2')}>选择待处理题</Button><Button variant="outline" onClick={()=>selectAndLocate('q7-start')}>选择跨页第 7 题</Button></div><div className="min-w-0 overflow-hidden" style={{height:720}}><PaperPreview layout="mixed" mixed={{viewportRef,pages,zoom:'width',rotations:{},selected:'',selectedRegionIds,scale:1,activePage:'original-scan-1',topInset:16,headers:{},onSelect:select,onZoom:()=>{},onVisiblePage:()=>{},onViewport:()=>{},renderSectionHeading:(_,index)=>index===2?null:<h3 className="text-item-title">{index===0?'Word 数字原文':'扫描原件 · 第 1–2 页'}</h3>}}/></div><p role="status" className="text-ui-hint">{notice}</p></div>
}
