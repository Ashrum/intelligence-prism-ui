"use client"

import { useState } from "react"
import { SearchIcon, XIcon, PlusIcon, CheckIcon, ChevronRightIcon, ArrowUpIcon, ArrowDownIcon, EllipsisIcon, SettingsIcon, SlidersHorizontalIcon, CopyIcon, DownloadIcon, PrinterIcon, ScanLineIcon, FileTextIcon, BookOpenIcon, LibraryIcon, ListTreeIcon, TagsIcon, ShoppingBasketIcon, FolderOpenIcon, SquarePenIcon, Trash2Icon, StarIcon, FlagIcon, ClipboardCheckIcon, CircleHelpIcon, CircleAlertIcon, CircleCheckIcon, ClockIcon, ChartNoAxesCombinedIcon, ChartColumnIcon, ChartPieIcon, Table2Icon, TargetIcon, CalendarDaysIcon, ListChecksIcon, HistoryIcon, BotIcon, SendIcon, PauseIcon, type LucideIcon } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Input } from "@/components/coss/input"
import { Badge } from "@/components/prism-next/badge"
import { DemoSection } from "./demo-parts"
import { QuestionSelect } from "./question-controls"

type IconEntry = { name:string; label:string; group:string; meaning:string; Icon:LucideIcon }
const entries:IconEntry[] = [
  ["Search","搜索","通用操作","查找题目、教材或记录",SearchIcon], ["X","关闭","通用操作","关闭当前浮层；移除需明确对象",XIcon], ["Plus","添加","通用操作","新建或添加对象",PlusIcon], ["Check","确认","通用操作","确认选择，不能单独替代状态文字",CheckIcon], ["ChevronRight","展开","通用操作","进入下一级或展开目录",ChevronRightIcon], ["ArrowUp","上移","通用操作","调整对象顺序",ArrowUpIcon], ["ArrowDown","下移","通用操作","调整对象顺序",ArrowDownIcon], ["Ellipsis","更多","通用操作","显示当前未外露的次要操作",EllipsisIcon], ["Settings","设置","通用操作","全局或对象设置",SettingsIcon], ["SlidersHorizontal","筛选","通用操作","调整筛选或排版条件",SlidersHorizontalIcon], ["Copy","复制","通用操作","复制当前内容",CopyIcon], ["Download","下载","通用操作","下载已生成文件",DownloadIcon],
  ["FileText","题目","教学资源","题目或文档详情",FileTextIcon], ["BookOpen","教材","教学资源","阅读教材内容",BookOpenIcon], ["Library","题库","教学资源","浏览资源集合",LibraryIcon], ["ListTree","目录","教学资源","教材课程树或知识点树",ListTreeIcon], ["Tags","知识点","教学资源","题目关联的教学标签",TagsIcon], ["ShoppingBasket","试题篮","教学资源","暂存选题，区别于正式试卷",ShoppingBasketIcon], ["FolderOpen","打开材料","教学资源","打开已存在的资源",FolderOpenIcon], ["SquarePen","编辑","教学资源","切换到编辑或打开资料编辑层",SquarePenIcon], ["Trash2","移除","教学资源","须注明从何处移除或永久删除",Trash2Icon], ["Star","收藏","教学资源","收藏状态同时通过文字表达",StarIcon], ["Flag","纠错","教学资源","提交题目问题",FlagIcon], ["Printer","打印","教学资源","打印或进入纸面预览",PrinterIcon], ["ScanLine","扫描","教学资源","导入扫描件并解析",ScanLineIcon],
  ["ClipboardCheck","评价复核","评价与诊断","查看评分点与评价证据",ClipboardCheckIcon], ["CircleHelp","待确认","评价与诊断","需要补充证据，不能表示错误",CircleHelpIcon], ["CircleAlert","注意","评价与诊断","异常或需要关注的状态",CircleAlertIcon], ["CircleCheck","已确认","评价与诊断","已完成确认，不代表掌握",CircleCheckIcon], ["Clock","等待","评价与诊断","待处理或时间相关信息",ClockIcon], ["History","版本记录","评价与诊断","追溯修改与证据版本",HistoryIcon],
  ["ChartNoAxesCombined","趋势","分析与规划","同口径数据的时间变化",ChartNoAxesCombinedIcon], ["ChartColumn","比较","分析与规划","对比维度或分组",ChartColumnIcon], ["ChartPie","组成","分析与规划","同一总体中互斥类别的占比",ChartPieIcon], ["Table2","明细","分析与规划","查看支撑指标的原始记录",Table2Icon], ["Target","目标","分析与规划","学习目标及达成标准",TargetIcon], ["CalendarDays","计划日期","分析与规划","安排学习时间",CalendarDaysIcon], ["ListChecks","学习任务","分析与规划","执行状态与目标达成分开",ListChecksIcon],
  ["Bot","Agent","Agent 工作区","智能助手及其工作记录",BotIcon], ["Send","发送","Agent 工作区","提交用户消息",SendIcon], ["Pause","暂停","Agent 工作区","暂停当前执行",PauseIcon],
].map(([name,label,group,meaning,Icon])=>({name,label,group,meaning,Icon})) as IconEntry[]
const categories=["全部",...new Set(entries.map(item=>item.group))]

