"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useTheme } from "next-themes"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { Toggle } from "@/components/coss/toggle"
import { Label } from "@/components/coss/label"
import { Badge } from "../badge"
import { QuestionSelect } from "../question-controls"
import { agentComponentStatusLabels, type AgentComponentEntry } from "@/lib/prism-next/agent-component-registry"
import { agentOverviewHref, agentSemanticHref, agentSemanticTabs, resolveSemanticTab, semanticNeighbors, type AgentSemanticTab } from "@/lib/prism-next/agent-component-navigation"
import { agentComponentExamples } from "./agent-component-examples"
import { AgentDemoPresentation } from "./agent-demo-presentation"

export const previewThemes = [{ value: "site", label: "跟随站点" }, { value: "light", label: "浅色" }, { value: "paper", label: "暖纸" }, { value: "dark", label: "深色" }]
export const previewWidths = [{ value: "auto", label: "自适应" }, ...[320, 390, 768, 1280].map(width => ({ value: String(width), label: `${width}` }))]
export type PreviewTheme = "site" | "light" | "paper" | "dark"
export type PreviewWidth = "auto" | "320" | "390" | "768" | "1280"
const twoStateLabels = { "仅 Inline": "仅对话态", "Inline + 通用扩展容器": "对话态与完整查看", "Inline + 专用扩展内容": "对话态与专用工作区" }

/** Width belongs to this element, so descendant container queries and observers measure it. */
export function AgentPreviewFrame({ theme, width, siteTheme, children }: { theme: PreviewTheme; width: PreviewWidth; siteTheme?: string; children: ReactNode }) {
  const themeLabel = previewThemes.find(item => item.value === (theme === "site" ? siteTheme : theme))?.label ?? "跟随站点"
  const name = `预览 · ${themeLabel} · ${width === "auto" ? "自适应宽度" : `${width} 宽`}`
  return <div className="min-w-0 max-w-full overflow-x-auto" role="region" aria-label={name} tabIndex={0} data-agent-preview-scroll>
    <div data-agent-preview data-prism-theme={theme === "site" ? undefined : theme} data-preview-width={width}
      className="@container min-w-0 bg-background text-foreground" style={{ width: width === "auto" ? "100%" : `${width}px` }}>
      {children}
    </div>
  </div>
}

export function AgentSemanticExample({ entry, mode, onNavigate }: { entry: AgentComponentEntry; mode: "inline" | "workspace" | "compact" | "states"; onNavigate: (tab: AgentSemanticTab) => void }) {
  if (mode === "workspace" && entry.twoState === "仅 Inline") return <p className="text-ui-body">此组件仅提供对话态，没有扩展态。</p>
  if (mode === "compact" && ["13", "15", "25"].includes(entry.number)) return <p className="text-ui-body">此组件尚未提供独立紧凑呈现，请查看对话态。</p>
  const example = agentComponentExamples[entry.slug]
  return <AgentDemoPresentation.Provider value={{ previewOnly: mode !== "states", embedded: true, view: mode === "workspace" ? "workspace" : "inline", density: mode === "compact" ? "compact" : "default", onExpand: () => onNavigate("workspace"), onBack: () => onNavigate("inline") }}>
    {mode === "states" ? example.examples : example.preview}
  </AgentDemoPresentation.Provider>
}

