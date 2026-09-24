"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { ArrowUpRight, Bell, Check, ChevronDown, Coins, Cpu, FileSearch, Menu as MenuIcon, Moon, PanelLeft, PanelRight, Search, Settings2, Sun, UserRound, X } from 'lucide-react'
import { Button } from '@/components/coss/button'
import { Avatar, AvatarFallback } from '@/components/coss/avatar'
import { Badge } from '@/components/prism-next/badge'
import { Menu, MenuTrigger, MenuPopup, MenuItem, MenuGroup, MenuGroupLabel, MenuSeparator } from '@/components/coss/menu'
import { Popover, PopoverTrigger, PopoverPopup, PopoverTitle, PopoverDescription, PopoverClose } from '@/components/coss/popover'
import { Dialog, DialogPopup, DialogTitle, DialogDescription, DialogHeader, DialogPanel } from '@/components/coss/dialog'
import { Command, CommandInput, CommandPanel, CommandEmpty, CommandList, CommandItem } from '@/components/coss/command'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/coss/empty'
import { Tooltip, TooltipTrigger, TooltipPopup } from '@/components/coss/tooltip'
import { themeOptions } from '@/lib/prism-next/config'
import { usageText, type UsageAccount } from './workbench-model'
import { AIActivityMonitor, type ActivityMonitorData } from './ai-activity-monitor'
import './workbench-shell.css'

export type ShellNavigationItem = { id: string; label: string; icon?: ReactNode }
export type ShellSearchResult = { id: string; title: string; description: string; type: string }
export type ShellNotification = { id: string; title: string; detail: string; time: string; read: boolean }
export type WorkbenchShellProps = {
  organization: { name: string; description: string; mark: ReactNode }
  user: { name: string; role: string; initials: string }
  navigation: readonly ShellNavigationItem[]
  activeId: string
  onNavigate: (id: string) => void
  onPersonal: () => void
  search: { query: string; onQueryChange: (query: string) => void; results: readonly ShellSearchResult[]; status: 'ready' | 'loading' | 'error'; sourceLabel: string; scopeLabel: string; onSelect: (id: string) => void }
  notifications: { items: readonly ShellNotification[]; sourceLabel: string; onRead: (id: string) => void; onReadAll: () => void }
  monitor: ActivityMonitorData
  usage: { accounts: readonly UsageAccount[]; sourceLabel: string }
  context?: { label: string; content: ReactNode | ((close: () => void) => ReactNode) }
  auxiliary?: ReactNode
  contentLayout?: 'document' | 'workspace'
  auxiliaryLabel?: string
  children: ReactNode
  basket?: { open: boolean; position: 'right' | 'bottom'; empty?: boolean }
}
type Panel = 'navigation' | 'context' | 'auxiliary' | 'search' | 'notifications' | 'monitor' | 'account' | 'settings' | 'usage' | null

/** Page skeleton extracted from the teacher PreviewHeader and global basket layout.
 * Applications own routes, data, callbacks and the basket. No business fixture lives here. */
