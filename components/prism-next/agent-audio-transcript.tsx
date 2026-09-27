"use client"

import { useId, useState, type Ref } from "react"
import { Button } from "@/components/coss/button"
import { Field, FieldLabel } from "@/components/coss/field"
import { Input } from "@/components/coss/input"
import { Textarea } from "@/components/coss/textarea"
import { MediaFrame, NativeMedia, MediaRangeFields, MediaDraftActions, mediaListKeys, mediaSeconds, mediaTime, validMediaRange, type AgentMediaCapability, type AgentMediaMetadata, type AgentMediaViewProps } from "./agent-media-parts"

export type { AgentMediaCapability, AgentMediaAvailability, AgentMediaMetadata } from "./agent-media-parts"

export type AgentAudioCapabilityKind = "play" | "transcribe" | "edit-transcript" | "clip" | "export"
export type AgentAudioCapabilities = Record<AgentAudioCapabilityKind, AgentMediaCapability>
export type AgentAudioSegment = { id: string; start: number; end: number; speaker?: string; text: string; confidence?: { label: string; source?: string } }
export type AgentAudioContext = { audioId: string; version: string }
export type AgentAudioIntent = AgentAudioContext & (
  | { type: "seek"; segmentId: string; seconds: number }
  | { type: "edit-segment"; segmentId: string; text: string }
  | { type: "clip-request"; start: number; end: number }
  | { type: "request-transcribe" | "request-export" | "open-source" }
)
export type AgentAudioTranscriptProps = AgentMediaViewProps & AgentAudioContext & {
  audio: AgentMediaMetadata
  segments: readonly AgentAudioSegment[]
  capabilities: AgentAudioCapabilities
  mediaRef?: Ref<HTMLAudioElement>
  onIntent?: (intent: AgentAudioIntent) => void
  onExpand?: (trigger: HTMLButtonElement, context: AgentAudioContext) => void
  onBack?: (context: AgentAudioContext) => void
}
type Draft = AgentAudioContext & { baseline: string } & ({ kind: "edit-transcript"; segmentId: string; text: string } | { kind: "clip"; start: string; end: string })
const labels = { play: "播放", transcribe: "转写", "edit-transcript": "编辑转写", clip: "剪辑", export: "导出" }

