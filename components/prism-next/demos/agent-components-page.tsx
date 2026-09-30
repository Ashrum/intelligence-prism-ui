"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { ScrollArea } from "@/components/coss/scroll-area"
import { Badge } from "../badge"
import { AgentStatus } from "../agent-visual-parts"
import { Button } from "../button"
import { QuestionSelect } from "../question-controls"
import { agentComponentCategories, agentComponentStatusCounts, agentComponentRegistry, agentComponentStatusLabels, filterAgentComponents, type AgentComponentEntry, type AgentComponentStatus } from "@/lib/prism-next/agent-component-registry"
import { agentComponentExamples, agentSupplementalExamples } from "./agent-component-examples"
import { AgentDemoPresentation } from "./agent-demo-presentation"

const allSlugs = [...agentComponentRegistry.map(entry => entry.slug), ...agentSupplementalExamples.map(entry => entry.slug)]
/** The historical nested input anchor must also open its containing section. */
export function resolveAgentPageAnchor(hash: string) {
  let slug: string
  try { slug = decodeURIComponent(hash.replace(/^#/, "")) } catch { return undefined }
  const section = slug === "composer-adaptations" ? "existing-agent-inputs" : slug
  return allSlugs.includes(section) ? { section, target: slug } : undefined
}

export function AgentExampleSection({ slug, name, description, entry, preview, examples, expanded, onExpandedChange }: {
  slug: string; name: string; description: string; entry?: AgentComponentEntry; preview: ReactNode; examples: ReactNode
  expanded: boolean; onExpandedChange: (value: boolean) => void
}) {
  const details = useRef<HTMLDivElement>(null), focusDetails = useRef(false)
  useLayoutEffect(() => {
    if (expanded && focusDetails.current) {
      focusDetails.current = false
      details.current?.focus({ preventScroll: true })
      details.current?.scrollIntoView({ block: "nearest", behavior: "instant" })
    }
  }, [expanded])
  return <section id={slug} data-agent-page-section className="@container min-w-0 scroll-mt-24 space-y-4" aria-labelledby={`${slug}-heading`}>
    <header className="space-y-2">
      <h2 id={`${slug}-heading`} tabIndex={-1} className="text-section-title">{entry ? <a className="prism-link" href={`/next/components/agent-components/${slug}`} aria-label={`${entry.number} ${name} · 打开单独页面`}>{entry.number} {name}</a> : name}</h2>
      {entry && <a className="prism-link text-ui-hint" href={`/next/components/agent-components/${slug}`}>打开单独页面<span className="sr-only"> · {name}</span></a>}
      <p className="text-ui-body">{description}</p>
      {entry ? <div className="space-y-2"><AgentStatus tone="neutral">{agentComponentStatusLabels[entry.status]}</AgentStatus><p className="text-ui-hint text-muted-foreground">承载位置：{entry.carriers.label}</p></div> : <Badge variant="secondary">组合示例</Badge>}
    </header>
    <div data-agent-page-preview>
      <AgentDemoPresentation.Provider value={{ previewOnly: true, embedded: true, onExpand: () => { focusDetails.current = true; onExpandedChange(true) } }}>{preview}</AgentDemoPresentation.Provider>
    </div>
    <Button variant="outline" size="navigation" aria-expanded={expanded} aria-controls={`${slug}-examples`} onClick={() => onExpandedChange(!expanded)}>{expanded ? "收起全部示例" : "展开全部示例"}<span className="sr-only"> · {name}</span></Button>
    <div id={`${slug}-examples`} hidden={!expanded} ref={details} tabIndex={-1} role="region" aria-label={`${name} · 全部示例`} className="min-w-0 scroll-mt-24 space-y-5">
      {expanded && <>
        <p className="text-ui-hint text-muted-foreground">下方为独立示例；收起后恢复初始内容，上方对话示例保留。</p>
        {entry && <div className="space-y-2 text-ui-hint">
          <p>呈现方式：{{ "仅 Inline": "仅对话态", "Inline + 通用扩展容器": "对话态与完整查看", "Inline + 专用扩展内容": "对话态与专用工作区" }[entry.twoState]}</p>
          <p>未验证范围：{entry.unverified.join("；")}</p>
          <div className="flex flex-wrap gap-3" aria-label="验证记录">{entry.carriers.prs.length ? entry.carriers.prs.map(url => <a key={url} className="prism-link" href={url} target="_blank" rel="noreferrer">{url.includes("ole-school-workbench") ? "Workspace" : "Prism"} #{url.split("/").at(-1)}</a>) : "验证记录未记录"}</div>
        </div>}
        <AgentDemoPresentation.Provider value={{ previewOnly: false, embedded: true, onExpand: undefined }}>{examples}</AgentDemoPresentation.Provider>
      </>}
    </div>
  </section>
}

export function AgentComponentsPage() {
  const id = useId()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<AgentComponentStatus | "all">("all")
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const [active, setActive] = useState("")
  const [pendingTarget, setPendingTarget] = useState<string>()
  const root = useRef<HTMLDivElement>(null), mobileDirectory = useRef<HTMLDetailsElement>(null)
  const entries = filterAgentComponents(query, status)
  const supplemental = status === "all" ? agentSupplementalExamples.filter(entry => `${entry.name} ${"componentName" in entry ? entry.componentName : ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) : []
  const changeExpanded = (slug: string, value: boolean) => setExpanded(current => {
    const next = new Set(current)
    if (value) next.add(slug); else next.delete(slug)
    return next
  })
  const navigate = (hash: string) => {
    const anchor = resolveAgentPageAnchor(hash)
    if (!anchor) return
    changeExpanded(anchor.section, true)
    setActive(anchor.section)
    setPendingTarget(anchor.target)
    if (mobileDirectory.current) mobileDirectory.current.open = false
  }
  useEffect(() => {
    const onHashChange = () => navigate(window.location.hash)
    onHashChange()
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
    // Anchor entry is event-driven; expanding/collapsing must not re-open the current hash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useLayoutEffect(() => {
    if (!pendingTarget) return
    const target = document.getElementById(pendingTarget)
    target?.scrollIntoView({ block: "start", behavior: "instant" })
    const heading = target?.querySelector<HTMLElement>("h2, h3")
    if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }) }
    setPendingTarget(undefined)
  }, [pendingTarget, expanded])
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const visible = new Set<Element>()
    const observer = new IntersectionObserver(changes => {
      for (const change of changes) {
        if (change.isIntersecting) visible.add(change.target); else visible.delete(change.target)
      }
      const current = [...visible].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]
      if (current) setActive(current.id)
    }, { rootMargin: "-96px 0px -60% 0px", threshold: 0 })
    root.current?.querySelectorAll("[data-agent-page-section]").forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [])
  const link = (slug: string, name: string, entry?: AgentComponentEntry) => <Button key={slug} render={<a href={`#${slug}`} />} variant={active === slug ? "secondary" : "ghost"} size="navigation"
    aria-current={active === slug ? "location" : undefined} className="w-full justify-start whitespace-normal text-left" onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      if (window.location.hash !== `#${slug}`) window.history.pushState(null, "", `#${slug}`)
      navigate(`#${slug}`)
    }}><span className="min-w-0 space-y-1"><span className="block text-ui-body">{entry && `${entry.number} `}{name}</span>{entry && <AgentStatus tone="neutral">{agentComponentStatusLabels[entry.status]}</AgentStatus>}</span></Button>
  const directory = <nav aria-label="Agent 语义组件页内目录" className="space-y-5 p-1">
    {agentComponentCategories.map(category => {
      const group = entries.filter(entry => entry.category.id === category.id)
      return group.length > 0 && <div key={category.id} className="space-y-2"><h3 className="text-block-title">{category.id} {category.name}</h3><ul className="space-y-1">{group.map(entry => <li key={entry.slug}>{link(entry.slug, entry.name, entry)}</li>)}</ul></div>
    })}
    {supplemental.length > 0 && <div className="space-y-2"><h3 className="text-block-title">组合与既有组件</h3><ul className="space-y-1">{supplemental.map(entry => <li key={entry.slug}>{link(entry.slug, entry.name)}</li>)}</ul></div>}
    {!entries.length && !supplemental.length && <p className="text-ui-hint">没有匹配的目录项，请调整搜索或状态。</p>}
  </nav>
  return <div ref={root} className="space-y-6" data-agent-components-page data-testid="agent-components-page">
    <div className="space-y-4">
      <p className="text-ui-body">共 {agentComponentRegistry.length} 项语义组件：Workspace 已验证 {agentComponentStatusCounts["workspace-validated"]} 项，组件候选 {agentComponentStatusCounts.candidate} 项，未开始 {agentComponentStatusCounts["not-started"]} 项。示例验证不代表真实服务接入。默认展示对话态，更多示例与验证记录可逐项展开。</p>
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1 basis-64 space-y-2"><Label htmlFor={`${id}-search`}>搜索目录</Label><Input id={`${id}-search`} value={query} onChange={event => setQuery(event.target.value)} placeholder="名称、编号或组件名称" /></div>
        <div className="space-y-2"><Label htmlFor={`${id}-status`}>验证状态</Label><QuestionSelect id={`${id}-status`} label="验证状态" value={status} onChange={value => setStatus(value as typeof status)} items={[{ value: "all", label: "全部状态" }, ...Object.entries(agentComponentStatusLabels).map(([value, label]) => ({ value, label }))]} /></div>
        <Button variant="outline" size="navigation" onClick={() => setExpanded(new Set(allSlugs))}>全部展开</Button>
        <Button variant="outline" size="navigation" onClick={() => setExpanded(new Set())}>全部收起</Button>
      </div>
      <p role="status" className="text-ui-hint text-muted-foreground">目录匹配 {entries.length} / {agentComponentRegistry.length} 项语义组件，另有 {supplemental.length} 项组合与既有组件。</p>
    </div>
    <details ref={mobileDirectory} className="lg:hidden"><summary className="cursor-pointer text-ui-action">页内目录</summary><div className="mt-4 h-[60dvh]"><ScrollArea>{directory}</ScrollArea></div></details>
    <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="sticky top-24 hidden h-[calc(100dvh-7rem)] min-h-0 lg:block"><ScrollArea>{directory}</ScrollArea></aside>
      <div className="min-w-0 space-y-12">
        {agentComponentCategories.map(category => <div key={category.id} className="space-y-10"><h2 className="text-section-title">{category.id} {category.name}</h2>
          {agentComponentRegistry.filter(entry => entry.category.id === category.id).map(entry => <AgentExampleSection key={entry.slug} {...agentComponentExamples[entry.slug]} slug={entry.slug} name={entry.name} entry={entry} expanded={expanded.has(entry.slug)} onExpandedChange={value => changeExpanded(entry.slug, value)} />)}
        </div>)}
        <div className="space-y-10"><h2 className="text-section-title">组合与既有组件</h2>{agentSupplementalExamples.map(entry => <AgentExampleSection key={entry.slug} {...entry} expanded={expanded.has(entry.slug)} onExpandedChange={value => changeExpanded(entry.slug, value)} />)}</div>
      </div>
    </div>
  </div>
}
