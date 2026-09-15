"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect,useState } from "react"
import { BookOpen,Boxes,Palette,ArrowUpRight,Archive,MessageSquare,Search,Layers } from "lucide-react"
import { SidebarProvider,Sidebar,SidebarContent,SidebarFooter,SidebarHeader,SidebarGroup,SidebarGroupLabel,SidebarMenu,SidebarMenuItem,SidebarMenuButton,SidebarInset,SidebarTrigger,useSidebar } from "@/components/coss/sidebar"
import { Select,SelectTrigger,SelectValue,SelectPopup,SelectItem } from "@/components/coss/select"
import { Button } from "@/components/coss/button"
import { componentGroups } from "@/lib/prism-next/catalog"
import { themeOptions,DESIGN_VERSION } from "@/lib/prism-next/config"

function Navigation() {
  const pathname=usePathname()
  const {setOpenMobile}=useSidebar()
  const link=(href:string,label:string,icon?:React.ReactNode)=> <SidebarMenuItem key={href}>
    <SidebarMenuButton isActive={pathname===href} render={<Link href={href}/>} onClick={()=>setOpenMobile(false)}>{icon}<span>{label}</span></SidebarMenuButton>
  </SidebarMenuItem>
  return <Sidebar collapsible="offcanvas">
    <SidebarHeader className="px-4 py-5">
      <Link href="/next" className="flex items-center gap-2.5 font-semibold text-foreground">
        <span className="flex items-center gap-0.5" aria-hidden="true"><span className="h-4 w-1 rounded-full bg-(--brand-blue)"/><span className="h-5 w-1 rounded-full bg-(--brand-magenta)"/><span className="h-3 w-1 rounded-full bg-(--brand-green)"/></span>
        智能曜彩 <span className="ml-auto text-xs font-normal text-muted-foreground">v{DESIGN_VERSION}</span>
      </Link>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup><SidebarMenu>
        {link('/next','组件总览',<Boxes/>)}
        {link('/next/foundations','基础规范',<Palette/>)}
        {link('/next/reading','材料研读',<BookOpen/>)}
        {link('/next/agent','Agent 工作区',<MessageSquare/>)}
      </SidebarMenu></SidebarGroup>
      {componentGroups.map(group=><SidebarGroup key={group.id}>
        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
        <SidebarMenu>{group.items.map(item=>link('/next/components/'+item.id,item.title))}</SidebarMenu>
      </SidebarGroup>)}
    </SidebarContent>
    <SidebarFooter className="p-3"><SidebarMenu>
      <SidebarMenuItem><SidebarMenuButton render={<a href="/"/>}><Archive/><span>旧版 · 已过期</span><ArrowUpRight className="ml-auto"/></SidebarMenuButton></SidebarMenuItem>
    </SidebarMenu></SidebarFooter>
  </Sidebar>
}

function ThemePicker() {
  const {theme,setTheme}=useTheme()
  const [mounted,setMounted]=useState(false)
  useEffect(()=>setMounted(true),[])
  return <div className="w-36 shrink-0">
    <Select items={themeOptions} value={mounted?(theme??'light'):'light'} onValueChange={v=>{if(v)setTheme(v)}}>
      <SelectTrigger aria-label="切换主题"><SelectValue/></SelectTrigger>
      <SelectPopup>{themeOptions.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectPopup>
    </Select>
  </div>
}

export function Shell({children}:{children:React.ReactNode}) {
  return <div className="prism-root"><a className="prism-skip" href="#prism-main">跳到主要内容</a>
    <SidebarProvider style={{"--sidebar-width":"15rem"} as React.CSSProperties}>
      <Navigation/>
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-5">
          <SidebarTrigger aria-label="切换导航侧栏"/>
          <span className="hidden text-sm text-muted-foreground sm:inline">组件库</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">v1.6.0 · 待评审</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="查找组件" render={<Link href="/next#component-search"/>}><Search/></Button>
            <ThemePicker/>
            <Button className="hidden sm:inline-flex" variant="ghost" size="icon" aria-label="打开 coss 官方文档" render={<a href="https://coss.com/ui" target="_blank" rel="noreferrer"/>}><ArrowUpRight/></Button>
          </div>
        </header>
        <div id="prism-main" className="min-w-0 flex-1" tabIndex={-1}>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  </div>
}
