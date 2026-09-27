"use client"

import { useId, useState, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Checkbox } from "@/components/coss/checkbox"
import { Label } from "@/components/coss/label"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Button } from "./button"
import { Badge } from "./badge"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentTemplate = {
  id: string
  name: string
  objectType: string
  summary: string | null
  scope: string | null
  source: string | null
  version: { id: string; label: string | null }
  categoryId?: string
  recommended?: boolean
  recommendationReason?: string | null
  availability: { state: "available" } | { state: "unavailable"; reason: string } | { state: "unknown"; reason?: string }
  /** Host-authored structural fields; no inferred scores, sections or differences. */
  structure: readonly { key: string; label: string; value: string | null }[]
  preview?: ReactNode
  /** Relative to the current arrangement. Missing information requires confirmation. */
  selectionImpact?: { requiresConfirmation: boolean; description: string }
}
type TemplateContext = { templateSetId: string; version: string }
export type AgentTemplatePickerIntent = TemplateContext & (
  | { type: "select"; templateId: string; templateVersion: string; previousTemplateId: string | null; confirmed: boolean; impact: string | null }
  | { type: "preview"; templateId: string; templateVersion: string }
  | { type: "compare"; templateIds: readonly [string, string]; templateVersions: readonly [string, string] }
  | { type: "clear"; previousTemplateId: string }
  | { type: "request-manage" }
)
export type AgentTemplatePickerProps = AgentRecordViewProps & {
  title: string
  templateSet: { id: string; version: string }
  templates: readonly AgentTemplate[]
  selectedId: string | null
  categories?: readonly { id: string; label: string }[]
  previewId?: string | null
  comparison?: readonly [string, string] | null
  onIntent?: (intent: AgentTemplatePickerIntent) => void
  manage?: { disabledReason?: string }
  disabledReason?: string
  onBack?: () => void
  presentation?: "card" | "inline"
  notice?: string | null
}

const hasText = (value: string | null | undefined): value is string => !!value?.trim()
const availabilityLabel = { available: "可用", unavailable: "不可用", unknown: "可用性未知" }

