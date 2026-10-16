"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Bell, Folder, MessageSquare } from "lucide-react";
import { AppBar, AppBarIdentity, AppBarNavigation, AppBarNavLink, AppBarSpaceMenu, AppBarPersonalMenu, BarIconButton, SpaceBar } from "@/components/prism-next/app-bar";
import { Sidebar, SidebarProvider, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction } from "@/components/coss/sidebar";
import { MenuItem } from "@/components/coss/menu";
import type { PrismTheme } from "@/lib/prism-next/config";

// Review-only composition: host mounts this at an existing fixture entry point.
// State is reversible local selection/open state, never a simulated business fact.
export function ShellNavFixture({ theme = "blueprint", outerTheme = "light" }: { theme?: PrismTheme; outerTheme?: PrismTheme }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(true);
  const [current, setCurrent] = useState("agent");
  const [conversation, setConversation] = useState(0);
  const spaces = [{ id: "agent", label: "Agent" }, { id: "papers", label: "组卷" }];
  const popupProps = { portalProps: { container: host } };
  return <div data-prism-theme={outerTheme}>
    <div ref={setHost} data-agent-preview data-prism-theme={theme} className="bg-background text-foreground">
      <AppBar
        identity={<AppBarIdentity institution="长中文实验学校第二分校" href="#shell-nav-fixture" />}
        navigation={<AppBarNavigation compact={<AppBarSpaceMenu items={spaces} currentId={current} onSelect={setCurrent} popupProps={popupProps} />}>
          {spaces.map(space => <AppBarNavLink key={space.id} href={`#${space.id}`} aria-current={current === space.id ? "page" : undefined} onClick={event => { event.preventDefault(); setCurrent(space.id); }}>{space.label}</AppBarNavLink>)}
        </AppBarNavigation>}
        tools={<><BarIconButton label="通知" count={6}><Bell /></BarIconButton><AppBarPersonalMenu identity={{ name: "李老师", institution: "实验学校", detail: "评审夹具", initials: "李" }} popupProps={popupProps}><MenuItem aria-current="page">个人资料</MenuItem><MenuItem>偏好设置</MenuItem></AppBarPersonalMenu></>}
      />
      <SpaceBar side={{ title: "会话目录", collapsed: !open, onToggle: () => setOpen(!open) }} tools={<BarIconButton label="资料" size="space"><Folder /></BarIconButton>}>函数与方程复习讨论</SpaceBar>
      <SidebarProvider open={open} onOpenChange={setOpen} className="relative min-h-0" style={{ height: 360, "--sidebar-width": "232px" } as CSSProperties}>
        <Sidebar collapsible="icon" className="absolute inset-y-0">
          <SidebarGroup><SidebarGroupLabel>最近对话</SidebarGroupLabel><SidebarMenu>
            {["函数与方程复习讨论及完整长中文标题", "二次函数的图像"].map((title, index) => <SidebarMenuItem key={title}><SidebarMenuButton isActive={conversation === index} onClick={() => setConversation(index)} tooltip={title}><MessageSquare /><span>{title}</span></SidebarMenuButton><SidebarMenuAction showOnHover aria-label={`更多：${title}`}><Folder /></SidebarMenuAction></SidebarMenuItem>)}
          </SidebarMenu></SidebarGroup>
        </Sidebar>
        <div className="min-w-0 flex-1 p-4 text-read-body">仅用于样式评审。选择与开合不产生执行状态。</div>
      </SidebarProvider>
    </div>
  </div>;
}
