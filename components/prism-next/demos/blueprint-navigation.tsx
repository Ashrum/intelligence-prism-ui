"use client";

import { useState } from "react";
import { BookOpen, Users, Layers } from "lucide-react";
import { AppBar, AppBarIdentity, AppBarNavigation, AppBarNavLink, AppBarSpaceMenu } from "../app-bar";
import { PageTabs, type PageNavigationItem } from "../page-tabs";
import { PageSegments } from "../page-segments";
import { ObjectBar } from "../object-bar";
import { Button } from "../button";
import { SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge } from "@/components/coss/sidebar";

function NavigationExample({ teacher = false }: { teacher?: boolean }) {
  const [tab, setTab] = useState("first");
  const [segment, setSegment] = useState(teacher ? "group" : "evaluation");
  const moduleName = teacher ? "学生与班级" : "学校知识库";
  const id = teacher ? "navigation-teacher" : "navigation-library";
  const tabs = teacher
    ? [{ id: "first", label: "九(1) 班", count: 45 }, { id: "second", label: "九(2) 班", count: 45 }, { id: "compare", label: "两班对比" }]
    : [{ id: "first", label: "全部资料", count: 2846 }, { id: "review", label: "审核与更新", count: 12, tone: "todo" as const }];
  const segments = teacher
    ? [{ id: "group", label: "按状态分组" }, { id: "list", label: "名单" }, { id: "trend", label: "趋势" }]
    : [{ id: "all", label: "全部", count: 2846 }, { id: "evaluation", label: "教学评价", count: 1420 }, { id: "course", label: "校本课程", count: 860 }, { id: "operation", label: "教学运行", count: 118 }, { id: "admin", label: "行政规范", count: 448 }];
  const links = (items: PageNavigationItem[], select: (id: string) => void) => items.map(item => ({ ...item,
    href: `#${id}`, onClick: (event: React.MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); select(item.id); },
  }));
  const spaces = teacher
    ? [{ id: "library", label: "Agent", href: "#navigation-library" }, { id: "teacher", label: "学情分析", href: "#navigation-teacher" }]
    : [{ id: "teacher", label: "学校管理", href: "#navigation-teacher" }, { id: "library", label: "AI 资源管理", href: "#navigation-library" }];
  const currentSpace = teacher ? "teacher" : "library";
  return <div id={id} className="min-w-0 border border-border">
    <AppBar brandBand identity={<AppBarIdentity institution="启明实验学校" href={`#${id}`} />}
      navigation={<AppBarNavigation compact={<AppBarSpaceMenu items={spaces} currentId={currentSpace} />}>
        {spaces.map(space => <AppBarNavLink key={space.id} href={space.href} aria-current={space.id === currentSpace ? "page" : undefined}>{space.label}</AppBarNavLink>)}
      </AppBarNavigation>} />
    <SidebarProvider className="min-h-0 block">
      <div className="bp-navigation-demo-body">
        <nav className="bp-navigation-demo-side" aria-label={`${moduleName}二级导航`}>
          <SidebarMenu>
            <SidebarMenuItem><SidebarMenuButton render={<a href="#navigation-library" />}><Layers /><span>{teacher ? "概览" : "模型管理"}</span></SidebarMenuButton>
              <SidebarMenuBadge data-dot="todo" aria-label="有待处理事项" />
            </SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton isActive render={<a href={`#${id}`} />} aria-current="page">{teacher ? <Users /> : <BookOpen />}<span>{moduleName}</span></SidebarMenuButton>
              {!teacher && <SidebarMenuBadge data-tone="todo" aria-label="12 项待处理">12</SidebarMenuBadge>}
            </SidebarMenuItem>
          </SidebarMenu>
        </nav>
        <div className="bp-navigation-demo-main">
          <h1 className="sr-only">{moduleName}</h1>
          <PageTabs aria-label={`${moduleName}栏目`} leading={moduleName} items={links(tabs, setTab)} currentId={tab}
            actions={<Button variant="outline" render={<a href="#navigation-object" />}>打开对象示例</Button>} />
          <PageSegments aria-label={`${moduleName}视图`} items={links(segments, setSegment)} currentId={segment} />
          <p role="status" className="text-ui-hint text-muted-foreground">合成示例：{tabs.find(item => item.id === tab)?.label} · {segments.find(item => item.id === segment)?.label}</p>
          {teacher ? <ul className="space-y-3 text-ui-body"><li>稳定保持 · 10 人</li><li>近期回落 · 8 人</li><li>需要支持 · 2 人</li><li>继续观察 · 12 人</li></ul>
            : <a className="text-ui-body underline" href="#navigation-object">二次函数单元测验 · 试卷</a>}
        </div>
      </div>
    </SidebarProvider>
  </div>;
}

export function BlueprintNavigationDemo() {
  const [immersive, setImmersive] = useState(false);
  return <section id="navigation-system" aria-label="导航体系" className="min-w-0 space-y-6">
    <h2 className="text-section-title">导航体系</h2>
    <p className="text-ui-hint text-muted-foreground">方案 B · 合成数据。链接切换示例选择；不连接工作台业务或预览框架。</p>
    <NavigationExample />
    <NavigationExample teacher />
    <div id="navigation-object" className="min-w-0">
      <ObjectBar back={{ render: <a href="#navigation-library" /> }} breadcrumbs={[
        { id: "library", label: "学校知识库", href: "#navigation-library" },
        { id: "all", label: "全部资料", href: "#navigation-library" },
        { id: "category", label: "教学评价", href: "#navigation-library" },
        { id: "object", label: "二次函数单元测验 · 试卷" },
      ]} actions={<><span className="text-ui-hint">第 1 / 1,420 份</span><Button variant="outline" aria-pressed={immersive} onClick={() => setImmersive(value => !value)}>{immersive ? "退出沉浸阅读" : "沉浸阅读"}</Button><Button variant="outline" render={<a href="#navigation-library" />} aria-label="关闭对象示例">×</Button></>} />
      <div className="space-y-4 p-5">
        <h1 className="text-section-title">二次函数单元测验 · 试卷</h1>
        {!immersive && <p className="text-ui-hint text-muted-foreground">数学 · 九年级 · 王建国 · 数学组可用</p>}
        <p className="text-read-body">内容预览（合成数据）：已知二次函数，求其顶点坐标。</p>
      </div>
    </div>
  </section>;
}