export function WorkbenchShell(props: WorkbenchShellProps) {
  const { organization, user, navigation, activeId, onNavigate, search, notifications, monitor, usage, context, auxiliary, auxiliaryLabel = '辅助区域', basket, children } = props
  const [panel, setPanel] = useState<Panel>(null)
  const [mounted, setMounted] = useState(false)
  const [auxiliaryDocked, setAuxiliaryDocked] = useState(false)
  const { theme, setTheme } = useTheme()
  const main = useRef<HTMLElement>(null)
  const workspace = useRef<HTMLDivElement>(null)
  const auxiliaryTrigger = useRef<HTMLButtonElement>(null)
  const searchTrigger = useRef<HTMLButtonElement>(null)
  const searchSelected = useRef(false)
  const notificationTrigger = useRef<HTMLButtonElement>(null)
  const monitorTrigger = useRef<HTMLButtonElement>(null)
  const navigationTrigger = useRef<HTMLButtonElement>(null)
  const contextTrigger = useRef<HTMLButtonElement>(null)
  const settingsTrigger = useRef<HTMLButtonElement>(null)
  const accountTrigger = useRef<HTMLButtonElement>(null)
  const activePanel = useRef<Panel>(panel)
  activePanel.current = panel
  const id = useId()
  const mainId = `workbench-main-${id}`
  const unread = notifications.items.filter(item => !item.read).length
  const current = navigation.find(item => item.id === activeId)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    const element = workspace.current
    if (!element) return
    // Measure the area remaining AFTER the context navigation and basket.
    // Keep a readable main column after gutters; short windows use a dialog.
    const observer = new ResizeObserver(([entry]) => {
      const docked = entry.contentRect.width >= 1120 && entry.contentRect.height >= 640
      if (!docked && element.querySelector('.workbench-auxiliary')?.contains(document.activeElement)) setPanel('auxiliary')
      setAuxiliaryDocked(docked)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (auxiliaryDocked && activePanel.current === 'auxiliary') {
      setPanel(null)
      requestAnimationFrame(() => main.current?.focus({ preventScroll: true }))
    }
  }, [auxiliaryDocked])
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
      // Do not steal focus from an application's editing/confirmation dialog.
      const otherDialog = [...document.querySelectorAll('[role="dialog"][data-open], [role="alertdialog"][data-open]')].some(node => !node.hasAttribute('data-shell-overlay') && node.getAttribute('aria-modal') === 'true')
      if (otherDialog) return
      event.preventDefault()
      searchSelected.current = false
      setPanel(value => value === 'search' ? null : 'search')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])
  const change = (key: Exclude<Panel, null>) => (open: boolean) => setPanel(previous => open ? key : previous === key ? null : previous)
  const returnTo = (element: HTMLButtonElement | null) => activePanel.current ? false : element ?? false
  function navigate(id: string) { setPanel(null); onNavigate(id); requestAnimationFrame(() => main.current?.focus({ preventScroll: true })) }
  const navItems = navigation.map(item => <MenuItem key={item.id} onClick={() => navigate(item.id)} aria-current={activeId === item.id ? 'page' : undefined}>{item.icon}<span className="flex-1">{item.label}</span>{activeId === item.id && <Check />}</MenuItem>)
  return <div className={`workbench-shell bg-background text-foreground${basket?.empty ? ' workbench-basket-empty' : ''}`} data-content-layout={props.contentLayout ?? 'document'} data-basket-open={basket?.open || undefined} data-basket-position={basket?.position} data-shell-panel={panel ?? undefined}>
    <a className="prism-skip" href={`#${mainId}`} onClick={event => { event.preventDefault(); main.current?.focus({ preventScroll: true }) }}>跳到主要内容</a>
    <header className="workbench-topbar border-b bg-background">
      <div className="workbench-organization" title={`${organization.name} · ${organization.description}`}>
        <span className="shrink-0 text-muted-foreground" aria-hidden="true">{organization.mark}</span>
        <div className="min-w-0"><strong className="block truncate text-item-title">{organization.name}</strong><span className="block truncate text-ui-hint text-muted-foreground">{organization.description}</span></div>
      </div>
      <nav className="workbench-primary" aria-label="一级业务导航">
        <div className="workbench-primary-links">{navigation.map(item => <Button key={item.id} variant={activeId === item.id ? 'secondary' : 'ghost'} aria-current={activeId === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>{item.icon}{item.label}</Button>)}</div>
        <div className="workbench-primary-compact"><Menu open={panel === 'navigation'} onOpenChange={change('navigation')}><MenuTrigger render={<Button ref={navigationTrigger} variant="secondary" aria-label={`一级导航，当前${current?.label ?? '未选择'}`} />}><MenuIcon /><span>{current?.label ?? '导航'}</span><ChevronDown /></MenuTrigger><MenuPopup align="start" finalFocus={() => returnTo(navigationTrigger.current)}>{navItems}</MenuPopup></Menu></div>
      </nav>
      <div className="workbench-tools" aria-label="公共工具">
        <Tooltip><TooltipTrigger render={<Button ref={searchTrigger} variant="ghost" size="icon" aria-label="全局搜索" onClick={() => { searchSelected.current = false; setPanel('search') }} />}><Search /></TooltipTrigger><TooltipPopup>全局搜索 · Ctrl / ⌘ K</TooltipPopup></Tooltip>
        <Popover open={panel === 'notifications'} onOpenChange={change('notifications')}>
          <PopoverTrigger render={<Button ref={notificationTrigger} variant="ghost" size="icon" className="relative" aria-label={`通知，${unread} 条未读`} />}><Bell />{unread > 0 && <span className="absolute -end-1 -top-1"><Badge variant="info-solid" size="sm" aria-hidden="true">{unread > 99 ? '99+' : unread}</Badge></span>}</PopoverTrigger>
          <PopoverPopup className="workbench-popup" align="end" data-shell-overlay="notifications" finalFocus={() => returnTo(notificationTrigger.current)}>
            <div className="flex items-center justify-between gap-3"><PopoverTitle>通知</PopoverTitle><PopoverClose render={<Button variant="ghost" size="icon" aria-label="关闭通知" />}><X /></PopoverClose></div>
            <PopoverDescription className="mt-2">{notifications.sourceLabel}</PopoverDescription>
            <div className="my-3 flex items-center justify-between gap-2"><span className="text-ui-hint text-muted-foreground">{unread ? `${unread} 条未读` : '全部已读'}</span><Button size="sm" variant="ghost" disabled={!unread} onClick={notifications.onReadAll}>全部标为已读</Button></div>
            {notifications.items.length ? <ul className="space-y-5">{notifications.items.map(item => <li key={item.id} className="space-y-1"><div className="flex items-start justify-between gap-3"><p className="text-ui-action">{item.title}</p>{!item.read && <Badge variant="info" size="sm">未读</Badge>}</div><p className="text-ui-hint text-muted-foreground">{item.detail}</p><div className="flex items-center justify-between gap-3"><span className="text-ui-hint text-muted-foreground">{item.time}</span><Button variant="ghost" size="sm" disabled={item.read} onClick={() => notifications.onRead(item.id)}>{item.read ? '已读' : '标为已读'}</Button></div></li>)}</ul> : <Empty><EmptyHeader><EmptyTitle>暂无通知</EmptyTitle><EmptyDescription>新的通知会出现在这里。</EmptyDescription></EmptyHeader></Empty>}
          </PopoverPopup>
        </Popover>
        <AIActivityMonitor data={monitor} open={panel === 'monitor'} onOpenChange={change('monitor')} triggerRef={monitorTrigger} finalFocus={() => returnTo(monitorTrigger.current)} />
        <Button ref={settingsTrigger} variant="ghost" size="icon" className="workbench-settings-trigger" aria-label="快捷设置" onClick={() => setPanel('settings')}><Settings2 /></Button>
        <Menu open={panel === 'account'} onOpenChange={change('account')}>
          <MenuTrigger render={<Button ref={accountTrigger} variant="ghost" size="icon-lg" aria-label={`${user.name}的个人菜单`} />}><Avatar><AvatarFallback>{user.initials}</AvatarFallback></Avatar></MenuTrigger>
          <MenuPopup className="w-64" align="end" finalFocus={() => returnTo(accountTrigger.current)}>
            <MenuGroup><MenuGroupLabel>{user.name} · {user.role}</MenuGroupLabel><div className="px-2 pb-2 text-ui-hint text-muted-foreground break-words">{organization.name}</div><MenuItem onClick={() => { setPanel(null); props.onPersonal() }}><UserRound />个人页面<ArrowUpRight className="ml-auto" /></MenuItem><MenuItem onClick={() => setPanel('settings')}><Settings2 />快捷设置</MenuItem></MenuGroup>
            <MenuSeparator /><MenuItem onClick={() => setPanel('usage')}><Coins />积分与 token</MenuItem>
          </MenuPopup>
        </Menu>
      </div>
    </header>
    <div className="workbench-body">
      {context && <aside className="workbench-context border-r" aria-label={context.label}>{typeof context.content === 'function' ? context.content(() => {}) : context.content}</aside>}
      <div ref={workspace} className="workbench-workspace">
        <div className="workbench-region-tools bg-background" data-has-context={!!context} data-has-auxiliary={!!auxiliary && !auxiliaryDocked}>
          {context && <div className="workbench-context-mobile"><Button ref={contextTrigger} variant="ghost" size="sm" onClick={() => setPanel('context')}><PanelLeft />{context.label}</Button></div>}
          {auxiliary && !auxiliaryDocked && <Button ref={auxiliaryTrigger} variant="ghost" size="sm" className="ml-auto" onClick={() => setPanel('auxiliary')} aria-haspopup="dialog"><PanelRight />{auxiliaryLabel}</Button>}
        </div>
        <div className="workbench-scroll"><div className={`workbench-content${auxiliary && auxiliaryDocked ? ' has-auxiliary' : ''}`}><main ref={main} id={mainId} tabIndex={-1} className="workbench-main outline-none">{children}</main>{auxiliary && auxiliaryDocked && <aside className="workbench-auxiliary" aria-label={auxiliaryLabel}><h2 className="mb-5 text-section-title">{auxiliaryLabel}</h2>{auxiliary}</aside>}</div></div>
      </div>
    </div>
    <Dialog open={panel === 'search'} onOpenChange={change('search')} onOpenChangeComplete={open => { if (!open && searchSelected.current && !activePanel.current) main.current?.focus({ preventScroll: true }) }}>
      <DialogPopup data-shell-overlay="search" finalFocus={() => activePanel.current ? false : searchSelected.current ? main.current : searchTrigger.current} closeProps={{ 'aria-label': '关闭全局搜索' }}>
        <DialogHeader><DialogTitle>全局搜索</DialogTitle><DialogDescription>{search.scopeLabel} · {search.sourceLabel}</DialogDescription></DialogHeader>
        <Command items={search.results.map(item => item.title)} value={search.query} onValueChange={search.onQueryChange}>
          <CommandInput aria-label="搜索关键词" placeholder="搜索入口或演示材料…" />
          <CommandPanel>{search.status === 'ready' ? <><CommandEmpty>没有找到“{search.query}”。请换一个关键词，或清空输入查看可搜索内容。</CommandEmpty><CommandList>{(title: string) => { const item = search.results.find(result => result.title === title)!; return <CommandItem key={item.id} value={title} onClick={() => { searchSelected.current = true; setPanel(null); search.onSelect(item.id); requestAnimationFrame(() => main.current?.focus()) }}><FileSearch /><span className="min-w-0 flex-1"><span className="block">{item.title}</span><span className="block text-ui-hint text-muted-foreground">{item.description}</span></span><span className="text-ui-hint text-muted-foreground">{item.type}</span></CommandItem> }}</CommandList></> : <p className="p-5 text-ui-body" role="status">{search.status === 'loading' ? '正在搜索…' : '搜索暂不可用，请稍后重试。'}</p>}</CommandPanel>
        </Command>
      </DialogPopup>
    </Dialog>
    {auxiliary && !auxiliaryDocked && <Dialog open={panel === 'auxiliary'} onOpenChange={change('auxiliary')}><DialogPopup data-shell-overlay="auxiliary" finalFocus={() => returnTo(auxiliaryTrigger.current)} closeProps={{ 'aria-label': `关闭${auxiliaryLabel}` }}><DialogHeader><DialogTitle>{auxiliaryLabel}</DialogTitle><DialogDescription>调整后关闭面板，继续当前阅读位置。</DialogDescription></DialogHeader><DialogPanel>{auxiliary}</DialogPanel></DialogPopup></Dialog>}
    <Dialog open={panel === 'settings'} onOpenChange={change('settings')}><DialogPopup data-shell-overlay="settings" finalFocus={() => returnTo(settingsTrigger.current?.getClientRects().length ? settingsTrigger.current : accountTrigger.current)} closeProps={{ 'aria-label': '关闭快捷设置' }}><DialogHeader><DialogTitle>快捷设置</DialogTitle><DialogDescription>外观偏好沿用当前浏览器的主题设置。</DialogDescription></DialogHeader><DialogPanel><div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,5rem),1fr))] gap-3" role="group" aria-label="主题">{themeOptions.map(option => <Button key={option.value} variant={mounted && theme === option.value ? 'secondary' : 'outline'} className="h-auto min-w-0 flex-col whitespace-normal py-4 sm:h-auto" aria-pressed={mounted && theme === option.value} onClick={() => setTheme(option.value)}>{option.value === 'dark' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}<span className="max-w-full break-words">{option.label}</span></Button>)}</div></DialogPanel></DialogPopup></Dialog>
    <Dialog open={panel === 'usage'} onOpenChange={change('usage')}><DialogPopup data-shell-overlay="usage" finalFocus={() => returnTo(accountTrigger.current)} closeProps={{ 'aria-label': '关闭积分与 token' }}><DialogHeader><DialogTitle>积分与 token</DialogTitle><DialogDescription>{usage.sourceLabel}</DialogDescription></DialogHeader><DialogPanel><dl className="space-y-7">{usage.accounts.map(account => <div key={account.kind}><dt className="flex items-center gap-2 text-ui-action">{account.kind === 'points' ? <Coins className="size-4" /> : <Cpu className="size-4" />}{account.kind === 'points' ? '积分' : 'Token 额度'}<span className="ml-auto font-normal text-muted-foreground">{account.scope === 'personal' ? '个人' : account.scope === 'organization' ? '组织' : '归属待确认'}</span></dt><dd className="my-2 text-section-title tabular-nums">{usageText(account)}</dd><dd className="text-ui-hint text-muted-foreground">{account.detail}</dd></div>)}</dl></DialogPanel></DialogPopup></Dialog>
    <Dialog open={panel === 'context'} onOpenChange={change('context')}><DialogPopup data-shell-overlay="context" finalFocus={() => returnTo(contextTrigger.current)} closeProps={{ 'aria-label': '关闭上下文导航' }}><DialogHeader><DialogTitle>{context?.label}</DialogTitle><DialogDescription>当前页面的内容目录</DialogDescription></DialogHeader><DialogPanel>{typeof context?.content === 'function' ? context.content(() => setPanel(null)) : context?.content}</DialogPanel></DialogPopup></Dialog>
  </div>
}
