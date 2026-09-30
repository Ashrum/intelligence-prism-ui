"use client";

import { useRef, useState } from "react";
import { Bell, BookOpen, ChartNoAxesColumn, ChevronDown, ClipboardCheck, Clock, FileText, FlaskConical, Folder, Map, MoreHorizontal, PanelRight, Plus, Search, Settings2, ShoppingBasket, Sparkles } from "lucide-react";
import { Button } from "@/components/prism-next/button";
import { Badge } from "@/components/prism-next/badge";
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuGroup, MenuGroupLabel, MenuSeparator } from "@/components/coss/menu";
import { Popover, PopoverTrigger, PopoverPopup, PopoverTitle, PopoverDescription } from "@/components/coss/popover";
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogPanel } from "@/components/coss/dialog";
import { Separator } from "@/components/coss/separator";
import { AppBar, AppBarTeachingContext, AppBarIdentity, AppBarNavigation, AppBarNavLink, AppBarSpaceMenu, AppBarToolGroup, AppBarStatusButton, AppBarPersonalMenu, BarIconButton, SpaceBar, SpaceBarTitle, PageHead, type AppBarSpace } from "@/components/prism-next/app-bar";
import "./demo.css";

// Base layout copy comes from design-topnav/gen.py; teaching-context cases are review fixtures.
const spaces: readonly AppBarSpace[] = [
  { id: "agent", label: "Agent", icon: <Sparkles /> },
  { id: "records", label: "工作记录", icon: <Clock /> },
  { id: "grading", label: "批阅与解析", icon: <ClipboardCheck /> },
  { id: "papers", label: "组卷", icon: <BookOpen /> },
  { id: "analysis", label: "学情分析", icon: <ChartNoAxesColumn /> },
];
const themes = [{ value: "light", label: "浅色" }, { value: "paper", label: "暖纸" }, { value: "dark", label: "深色" }] as const;
const widths = [1280, 1024, 800, 390] as const;
const conversations = ["二次函数顶点、对称轴与最值练习", "勾股定理复习课", "九年级（1）班课堂诊断讲评"];
const teachingItems = [{ id: "class-1", label: "九年级（1）班 · 数学" }, { id: "class-2", label: "九年级（2）班 · 数学" }];
const environment = "本机规则、示例数据，模型未接入";
const identity = { name: "王建国", institution: "启明实验学校", detail: "数学教师 · 九年级（1）（2）班", initials: "王" };
const pageHeads: Record<string, { title: string; description: string }> = {
  papers: { title: "同步组卷", description: "沿教材与知识点选题，调整编排后保存正式试卷。" },
  records: { title: "全部工作", description: "Agent 与各空间留下的工作，按更新时间排列。" },
  analysis: { title: "本班学习概览", description: "从已完成的纸卷批阅追溯作答表现，再决定下一步。" },
};