/** 31: host-owned recording/transcript facts; local drafts never become saved content. */
export function AgentAudioTranscript({ audioId, version, audio, segments, capabilities, mediaRef, onIntent, onExpand, onBack, view = "inline", density = "default", details, notice, readOnlyReason }: AgentAudioTranscriptProps) {
  const id = useId()
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [feedback, setFeedback] = useState("")
  const context = { audioId, version }
  const valid = !!audioId.trim() && !!version.trim() && (audio.duration === undefined || (Number.isFinite(audio.duration) && audio.duration >= 0)) && segments.every(segment => segment.id.trim() && validMediaRange(segment.start, segment.end, audio.duration)) && new Set(segments.map(segment => segment.id)).size === segments.length
  const baseline = JSON.stringify([context, audio, segments, capabilities, readOnlyReason])
  const stale = !!draft && draft.baseline !== baseline
  const supports = (kind: AgentAudioCapabilityKind) => valid && !!onIntent && capabilities[kind].supported && (readOnlyReason === undefined || kind === "play" || kind === "export")
  const request = (intent: AgentAudioIntent, kind?: AgentAudioCapabilityKind) => {
    if (!valid || !onIntent || draft || (kind && !supports(kind))) return
    onIntent(intent)
  }
  const tool = (label: string, kind: AgentAudioCapabilityKind, action: () => void) => supports(kind) && <Button type="button" variant="outline" disabled={!!draft} onClick={() => { if (!draft && supports(kind)) action() }}>{label}</Button>
  const visible = view === "inline" ? segments.slice(0, 3) : segments.filter(segment => `${segment.text} ${segment.speaker ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const unknownMetadata = new Map<string, string[]>()
  for (const [label, known] of [
    ["说话人", (segment: AgentAudioSegment) => !!segment.speaker?.trim()],
    ["置信度", (segment: AgentAudioSegment) => !!segment.confidence?.label.trim()],
  ] as const) {
    const missing = segments.flatMap((segment, index) => known(segment) ? [] : [`第 ${index + 1} 段`])
    if (!missing.length) continue
    const scope = missing.length === segments.length ? "全部段落" : missing.join("、")
    unknownMetadata.set(scope, [...(unknownMetadata.get(scope) ?? []), label])
  }
  const start = draft?.kind === "clip" ? mediaSeconds(draft.start) : null
  const end = draft?.kind === "clip" ? mediaSeconds(draft.end) : null
  const draftValid = !!draft && supports(draft.kind) && (draft.kind === "edit-transcript" ? !!draft.text.trim() : start !== null && end !== null && validMediaRange(start, end, audio.duration))
  return <MediaFrame media={audio} kind="audio" view={view} density={density} capabilities={capabilities} labels={labels} summary={`${segments.length} 段转写`} invalid={!valid} receiver={!!onIntent} details={details} notice={notice} readOnlyReason={readOnlyReason} actions={<>
    {tool("请求转写", "transcribe", () => request({ ...context, type: "request-transcribe" }, "transcribe"))}
    {tool("请求导出", "export", () => request({ ...context, type: "request-export" }, "export"))}
    {audio.source?.openable && valid && onIntent && <Button type="button" variant="outline" disabled={!!draft} onClick={() => request({ ...context, type: "open-source" })}>查看来源</Button>}
    {view === "inline" && valid && onExpand && <Button type="button" variant="outline" data-media-expand="" disabled={!!draft} onClick={event => { if (!draft) onExpand(event.currentTarget, context) }}>打开音频与转写</Button>}
    {view === "workspace" && onBack && <Button type="button" variant="outline" data-media-back="" onClick={event => {
      if (draft) event.currentTarget.closest("[data-agent-media]")?.querySelector<HTMLButtonElement>("[data-media-discard]")?.focus()
      else onBack(context)
    }}>返回原位置</Button>}
  </>}>
    <NativeMedia key={JSON.stringify([audioId, version, audio.src, capabilities.play, audio.availability])} kind="audio" media={audio} capability={capabilities.play} mediaRef={mediaRef} />
    {view === "workspace" && <Field><FieldLabel htmlFor={`${id}-search`}>搜索转写</FieldLabel><Input nativeInput id={`${id}-search`} value={query} onChange={event => setQuery(event.target.value)} /></Field>}
    <section aria-label="转写段落" className="min-w-0 space-y-3" onKeyDown={mediaListKeys}>
      {!!unknownMetadata.size && <p className="break-words text-ui-hint">{[...unknownMetadata].map(([scope, fields]) => `${fields.join("/")}：未知（${scope}）`).join("；")}</p>}
      <ol className="min-w-0 space-y-4">{visible.map(segment => <li key={segment.id} tabIndex={supports("play") ? undefined : 0} className="min-w-0 space-y-2">
        <p className="break-words text-ui-hint">{mediaTime(segment.start)}–{mediaTime(segment.end)}{segment.speaker?.trim() && ` · 说话人：${segment.speaker.trim()}`}{segment.confidence?.label.trim() && ` · 置信度：${segment.confidence.label.trim()}（来源：${segment.confidence.source?.trim() || "未知"}）`}</p>
        <p className="max-w-[40em] whitespace-pre-wrap break-words text-read-body">{segment.text}</p>
        <div className="flex flex-wrap gap-2">
          {supports("play") && <Button type="button" variant="ghost" data-media-seek="" disabled={!!draft} aria-label={`跳转到 ${mediaTime(segment.start)} 的转写`} onClick={() => request({ ...context, type: "seek", segmentId: segment.id, seconds: segment.start }, "play")}>跳转到 {mediaTime(segment.start)}</Button>}
          {view === "workspace" && tool(`编辑第 ${segments.indexOf(segment) + 1} 段`, "edit-transcript", () => { setFeedback(""); setDraft({ ...context, baseline, kind: "edit-transcript", segmentId: segment.id, text: segment.text }) })}
        </div>
      </li>)}</ol>
      {!visible.length && <p role="status" className="text-ui-hint">{segments.length ? "没有匹配的转写段落。" : "尚未提供转写。"}</p>}
      {view === "inline" && segments.length > 3 && <p className="text-ui-hint">展示前 3 段，共 {segments.length} 段。</p>}
    </section>
    {view === "workspace" && <div>{tool("选择音频片段", "clip", () => { setFeedback(""); setDraft({ ...context, baseline, kind: "clip", start: "", end: "" }) })}</div>}
    {draft && <section aria-label="音频草稿" className="min-w-0 space-y-3">
      {draft.audioId === audioId && readOnlyReason === undefined && (draft.kind === "edit-transcript"
        ? <Field><FieldLabel htmlFor={`${id}-text`}>转写文本</FieldLabel><Textarea id={`${id}-text`} value={draft.text} readOnly={stale} onChange={event => setDraft({ ...draft, text: event.target.value })} /></Field>
        : <MediaRangeFields start={draft.start} end={draft.end} duration={audio.duration} disabled={stale} onChange={(start, end) => setDraft({ ...draft, start, end })} />)}
      <MediaDraftActions stale={stale} valid={draftValid} onDiscard={() => { setDraft(null); setFeedback("") }} onConfirm={() => {
        if (stale || !draftValid) return
        if (draft.kind === "edit-transcript") onIntent?.({ audioId: draft.audioId, version: draft.version, type: "edit-segment", segmentId: draft.segmentId, text: draft.text })
        else if (start !== null && end !== null) onIntent?.({ audioId: draft.audioId, version: draft.version, type: "clip-request", start, end })
        setDraft(null); setFeedback("请求已提交，结果待确认。")
      }} />
    </section>}
    {feedback && <p role="status" className="text-ui-hint">{feedback}</p>}
  </MediaFrame>
}
