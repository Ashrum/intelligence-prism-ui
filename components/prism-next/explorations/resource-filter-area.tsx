"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
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
  return <>{selected && <Check aria-hidden="true" />}<span className="truncate">{option.label}{option.count !== undefined && `（${option.count}）`}</span></>
}

type DimensionProps = {
  dimension: FilterDimension
  selected: readonly string[]
  onIntent: (intent: ResourceFilterIntent) => void
}

function OptionChoices({ dimension, selected, onSelect, options = dimension.options }: Omit<DimensionProps, "onIntent"> & {
  options?: readonly FilterOption[]
  onSelect: (values: string[]) => void
}) {
  return <ToggleGroup multiple={dimension.mode === "multiple"} value={selected.length ? [...selected] : [""]} aria-label={dimension.label} className="max-w-full flex-wrap" onValueChange={values => {
    if (values.includes("") && selected.length) { onSelect([]); return }
    const added = values.find(value => value !== "" && !selected.includes(value))
    onSelect(added ? [added] : values.filter(Boolean))
  }}>
    <ToggleGroupItem value="" aria-label={`${dimension.label}：不限`}>{!selected.length && <Check aria-hidden="true" />}不限</ToggleGroupItem>
    {options.map(option => <ToggleGroupItem key={option.id} value={option.id} aria-label={`${dimension.label}：${option.label}${option.count !== undefined ? `，${option.count} 题` : ""}`} title={option.label} disabled={option.count === 0 && !selected.includes(option.id)} className="max-w-full">
      <OptionLabel option={option} selected={selected.includes(option.id)} />
    </ToggleGroupItem>)}
  </ToggleGroup>
}

function MultiChoices({ dimension, draft, setDraft, options = dimension.options }: {
  dimension: FilterDimension; draft: readonly string[]; setDraft: (value: string[]) => void; options?: readonly FilterOption[]
}) {
  return <div className="flex flex-wrap gap-x-4 gap-y-3" role="group" aria-label={`${dimension.label}多选`}>
    {options.map(option => <label key={option.id} className="flex max-w-full items-center gap-2 text-ui-body">
      <Checkbox checked={draft.includes(option.id)} disabled={option.count === 0 && !draft.includes(option.id)} aria-label={`${dimension.label}：${option.label}`} onCheckedChange={checked => setDraft(checked ? [...draft.filter(id => id !== option.id), option.id] : draft.filter(id => id !== option.id))} />
      <span className="break-words">{option.label}{option.count !== undefined && `（${option.count}）`}</span>
    </label>)}
  </div>
}

