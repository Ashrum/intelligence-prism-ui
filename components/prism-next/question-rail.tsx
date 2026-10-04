"use client"
import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react"
import { Button } from "./button"
import { Tooltip, TooltipTrigger, TooltipPopup } from "@/components/coss/tooltip"
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/coss/tabs"
import { Badge as CossBadge } from "@/components/coss/badge"
import { ScrollArea } from "@/components/coss/scroll-area"
import { ReviewTip as Tip, reviewToneClass, type ReviewTone } from "./review-parts"
import "./review-workspace.css"
import {ThinBar} from "./question-analysis-parts"
import {ReviewRailList} from "./knowledge-rail"
export type QuestionRailMarker = { icon: ReactNode; ariaLabel: string; tooltip?: ReactNode; tone?: ReviewTone }
export type QuestionRailItem = {
  id: string; number: ReactNode; tone: ReviewTone; value: ReactNode; denominator?: ReactNode
  marker?: QuestionRailMarker
  detail?: ReactNode; ratio?: number; ariaLabel: string; tooltip: ReactNode; content?: ReactNode
}
const markerToneClass: Record<ReviewTone, string> = { neutral: "text-muted-foreground", success: "text-success", warning: "text-warning", destructive: "text-destructive" }
function ItemMarker({ marker }: { marker: QuestionRailMarker }) {
  return <span aria-hidden="true" data-question-marker className={`pointer-events-none absolute right-0 top-0 flex size-2.5 items-center justify-center [&_svg]:max-h-full [&_svg]:max-w-full ${markerToneClass[marker.tone ?? "neutral"]}`}>{marker.icon}</span>
}
export type QuestionRailSection = {
  id: string; label: string; range?: ReactNode; summary?: ReactNode; layout: "cell" | "row"
  pages: { id: string; marker?: { label: ReactNode; tooltip: string; ariaLabel: string }; items: QuestionRailItem[] }[]
}
export type QuestionRailProps = {
  sections: QuestionRailSection[]; selected: string; filter: string; onFilterChange: (value: string) => void
  filters: { value: string; label: ReactNode; count?: ReactNode; ariaLabel: string }[]
  overview: { segments: { count: number; tone: ReviewTone }[]; text: ReactNode; label?: string }
  collapse?: ReactNode; sort?: ReactNode; footer?: ReactNode; empty?: ReactNode; panelId: string
  label?: string; title?: string; filterLabel?: string; listLabel?: string
  onSelect: (id: string) => void; onLocate: () => void; onPage: (id: string) => void
}
/** Host orders sections/pages/items and supplies all classification, counts and text. */
export function QuestionRail({ sections, selected, filter, onFilterChange, filters, overview, collapse, sort, footer, empty = "暂无题目", panelId, label = "题目栏", title = "题目", filterLabel = "题目筛选", listLabel = "选择题目", onSelect, onLocate, onPage }: QuestionRailProps) {
  const list = sections.flatMap(section => section.pages.flatMap(page => page.items))
  const orderKey = JSON.stringify(list.map(item => item.id))
  const root = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const rail = root.current
    if (!rail) return
    // Wait for the ScrollArea layout, and repeat when a hidden narrow-screen rail reopens.
    let request = 0
    const reveal = () => {
      cancelAnimationFrame(request)
      request = requestAnimationFrame(() => {
        const node = [...rail.querySelectorAll<HTMLElement>('[data-question-id]')].find(node => node.dataset.questionId === selected)
        if (!node?.getClientRects().length || rail.closest('[inert]')) return
        node.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
      })
    }
    reveal()
    const observer = new ResizeObserver(reveal)
    observer.observe(rail)
    return () => { cancelAnimationFrame(request); observer.disconnect() }
  }, [selected, filter, orderKey])
  function keyboard(event: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) return
    const target = event.target as HTMLElement
    // Page buttons retain native Enter activation; question options locate the
    // focused item after Tab navigation without changing selection on focus.
    if (event.key === 'Enter' && target?.closest('[data-page-marker]')) return
    const focused = target?.closest<HTMLElement>('[data-question-id]')?.dataset.questionId
    event.preventDefault(); event.stopPropagation()
    if (event.key === 'Enter') { if (focused && focused !== selected) onSelect(focused); onLocate(); return }
    if (!list.length) return
    const index = Math.max(0, list.findIndex(q => q.id === (focused ?? selected)))
    const next = list[Math.max(0, Math.min(list.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1)))]
    onSelect(next.id)
    ;[...root.current?.querySelectorAll<HTMLButtonElement>('[data-question-id]') ?? []].find(node => node.dataset.questionId === next.id)?.focus({ preventScroll: true })
  }
  return <aside ref={root} aria-label={label} data-review-rail className="d1-rail min-h-0 bg-background">
    <Tabs className="d1-rail-tabs" value={filter} onValueChange={onFilterChange}>
    <header className="d1-rail-header flex items-center justify-between gap-1 px-3"><h2 className="sr-only">{title}</h2>
      <TabsList size="sm" aria-label={filterLabel}>
        {filters.map(item => <TabsTab key={item.value} value={item.value} aria-controls={panelId} aria-label={item.ariaLabel}>{item.label}{item.count !== undefined && <CossBadge variant="outline">{item.count}</CossBadge>}</TabsTab>)}
      </TabsList>
      {collapse}
    </header>
    <section aria-label={overview.label ?? "全卷概览"} className="d1-rail-overview space-y-1 px-3 py-1.5">
      <div aria-hidden="true" className="flex h-1 gap-0.5 overflow-hidden rounded-full">{overview.segments.map(({ count, tone }, index) => count > 0 && <span key={index} data-overview-count={count} className={reviewToneClass[tone]} style={{ flex: count }} />)}</div>
      <p className="text-ui-meta tabular-nums text-muted-foreground">{overview.text}</p>
    </section>
    <TabsPanel id={panelId} value={filter} className="min-h-0"><ScrollArea overscrollContain>{sort}<div role="listbox" aria-label={listLabel} onKeyDown={keyboard} className="space-y-4 px-3 py-2">
      {sections.map(section => {
        const type = section.id, row = section.layout === 'row'
        if (!section.pages.some(page => page.items.length)) return null
        return <div key={type} role="group" aria-label={section.label}>
          <h3 className="mb-1 flex items-center justify-between gap-1 text-ui-meta text-muted-foreground"><span>{section.label} <span className="tabular-nums">{section.range}</span></span><span data-section-total={type} className="text-right tabular-nums">{section.summary}</span></h3>
          {section.pages.map(({ id: page, marker, items }) => <div key={page}>
            {marker && <div className="flex items-center gap-2" data-page-marker><span className="h-px flex-1 bg-border" aria-hidden="true" /><Tip label={marker.tooltip} keys="Enter"><Button variant="ghost" className="px-1" aria-label={marker.ariaLabel} onClick={() => onPage(page)}><span className="text-ui-meta text-muted-foreground">{marker.label}</span></Button></Tip></div>}
            <div className={row ? 'grid gap-1' : 'grid grid-cols-4 gap-1'}>
              {items.map(q => <Tooltip key={q.id}><TooltipTrigger render={<Button role="option" aria-selected={selected === q.id} tabIndex={0} data-question-id={q.id} data-question-layout={row ? 'row' : 'cell'} aria-label={q.marker ? `${q.ariaLabel}，${q.marker.ariaLabel}` : q.ariaLabel} variant="ghost" onClick={() => onSelect(q.id)} className={`d1-question${q.marker ? " relative" : ""} h-auto sm:h-auto w-full px-2 transition-shadow duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${row ? 'gap-2' : `min-h-11 ${(q.tone === 'neutral' || q.tone === 'success') ? 'bg-muted text-muted-foreground hover:bg-accent' : q.tone === 'destructive' ? 'bg-destructive/10 text-foreground hover:bg-destructive/20' : 'bg-warning/10 text-foreground hover:bg-warning/20'}`} ${selected === q.id ? 'ring-2 ring-info focus-visible:ring-info shadow-sm text-foreground' : ''}`} />}>
                <span className={`shrink-0 tabular-nums ${row ? 'w-6 text-right text-block-title' : 'text-ui-action'}`}>{q.number}</span>
                {row && <><span aria-hidden="true" className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">{Number.isFinite(q.ratio) && <span className={`block h-full ${q.tone === 'neutral' ? 'bg-foreground' : reviewToneClass[q.tone]}`} style={{ width: `${Math.max(0, Math.min(100, q.ratio ?? 0))}%` }} />}</span><span className="w-16 shrink-0 text-right tabular-nums"><span className="block text-ui-action">{q.value}{q.denominator !== undefined && <span className="text-ui-meta text-muted-foreground"> / {q.denominator}</span>}</span>{q.detail != null && <span className="block text-ui-meta text-muted-foreground">{q.detail}</span>}</span></>}
              {q.content}{q.marker && <ItemMarker marker={q.marker} />}</TooltipTrigger><TooltipPopup className="surface-floating" side="right">{q.tooltip}{q.marker && <span className="block">{q.marker.tooltip ?? q.marker.ariaLabel}</span>}</TooltipPopup></Tooltip>)}
            </div>
          </div>)}
        </div>
      })}
      {!list.length && <p className="py-6 text-ui-body text-muted-foreground">{empty}</p>}
    </div><p className="px-3 pb-3 text-ui-meta text-muted-foreground">{footer}</p></ScrollArea></TabsPanel>
    </Tabs>
  </aside>
}
export type QuestionRailClassSection = {id:string;label:ReactNode;summary?:ReactNode;layout:'cell'|'row';items:(Omit<QuestionRailItem,"marker">&{kind?:ReactNode;marker?:boolean|QuestionRailMarker})[]}
export type QuestionRailClassProps = {sections:QuestionRailClassSection[];overview:{segments:{count:number;tone:ReviewTone}[];text:ReactNode};selected:string;onSelect:(id:string)=>void;sort?:ReactNode;bodyOnly?:boolean;onLocate?:(id?:string)=>void}
/** Class-rate presentation, with host ordering and external risk/discrimination markers. */
export function QuestionRailClass({sections,overview,selected,onSelect,sort,bodyOnly=false,onLocate=()=>{}}:QuestionRailClassProps){const body=<><div className="space-y-1 py-1"><div className="flex h-1 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">{overview.segments.map((segment,index)=><span key={index} className={segment.tone==='warning'?'bg-warning':segment.tone==='destructive'?'bg-destructive':'bg-muted'} style={{flex:segment.count}}/>)}</div><p className="text-ui-meta text-muted-foreground">{overview.text}</p></div>{sections.map(section=>{const items=section.items,rows=section.layout==='row';if(!items.length)return null;return <section key={section.id}><h3 className="mb-1 flex justify-between text-ui-meta text-muted-foreground"><span>{section.label}</span>{section.summary!=null&&<span>{section.summary}</span>}</h3><div className={rows?'grid gap-1':'grid grid-cols-4 gap-1'}>{items.map(q=>{const marker=typeof q.marker==="object"?q.marker:undefined;const description=marker?`${q.ariaLabel}，${marker.ariaLabel}`:q.ariaLabel;return <Tooltip key={q.id}><TooltipTrigger render={<Button variant="ghost" role="option" aria-selected={q.id===selected} data-entry={q.id} data-selected={q.id===selected} aria-label={description} onClick={()=>onSelect(q.id)} className={`d1-question relative h-auto sm:h-auto ${rows?'':'min-h-11 flex-col gap-0.5'} ${q.tone==='destructive'?'bg-destructive/10 hover:bg-destructive/20':q.tone==='warning'?'bg-warning/10 hover:bg-warning/20':'bg-muted hover:bg-accent'} ${q.id===selected?'ring-2 ring-info shadow-sm':''}`}/>}>
 {rows?<span className="grid flex-1 gap-1"><span className="flex items-center gap-2"><span className="text-ui-action tabular-nums">{q.number}</span>{q.kind&&<span className="text-ui-meta">{q.kind}</span>}<ThinBar value={q.ratio??0}/><span className="text-ui-meta tabular-nums">{q.value}</span></span><span className="text-left text-ui-meta text-muted-foreground">{q.detail}</span></span>:<><span className="text-ui-action tabular-nums">{q.number}</span><span className="text-ui-meta tabular-nums">{q.value}</span>{q.marker===true&&<span aria-hidden="true" className="absolute right-1 top-1 size-1.5 rounded-full bg-info"/>}</>}
 {marker&&<ItemMarker marker={marker}/> }</TooltipTrigger><TooltipPopup className="surface-floating">{marker?<>{q.tooltip}<span className="block">{marker.tooltip??marker.ariaLabel}</span></>:description}</TooltipPopup></Tooltip>})}</div></section>})}</>;return bodyOnly?body:<aside className="knowledge-rail min-h-0 bg-background" aria-label="题目栏">{sort}<ScrollArea overscrollContain><ReviewRailList items={sections.flatMap(s=>s.items)} selected={selected} onSelect={onSelect} onLocate={onLocate} label="选择题目">{body}</ReviewRailList></ScrollArea></aside>}