/** Semantic 09: only selection requests. Template storage, application and management stay outside. */
export function AgentTemplatePicker({ title, templateSet, templates, selectedId, categories = [], previewId, comparison,
  view = "inline", density = "default", presentation = "card", onIntent, onExpand, onBack, manage, disabledReason,
  notice = "选择模板不代表已应用到内容。", details }: AgentTemplatePickerProps) {
  const id = useId(), full = view === "workspace", compact = density === "compact"
  // These are transient disclosure/filter states, never a template or arrangement draft.
  const [filter, setFilter] = useState<string | null>(null)
  const [compareSelection, setCompareSelection] = useState<{ basis: string; ids: string[] }>({ basis: "", ids: [] })
  const [pending, setPending] = useState<{ basis: string; templateId: string } | null>(null)
  const context = { templateSetId: templateSet.id, version: templateSet.version }
  const basis = JSON.stringify([templateSet, selectedId, templates.map(item => [item.id, item.version, item.availability, item.selectionImpact]), disabledReason])
  const valid = hasText(templateSet.id) && hasText(templateSet.version) && templates.every(item => hasText(item.id) && hasText(item.version.id)) && new Set(templates.map(item => item.id)).size === templates.length
  const reason = disabledReason !== undefined ? disabledReason || "当前仅供查看。" : !valid ? "模板或版本尚未确认。" : !onIntent ? "当前仅供查看。" : undefined
  const selected = templates.find(item => item.id === selectedId)
  const category = categories.find(item => item.id === filter)
  const visible = templates.filter(item => full ? !category || item.categoryId === category.id || item.id === selectedId : !onExpand || item.recommended || item.id === selectedId)
  const compared = compareSelection.basis === basis ? compareSelection.ids : []
  const pair = comparison?.map(key => templates.find(item => item.id === key))
  const comparisonItems = pair?.length === 2 && pair[0] && pair[1] && pair[0] !== pair[1] && valid ? pair as [AgentTemplate, AgentTemplate] : null
  const ordinal = (item: AgentTemplate) => `模板 ${templates.indexOf(item) + 1}`
  const emit = (intent: AgentTemplatePickerIntent) => { if (!reason) onIntent?.(intent) }
  const canSelect = (item: AgentTemplate) => !reason && item.availability.state === "available" && item.id !== selectedId
  const needsConfirmation = (item: AgentTemplate) => !item.selectionImpact || !hasText(item.selectionImpact.description) || item.selectionImpact.requiresConfirmation
  const select = (item: AgentTemplate, confirmed: boolean) => {
    if (!canSelect(item) || (needsConfirmation(item) && !confirmed)) return
    emit({ ...context, type: "select", templateId: item.id, templateVersion: item.version.id, previousTemplateId: selectedId, confirmed, impact: hasText(item.selectionImpact?.description) ? item.selectionImpact.description : null })
    setPending(null)
  }

  // Exact repeated descriptions have one persistent owner, with scope and ARIA references.
  const facts = new Map<string, AgentTemplate[]>()
  const unknown: string[] = []
  for (const item of visible) {
    const missing: string[] = []
    const add = (label: string, value: string | null | undefined) => {
      if (!hasText(value)) { missing.push(label); return }
      const text = `${label}：${value}`
      facts.set(text, [...(facts.get(text) ?? []), item])
    }
    add("适用对象", item.objectType); add("结构摘要", item.summary); add("适用范围", item.scope)
    add("来源", item.source); add("版本", item.version.label); add("推荐理由", item.recommendationReason)
    add("切换影响", item.selectionImpact?.description)
    if (item.availability.state !== "available") {
      if (hasText(item.availability.reason)) add("不可选原因", item.availability.reason)
      else missing.push("不可选原因")
    }
    if (missing.length) unknown.push(`${ordinal(item)}：${missing.map(label => label === "切换影响" ? "影响未知" : `${label}未知`).join("、")}`)
  }
  const factEntries = [...facts]
  const describedBy = (item: AgentTemplate) => [reason ? `${id}-reason` : "", ...factEntries.flatMap(([, items], index) => items.includes(item) ? [`${id}-fact-${index}`] : []), unknown.length ? `${id}-unknown` : ""].filter(Boolean).join(" ") || undefined
  const content = <>
    <header className="min-w-0 space-y-2">
      <h3 id={`${id}-title`} className="break-words text-block-title">{title}</h3>
      {selectedId === null && <p className="text-ui-hint">尚未选择模板。</p>}
      {selectedId !== null && !selected && <p className="text-ui-hint">当前选择未列出，请核对或清除选择。</p>}
      {full && selected && category && selected.categoryId !== category.id && <p className="text-ui-hint">当前选择不属于此分类，仍保留在列表中。</p>}
      {reason && <p id={`${id}-reason`} className="break-words text-ui-hint">{reason}</p>}
    </header>
    {full && categories.length > 0 && <div className="min-w-0 space-y-2">
      <Label htmlFor={`${id}-filter`}>模板分类</Label>
      <Select value={category ? String(categories.indexOf(category)) : "all"} onValueChange={value => {
        const index = categories.findIndex((_, index) => String(index) === value)
        setFilter(index < 0 ? null : categories[index].id)
      }}>
        <SelectTrigger id={`${id}-filter`} className="w-full min-w-0"><SelectValue>{category?.label ?? "全部分类"}</SelectValue></SelectTrigger>
        <SelectPopup><SelectItem value="all">全部分类</SelectItem>{categories.map((item, index) => <SelectItem key={index} value={String(index)}>{item.label}</SelectItem>)}</SelectPopup>
      </Select>
    </div>}
    {!visible.length && <p className="text-ui-hint">{full ? "当前分类没有模板。" : "暂无推荐模板，可查看全部模板。"}</p>}
    <div className={compact ? "min-w-0 space-y-2" : "min-w-0 space-y-4"}>
      {factEntries.map(([text, items], index) => items.length > 1 && <p key={index} id={`${id}-fact-${index}`} className="break-words text-ui-hint">
        {items.length === visible.length ? "" : `${items.map(ordinal).join("、")} · `}{text}
      </p>)}
      {!!unknown.length && <p id={`${id}-unknown`} className="break-words text-ui-hint">{unknown.join("；")}。</p>}
    </div>
    <ol className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-5"}>
      {visible.map(item => {
        const index = templates.indexOf(item)
        const confirming = pending?.basis === basis && pending.templateId === item.id && canSelect(item)
        return <li key={index} aria-labelledby={`${id}-item-${index}`} aria-describedby={describedBy(item)} className="min-w-0 space-y-2" data-template-item="">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h4 id={`${id}-item-${index}`} className="min-w-0 break-words text-item-title">{ordinal(item)} · {item.name || "未命名模板"}</h4>
            {item.id === selectedId && <Badge variant="secondary">当前选择</Badge>}
            {item.recommended && <Badge variant="outline">推荐</Badge>}
            <Badge variant={item.availability.state === "available" ? "outline" : "warning"}>{availabilityLabel[item.availability.state]}</Badge>
          </div>
          {factEntries.map(([text, items], factIndex) => items.length === 1 && items[0] === item && <p key={factIndex} id={`${id}-fact-${factIndex}`} className="break-words text-ui-hint">{text}</p>)}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="navigation" disabled={!canSelect(item)} aria-describedby={describedBy(item)} aria-label={`选择${item.name}`}
              onClick={() => { if (!canSelect(item)) return; if (needsConfirmation(item)) setPending({ basis, templateId: item.id }); else select(item, false) }}>选择模板</Button>
            {full && item.preview != null && <Button type="button" variant="outline" size="navigation" disabled={!!reason} aria-describedby={describedBy(item)} aria-label={`预览${item.name}`}
              onClick={() => emit({ ...context, type: "preview", templateId: item.id, templateVersion: item.version.id })}>预览版面</Button>}
            {full && <Label className="flex min-w-0 items-center gap-2 text-ui-body" htmlFor={`${id}-compare-${index}`}>
              <Checkbox id={`${id}-compare-${index}`} checked={compared.includes(item.id)} disabled={!!reason || (!compared.includes(item.id) && compared.length >= 2)}
                aria-label={`对比${item.name}`} aria-describedby={describedBy(item)} onCheckedChange={checked => {
                  if (reason || (checked && !compared.includes(item.id) && compared.length >= 2)) return
                  setCompareSelection({ basis, ids: checked ? [...new Set([...compared, item.id])] : compared.filter(key => key !== item.id) })
                }} />加入对比
            </Label>}
          </div>
          {confirming && <section aria-label="确认切换模板" className="min-w-0 space-y-2">
            <p className="text-ui-hint">请核对上述切换影响，再确认选择。</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="navigation" autoFocus aria-describedby={describedBy(item)} onClick={event => { event.currentTarget.closest("li")?.querySelector("button")?.focus(); if (pending?.basis === basis) select(item, true) }}>确认切换</Button>
              <Button type="button" size="navigation" variant="outline" onClick={event => { event.currentTarget.closest("li")?.querySelector("button")?.focus(); setPending(null) }}>取消切换</Button>
            </div>
          </section>}
          {full && valid && previewId === item.id && item.preview != null && <Card className="min-w-0 gap-3 p-4" aria-label="模板示例版面">
            <h5 className="text-ui-action">示例版面</h5><div className="min-w-0 break-words">{item.preview}</div>
          </Card>}
        </li>
      })}
    </ol>
    {full && <>
      <p id={`${id}-compare-help`} className="text-ui-hint">选择两个模板对比结构，当前已勾选 {compared.length} 个。</p>
      <Button type="button" variant="outline" size="navigation" disabled={!!reason || compared.length !== 2} aria-describedby={[`${id}-compare-help`, reason ? `${id}-reason` : ""].filter(Boolean).join(" ")}
        onClick={() => {
          const items = compared.map(key => templates.find(item => item.id === key))
          if (compared.length !== 2 || !items[0] || !items[1]) return
          emit({ ...context, type: "compare", templateIds: [items[0].id, items[1].id], templateVersions: [items[0].version.id, items[1].version.id] })
        }}>对比结构</Button>
      {comparisonItems && <section aria-label="模板结构对比" className="min-w-0 space-y-3">
        <h4 className="text-ui-action">结构对比 · {comparisonItems.map(ordinal).join(" / ")}</h4>
        <p className="text-ui-hint">逐项并列展示已提供的结构字段；未提供的字段保持未知。</p>
        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4">{comparisonItems.map((item, index) => <Card key={index} className="min-w-0 gap-3 p-4">
          <h5 className="text-ui-action">{ordinal(item)}</h5>
          {item.structure.length ? <dl className="min-w-0 space-y-2">{item.structure.map((field, fieldIndex) => <div key={fieldIndex} className="min-w-0">
            <dt className="break-words text-ui-hint">{field.label}</dt><dd className="whitespace-pre-wrap break-words text-ui-body">{hasText(field.value) ? field.value : "未知"}</dd>
          </div>)}</dl> : <p className="text-ui-hint">结构字段未知。</p>}
        </Card>)}</div>
      </section>}
    </>}
    {notice && <p className="break-words text-ui-hint text-muted-foreground" data-template-notice="">{notice}</p>}
    <RecordDetails>{details}</RecordDetails>
    <div className="flex min-w-0 flex-wrap gap-2">
      {selectedId !== null && <Button type="button" variant="outline" size="navigation" disabled={!!reason} aria-describedby={reason ? `${id}-reason` : undefined}
        onClick={() => emit({ ...context, type: "clear", previousTemplateId: selectedId })}>清除选择</Button>}
      {!full && onExpand && <Button type="button" variant="outline" size="navigation" onClick={event => onExpand(event.currentTarget)}>查看全部模板</Button>}
      {full && manage && <Button type="button" variant="outline" size="navigation" disabled={!!reason || manage.disabledReason !== undefined} aria-describedby={manage.disabledReason !== undefined && manage.disabledReason !== reason ? `${id}-manage-reason` : reason ? `${id}-reason` : undefined}
        onClick={() => { if (manage.disabledReason === undefined) emit({ ...context, type: "request-manage" }) }}>管理与配置</Button>}
      {full && onBack && <Button type="button" variant="outline" size="navigation" onClick={onBack}>返回原位置</Button>}
    </div>
    {full && manage?.disabledReason !== undefined && manage.disabledReason !== reason && <p id={`${id}-manage-reason`} className="break-words text-ui-hint">{manage.disabledReason || "暂不能管理模板。"}</p>}
  </>
  const shared = { "aria-labelledby": `${id}-title`, "data-agent-template-view": view, "data-density": density }
  return presentation === "inline" ? <section {...shared} className={compact ? "min-w-0 space-y-3" : "min-w-0 space-y-5"}>{content}</section>
    : <Card {...shared} className={compact ? "min-w-0 gap-3 p-4" : "min-w-0 gap-5 p-5"}>{content}</Card>
}