function DraftActions({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return <div className="flex gap-2"><Button variant="outline" onClick={onConfirm}>确认</Button><Button variant="ghost" onClick={onCancel}>取消</Button></div>
}

export function FacetRow({ dimension, selected, onIntent, slots = 2, full = false, searchable = false }: DimensionProps & { slots?: number; full?: boolean; searchable?: boolean }) {
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
  return <fieldset className="resource-filter-facet min-w-0" aria-describedby={dimension.description ? `${id}-help` : undefined} data-dimension={dimension.id}>
    <legend className="sr-only">{dimension.label}</legend>
    {!full && <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true" inert><div ref={measureBox} className="flex w-max gap-0.5"><Toggle tabIndex={-1}>{!selected.length && <Check aria-hidden="true" />}不限</Toggle>{dimension.options.map(option => <Toggle key={option.id} tabIndex={-1}><OptionLabel option={option} selected={selected.includes(option.id)} /></Toggle>)}</div></div>}
    <div className="resource-filter-row" data-full={full || undefined}>
      <span className="text-ui-action" aria-hidden="true">{dimension.label}</span>
      <div ref={optionsBox} className="relative min-w-0 space-y-3" id={`${id}-options`}>
        {searchable && <div className="space-y-2"><Label htmlFor={`${id}-search`}>搜索{dimension.label}选项</Label><Input id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} /></div>}
        {draft !== null ? <><MultiChoices dimension={dimension} draft={draft} setDraft={setDraft} options={visible} /><DraftActions onConfirm={() => { onIntent(filterIntent(dimension, draft)); finishDraft() }} onCancel={finishDraft} /></> :
          <OptionChoices dimension={dimension} selected={selected} options={visible} onSelect={values => onIntent(filterIntent(dimension, values))} />}
        {!visible.length && <p role="status" className="text-ui-hint">没有匹配的选项。</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-1">
        {!full && hasMore && draft === null && <Button variant="ghost" aria-label={`${dimension.label}${expanded ? "收起" : "更多"}`} aria-expanded={expanded} aria-controls={`${id}-options`} onClick={() => setExpanded(value => !value)}>{expanded ? "收起" : "更多"}{expanded ? <ChevronUp /> : <ChevronDown />}</Button>}
        {dimension.mode === "multiple" && <Button ref={multiTrigger} variant="ghost" disabled={draft !== null} aria-label={`${dimension.label}多选`} onClick={() => setDraft([...selected])}>多选</Button>}
      </div>
    </div>
    {dimension.description && <p id={`${id}-help`} className="mt-2 text-ui-hint">{dimension.description}</p>}
  </fieldset>
}

export function DimensionEditor({ dimension, selected, onIntent, onClose }: DimensionProps & { onClose: () => void }) {
  const id = useId()
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState<string[]>([...selected])
  const options = dimension.options.filter(option => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  return <fieldset className="min-w-0 space-y-4" aria-describedby={dimension.description ? `${id}-help` : undefined}>
    <legend className="sr-only">{dimension.label}</legend>
    {dimension.description && <p id={`${id}-help`} className="text-ui-hint">{dimension.description}</p>}
    <div className="space-y-2"><Label htmlFor={`${id}-search`}>搜索{dimension.label}选项</Label><Input id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} /></div>
    {dimension.mode === "multiple" ? <>
      <MultiChoices dimension={dimension} draft={draft} setDraft={setDraft} options={options} />
      <p className="text-ui-hint">已勾选 {draft.length} 项，确认后生效。</p>
      <DraftActions onConfirm={() => { onIntent(filterIntent(dimension, draft)); onClose() }} onCancel={onClose} />
    </> : <OptionChoices dimension={dimension} selected={selected} options={options} onSelect={values => { onIntent(filterIntent(dimension, values)); onClose() }} />}
    {!options.length && <p role="status" className="text-ui-hint">没有匹配的选项。</p>}
  </fieldset>
}

function DimensionPopover({ dimension, selected, onIntent }: DimensionProps) {
  const [open, setOpen] = useState(false)
  const summary = dimensionSelection(dimension, selected)
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger render={<Button variant="outline" className="min-w-0 max-w-full" />} title={`${dimension.label}${summary ? `：${summary}` : ""}`}>
      <span className="shrink-0">{dimension.label}</span>{summary && <><Check aria-hidden="true" /><span className="truncate">：{summary}</span></>}<ChevronDown />
    </PopoverTrigger>
    <PopoverPopup className="w-96 max-w-[calc(100vw-2rem)]" align="start">
      <PopoverTitle className="mb-4">{dimension.label}</PopoverTitle>
      {open && <DimensionEditor dimension={dimension} selected={selected} onIntent={onIntent} onClose={() => setOpen(false)} />}
    </PopoverPopup>
  </Popover>
}

function FilterPanel({ label, dimensions, value, onIntent, searchable = false }: Pick<ResourceFilterAreaProps, "dimensions" | "value" | "onIntent"> & { label: string; searchable?: boolean }) {
  const [open, setOpen] = useState(false)
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger render={<Button variant="outline" className="max-w-full" />}>{label}<ChevronDown /></PopoverTrigger>
    <PopoverPopup align="start" className="w-[40rem] max-w-[calc(100vw-2rem)]">
      <div className="mb-4 flex items-center justify-between gap-3"><PopoverTitle>{label}</PopoverTitle><PopoverClose render={<Button variant="ghost" />}>关闭</PopoverClose></div>
      <p className="mb-4 text-ui-hint">单选即时生效；多选需在所在维度确认，取消或关闭放弃未确认的勾选。</p>
      {open && <div className="space-y-4">{dimensions.map(dimension => <FacetRow key={dimension.id} full searchable={searchable} dimension={dimension} selected={value.filters[dimension.id] ?? []} onIntent={onIntent} />)}</div>}
    </PopoverPopup>
  </Popover>
}

export function FilterResults({ value, sortItems, resultCount, favoriteCount, endSlot, onIntent }: Omit<ResourceFilterAreaProps, "variant" | "dimensions">) {
  const id = useId()
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-3" aria-label="筛选结果工具栏" role="group">
    {sortItems.length > 0 && <div className="flex min-w-0 flex-wrap items-center gap-2"><span id={`${id}-sort`} className="text-ui-action">排序</span><ToggleGroup aria-labelledby={`${id}-sort`} multiple={false} value={[value.sort]} className="max-w-full flex-wrap" onValueChange={values => { if (values[0]) onIntent({ type: "sort", value: values[0] }) }}>
      {sortItems.map(item => <ToggleGroupItem key={item.id} value={item.id}>{value.sort === item.id && <Check aria-hidden="true" />}{item.label}</ToggleGroupItem>)}
    </ToggleGroup></div>}
    <span className="whitespace-nowrap text-ui-body">{resultCount === undefined ? "题数未提供" : `${resultCount} 题`}</span>
    <Toggle pressed={value.favoritesOnly} onPressedChange={pressed => onIntent({ type: "favorites", value: pressed })}>{value.favoritesOnly && <Check aria-hidden="true" />}我的收藏（{favoriteCount ?? "数量未知"}）</Toggle>
    <div className="flex max-w-full items-center gap-2"><Label htmlFor={`${id}-search`} className="shrink-0">在结果中搜索</Label><Input id={`${id}-search`} type="search" className="w-32" value={value.search} onChange={event => onIntent({ type: "search", value: event.target.value })} /></div>
    {endSlot && <div className="ml-auto max-w-full">{endSlot}</div>}
  </div>
}

export function ResourceFilterArea(props: ResourceFilterAreaProps) {
  const { dimensions, value, variant, onIntent } = props
  const { ref, width } = useContainerWidth()
  const id = useId()
  const [collapsed, setCollapsed] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const active = dimensions.filter(dimension => value.filters[dimension.id]?.length).length
  const common = dimensions.filter(dimension => dimension.common).slice(0, 3)
  const remaining = dimensions.filter(dimension => !common.includes(dimension))
  const otherActive = remaining.filter(dimension => value.filters[dimension.id]?.length).length
  const buttonLimit = width < 600 ? 2 : width < 820 ? 3 : 4
  const visibleDimensions = dimensions.slice(0, buttonLimit)
  const overflow = dimensions.slice(buttonLimit)
  const overflowActive = overflow.filter(dimension => value.filters[dimension.id]?.length).length
  const slots = Math.max(1, Math.floor((width - 280) / 120))
  const row = (dimension: FilterDimension) => <FacetRow key={dimension.id} dimension={dimension} selected={value.filters[dimension.id] ?? []} onIntent={onIntent} slots={slots} />
  return <div ref={ref} data-filter-variant={variant} className="resource-filter-area min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      {variant === "A" ? <Button variant="ghost" aria-expanded={!collapsed} aria-controls={`${id}-facets`} onClick={() => setCollapsed(value => !value)}>筛选 · {active} 个维度已启用{collapsed ? <ChevronDown /> : <ChevronUp />}</Button> : <span className="text-ui-action">筛选</span>}
      <Button variant="ghost" onClick={() => { setResetKey(key => key + 1); onIntent({ type: "reset" }) }}>重置</Button>
    </div>
    {variant === "A" && <div key={resetKey} id={`${id}-facets`} hidden={collapsed} className="space-y-3">{dimensions.map(row)}</div>}
    {variant === "B" && <div key={resetKey} className="flex min-w-0 items-center gap-2">
      <div className="grid min-w-0 flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${visibleDimensions.length || 1}, minmax(0, 1fr))` }}>{visibleDimensions.map(dimension => <DimensionPopover key={dimension.id} dimension={dimension} selected={value.filters[dimension.id] ?? []} onIntent={onIntent} />)}</div>
      {overflow.length > 0 && <FilterPanel searchable label={`更多筛选 ${overflow.length}${overflowActive ? ` · 已启用 ${overflowActive}` : ""}`} dimensions={overflow} value={value} onIntent={onIntent} />}
    </div>}
    {variant === "C" && <div key={resetKey} className="space-y-3">{common.map(row)}<FilterPanel label={`全部筛选 · 其余已启用 ${otherActive}`} dimensions={dimensions} value={value} onIntent={onIntent} /></div>}
    <div className="border-t pt-3"><FilterResults {...props} /></div>
  </div>
}
