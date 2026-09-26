"use client"

import { useId, useState, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Input } from "@/components/coss/input"
import { Textarea } from "@/components/coss/textarea"
import { Badge } from "./badge"
import { Button } from "./button"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"
import type { AgentResourceLicense } from "./agent-resource-retriever"
import type { AgentMaterialAvailability } from "./agent-material-pack"
import {
  copyMaterialRange, extendMaterialRange, materialParagraphRange, materialRangeDescription,
  materialRangeFromCharacters, materialRangeParts, materialRangeText, sameMaterialRange,
  type MaterialTextRange, type MaterialTextSource,
} from "@/lib/prism-next/material-extractor"

export type { MaterialParagraph, MaterialTextPoint, MaterialTextRange } from "@/lib/prism-next/material-extractor"
export type AgentMaterialSource = MaterialTextSource & {
  label: string
  versionLabel: string | null
  kind: "text" | "document" | "question" | "image" | "video" | "audio" | "other"
  extractability: { state: "available" | "unavailable" | "unknown"; reason?: string }
  license: AgentResourceLicense
  availability: AgentMaterialAvailability
  openable?: boolean
  openDisabledReason?: string
}
export type AgentMaterialCandidateStatus =
  | { state: "candidate" | "confirmed" }
  | { state: "added"; targetLabel: string }
  | { state: "invalid"; reason: string }
  | { state: "unconfirmed"; reason?: string }
export type AgentMaterialCandidate = {
  id: string
  range: MaterialTextRange
  /** Readable snapshot labels remain tied to the candidate's source version. */
  sourceLabel: string
  versionLabel: string | null
  location: string
  excerpt: string
  title: string
  note: string
  status: AgentMaterialCandidateStatus
  disabledReason?: string
}
export type AgentMaterialExtractorContext = { extractorId: string; baseRevision: string }
export type AgentMaterialExtractorTarget = { packId: string; versionId: string; baseVersionId: string; label: string }
export type AgentMaterialCandidateReference = { candidateId: string; range: MaterialTextRange }
export type AgentMaterialExtractorIntent = AgentMaterialExtractorContext & (
  | { type: "select-range"; range: MaterialTextRange; purpose: "preview" | "candidate" }
  | ({ type: "annotate"; field: "title" | "note"; value: string } & AgentMaterialCandidateReference)
  | ({ type: "remove" } & AgentMaterialCandidateReference)
  | ({ type: "reorder"; beforeCandidateId: string | null; orderedCandidateIds: readonly string[] } & AgentMaterialCandidateReference)
  | { type: "confirm"; target: AgentMaterialExtractorTarget; candidates: readonly (AgentMaterialCandidateReference & { title: string; note: string })[] }
  | { type: "open-source"; sourceId: string; sourceVersion: string | null; range?: MaterialTextRange }
)
export type AgentMaterialExtractorProps = AgentRecordViewProps & {
  context: AgentMaterialExtractorContext
  sources: readonly AgentMaterialSource[]
  candidates: readonly AgentMaterialCandidate[]
  selection: MaterialTextRange | null
  target: AgentMaterialExtractorTarget | null
  readOnlyReason?: string
  confirmDisabledReason?: string
  onIntent?: (intent: AgentMaterialExtractorIntent) => void
  onBack?: () => void
  /** Optional passive formatting of the supplied excerpt; never a source loader or editor. */
  renderExcerpt?: (candidate: AgentMaterialCandidate) => ReactNode
  notice?: string
}

const kinds = { text: "文本", document: "文档", question: "题目", image: "图像", video: "视频", audio: "音频", other: "其他来源" }
const states = { candidate: "候选", confirmed: "已确认", added: "已加入素材包", invalid: "失效", unconfirmed: "未确认" }
const licenses = { available: "可用", restricted: "受限", "confirmation-required": "需确认", unknown: "未知" }
const availability = { available: "可用", invalid: "失效", restricted: "受限", unknown: "未知" }
const reasonOf = (value: string | undefined, fallback: string) => value === undefined ? undefined : value.trim() ? value : fallback
const named = (label: string) => label.trim() || "未命名来源"
const candidateTitle = (item: AgentMaterialCandidate, index: number) => item.title.trim() || `片段 ${index + 1}`
const uniqueIds = (items: readonly { id: string }[]) => items.every(item => item.id.trim()) && new Set(items.map(item => item.id)).size === items.length

