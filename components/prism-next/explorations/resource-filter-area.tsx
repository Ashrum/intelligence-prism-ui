"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Circle, Info, ListFilter, Search, Star, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/coss/badge"
import { FramePanel } from "@/components/coss/frame"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/coss/input-group"
import { Tabs, TabsList, TabsTab } from "@/components/coss/tabs"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/coss/tooltip"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Toggle } from "@/components/coss/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Popover, PopoverClose, PopoverPopup, PopoverTitle, PopoverTrigger } from "@/components/coss/popover"
import { dimensionSelection, filterIntent, fittingOptions, type FilterDimension, type FilterOption, type ResourceFilterAreaProps, type ResourceFilterIntent } from "./resource-filter-types"
import "./resource-filter-area.css"

// Geometry controls presentation only. No query, result count or selected value is inferred here.
function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(520)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return { ref, width }
}

function OptionLabel({ option, selected }: { option: FilterOption; selected: boolean }) {
  return <span className={`flex min-w-0 items-center gap-1.5 ${option.count === 0 ? "text-muted-foreground" : ""}`}>
    {option.tone && <Circle aria-hidden="true" className={`size-[7px] shrink-0 ${option.tone === "success" ? "text-success" : option.tone === "info" ? "text-info" : "text-warning"}`} fill="currentColor" strokeWidth={0} />}
    <span className={`truncate ${selected ? "text-ui-action" : "text-ui-body"}`}>{option.label}</span>
    {option.count !== undefined && <span className="shrink-0 text-ui-hint text-muted-foreground tabular-nums">{option.count}</span>}
  </span>
}

function DimensionLabel({ dimension, helpId }: { dimension: FilterDimension; helpId: string }) {
  return <div className="flex min-h-7 items-center gap-0.5 text-ui-hint text-muted-foreground">
    <span>{dimension.label}</span>
    {dimension.description && <><span id={helpId} className="sr-only">{dimension.description}</span><Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-xs" />} aria-label={`${dimension.label}说明`}><Info aria-hidden="true" /></TooltipTrigger>
      <TooltipPopup className="max-w-72">{dimension.description}</TooltipPopup>
    </Tooltip></>}
  </div>
}

type DimensionProps = {
  dimension: FilterDimension
  selected: readonly string[]
  onIntent: (intent: ResourceFilterIntent) => void
}

function OptionChoices({ dimension, selected, onSelect, options = dimension.options, multiple = false, list = false }: Omit<DimensionProps, "onIntent"> & {
  options?: readonly FilterOption[]
  onSelect: (values: string[]) => void
  multiple?: boolean
  list?: boolean
}) {
  return <ToggleGroup size="sm" orientation={list ? "vertical" : "horizontal"} multiple={multiple || dimension.mode === "multiple"} value={selected.length ? [...selected] : [""]} aria-label={dimension.label} className={list ? "w-full flex-col gap-0.5" : "max-w-full flex-wrap gap-0.5"} onValueChange={values => {
    if (values.includes("") && selected.length) { onSelect([]); return }
    const added = values.find(value => value !== "" && !selected.includes(value))
    onSelect(multiple ? values.filter(Boolean) : added ? [added] : values.filter(Boolean))
  }}>
    <ToggleGroupItem value="" aria-label={`${dimension.label}：全部`} className={list ? "w-full justify-start" : ""}><span className={!selected.length ? "text-ui-action" : "text-ui-body"}>全部</span></ToggleGroupItem>
    {options.map(option => <ToggleGroupItem key={option.id} value={option.id} aria-label={`${dimension.label}：${option.label}${option.count !== undefined ? `，${option.count} 题` : ""}`} title={option.label} disabled={option.count === 0 && !selected.includes(option.id)} className={list ? "w-full justify-start" : "max-w-full"}>
      <OptionLabel option={option} selected={selected.includes(option.id)} />
    </ToggleGroupItem>)}
  </ToggleGroup>
}

function MultiChoices({ dimension, draft, setDraft, options = dimension.options, list = false }: {
  dimension: FilterDimension; draft: readonly string[]; setDraft: (value: string[]) => void; options?: readonly FilterOption[]; list?: boolean
}) {
  return <OptionChoices dimension={dimension} selected={draft} onSelect={setDraft} options={options} multiple list={list} />
}

