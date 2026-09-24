"use client"

import { useId,useState } from "react"
import Link from "next/link"
import { Info,Check,TriangleAlert,ArrowUpDown,ArrowRight,Bookmark,Clock,ChevronDown,FileText } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Avatar,AvatarFallback } from "@/components/coss/avatar"
import { RadioGroup,Radio } from "@/components/coss/radio-group"
import { StatusBadge } from "@/components/prism-next/status-badge"
import { Progress,ProgressTrack,ProgressIndicator } from "@/components/coss/progress"
import { Card,CardHeader,CardTitle,CardDescription,CardPanel,CardFooter,CardFrame,CardFrameHeader,CardFrameTitle,CardFrameDescription } from "@/components/coss/card"
import { Badge } from "@/components/prism-next/badge"
import { Frame,FrameHeader,FrameTitle,FrameDescription,FramePanel,FrameFooter } from "@/components/coss/frame"
import { Table,TableHeader,TableBody,TableHead,TableRow,TableCell,TableCaption } from "@/components/coss/table"
import { Accordion,AccordionItem,AccordionTrigger,AccordionPanel } from "@/components/coss/accordion"
import { Collapsible,CollapsibleTrigger,CollapsiblePanel } from "@/components/coss/collapsible"
import { Kbd,KbdGroup } from "@/components/coss/kbd"
import { ScrollArea } from "@/components/coss/scroll-area"
import { Separator } from "@/components/coss/separator"
import { DemoSection,Feedback } from "@/components/prism-next/demo-parts"
import { BrandMark } from "@/components/prism-next/shell"