function sourceBlock(source: AgentMaterialSource) {
  if (!["text", "document", "question"].includes(source.kind)) return `${kinds[source.kind]}来源暂不支持提取。`
  if (source.extractability.state !== "available") return source.extractability.reason?.trim() || (source.extractability.state === "unknown" ? "可提取性未知，暂不能选择片段。" : "此来源暂不能提取片段。")
  if (!source.id.trim() || !source.version?.trim()) return "来源版本未知，暂不能选择或确认片段。"
  if (!uniqueIds(source.paragraphs)) return "段落位置重复或缺失，请重新提供来源。"
}

/** Only the two numeric controls have transient UI input; all material and range choices are page-owned. */
function MaterialRangeFields({ source, range, disabled, describedBy, onRange }: {
  source: AgentMaterialSource; range: MaterialTextRange; disabled: boolean; describedBy?: string; onRange: (range: MaterialTextRange) => void
}) {
  const id = useId(), parts = materialRangeParts(source, range)!
  const first = parts[0], last = parts[parts.length - 1]
  const [start, setStart] = useState(String([...first.paragraph.text.slice(0, first.start)].length + 1))
  const [end, setEnd] = useState(String([...last.paragraph.text.slice(0, last.end)].length))
  const next = materialRangeFromCharacters(source, first.paragraph.id, last.paragraph.id, Number(start), Number(end))
  return <div className="min-w-0 space-y-2">
    <div className="flex flex-wrap gap-3">
      <Field className="min-w-0 flex-1 basis-40"><FieldLabel htmlFor={`${id}-start`}>起始字符（从 1 计）</FieldLabel>
        <Input nativeInput id={`${id}-start`} type="number" min={1} max={[...first.paragraph.text].length} step={1} value={start} disabled={disabled}
          aria-invalid={!next} aria-describedby={[`${id}-location`, !next && `${id}-error`, describedBy].filter(Boolean).join(" ")}
          onChange={event => { if (!disabled) setStart(event.target.value) }} /></Field>
      <Field className="min-w-0 flex-1 basis-40"><FieldLabel htmlFor={`${id}-end`}>结束字符（含）</FieldLabel>
        <Input nativeInput id={`${id}-end`} type="number" min={1} max={[...last.paragraph.text].length} step={1} value={end} disabled={disabled}
          aria-invalid={!next} aria-describedby={[`${id}-location`, !next && `${id}-error`, describedBy].filter(Boolean).join(" ")}
          onChange={event => { if (!disabled) setEnd(event.target.value) }} /></Field>
    </div>
    <p id={`${id}-location`} className="text-ui-hint">起点：{first.paragraph.label}；终点：{last.paragraph.label}。</p>
    {!next && <p id={`${id}-error`} className="text-ui-hint" role="status">请填写段内有效的字符位置，起点不能晚于终点。</p>}
    <Button type="button" size="navigation" variant="outline" disabled={disabled || !next || sameMaterialRange(next, range)}
      onClick={() => { if (!disabled && next && !sameMaterialRange(next, range)) onRange(next) }}>更新所选范围</Button>
  </div>
}