function WorkspacePreview({ width, theme, initialSpace, institution, contextState }: { width: number; theme: typeof themes[number]; initialSpace: string; institution: string; contextState: "ready" | "empty" | "long" }) {
  const [space, setSpace] = useState(initialSpace);
  const [currentId, setCurrentId] = useState("class-1");
  const items = contextState === "empty" ? [] : contextState === "long" ? teachingItems.map(item => ({ ...item, label: `${item.label} · 跨校联合教学实验班（第二学期拓展教学）` })) : teachingItems;
  const summary = items.find(item => item.id === currentId)?.label ?? "暂无可用任教关系，请先设置";
  const [conversation, setConversation] = useState(conversations[0]);
  const [collapsed, setCollapsed] = useState(width < 1180);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [panel, setPanel] = useState<string | null>(null);
  // A theme boundary outside the horizontal scroller keeps portalled menus unclipped and on theme.
  const portal = useRef<HTMLDivElement>(null);
  const portalProps = { container: portal };
  const phone = width < 600;
  const agent = space === "agent";
  const sideTitle = agent ? "对话" : space === "records" ? "任务视图" : "工作目录";
  const directory = agent ? ["新建对话", "搜索对话", ...conversations] : space === "records" ? ["全部工作", "待我处理"] : ["同步组卷", "高考备考组卷", "已保存试卷"];
  const head = pageHeads[space];
  const extraTools = agent ? ["资源与产出", "查看工作对象", "收起右侧栏"] : [];
  const panelDescription = panel === "演示环境说明" ? environment : panel === "Page Map" ? spaces.map(item => item.label).join(" · ") : identity.detail;
  const openPanel = (title: string) => setPanel(title);

  const personalMenu = <AppBarPersonalMenu identity={{ ...identity, institution }} popupProps={{ portalProps }}>
    <MenuItem onClick={() => openPanel("个人信息与成就")}><FileText className="size-4" />个人信息与成就</MenuItem>
    <MenuItem onClick={() => openPanel("设置与知识资料")}><Settings2 className="size-4" />设置与知识资料</MenuItem>
    <MenuItem onClick={() => openPanel("外观")}><Sparkles className="size-4" /><span className="flex-1">外观</span><span className="text-ui-meta text-muted-foreground">{theme.label}</span></MenuItem>
    <MenuItem onClick={() => openPanel("使用说明")}><BookOpen className="size-4" />使用说明</MenuItem>
    <MenuSeparator />
    <MenuGroup>
      <MenuGroupLabel className="text-ui-meta">演示与审阅</MenuGroupLabel>
      {width < 900 && <MenuItem onClick={() => openPanel("演示环境说明")}><FlaskConical className="size-4" /><span className="flex-1">演示环境说明</span><span className="text-ui-meta text-muted-foreground">本机规则</span></MenuItem>}
      <MenuItem onClick={() => openPanel("Page Map")}><Map className="size-4" />Page Map</MenuItem>
    </MenuGroup>
  </AppBarPersonalMenu>;

  const tools = <>
    <AppBarToolGroup visibility="wide">
      <Popover>
        <PopoverTrigger render={<AppBarStatusButton aria-label={`演示环境：${environment}`} />}>演示环境</PopoverTrigger>
        <PopoverPopup portalProps={portalProps} className="w-72"><PopoverTitle>演示环境说明</PopoverTitle><PopoverDescription className="mt-2">{environment}</PopoverDescription></PopoverPopup>
      </Popover>
    </AppBarToolGroup>
    <AppBarToolGroup visibility="desktop"><BarIconButton label="搜索工作台 · ⌘K" onClick={() => openPanel("搜索工作台 · ⌘K")}><Search /></BarIconButton></AppBarToolGroup>
    <AppBarToolGroup>
      <AppBarTeachingContext summary={summary} items={items} currentId={currentId} status="暂无可用任教关系，请先设置"
        textbook={contextState === "empty" ? "教材尚未配置" : contextState === "long" ? "人民教育出版社 · 九年级上册 · 二次函数 y = ax² + bx + c 教学拓展资料" : "人教版 · 九年级上册"}
        onSelect={setCurrentId} settings={{ onSelect: () => openPanel("任教与教材设置") }} popupProps={{ portalProps }} />
    </AppBarToolGroup>
    <BarIconButton label="通知" count={5} countUnit=" 条未读" onClick={() => openPanel("通知")}><Bell /></BarIconButton>
    <AppBarToolGroup visibility="desktop">
      <BarIconButton label="设置与知识资料" onClick={() => openPanel("设置与知识资料")}><Settings2 /></BarIconButton>
      <Separator orientation="vertical" className="mx-2 h-5" />
    </AppBarToolGroup>
    {personalMenu}
  </>;

  const moreMenu = <Menu><MenuTrigger render={<BarIconButton size="space" label={`更多：${extraTools.join("、")}`}><MoreHorizontal /></BarIconButton>} />
    <MenuPopup portalProps={portalProps} align="end">{extraTools.map(label => <MenuItem key={label} onClick={() => openPanel(label)}>{label}</MenuItem>)}</MenuPopup>
  </Menu>;
  const spaceTools = <>
    {!phone && agent && <>
      <BarIconButton size="space" label="资源与产出" onClick={() => openPanel("资源与产出")}><Folder /></BarIconButton>
      <BarIconButton size="space" label="查看工作对象" onClick={() => openPanel("查看工作对象")}><FileText /></BarIconButton>
      <BarIconButton size="space" label="收起右侧栏" onClick={() => openPanel("收起右侧栏")}><PanelRight /></BarIconButton>
      <Separator orientation="vertical" className="mx-1.5 h-5" />
    </>}
    {phone && agent && moreMenu}
    <BarIconButton size="space" label="试题篮" count={6} countUnit=" 题" onClick={() => openPanel("试题篮，6 题")}><ShoppingBasket /></BarIconButton>
  </>;

  return <section className="space-y-3" aria-label={`${theme.label} · ${spaces.find(item => item.id === space)?.label} · ${width}`}>
    <h3 className="text-block-title">{spaces.find(item => item.id === space)?.label} · {width}</h3>
    <div data-agent-preview data-prism-theme={theme.value}>
      <div className="workspace-app-bar-scroll" tabIndex={0} role="region" aria-label={`${width}px 顶部区域预览`}>
        <div className="workspace-app-bar-preview bg-background text-foreground" data-preview-width={width} style={{ width }}>
          <AppBar aria-label="全局栏" identity={<AppBarIdentity institution={institution} href="#" onClick={event => { event.preventDefault(); setSpace("agent"); }} />}
            navigation={<AppBarNavigation compact={<AppBarSpaceMenu items={spaces} currentId={space} onSelect={setSpace} popupProps={{ portalProps }} />}>
              {spaces.map(item => <AppBarNavLink key={item.id} href="#" icon={item.icon} aria-current={item.id === space ? "page" : undefined}
                onClick={event => { event.preventDefault(); setSpace(item.id); }}>{item.label}</AppBarNavLink>)}
            </AppBarNavigation>} tools={tools} />
          <SpaceBar side={{ title: sideTitle, collapsed, onToggle: () => width < 1180 ? setDirectoryOpen(true) : setCollapsed(!collapsed) }} tools={spaceTools}>
            {agent ? <>
              <Menu><MenuTrigger render={<Button variant="ghost" className="min-w-0 px-0" />}>
                <SpaceBarTitle title={conversation}>{conversation}</SpaceBarTitle><ChevronDown className="size-3.5 shrink-0" />
              </MenuTrigger><MenuPopup portalProps={portalProps} align="start">{conversations.map(title => <MenuItem key={title} onClick={() => setConversation(title)}>{title}</MenuItem>)}</MenuPopup></Menu>
              {!phone && <Badge variant="secondary" size="sm" className="text-component-label">示例对话</Badge>}
            </> : null}
          </SpaceBar>
          <div className="flex min-w-0">
            {!collapsed && <div className="workspace-app-bar-directory" style={{ width: 248 }}><div className="flex flex-col gap-0.5 p-3">{directory.map(label => <Button variant={label === (agent ? conversation : head?.title) ? "secondary" : "ghost"} className="min-w-0 justify-start" key={label} onClick={() => agent && conversations.includes(label) ? setConversation(label) : openPanel(label)}><span className="truncate">{label}</span></Button>)}</div></div>}
            <div className="min-w-0 flex-1">
              {agent ? <div className="space-y-2 px-4 py-7 sm:px-8"><p className="text-ui-meta text-muted-foreground">你</p><p className="text-read-body">帮我准备一份二次函数顶点、对称轴与最值练习，先看基础题，稍后再确定使用哪些。</p><p className="pt-3 text-ui-body text-muted-foreground">Agent</p></div> : head && <PageHead {...head} actions={space === "papers" ? <>
                {!phone && <Button variant="outline" onClick={() => openPanel("导入结构化题目")}>导入结构化题目</Button>}
                <Button onClick={() => openPanel("新建试卷")}><Plus className="size-4" />新建试卷</Button>
              </> : space === "analysis" ? <Button onClick={() => openPanel("建立教学行动")}><Plus className="size-4" />建立教学行动</Button> : undefined} />}
            </div>
          </div>
        </div>
      </div>
      <div ref={portal} />
      <Dialog open={directoryOpen} onOpenChange={setDirectoryOpen}><DialogPopup portalProps={portalProps} closeProps={{ "aria-label": `关闭${sideTitle}` }}><DialogHeader><DialogTitle>{sideTitle}</DialogTitle></DialogHeader><DialogPanel className="flex flex-col gap-2">{directory.map(label => <Button key={label} variant="ghost" onClick={() => { if (agent && conversations.includes(label)) setConversation(label); setDirectoryOpen(false); }}>{label}</Button>)}</DialogPanel></DialogPopup></Dialog>
      <Dialog open={panel !== null} onOpenChange={open => { if (!open) setPanel(null); }}><DialogPopup portalProps={portalProps} closeProps={{ "aria-label": "关闭" }}><DialogHeader><DialogTitle>{panel}</DialogTitle><DialogDescription>{panelDescription}</DialogDescription></DialogHeader></DialogPopup></Dialog>
    </div>
  </section>;
}

