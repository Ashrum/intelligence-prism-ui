"use client"

import Link from "next/link"
import { usePathname,useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect,useRef,useState } from "react"
import { BookOpen,Boxes,Palette,Search,ChevronRight,ArrowUpRight,Layers } from "lucide-react"
import { SidebarProvider,Sidebar,SidebarContent,SidebarHeader,SidebarGroup,SidebarGroupLabel,SidebarMenu,SidebarMenuItem,SidebarMenuButton,SidebarInset,SidebarTrigger,useSidebar } from "@/components/coss/sidebar"
import { Select,SelectTrigger,SelectValue,SelectPopup,SelectItem } from "@/components/coss/select"
import { Collapsible,CollapsibleTrigger,CollapsiblePanel } from "@/components/coss/collapsible"
import { Command,CommandInput,CommandList,CommandEmpty,CommandItem,CommandPanel,CommandDialog,CommandDialogTrigger,CommandDialogPopup,CommandDialogPrimitive } from "@/components/coss/command"
import { StatusBadge } from "./status-badge"
import { Button } from "@/components/coss/button"
import { componentGroups,components,applicationExamples,agentRelatedPages } from "@/lib/prism-next/catalog"
import { themeOptions,DESIGN_VERSION,DESIGN_STATUS } from "@/lib/prism-next/config"

export function BrandMark() {
  return <span className="flex items-center gap-0.5" aria-hidden="true"><span className="h-4 w-1 rounded-full bg-(--brand-blue)"/><span className="h-5 w-1 rounded-full bg-(--brand-magenta)"/><span className="h-3 w-1 rounded-full bg-(--brand-green)"/></span>
}

function Navigation() {
  const pathname=usePathname()
  const {setOpenMobile}=useSidebar()
  const navigation=useRef<HTMLDivElement>(null)
  const currentGroup=agentRelatedPages.some(page=>page.href===pathname)?'agent':componentGroups.find(g=>g.items.some(i=>pathname==='/next/components/'+i.id))?.id
  const [openGroups,setOpenGroups]=useState<Record<string,boolean>>({[currentGroup??'actions']:true})
  useEffect(()=>{
    if(currentGroup)setOpenGroups(previous=>({...previous,[currentGroup]:true}))
    const timer=setTimeout(()=>{
      const container=navigation.current,active=container?.querySelector('[aria-current="page"]')
      if(!container||!active)return
      const outer=container.getBoundingClientRect(),inner=active.getBoundingClientRect()
      if(inner.bottom>outer.bottom-16)container.scrollTop+=inner.bottom-outer.bottom+16
      else if(inner.top<outer.top+16)container.scrollTop+=inner.top-outer.top-16
    },220)
    return()=>clearTimeout(timer)
  },[currentGroup,pathname])
  const link=(href:string,label:string,icon?:React.ReactNode)=> <SidebarMenuItem key={href}>
    <SidebarMenuButton isActive={pathname===href} aria-current={pathname===href?'page':undefined} render={<Link href={href}/>} onClick={()=>setOpenMobile(false)}>{icon}<span>{label}</span></SidebarMenuButton>
  </SidebarMenuItem>
  return <Sidebar collapsible="offcanvas">
    <SidebarHeader className="px-5 pt-6 pb-4">
      <Link href="/next" className="flex items-center gap-3 font-semibold text-foreground"><BrandMark/><span>智能曜彩<span className="mt-0.5 block text-ui-hint  text-muted-foreground">组件与设计规范</span></span></Link>
    </SidebarHeader>
    <SidebarContent ref={navigation} className="px-2">
      <SidebarGroup><SidebarMenu>
        {link('/next','组件总览',<Boxes/>)}{link('/next/foundations','基础规范',<Palette/>)}
        {link('/next/foundations/typography','字体与字号',<BookOpen/>)}{link('/next/reading','材料研读',<BookOpen/>)}{link('/next/use-cases','教师用例与流程',<Layers/>)}
      </SidebarMenu></SidebarGroup>
      {componentGroups.map(group=><SidebarGroup key={group.id} className="py-0.5"><Collapsible open={Boolean(openGroups[group.id])} onOpenChange={open=>setOpenGroups(previous=>({...previous,[group.id]:open}))}>
        <CollapsibleTrigger render={<Button variant="ghost"/>} className="prism-nav-group">{group.title}<span className="text-ui-body tabular-nums">{group.items.length}</span><ChevronRight/></CollapsibleTrigger>
        <CollapsiblePanel><SidebarMenu>{group.items.map(item=>link('/next/components/'+item.id,item.title))}{group.id==='agent'&&agentRelatedPages.map(page=>link(page.href,page.title))}</SidebarMenu></CollapsiblePanel>
      </Collapsible></SidebarGroup>)}
      <SidebarGroup><SidebarGroupLabel>页面骨架</SidebarGroupLabel><SidebarMenu>{link("/next/skeletons","教师工作台总骨架",<Layers/>)}</SidebarMenu></SidebarGroup>
      <SidebarGroup><SidebarGroupLabel>标准页面</SidebarGroupLabel><SidebarMenu>{link("/next/pages","阶段与范围")}</SidebarMenu></SidebarGroup>
      <SidebarGroup><SidebarGroupLabel>应用示例</SidebarGroupLabel><SidebarMenu>{applicationExamples.map(item=>link('/next/examples/'+item.id,item.title))}</SidebarMenu></SidebarGroup>
      <div className="px-4 py-4 space-y-2"><p className="text-ui-hint text-muted-foreground">v{DESIGN_VERSION}</p><StatusBadge tone="neutral">{DESIGN_STATUS}</StatusBadge></div>
    </SidebarContent>
  </Sidebar>
}

