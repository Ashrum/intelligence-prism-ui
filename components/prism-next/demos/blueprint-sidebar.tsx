"use client"

import { useState } from "react"
import { MessageCircle, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react"
import { Sidebar, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/coss/sidebar"
import { Button } from "../button"
import { BlueprintSectionHeader, BpSegTabs } from "../blueprint/blueprint"

const conversations = [
  { id: "pinned", title: "函数复习与课堂练习", pinned: true, archived: false },
  { id: "recent", title: "高一数学期中复习：一元二次方程与函数图像的长中文对话标题", pinned: false, archived: false },
  { id: "formula", title: "判别式 Δ = b² − 4ac 与实数根", pinned: false, archived: false },
  { id: "archived", title: "九月课堂练习整理", pinned: false, archived: true },
]
const filters = [{ value: "recent", label: "近期" }, { value: "archived", label: "已归档" }]

/** Local presentation fixture; no conversation creation, persistence or execution. */
export function BlueprintSidebarDemo({ initiallyCollapsed = false }: { initiallyCollapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed)
  const [filter, setFilter] = useState("recent")
  const [selected, setSelected] = useState("pinned")
  const [feedback, setFeedback] = useState("固定对话样本；操作仅展示意图。")
  const visible = conversations.filter(item => item.archived === (filter === "archived"))
  return <section id="conversation-directory" aria-label="会话目录样式" className="space-y-4">
    <BlueprintSectionHeader title="会话目录" description="表头显示当前列表的真实样本条数；分段控件筛选近期与已归档。" />
    <SidebarProvider className="min-h-0 min-w-0">
      <Sidebar collapsible="none" data-collapsible={collapsed ? "icon" : ""} aria-label="对话样本目录" className={`group h-auto max-w-full ${collapsed ? "w-14" : "w-80"}`}>
        <SidebarHeader className="bp-sidebar-header flex-row items-center gap-2">
          {!collapsed && <><h3 className="text-item-title">对话</h3><span className="bp-sidebar-meta ml-auto text-ui-meta" aria-live="polite">{visible.length} 条</span></>}
          <Button variant="ghost" size="icon" aria-label={collapsed ? "展开对话目录" : "收起对话目录"} aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </Button>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarMenu><SidebarMenuItem><SidebarMenuButton className="bp-sidebar-primary" aria-label="新建对话" onClick={() => setFeedback("新建对话意图已触发；此示例不创建或保存对话。") }><Plus aria-hidden="true" />{!collapsed && <span>新建对话</span>}</SidebarMenuButton></SidebarMenuItem></SidebarMenu>
        </SidebarGroup>
        {!collapsed && <div className="px-2 py-1"><BpSegTabs className="bp-sidebar-segments" label="对话范围" items={filters} value={filter} onValueChange={setFilter} /></div>}
        {[true, false].map(pinned => {
          const items = visible.filter(item => item.pinned === pinned)
          return items.length > 0 && <SidebarGroup key={String(pinned)}>
            {!collapsed && <SidebarGroupLabel>{pinned ? "置顶" : filter === "archived" ? "已归档" : "近期"}</SidebarGroupLabel>}
            <SidebarMenu>{items.map(item => <SidebarMenuItem key={item.id}>
              <SidebarMenuButton isActive={selected === item.id} aria-current={selected === item.id ? "true" : undefined} aria-label={item.title} title={item.title} onClick={() => setSelected(item.id)}><MessageCircle aria-hidden="true" />{!collapsed && <span>{item.title}</span>}</SidebarMenuButton>
              {!collapsed && <SidebarMenuAction showOnHover aria-label={`更多：${item.title}`} onClick={() => setFeedback(`更多操作意图：${item.title}`)}><MoreHorizontal aria-hidden="true" /></SidebarMenuAction>}
            </SidebarMenuItem>)}</SidebarMenu>
          </SidebarGroup>
        })}
      </Sidebar>
    </SidebarProvider>
    <p role="status" className="text-ui-hint text-muted-foreground">{feedback}</p>
  </section>
}