const avatarSizes=[
  {size:24,style:"size-6 text-ui-hint",usage:"紧凑列表"},
  {size:32,style:"size-8 text-ui-hint",usage:"导航 · 默认"},
  {size:40,style:"size-10 text-ui-body",usage:"成员列表"},
  {size:48,style:"size-12 text-read-body",usage:"人物卡片"},
  {size:64,style:"size-16 text-section-title",usage:"个人资料"},
  {size:96,style:"size-24 text-stat-display tabular-nums",usage:"资料页头"},
]
export function AvatarDemo(){return <DemoSection title="六种常用尺寸" description="同一头像按使用位置调整尺寸，文字回退随头像等比例变化；默认尺寸为 32px。"><div className="flex flex-wrap items-end gap-x-8 gap-y-6">{avatarSizes.map(item=><div key={item.size} className="flex flex-col items-center gap-3"><Avatar className={item.style} aria-label={`陈老师，${item.size} 像素头像`}><AvatarFallback>陈</AvatarFallback></Avatar><div className="text-center"><p className="text-ui-action tabular-nums">{item.size}px</p><p className="mt-1 text-ui-hint text-muted-foreground">{item.usage}</p></div></div>)}</div></DemoSection>}
export function BadgeDemo(){
 const [count,setCount]=useState(2)
 return <>

 <DemoSection title="业务状态" description="状态由示例显式传入；使用现有 Badge 变体，文字与图标共同表达。"><div className="flex flex-wrap items-center gap-3"><StatusBadge tone="neutral">草稿</StatusBadge><StatusBadge tone="pending">待复核</StatusBadge><StatusBadge tone="active">处理中</StatusBadge><StatusBadge tone="complete">已更新</StatusBadge><StatusBadge tone="complete">已复核</StatusBadge></div></DemoSection>
 <DemoSection title="风险与校验" description="风险与校验分别使用现有 warning / error 变体。"><div className="flex flex-wrap items-center gap-3"><StatusBadge tone="warning">来源已变化</StatusBadge><StatusBadge tone="error">校验未通过</StatusBadge></div></DemoSection>

  <DemoSection title="信息与状态"><div className="flex flex-wrap items-center gap-3"><Badge variant="secondary">草稿</Badge><Badge variant="outline">待复核</Badge><Badge variant="info"><Info/>处理中</Badge><Badge variant="success"><Check/>已复核</Badge><Badge variant="warning"><TriangleAlert/>需要补充</Badge><Badge variant="error">未通过</Badge></div></DemoSection>
  <DemoSection title="实心信息色与计数" description="用彩色气泡背景突出数量，数字保持中性色。info-solid 适用于计数等需要强调的信息，不表示待办、错误或任务完成。">
   <div className="flex flex-wrap items-center gap-4"><Badge variant="info">浅底信息</Badge><Badge variant="info-solid">实心信息</Badge>{[0,2,100].map(value=><Badge key={value} variant="info-solid" size="sm" ><span className="sr-only">数量 </span>{value}</Badge>)}</div>
   <div className="mt-5 flex flex-wrap items-center gap-3"><Button variant="outline" aria-label={`查看已选材料，${count} 项`} onClick={()=>setCount(value=>value===0?2:value===2?100:0)}>已选材料<Badge variant="info-solid" size="sm" aria-hidden="true">{count}</Badge></Button><span className="text-ui-hint text-muted-foreground">点击入口依次预览 0、2、100；示例不读取业务数据。</span></div>
   <Feedback>当前示例数量：{count}。数量由调用方提供，徽标不自动隐藏零值或截断为 99+。</Feedback>
  </DemoSection>
 </>
}
export function CardDemo(){
 const [saved,setSaved]=useState(false),[selected,setSelected]=useState("brief")
 const id=useId()
 const completed=128,total=160,completion=completed/total*100
 return <div className="prism-card-examples"><div className="prism-card-grid">
  <DemoSection title="内容与操作" description="用于材料摘要；状态与时长集中呈现，收藏和阅读分别位于两侧。">
   <Card className="prism-card-composed">
    <CardHeader className="flex items-start justify-between gap-4">
     <div className="min-w-0 space-y-1"><CardTitle>二次方程的实数根</CardTitle><CardDescription>数学 · 函数与方程</CardDescription></div>
     <span className="prism-card-signature shrink-0" role="img" aria-label="智能曜彩"><BrandMark/></span>
    </CardHeader>
    <CardPanel>
     <p className="text-read-body">从判别式开始，理解两实根、重根与无实根的区别。</p>
     <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2"><StatusBadge tone="pending">待复核</StatusBadge><span className="inline-flex items-center gap-1.5 text-ui-hint text-muted-foreground"><Clock className="size-3.5" aria-hidden="true"/>预计 8 分钟</span></div>
    </CardPanel>
    <CardFooter className="flex-wrap justify-between gap-3"><Button variant="ghost" className="-ml-2" onClick={()=>setSaved(v=>!v)} aria-pressed={saved}><Bookmark className={saved?'fill-current':''}/>{saved?'已收藏':'收藏'}</Button><Button className="ml-auto" render={<Link href="/next/reading"/>}>阅读材料<ArrowRight/></Button></CardFooter>
   </Card>
  </DemoSection>

  <DemoSection title="带分组标题的卡片" description="分组标题独立于内容卡，更新状态与分类分别呈现。">
   <CardFrame ><CardFrameHeader className="flex flex-row items-center gap-3 px-0 pt-0 pb-3"><span className="prism-card-signature" aria-hidden="true"><BrandMark/></span><div><CardFrameTitle>本周材料</CardFrameTitle><CardFrameDescription className="mt-0.5">待完成的阅读与复核</CardFrameDescription></div></CardFrameHeader><Card className="prism-card-composed"><CardHeader><CardTitle>函数的单调性</CardTitle><div className="flex flex-wrap items-center gap-x-3 gap-y-2"><CardDescription>知识梳理</CardDescription><StatusBadge tone="complete">已更新</StatusBadge></div></CardHeader><CardPanel><p className="text-read-body">从图像观察变化，再用定义说明结论。</p></CardPanel><CardFooter className="justify-end"><Button render={<Link href="/next/reading"/>}>查看材料<ArrowRight/></Button></CardFooter></Card></CardFrame>
  </DemoSection>

  <DemoSection title="指标摘要" description="数值与进度共用统计口径。">
   <Card className="prism-card-composed">
    <CardHeader><CardTitle id={`${id}-progress-title`}>已完成复核</CardTitle><CardDescription>本周 · 示例数据</CardDescription></CardHeader>
    <CardPanel>
     <p className="flex items-baseline gap-2 text-stat-display tabular-nums">{completed}<span className="text-ui-body text-muted-foreground">份</span></p>
     <Progress value={completion} aria-labelledby={`${id}-progress-title`} aria-valuetext={`已完成 ${completed} 份，共 ${total} 份，完成率 ${completion}%`} className="mt-4"><ProgressTrack><ProgressIndicator/></ProgressTrack></Progress>
     <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-ui-hint tabular-nums"><span className="text-muted-foreground">共 {total} 份材料</span><span className="text-ui-action">完成率 {completion}%</span></div>
    </CardPanel>
   </Card>
  </DemoSection>

  <DemoSection title="可选择卡片" description="用于互斥方案，支持整卡点击与方向键选择。">
   <RadioGroup value={selected} onValueChange={setSelected} aria-label="卡片展示方案" className="prism-card-options grid gap-3">{[{id:"brief",title:"摘要模式",text:"优先显示标题、状态和关键数据。"},{id:"detail",title:"详细模式",text:"显示说明、关联内容与操作。"}].map(item=><Card key={item.id} render={<label/>} className="cursor-pointer"><CardPanel className="flex items-start gap-3 p-4"><Radio value={item.id} aria-labelledby={`${id}-${item.id}-title`} aria-describedby={`${id}-${item.id}-description`} className="mt-1"/><div className="min-w-0"><h3 id={`${id}-${item.id}-title`} className="text-item-title">{item.title}</h3><p id={`${id}-${item.id}-description`} className="mt-1 text-ui-hint text-muted-foreground">{item.text}</p></div></CardPanel></Card>)}</RadioGroup><Feedback>当前选择：{selected==="brief"?"摘要模式":"详细模式"}</Feedback>
  </DemoSection>

  <DemoSection title="紧凑横向卡片" description="用于资源清单，整卡进入材料。">
   <Card render={<Link href="/next/reading"/>} className="group transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><CardPanel className="flex items-center gap-3 p-4"><FileText className="size-6 shrink-0 text-muted-foreground"/><div className="min-w-0 flex-1"><h3 className="text-item-title">函数图像阅读材料</h3><p className="mt-0.5 text-ui-hint text-muted-foreground">例题讲解 · 预计 8 分钟</p></div><ChevronDown className="size-4 shrink-0 -rotate-90 text-muted-foreground"/></CardPanel></Card>
  </DemoSection>

  <DemoSection title="人物资料" description="身份信息与个人简介分组呈现。">
   <Card className="prism-card-composed">
    <CardHeader className="flex items-center gap-3"><Avatar className="size-12 text-read-body" aria-label="陈老师"><AvatarFallback>陈</AvatarFallback></Avatar><div className="min-w-0"><h3 className="text-item-title">陈老师</h3><p className="mt-1 text-ui-hint text-muted-foreground">数学 · 教研成员</p></div></CardHeader>
    <CardPanel><p className="text-read-body">关注函数与几何教学，参与材料整理和复核。</p></CardPanel>
   </Card>
  </DemoSection>
 </div></div>
}
export function FrameDemo(){return <>
 <DemoSection title="连续的内容面板" description="沿用 coss 标准：外框内边距 4px，面板内边距 20px，标题和底部横向内边距 20px。">
  <Frame className="max-w-lg"><FrameHeader><FrameTitle>本次复核</FrameTitle><FrameDescription>同一任务内的材料与进度。</FrameDescription></FrameHeader><FramePanel><h3 className="font-medium">二次方程的实数根</h3><p className="mt-2 text-ui-hint text-muted-foreground">公式与结论已核对，待补充教学提示。</p></FramePanel><FrameFooter><Button variant="outline" render={<Link href="/next/reading"/>}>继续复核</Button></FrameFooter></Frame>
 </DemoSection>
 <DemoSection title="多个内容面板" description="同一外框内可连续组合多个白色面板，面板之间保持 4px 间隔。">
  <Frame className="max-w-lg"><FrameHeader><FrameTitle>材料信息</FrameTitle><FrameDescription>相关内容分区呈现。</FrameDescription></FrameHeader><FramePanel><h3 className="text-item-title">材料正文</h3><p className="mt-2 text-ui-hint text-muted-foreground">函数图像与性质的阅读内容。</p></FramePanel><FramePanel><h3 className="text-item-title">复核说明</h3><p className="mt-2 text-ui-hint text-muted-foreground">补充来源、适用范围与注意事项。</p></FramePanel></Frame>
 </DemoSection>
</>}
const tableRows=[{name:'二次方程的实数根',time:8,score:98.5,status:'已复核'},{name:'函数的单调性',time:12,score:92.0,status:'待复核'},{name:'导数与极值',time:16,score:95.75,status:'待复核'},{name:'数列求和',time:10,score:87.5,status:'已复核'}]
export function TableDemo(){const[sort,setSort]=useState<'asc'|'desc'>('desc');const rows=[...tableRows].sort((a,b)=>sort==='asc'?a.score-b.score:b.score-a.score);return <DemoSection title="文字与数字列" description="数字右对齐并使用等宽数字；点击评分列切换排序。"><Table><TableCaption>教研材料示例数据</TableCaption><TableHeader><TableRow><TableHead>材料</TableHead><TableHead className="text-right">研读时长</TableHead><TableHead className="text-right" aria-sort={sort==='asc'?'ascending':'descending'}><Button variant="ghost" size="sm" onClick={()=>setSort(v=>v==='asc'?'desc':'asc')}>评分<ArrowUpDown/></Button></TableHead><TableHead>状态</TableHead></TableRow></TableHeader><TableBody>{rows.map(row=><TableRow key={row.name}><TableCell className="font-medium">{row.name}</TableCell><TableCell className="prism-numeric text-right">{row.time} 分钟</TableCell><TableCell className="prism-numeric text-right">{row.score.toFixed(2)}</TableCell><TableCell><StatusBadge tone={row.status==='已复核'?'complete':'pending'}>{row.status}</StatusBadge></TableCell></TableRow>)}</TableBody></Table></DemoSection>}
export function AccordionDemo(){return <DemoSection title="判别式说明"><Accordion className="max-w-xl" defaultValue={['positive']}><AccordionItem value="positive"><AccordionTrigger>判别式大于零</AccordionTrigger><AccordionPanel>方程有两个不相等的实数根。求根公式中的根号项大于零，因此加减两种取值不同。</AccordionPanel></AccordionItem><AccordionItem value="zero"><AccordionTrigger>判别式等于零</AccordionTrigger><AccordionPanel>方程有两个相等的实数根，根号项为零。</AccordionPanel></AccordionItem><AccordionItem value="negative"><AccordionTrigger>判别式小于零</AccordionTrigger><AccordionPanel>在实数范围内无法开平方，因此方程没有实数根。</AccordionPanel></AccordionItem></Accordion></DemoSection>}
export function CollapsibleDemo(){const[open,setOpen]=useState(false);return <DemoSection title="就地展开补充说明"><Collapsible open={open} onOpenChange={setOpen} className="max-w-xl"><CollapsibleTrigger render={<Button variant="outline"/>}>{open?'收起推导说明':'展开推导说明'}<ChevronDown className={open?'rotate-180':''}/></CollapsibleTrigger><CollapsiblePanel><p className="pt-4 text-read-body text-foreground">先将方程两边同除以二次项系数，再配方。对两边开平方后，得到求根公式。每一步均保留等价条件。</p></CollapsiblePanel></Collapsible></DemoSection>}
export function KbdDemo(){return <DemoSection title="快捷键标注"><div className="flex flex-wrap items-center gap-3 text-ui-body"><span>切换导航</span><KbdGroup><Kbd>Ctrl</Kbd><span>+</span><Kbd>B</Kbd></KbdGroup><span className="text-muted-foreground">macOS 使用 ⌘ B</span></div></DemoSection>}
export function ScrollAreaDemo(){return <DemoSection title="有限高度内的材料清单"><ScrollArea className="h-64 max-w-md rounded-lg border" scrollbarGutter><div className="divide-y px-4">{Array.from({length:16},(_,i)=><div key={i} className="flex gap-3 py-3 text-ui-body"><FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground"/><div><p>{['二次方程','函数的单调性','导数与极值','数列求和'][i%4]} · 材料 {i+1}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-ui-hint text-muted-foreground">教研材料</span><StatusBadge tone="pending">待复核</StatusBadge></div></div></div>)}</div></ScrollArea></DemoSection>}
export function SeparatorDemo(){return <DemoSection title="仅在必要处区分内容"><div className="max-w-md space-y-4"><div><h3 className="font-medium">材料复核</h3><p className="mt-1 text-ui-hint text-muted-foreground">先完成阅读，再提交修改。</p></div><Separator/><div className="flex h-5 items-center gap-4 text-ui-body"><span>正文</span><Separator orientation="vertical"/><span>元数据</span><Separator orientation="vertical"/><span>历史记录</span></div></div></DemoSection>}
export const contentDemos={avatar:AvatarDemo,badge:BadgeDemo,card:CardDemo,frame:FrameDemo,table:TableDemo,accordion:AccordionDemo,collapsible:CollapsibleDemo,kbd:KbdDemo,'scroll-area':ScrollAreaDemo,separator:SeparatorDemo}