function ComponentSearch() {
  const [open,setOpen]=useState(false),[query,setQuery]=useState('')
  const router=useRouter()
  const items=components.map(item=>item.title+' · '+item.summary)
  useEffect(()=>{const handle=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setOpen(value=>!value)}};document.addEventListener('keydown',handle);return()=>document.removeEventListener('keydown',handle)},[])
  return <CommandDialog open={open} onOpenChange={value=>{setOpen(value);if(!value)setQuery('')}}>
    <CommandDialogTrigger render={<Button variant="ghost"/>} aria-label="查找组件"><Search/><span className="hidden sm:inline">查找组件</span><kbd className="ml-3 hidden text-ui-hint text-muted-foreground lg:inline">⌘ / Ctrl K</kbd></CommandDialogTrigger>
    <CommandDialogPopup><CommandDialogPrimitive.Title className="sr-only">查找组件</CommandDialogPrimitive.Title><CommandDialogPrimitive.Description className="sr-only">输入名称或用途，使用方向键选择，按回车打开组件。</CommandDialogPrimitive.Description>
      <Command items={items} value={query} onValueChange={setQuery}><CommandInput placeholder="名称或用途，例如：表单、复核、Dialog" aria-label="搜索组件"/><CommandPanel><CommandEmpty>没有匹配的组件。</CommandEmpty><CommandList>{(value:string)=>{const item=components[items.indexOf(value)];return <CommandItem key={item.id} value={value} onClick={()=>{setOpen(false);setQuery('');router.push('/next/components/'+item.id)}}><div className="min-w-0 py-1"><p className="font-medium">{item.title}</p><p className="mt-1 truncate text-ui-hint text-muted-foreground">{item.summary}</p></div></CommandItem>}}</CommandList></CommandPanel></Command>
    </CommandDialogPopup>
  </CommandDialog>
}

function ThemePicker() {
  const {theme,setTheme}=useTheme()
  const [mounted,setMounted]=useState(false)
  useEffect(()=>setMounted(true),[])
  return <div className="w-36 shrink-0"><Select items={themeOptions} value={mounted?(theme??'light'):'light'} onValueChange={v=>{if(v)setTheme(v)}}><SelectTrigger aria-label="切换主题"><SelectValue/></SelectTrigger><SelectPopup>{themeOptions.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectPopup></Select></div>
}

export function Shell({children}:{children:React.ReactNode}) {
  const pathname=usePathname()
  if(["/next/skeletons/workbench", "/next/skeletons/agent", "/next/use-cases/parsing"].includes(pathname)) return <>{children}</>
  return <div className="prism-root"><a className="prism-skip" href="#prism-main">跳到主要内容</a>
    <SidebarProvider style={{"--sidebar-width":"15rem"} as React.CSSProperties}>
      <Navigation/>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-5">
          <SidebarTrigger aria-label="切换导航侧栏"/>
          <span className="hidden text-ui-hint text-muted-foreground sm:inline">组件库</span>
          <span className="hidden text-ui-hint text-muted-foreground sm:inline">v{DESIGN_VERSION} · {DESIGN_STATUS}</span>
          <div className="ml-auto flex items-center gap-2">
            <ComponentSearch/>
            <ThemePicker/>
            <Button className="hidden sm:inline-flex" variant="ghost" size="icon" aria-label="打开 coss 官方文档" render={<a href="https://coss.com/ui" target="_blank" rel="noreferrer"/>}><ArrowUpRight/></Button>
          </div>
        </header>
        <div id="prism-main" className="min-w-0 flex-1" tabIndex={-1}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  </div>
}