function DraftActions({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return <div className="flex gap-2"><Button size="xs" variant="outline" onClick={onConfirm}>确定</Button><Button size="xs" variant="ghost" onClick={onCancel}>取消</Button></div>
}

export function FacetRow({ dimension, selected, onIntent, slots = 2, full = false, searchable = false, tools }: DimensionProps & { slots?: number; full?: boolean; searchable?: boolean; tools?: ReactNode }) {
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState<string[] | null>(null)
  const [query, setQuery] = useState("")
  const [measuredSlots, setMeasuredSlots] = useState<number | null>(null)
  const multiTrigger = useRef<HTMLButtonElement>(null)
  const restoreMultiFocus = useRef(false)
  const optionsBox = useRef<HTMLDivElement>(null)
  const measureBox = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (draft === null && restoreMultiFocus.current) {
      restoreMultiFocus.current = false
      multiTrigger.current?.focus()
    }
  }, [draft])
  useEffect(() => {
    if (full || !optionsBox.current || !measureBox.current) return
    const measure = () => {
      if (!optionsBox.current || !measureBox.current || !optionsBox.current.clientWidth) return
      setMeasuredSlots(fittingOptions(optionsBox.current.clientWidth, Array.from(measureBox.current.children).map(child => child.getBoundingClientRect().width)))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(optionsBox.current)
    observer.observe(measureBox.current)
    measure()
    return () => observer.disconnect()
  }, [full, dimension.options, selected])
  const limit = measuredSlots ?? slots
  const matching = dimension.options.filter(option => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const visible = full || expanded || draft !== null ? matching : matching.filter((option, index) => index < limit || selected.includes(option.id))
  const hasMore = matching.length > visible.length || expanded
  const finishDraft = () => { restoreMultiFocus.current = true; setDraft(null) }
  return <fieldset className="resource-filter-facet relative min-w-0 border-b last:border-b-0" aria-describedby={dimension.description ? `${id}-help` : undefined} data-dimension={dimension.id}>
    <legend className="sr-only">{dimension.label}</legend>
    {!full && <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true" inert><div ref={measureBox} className="flex w-max gap-0.5"><Toggle size="sm" tabIndex={-1}><span className={!selected.length ? "text-ui-action" : "text-ui-body"}>全部</span></Toggle>{dimension.options.map(option => <Toggle size="sm" key={option.id} tabIndex={-1}><OptionLabel option={option} selected={selected.includes(option.id)} /></Toggle>)}</div></div>}
    <div className="resource-filter-row" data-full={full || undefined}>
      <DimensionLabel dimension={dimension} helpId={`${id}-help`} />
      <div ref={optionsBox} className="relative min-w-0 space-y-2" id={`${id}-options`}>
        {searchable && <div className="space-y-2"><Label htmlFor={`${id}-search`}>搜索{dimension.label}选项</Label><Input size="sm" id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} /></div>}
        {draft !== null ? <><MultiChoices dimension={dimension} draft={draft} setDraft={setDraft} options={visible} /><DraftActions onConfirm={() => { onIntent(filterIntent(dimension, draft)); finishDraft() }} onCancel={finishDraft} /></> :
          <OptionChoices dimension={dimension} selected={selected} options={visible} onSelect={values => onIntent(filterIntent(dimension, values))} />}
        {!visible.length && <p role="status" className="text-ui-hint">没有匹配的选项。</p>}
      </div>
      <div className="resource-filter-tools">
        <span>{!full && hasMore && draft === null && <Button size="xs" variant="ghost" className="text-muted-foreground" aria-label={`${dimension.label}${expanded ? "收起" : "更多"}`} aria-expanded={expanded} aria-controls={`${id}-options`} onClick={() => setExpanded(value => !value)}>{expanded ? "收起" : "更多"}{expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}</Button>}</span>
        <span>{dimension.mode === "multiple" && <Button size="xs" ref={multiTrigger} variant="ghost" className="text-muted-foreground" disabled={draft !== null} aria-label={`${dimension.label}多选`} onClick={() => setDraft([...selected])}>多选</Button>}</span>
        {tools && <div className="col-span-2 flex flex-wrap justify-end gap-1">{tools}</div>}
      </div>
    </div>
  </fieldset>
}

export function DimensionEditor({ dimension, selected, onIntent, onClose }: DimensionProps & { onClose: () => void }) {
  const id = useId()
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState<string[]>([...selected])
  const options = dimension.options.filter(option => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  return <fieldset className="min-w-0 space-y-4" aria-describedby={dimension.description ? `${id}-help` : undefined}>
    <legend className="sr-only">{dimension.label}</legend>
    <DimensionLabel dimension={dimension} helpId={`${id}-help`} />
    <div className="space-y-2"><Label htmlFor={`${id}-search`}>搜索{dimension.label}选项</Label><Input size="sm" id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} /></div>
    {dimension.mode === "multiple" ? <>
      <MultiChoices dimension={dimension} draft={draft} setDraft={setDraft} options={options} list />
      <p className="text-ui-hint">已勾选 {draft.length} 项，确定后生效。</p>
      <DraftActions onConfirm={() => { onIntent(filterIntent(dimension, draft)); onClose() }} onCancel={onClose} />
    </> : <OptionChoices dimension={dimension} selected={selected} options={options} list onSelect={values => { onIntent(filterIntent(dimension, values)); onClose() }} />}
    {!options.length && <p role="status" className="text-ui-hint">没有匹配的选项。</p>}
  </fieldset>
}

function DimensionPopover({ dimension, selected, onIntent }: DimensionProps) {
  const [open, setOpen] = useState(false)
  const summary = selected.length ? `${dimensionSelection(dimension, selected.slice(0, 1))}${selected.length > 1 ? ` +${selected.length - 1}` : ""}` : ""
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger render={<Toggle size="sm" variant="outline" pressed={selected.length > 0} className="min-w-0 max-w-full" />} title={`${dimension.label}${summary ? `：${summary}` : ""}`}>
      <span className="truncate">{dimension.label}{summary ? `：${summary}` : ""}</span><ChevronDown aria-hidden="true" />
    </PopoverTrigger>
    <PopoverPopup className="w-96 max-w-[calc(100vw-2rem)]" align="start">
      <PopoverTitle className="sr-only">{dimension.label}</PopoverTitle>
      {open && <DimensionEditor dimension={dimension} selected={selected} onIntent={onIntent} onClose={() => setOpen(false)} />}
    </PopoverPopup>
  </Popover>
}

function FilterPanel({ label, dimensions, value, onIntent, searchable = false, count = 0 }: Pick<ResourceFilterAreaProps, "dimensions" | "value" | "onIntent"> & { label: string; searchable?: boolean; count?: number }) {
  const [open, setOpen] = useState(false)
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger render={<Button size="sm" variant="outline" className="max-w-full gap-0.5 px-1.5" />}><ListFilter aria-hidden="true" />{label}{count > 0 && <Badge variant="secondary" size="sm" className="text-component-label">{count}</Badge>}</PopoverTrigger>
    <PopoverPopup align="start" className="resource-filter-area w-[40rem] max-w-[calc(100vw-2rem)]">
      <div className="mb-4 flex items-center justify-between gap-3"><PopoverTitle>{label}</PopoverTitle><PopoverClose render={<Button variant="ghost" />}>关闭</PopoverClose></div>
      <p className="mb-4 text-ui-hint">单选即时生效；多选需在所在维度确定，取消或关闭放弃未确认的勾选。</p>
      {open && <FramePanel className="p-0">{dimensions.map(dimension => <FacetRow key={dimension.id} full searchable={searchable} dimension={dimension} selected={value.filters[dimension.id] ?? []} onIntent={onIntent} />)}</FramePanel>}
    </PopoverPopup>
  </Popover>
}

export function FilterResults({ value, sortItems, resultCount, favoriteCount, endSlot, onIntent }: Omit<ResourceFilterAreaProps, "variant" | "dimensions">) {
  return <div className="resource-filter-results border-b pb-2" aria-label="筛选结果工具栏" role="group">
    {sortItems.length > 0 && <Tabs value={value.sort} onValueChange={value => { if (typeof value === "string") onIntent({ type: "sort", value }) }}>
      <TabsList variant="underline" size="sm" aria-label="排序">{sortItems.map(item => <TabsTab key={item.id} value={item.id}>{item.label}</TabsTab>)}</TabsList>
    </Tabs>}
    <div className="resource-filter-result-actions">
      <span className="whitespace-nowrap text-ui-hint text-muted-foreground tabular-nums">{resultCount === undefined ? "题数未提供" : `共 ${resultCount} 题`}</span>
      <Toggle size="sm" variant="outline" pressed={value.favoritesOnly} onPressedChange={pressed => onIntent({ type: "favorites", value: pressed })}><Star aria-hidden="true" />我的收藏<span className="text-ui-hint text-muted-foreground tabular-nums">{favoriteCount ?? "数量未知"}</span></Toggle>
      <InputGroup className="w-[168px] shrink-0"><InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon><InputGroupInput size="sm" aria-label="在结果中搜索" placeholder="在结果中搜索" type="search" value={value.search} onChange={event => onIntent({ type: "search", value: event.target.value })} /></InputGroup>
      {endSlot && <div className="max-w-full">{endSlot}</div>}
    </div>
  </div>
}

export function ResourceFilterArea(props: ResourceFilterAreaProps) {
  const { dimensions, value, variant, onIntent } = props
  const { ref, width } = useContainerWidth()
  const id = useId()
  const [collapsed, setCollapsed] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const collapseTrigger = useRef<HTMLButtonElement>(null)
  const restoreCollapseFocus = useRef(false)
  useEffect(() => {
    if (restoreCollapseFocus.current) { collapseTrigger.current?.focus(); restoreCollapseFocus.current = false }
  }, [collapsed])
  const common = dimensions.filter(dimension => dimension.common).slice(0, 3)
  const remaining = dimensions.filter(dimension => !common.includes(dimension))
  const otherActive = remaining.filter(dimension => value.filters[dimension.id]?.length).length
  const buttonLimit = width < 600 ? 2 : width < 820 ? 3 : 4
  const visibleDimensions = dimensions.slice(0, buttonLimit)
  const overflow = dimensions.slice(buttonLimit)
  const overflowActive = overflow.filter(dimension => value.filters[dimension.id]?.length).length
  const slots = Math.max(1, Math.floor((width - 224) / 90))
  const summary = dimensions.filter(dimension => value.filters[dimension.id]?.length).map(dimension => `${dimension.label} ${dimensionSelection(dimension, value.filters[dimension.id])}`).join("；") || "未筛选"
  const reset = <Button size="xs" variant="ghost" className="text-muted-foreground" onClick={() => { setResetKey(key => key + 1); onIntent({ type: "reset" }) }}>重置</Button>
  const collapse = <Button ref={collapseTrigger} size="xs" variant="ghost" className="text-muted-foreground" aria-expanded={!collapsed} aria-controls={`${id}-facets`} onClick={() => { restoreCollapseFocus.current = true; setCollapsed(value => !value) }}>{collapsed ? "展开" : "收起"}</Button>
  const rows = variant === "A" ? dimensions : common
  return <div ref={ref} data-filter-variant={variant} className="resource-filter-area min-w-0 space-y-2">
    {variant !== "B" && <FramePanel className="p-0">
      {collapsed && <div className="flex h-10 items-center gap-2 px-2"><span className="shrink-0 text-ui-action">筛选</span><span className="min-w-0 flex-1 truncate text-ui-hint text-muted-foreground" title={summary}>{summary}</span><div className="flex shrink-0">{reset}{collapse}</div></div>}
      <div key={resetKey} id={`${id}-facets`} hidden={collapsed}>{rows.map((dimension, index) => <FacetRow key={dimension.id} dimension={dimension} selected={value.filters[dimension.id] ?? []} onIntent={onIntent} slots={slots} tools={!collapsed && index === rows.length - 1 ? <>
        {variant === "C" && <FilterPanel label="全部筛选" count={otherActive} dimensions={dimensions} value={value} onIntent={onIntent} />}{reset}{collapse}
      </> : undefined} />)}</div>
    </FramePanel>}
    {variant === "B" && <FramePanel key={resetKey} className="flex min-h-10 min-w-0 flex-wrap items-center gap-2 px-2 py-1.5">
      {visibleDimensions.map(dimension => <DimensionPopover key={dimension.id} dimension={dimension} selected={value.filters[dimension.id] ?? []} onIntent={onIntent} />)}
      {overflow.length > 0 && <FilterPanel searchable label="更多筛选" count={overflowActive} dimensions={overflow} value={value} onIntent={onIntent} />}
      <div className="ml-auto">{reset}</div>
    </FramePanel>}
    <FilterResults {...props} />
  </div>
}