export function WorkspaceAppBarDemo() {
  const [width, setWidth] = useState<number>(1280);
  const [longName, setLongName] = useState(false);
  const [contextState, setContextState] = useState<"ready" | "empty" | "long">("ready");
  const institution = longName ? "北京市海淀区启明实验学校（集团）第二分校" : identity.institution;
  return <div className="mx-auto min-w-0 max-w-[1440px] space-y-8 p-5 sm:p-8" data-workspace-app-bar-demo>
    <header className="space-y-3"><p className="text-ui-hint text-muted-foreground">应用示例</p><h1 className="text-page-title">Workspace 顶部区域</h1><p className="text-ui-hint text-muted-foreground">全局栏 + 空间栏 + 页头</p></header>
    <div className="flex flex-wrap items-center gap-3">
      <div role="group" aria-label="容器宽度" className="flex flex-wrap gap-2">{widths.map(value => <Button key={value} variant={value === width ? "secondary" : "outline"} aria-pressed={value === width} onClick={() => setWidth(value)}>{value}</Button>)}</div>
      <Button variant="outline" aria-pressed={longName} onClick={() => setLongName(!longName)}>长机构名 · 208px 截断，不挤压空间</Button>
      <div role="group" aria-label="任教上下文夹具" className="flex flex-wrap gap-2">{(["ready", "empty", "long"] as const).map(value => <Button key={value} variant="outline" aria-pressed={contextState === value} onClick={() => setContextState(value)}>{value === "ready" ? "已配置任教" : value === "empty" ? "无任教关系" : "长任教与教材"}</Button>)}</div>
    </div>
    {themes.map(theme => <section key={theme.value} className="space-y-5"><h2 className="text-section-title">{theme.label}</h2>
      <WorkspacePreview key={`${width}-agent`} {...{ width, theme, institution, contextState }} initialSpace="agent" />
      <WorkspacePreview key={`${width}-papers`} {...{ width, theme, institution, contextState }} initialSpace="papers" />
    </section>)}
  </div>;
}