export function AgentMaterialExtractor({ context, sources, candidates, selection, target, readOnlyReason, confirmDisabledReason,
  onIntent, onExpand, onBack, renderExcerpt, view = "inline", density = "default", details,
  notice = "选择与确认不代表已加入素材包；加入结果以素材包记录为准。" }: AgentMaterialExtractorProps) {
  const id = useId(), full = view === "workspace", compact = density === "compact"
  const reasons = new Map<string, { id: string; scopes: Set<string> }>()
  function describe(reason: string | undefined, scope: string) {
    if (!reason) return undefined
    if (!reasons.has(reason)) reasons.set(reason, { id: `${id}-reason-${reasons.size}`, scopes: new Set() })
    const entry = reasons.get(reason)!
    if (scope === "全部片段") entry.scopes.clear()
    if (!entry.scopes.has("全部片段")) entry.scopes.add(scope)
    return entry.id
  }
  const identityReason = !context.extractorId.trim() || !context.baseRevision.trim() || !uniqueIds(sources) || !uniqueIds(candidates)
    ? "当前材料或版本暂不可核对，请更新后再操作。" : undefined
  const writeReason = reasonOf(readOnlyReason, "当前材料只读。") || identityReason || (!onIntent ? "当前材料只读。" : undefined)
  const globalDescription = describe(writeReason, "全部片段")
  const sourceFor = (range: MaterialTextRange) => sources.find(source => source.id === range.sourceId)
  const candidateRef = (item: AgentMaterialCandidate): AgentMaterialCandidateReference => ({ candidateId: item.id, range: copyMaterialRange(item.range) })
  function candidateBlock(item: AgentMaterialCandidate) {
    if (item.status.state === "invalid") return item.status.reason.trim() || "此片段已失效，请重新选择。"
    if (item.status.state === "unconfirmed") return item.status.reason?.trim() || "请先核对上次确认结果。"
    if (item.status.state === "added") return "已加入的片段无需重复确认。"
    const declared = reasonOf(item.disabledReason, "此片段暂不能调整或确认。")
    if (declared) return declared
    const source = sourceFor(item.range)
    if (source && sourceBlock(source)) return sourceBlock(source)
    if (!source || materialRangeText(source, item.range) !== item.excerpt) return "出处或片段内容已变化，请重新核对范围。"
  }
  function selectRange(source: AgentMaterialSource, range: MaterialTextRange | null, purpose: "preview" | "candidate") {
    if (writeReason || sourceBlock(source) || !range || !materialRangeParts(source, range)) return
    if (purpose === "candidate" && candidates.some(item => sameMaterialRange(item.range, range))) return
    onIntent?.({ ...context, type: "select-range", range: copyMaterialRange(range), purpose })
  }
  function openSource(source: AgentMaterialSource, range?: MaterialTextRange) {
    if (identityReason || !source.openable || source.openDisabledReason !== undefined || !onIntent) return
    onIntent({ ...context, type: "open-source", sourceId: source.id, sourceVersion: range ? range.sourceVersion : source.version, ...(range ? { range: copyMaterialRange(range) } : {}) })
  }
  const selectedSource = selection && sourceFor(selection)
  if (selection && (!selectedSource || !materialRangeParts(selectedSource, selection))) describe("所选范围暂不可定位，请重新选择。", "当前选择")

  const sourceRows = sources.map((source, index) => {
    const label = named(source.label), block = sourceBlock(source)
    const selectionDescription = describe(block, label) || globalDescription
    const unknown = [!source.versionLabel && "版本", source.license.state === "unknown" && !source.license.name && !source.license.reason && "许可", source.availability.state === "unknown" && !source.availability.reason && "可用性"].filter(Boolean)
    const metadataDescription = describe(unknown.length ? `${unknown.join("、")}：未知。` : undefined, label)
    const licenseReason = source.license.state === "restricted" ? source.license.reason.trim() || "许可受限，具体原因未提供。" : "reason" in source.license ? source.license.reason : undefined
    const availabilityReason = source.availability.state === "invalid" || source.availability.state === "restricted" ? source.availability.reason.trim() || "来源暂不可用，具体原因未提供。" : source.availability.reason
    const sourceReasons = [describe(source.extractability.reason, label), describe(licenseReason, label), describe(availabilityReason, label)].filter(Boolean).join(" ")
    const openDescription = describe(reasonOf(source.openDisabledReason, "此来源暂不能打开。"), label)
    const parts = selection ? materialRangeParts(source, selection) : null
    const alreadyListed = selection && candidates.some(item => sameMaterialRange(item.range, selection))
    return <section key={index} className="min-w-0 space-y-3" aria-labelledby={`${id}-source-${index}`} aria-describedby={[selectionDescription, metadataDescription, sourceReasons].filter(Boolean).join(" ") || undefined}>
      <h4 id={`${id}-source-${index}`} className="text-item-title break-words">{label}</h4>
      <p className="text-ui-hint break-words">{kinds[source.kind]}{source.versionLabel && ` · ${source.versionLabel}`}</p>
      {["text", "document", "question"].includes(source.kind) && source.extractability.state === "available" && <p className="text-ui-hint">可提取性：可选择文本片段</p>}
      {!(source.license.state === "unknown" && !source.license.name && !source.license.reason) && <p className="text-ui-hint break-words">许可：{source.license.name ? `${source.license.name} · ` : ""}{licenses[source.license.state]}</p>}
      {!(source.availability.state === "unknown" && !source.availability.reason) && <p className="text-ui-hint">可用性：{availability[source.availability.state]}</p>}
      {source.openable && onIntent && <Button type="button" variant="ghost" size="navigation" disabled={!!identityReason || source.openDisabledReason !== undefined}
        aria-describedby={openDescription || globalDescription} onClick={() => openSource(source)}>查看来源</Button>}
      {full && ["text", "document", "question"].includes(source.kind) && <>
        <ol aria-label={`${label}正文`} className={`min-w-0 ${compact ? "space-y-3" : "space-y-5"}`}>
          {source.paragraphs.map((paragraph, paragraphIndex) => {
            const part = parts?.find(part => part.paragraph === paragraph)
            const whole = materialParagraphRange(source, paragraph.id), sentence = materialParagraphRange(source, paragraph.id, "sentence")
            return <li key={paragraphIndex} className="min-w-0 space-y-2">
              <p className="text-ui-action break-words">{paragraph.label || `第 ${paragraphIndex + 1} 段`}</p>
              <p className="max-w-[40em] whitespace-pre-wrap break-words text-read-body">{part && part.start < part.end ? <>{paragraph.text.slice(0, part.start)}<span className="underline decoration-double underline-offset-4"><span className="sr-only">所选文字开始：</span><span aria-hidden="true">〔</span>{paragraph.text.slice(part.start, part.end)}<span aria-hidden="true">〕</span><span className="sr-only">，所选文字结束。</span></span>{paragraph.text.slice(part.end)}</> : paragraph.text}</p>
              {onIntent && <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="navigation" aria-label={`选择整段：${paragraph.label}`} disabled={!!writeReason || !!block || !whole}
                  aria-describedby={selectionDescription} onClick={() => selectRange(source, whole, "preview")}>选择整段</Button>
                <Button type="button" variant="ghost" size="navigation" aria-label={`选择首句：${paragraph.label}`} disabled={!!writeReason || !!block || !sentence}
                  aria-describedby={selectionDescription} onClick={() => selectRange(source, sentence, "preview")}>选择首句</Button>
              </div>}
            </li>
          })}
        </ol>
        {!source.paragraphs.length && <p className="text-ui-hint">暂未提供可阅读的段落。</p>}
        {parts && selection && <section className="min-w-0 space-y-3" aria-label="所选片段">
          <p className="text-ui-hint break-words" role="status">已选范围：{materialRangeDescription(source, selection)}</p>
          {onIntent && <>
            <div className="flex flex-wrap gap-2">{(["sentence", "paragraph"] as const).flatMap(unit => (["before", "after"] as const).map(direction => {
              const next = extendMaterialRange(source, selection, unit, direction)
              const label = `向${direction === "before" ? "前" : "后"}扩展一${unit === "sentence" ? "句" : "段"}`
              return <Button key={`${unit}-${direction}`} type="button" size="navigation" variant="outline" disabled={!!writeReason || !!block || !next}
                aria-describedby={selectionDescription} onClick={() => selectRange(source, next, "preview")}>{label}</Button>
            }))}</div>
            <MaterialRangeFields key={JSON.stringify(selection)} source={source} range={selection} disabled={!!writeReason || !!block}
              describedBy={selectionDescription} onRange={range => selectRange(source, range, "preview")} />
            <Button type="button" size="navigation" variant="outline" disabled={!!writeReason || !!block || !!alreadyListed}
              aria-describedby={selectionDescription} onClick={() => selectRange(source, selection, "candidate")}>{alreadyListed ? "此片段已在列表中" : "列为候选片段"}</Button>
          </>}
        </section>}
      </>}
    </section>
  })

  const candidateRows = candidates.map((item, index) => {
    const title = candidateTitle(item, index), source = sourceFor(item.range), block = candidateBlock(item)
    // Added is a fact with its own label; no redundant instruction beneath every added row.
    const description = (item.status.state !== "added" ? describe(block, title) : undefined) || globalDescription
    const editable = !writeReason && !block
    const removeBlock = writeReason || reasonOf(item.disabledReason, "此片段暂不能移出。") || (item.status.state === "unconfirmed" ? block : undefined)
    const removeDescription = describe(removeBlock, title)
    const requestAnnotation = (field: "title" | "note", value: string) => { if (editable) onIntent?.({ ...context, ...candidateRef(item), type: "annotate", field, value }) }
    return <li key={item.id || index} className="min-w-0 space-y-3" aria-describedby={description}>
      {full ? <Field className="min-w-0"><FieldLabel htmlFor={`${id}-title-${index}`}>片段标题</FieldLabel>
        <Input nativeInput id={`${id}-title-${index}`} value={item.title} readOnly={!editable} aria-describedby={description} onChange={event => requestAnnotation("title", event.target.value)} /></Field>
        : <h4 className="text-item-title break-words">{title}</h4>}
      <Badge variant={item.status.state === "invalid" ? "warning" : "secondary"}>{states[item.status.state]}</Badge>
      {item.status.state === "added" && <p className="text-ui-hint break-words">所在素材包：{item.status.targetLabel || "名称未提供"}</p>}
      <p className="text-ui-hint break-words">出处：{named(item.sourceLabel)} · {item.versionLabel || "版本未知"} · {item.location || "位置未提供"}</p>
      <div className="min-w-0 max-w-[40em]">{renderExcerpt ? renderExcerpt(item) : <p className="text-read-body whitespace-pre-wrap break-words">{item.excerpt}</p>}</div>
      {full ? <Field className="min-w-0"><FieldLabel htmlFor={`${id}-note-${index}`}>片段标注</FieldLabel>
        <Textarea id={`${id}-note-${index}`} value={item.note} rows={2} readOnly={!editable} aria-describedby={description} onChange={event => requestAnnotation("note", event.target.value)} /></Field>
        : item.note && <p className="text-ui-hint whitespace-pre-wrap break-words">标注：{item.note}</p>}
      <div className="flex flex-wrap gap-2">
        {source?.openable && onIntent && <Button type="button" variant="ghost" size="navigation" disabled={!!identityReason || source.openDisabledReason !== undefined}
          aria-describedby={describe(reasonOf(source.openDisabledReason, "此来源暂不能打开。"), named(source.label)) || globalDescription}
          onClick={() => openSource(source, item.range)}>定位出处</Button>}
        {onIntent && <Button type="button" variant="ghost" size="navigation" disabled={!!removeBlock} aria-label={`移出候选列表：${title}`} aria-describedby={removeDescription}
          onClick={() => { if (!removeBlock) onIntent({ ...context, ...candidateRef(item), type: "remove" }) }}>移出候选列表</Button>}
        {full && onIntent && ([-1, 1] as const).map(step => {
          const neighbor = candidates[index + step], blocked = !editable || !neighbor || !!candidateBlock(neighbor)
          const moveDescription = description || describe(!neighbor ? (step < 0 ? "已在列表最前，不能上移。" : "已在列表最后，不能下移。") : candidateBlock(neighbor) ? "相邻片段暂不能调整顺序。" : undefined, title)
          const move = () => {
            if (blocked) return
            const ordered = candidates.map(candidate => candidate.id)
            ;[ordered[index], ordered[index + step]] = [ordered[index + step], ordered[index]]
            onIntent({ ...context, ...candidateRef(item), type: "reorder", beforeCandidateId: ordered[index + step + 1] ?? null, orderedCandidateIds: ordered })
          }
          return <Button key={step} type="button" variant="outline" size="navigation" disabled={blocked} aria-label={`${step < 0 ? "上移" : "下移"}：${title}`}
            aria-describedby={moveDescription} onClick={move}>{step < 0 ? "上移" : "下移"}</Button>
        })}
      </div>
    </li>
  })
  const eligible = candidates.filter(item => !candidateBlock(item))
  const targetReason = !target || !target.packId.trim() || !target.versionId.trim() || !target.baseVersionId.trim() || !target.label.trim() ? "目标素材包未确认，暂不能加入。" : undefined
  const confirmReason = writeReason || reasonOf(confirmDisabledReason, "暂不能确认加入素材包。") || targetReason || (!eligible.length ? "当前没有可确认加入的片段。" : undefined)
  const confirmDescription = describe(confirmReason, "本次加入")
  return <Card data-material-extractor-view={view} data-material-extractor-density={density} className={`min-w-0 ${compact ? "gap-3 p-3" : "gap-5 p-4"}`}>
    <header className="min-w-0 space-y-2"><h3 tabIndex={-1} className="text-block-title">{full ? "批量提取、标注与整理" : "选择关键片段"}</h3>
      <p className="text-ui-body break-words">目标素材包：{target?.label || "未确认"}</p></header>
    <div className={full ? "flex min-w-0 flex-wrap gap-6" : "min-w-0 space-y-4"}>
      <div className={`min-w-0 flex-1 basis-80 ${compact ? "space-y-3" : "space-y-5"}`}>
        {full && <h4 className="text-block-title">来源阅读</h4>}{sourceRows}
        {!sources.length && <p className="text-ui-hint">暂未提供可阅读的来源。</p>}
      </div>
      <section className={`min-w-0 flex-1 basis-80 ${compact ? "space-y-3" : "space-y-4"}`} aria-label="片段列表">
        <h4 className="text-block-title">片段列表</h4>
        {!candidates.length ? <p className="text-ui-hint">暂无候选片段，请先从来源中选择。</p> : <ol className={compact ? "space-y-4" : "space-y-6"}>{candidateRows}</ol>}
      </section>
    </div>
    {!!reasons.size && <aside aria-label="当前限制" className="space-y-2">{[...reasons.entries()].map(([text, entry]) => <p key={entry.id} id={entry.id} className="text-ui-hint break-words">
      <span>{[...entry.scopes].join("、")}：{text}</span>
    </p>)}</aside>}
    <p className="text-ui-hint text-muted-foreground" data-material-extractor-boundary="">{notice}</p>
    <RecordDetails>{details}</RecordDetails>
    <footer className="flex flex-wrap gap-2">
      {onIntent && <Button type="button" size="navigation" disabled={!!confirmReason} aria-describedby={confirmDescription}
        onClick={() => { if (!confirmReason && target) onIntent({ ...context, type: "confirm", target: { ...target }, candidates: eligible.map(item => ({ ...candidateRef(item), title: item.title, note: item.note })) }) }}>确认加入 {eligible.length} 段</Button>}
      {!full && onExpand && <Button type="button" variant="outline" size="navigation" onClick={event => onExpand(event.currentTarget)}>展开提取与整理</Button>}
      {full && onBack && <Button type="button" variant="ghost" size="navigation" onClick={onBack}>返回原位置</Button>}
    </footer>
  </Card>
}