export function IconCatalogDemo() {
  const [query,setQuery]=useState("")
  const [group,setGroup]=useState("全部")
  const [selected,setSelected]=useState(entries[0])
  const [message,setMessage]=useState("")
  const visible=entries.filter(item=>(group==="全部"||item.group===group)&&`${item.name} ${item.label} ${item.meaning}`.toLowerCase().includes(query.trim().toLowerCase()))
  const SelectedIcon=selected.Icon
  return <DemoSection title="图标语义目录" description="Lucide 线性图标；保持 coss 原有控件尺寸。中文名称与业务含义一起检索。">
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3"><Input className="max-w-sm" aria-label="搜索图标" placeholder="搜索名称或用途，如：复核、目录" value={query} onChange={event=>setQuery(event.target.value)}/><QuestionSelect label="图标分类" value={group} onChange={setGroup} items={categories.map(value=>({value,label:value}))}/><span role="status" className="text-ui-hint text-muted-foreground">{visible.length} / {entries.length} 个</span></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">{visible.map(item=><Button key={item.name} variant={selected.name===item.name?"secondary":"ghost"} className="h-auto min-h-20 flex-col gap-2 py-3" aria-pressed={selected.name===item.name} onClick={()=>{setSelected(item);setMessage("")}}><item.Icon aria-hidden="true"/><span>{item.label}</span></Button>)}</div>
      {!visible.length&&<p className="py-8 text-ui-hint text-muted-foreground">没有匹配的图标。试试“教材”“目标”或英文名称。</p>}
      <section className="space-y-4 border-t pt-5" aria-label="所选图标规范"><div className="flex flex-wrap items-center gap-3"><SelectedIcon size={20} aria-hidden="true"/><strong className="text-ui-body">{selected.label}</strong><Badge variant="outline">{selected.group}</Badge><code className="text-ui-body">{selected.name}</code></div><p className="text-ui-hint text-muted-foreground">{selected.meaning}。</p><div className="flex flex-wrap items-center gap-6">{[16,20,24].map(size=><div key={size} className="flex items-center gap-2 text-ui-hint text-muted-foreground"><SelectedIcon size={size} strokeWidth={2} aria-hidden="true"/>{size} px</div>)}<Button variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(`import { ${selected.name}Icon } from "lucide-react"`);setMessage("已复制导入代码")}catch{setMessage("未能复制，请选择下方代码复制")}}}><CopyIcon/>复制导入</Button></div><code className="block overflow-x-auto rounded-md bg-muted p-3 text-ui-hint">{`import { ${selected.name}Icon } from "lucide-react"`}</code><p className="min-h-5 text-ui-hint text-muted-foreground" role="status">{message||"图标继承文字颜色。状态同时给出文字；独立图标按钮必须有可读名称。"}</p></section>
    </div>
  </DemoSection>
}