export function AgentComponentPage({ entry, contract }: { entry: AgentComponentEntry; contract: readonly string[] }) {
  const id = useId()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<AgentSemanticTab>("inline")
  const [theme, setTheme] = useState<PreviewTheme>("site")
  const [width, setWidth] = useState<PreviewWidth>("auto")
  const [parallel, setParallel] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const focusPanel = useRef(false)
  const scrollPanel = useRef(false)
  const { previous, next } = semanticNeighbors(entry.slug)
  useEffect(() => {
    setMounted(true)
    const readHash = () => {
      const nextTab = resolveSemanticTab(window.location.hash)
      if (nextTab) { focusPanel.current = true; scrollPanel.current = true; setTab(nextTab) }
      else if (!window.location.hash) setTab("inline")
    }
    readHash()
    window.addEventListener("hashchange", readHash)
    window.addEventListener("popstate", readHash)
    return () => { window.removeEventListener("hashchange", readHash); window.removeEventListener("popstate", readHash) }
  }, [])
  useLayoutEffect(() => {
    if (!focusPanel.current) return
    focusPanel.current = false
    const panel = root.current?.querySelector<HTMLElement>(`[id="${tab}"]`)
    panel?.focus({ preventScroll: true })
    if (scrollPanel.current) panel?.scrollIntoView({ block: "nearest", behavior: "instant" })
    scrollPanel.current = false
  }, [tab, mounted])
  function selectTab(value: AgentSemanticTab, focus = false) {
    focusPanel.current = focus
    setTab(value)
    if (window.location.hash !== `#${value}`) window.history.pushState(null, "", `#${value}`)
  }
  const navigate = (value: AgentSemanticTab) => selectTab(value, true)
  const frame = (content: ReactNode) => <AgentPreviewFrame theme={theme} width={width} siteTheme={mounted ? resolvedTheme : undefined}>{content}</AgentPreviewFrame>
  return <div ref={root} className="prism-content min-w-0 space-y-6" data-agent-component-page={entry.slug}>
    <nav aria-label="面包屑" className="text-ui-hint"><a className="prism-link" href={`${agentOverviewHref}#${entry.slug}`}>Agent 语义组件总览</a><span> / {entry.number} {entry.name}</span></nav>
    <header className="prism-page-heading space-y-3">
      <h1>{entry.number} {entry.name}</h1>
      <p className="text-ui-body break-words">导出名：{entry.componentName}</p>
      <div className="flex flex-wrap items-center gap-3"><Badge variant="outline">{agentComponentStatusLabels[entry.status]}</Badge><span className="text-ui-hint">{entry.category.id} {entry.category.name} · {twoStateLabels[entry.twoState]}</span></div>
      <p className="text-ui-body">{agentComponentExamples[entry.slug].description}</p>
    </header>
    <section aria-label="审阅设置" className="min-w-0 space-y-3">
      <h2 className="text-block-title">审阅模式</h2>
      <div role="group" aria-label="预览设置" className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2"><Label htmlFor={`${id}-theme`}>主题 · 仅预览区</Label><QuestionSelect id={`${id}-theme`} label="预览主题" value={theme} items={previewThemes} onChange={value => setTheme(value as PreviewTheme)} /></div>
        <div className="flex flex-col gap-2"><Label htmlFor={`${id}-width`}>预览宽度</Label><QuestionSelect id={`${id}-width`} label="预览宽度" value={width} items={previewWidths} onChange={value => setWidth(value as PreviewWidth)} /></div>
        <Toggle variant="outline" pressed={parallel} onPressedChange={setParallel} aria-label="并排对话态与扩展态">并排</Toggle>
      </div>
      <p className="text-ui-hint">主题仅预览区生效。宽度超出可用空间时，可在预览区横向滚动。并排适用于对话态与扩展态；两侧为独立示例。切换标签或并排方式后，示例恢复初始内容。审阅设置离开此页后还原。</p>
    </section>
    <Tabs value={tab} onValueChange={value => { const nextTab = resolveSemanticTab(String(value)); if (nextTab) selectTab(nextTab) }} className="min-w-0">
      <div className="min-w-0 max-w-full overflow-x-auto"><TabsList aria-label={`${entry.name}呈现与说明`}>{agentSemanticTabs.map(item => <TabsTab key={item.id} value={item.id}>{item.label}</TabsTab>)}</TabsList></div>
      {agentSemanticTabs.map(item => <TabsPanel key={item.id} value={item.id} id={item.id} keepMounted className="min-w-0 scroll-mt-24 pt-4">
        {tab === item.id && (item.id === "contract" ? <section className="max-w-4xl space-y-4 break-words" aria-label="接口要点">
          <h2 className="text-section-title">接口要点</h2><p className="text-ui-hint">以下为此组件的接口约定摘录。历史设计阶段描述不作为本轮验收结论，当前接入记录见“验收”。</p>
          {contract.map(paragraph => <p key={paragraph} className="text-read-body">{paragraph}</p>)}
        </section> : item.id === "review" ? <section className="space-y-4" aria-label="验收记录">
          <h2 className="text-section-title">验收记录</h2><p className="text-ui-body">Workspace 承载位置：{entry.carriers.label}</p>
          <p className="text-ui-hint">登记状态来自既有记录；本页示例不代表真实服务已接入，也不替代本轮浏览器复验。</p>
          <h3 className="text-block-title">相关 PR</h3><ul className="space-y-2">{entry.carriers.prs.map(url => <li key={url}><a className="prism-link text-ui-body" href={url} target="_blank" rel="noreferrer">{url.includes("ole-school-workbench") ? "Workspace" : "Prism"} #{url.split("/").at(-1)}</a></li>)}</ul>
          <h3 className="text-block-title">未验证范围</h3><ul className="list-disc space-y-2 pl-5 text-ui-body">{entry.unverified.map(text => <li key={text}>{text}</li>)}</ul>
        </section> : parallel && (item.id === "inline" || item.id === "workspace") ? <div className="@container min-w-0"><div className="grid min-w-0 gap-6 @min-[900px]:grid-cols-2">{(["inline", "workspace"] as const).map(mode => <section key={mode} className="min-w-0 space-y-3" aria-label={mode === "inline" ? "对话态示例" : "扩展态示例"}><h2 className="text-block-title">{mode === "inline" ? "对话态" : "扩展态"}</h2>{frame(<AgentSemanticExample entry={entry} mode={mode} onNavigate={navigate} />)}</section>)}</div></div>
          : frame(<AgentSemanticExample entry={entry} mode={item.id} onNavigate={navigate} />))}
      </TabsPanel>)}
    </Tabs>
    <nav aria-label="相邻语义组件" className="flex min-w-0 flex-wrap justify-between gap-4 pt-6 text-ui-body">
      {previous ? <a className="prism-link" rel="prev" href={agentSemanticHref(previous.slug)}>上一个 · {previous.number} {previous.name}</a> : <span>已是第一项</span>}
      {next ? <a className="prism-link" rel="next" href={agentSemanticHref(next.slug)}>下一个 · {next.number} {next.name}</a> : <span>已是最后一项</span>}
    </nav>
  </div>
}
