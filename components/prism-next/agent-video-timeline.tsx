"use client"

import { useId, useState, type Ref } from "react"
import { Button } from "@/components/coss/button"
import { Field, FieldLabel } from "@/components/coss/field"
import { Input } from "@/components/coss/input"
import { MediaFrame, NativeMedia, MediaRangeFields, MediaDraftActions, mediaListKeys, mediaSeconds, mediaTime, validMediaTime, validMediaRange, type AgentMediaCapability, type AgentMediaMetadata, type AgentMediaViewProps } from "./agent-media-parts"

export type { AgentMediaCapability, AgentMediaAvailability, AgentMediaMetadata } from "./agent-media-parts"

export type AgentVideoCapabilityKind = "play" | "subtitle" | "mark" | "clip" | "export"
export type AgentVideoCapabilities = Record<AgentVideoCapabilityKind, AgentMediaCapability>
export type AgentVideoMark = { id: string; time: number; label: string; kind: "chapter" | "subtitle" | "annotation" }
export type AgentVideoSubtitle = { id: string; start: number; end: number; text: string }
export type AgentVideoContext = { videoId: string; version: string }
export type AgentVideoIntent = AgentVideoContext & (
  | { type: "seek"; seconds: number; markId?: string; subtitleId?: string }
  | { type: "mark-create"; time: number; label: string; kind: AgentVideoMark["kind"] }
  | { type: "mark-update"; markId: string; time: number; label: string; kind: AgentVideoMark["kind"] }
  | { type: "mark-delete"; markId: string }
  | { type: "clip-request"; start: number; end: number }
  | { type: "request-subtitle" | "request-export" | "open-source" }
)
export type AgentVideoTimelineProps = AgentMediaViewProps & AgentVideoContext & {
  video: AgentMediaMetadata & { poster?: { src: string; alt: string } }
  marks: readonly AgentVideoMark[]
  subtitles?: readonly AgentVideoSubtitle[]
  capabilities: AgentVideoCapabilities
  mediaRef?: Ref<HTMLVideoElement>
  onIntent?: (intent: AgentVideoIntent) => void
  onExpand?: (trigger: HTMLButtonElement, context: AgentVideoContext) => void
  onBack?: (context: AgentVideoContext) => void
}
type Draft = AgentVideoContext & { baseline: string } & ({ kind: "mark"; markId?: string; time: string; label: string; markKind: AgentVideoMark["kind"] } | { kind: "clip"; start: string; end: string })
const labels = { play: "播放", subtitle: "字幕", mark: "编辑标记", clip: "剪辑", export: "导出" }
const markLabels = { chapter: "章节", subtitle: "字幕", annotation: "标注" }

/** 32: native playback and a textual timeline, not a video editing engine. */
export function AgentVideoTimeline({ videoId, version, video, marks, subtitles = [], capabilities, mediaRef, onIntent, onExpand, onBack, view = "inline", density = "default", details, notice, readOnlyReason }: AgentVideoTimelineProps) {
  const id = useId()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [feedback, setFeedback] = useState("")
  const context = { videoId, version }
  const valid = !!videoId.trim() && !!version.trim() && (video.duration === undefined || (Number.isFinite(video.duration) && video.duration >= 0)) && marks.every(mark => mark.id.trim() && validMediaTime(mark.time, video.duration)) && new Set(marks.map(mark => mark.id)).size === marks.length && subtitles.every(subtitle => subtitle.id.trim() && validMediaRange(subtitle.start, subtitle.end, video.duration)) && new Set(subtitles.map(subtitle => subtitle.id)).size === subtitles.length
  const baseline = JSON.stringify([context, video, marks, subtitles, capabilities, readOnlyReason])
  const stale = !!draft && draft.baseline !== baseline
  const supports = (kind: AgentVideoCapabilityKind) => valid && !!onIntent && capabilities[kind].supported && (readOnlyReason === undefined || kind === "play" || kind === "export")
  const request = (intent: AgentVideoIntent, kind?: AgentVideoCapabilityKind) => {
    if (!valid || !onIntent || draft || (kind && !supports(kind))) return
    onIntent(intent)
  }
  const tool = (label: string, kind: AgentVideoCapabilityKind, action: () => void) => supports(kind) && <Button type="button" variant="outline" disabled={!!draft} onClick={() => { if (!draft && supports(kind)) action() }}>{label}</Button>
  const sortedMarks = [...marks].sort((a, b) => a.time - b.time)
  const time = draft?.kind === "mark" ? mediaSeconds(draft.time) : null
  const start = draft?.kind === "clip" ? mediaSeconds(draft.start) : null
  const end = draft?.kind === "clip" ? mediaSeconds(draft.end) : null
  const draftValid = !!draft && supports(draft.kind) && (draft.kind === "mark" ? !!draft.label.trim() && time !== null && validMediaTime(time, video.duration) : start !== null && end !== null && validMediaRange(start, end, video.duration))
  function beginMark(mark?: AgentVideoMark) { setFeedback(""); setDraft({ ...context, baseline, kind: "mark", markId: mark?.id, time: mark ? String(mark.time) : "", label: mark?.label ?? "", markKind: mark?.kind ?? "annotation" }) }
  return <MediaFrame media={video} kind="video" view={view} density={density} capabilities={capabilities} labels={labels} summary={`${marks.length} 个标记 · ${subtitles.length} 条字幕`} invalid={!valid} receiver={!!onIntent} details={details} notice={notice} readOnlyReason={readOnlyReason} actions={<>
    {tool("请求字幕", "subtitle", () => request({ ...context, type: "request-subtitle" }, "subtitle"))}
    {tool("请求导出", "export", () => request({ ...context, type: "request-export" }, "export"))}
    {video.source?.openable && valid && onIntent && <Button type="button" variant="outline" disabled={!!draft} onClick={() => request({ ...context, type: "open-source" })}>查看来源</Button>}
    {view === "inline" && valid && onExpand && <Button type="button" variant="outline" data-media-expand="" disabled={!!draft} onClick={event => { if (!draft) onExpand(event.currentTarget, context) }}>打开视频与时间轴</Button>}
    {view === "workspace" && onBack && <Button type="button" variant="outline" data-media-back="" onClick={event => {
      if (draft) event.currentTarget.closest("[data-agent-media]")?.querySelector<HTMLButtonElement>("[data-media-discard]")?.focus()
      else onBack(context)
    }}>返回原位置</Button>}
  </>}>
    {view === "inline" && video.poster && video.availability.state === "available" && <img src={video.poster.src} alt={video.poster.alt.trim() || "未提供封面说明"} className="h-auto max-h-60 max-w-full object-contain" />}
    <NativeMedia key={JSON.stringify([videoId, version, video.src, capabilities.play, video.availability])} kind="video" media={video} capability={capabilities.play} mediaRef={mediaRef} poster={video.poster?.src} />
    <section aria-label="时间轴标记" onKeyDown={mediaListKeys} className="min-w-0 space-y-3">
      <ol className="min-w-0 space-y-3">{(view === "inline" ? sortedMarks.slice(0, 3) : sortedMarks).map(mark => <li key={mark.id} tabIndex={supports("play") ? undefined : 0} className="min-w-0 space-y-2">
        <p className="break-words text-read-body">{mediaTime(mark.time)} · {markLabels[mark.kind]} · {mark.label}</p>
        <div className="flex flex-wrap gap-2">
          {supports("play") && <Button type="button" variant="ghost" data-media-seek="" disabled={!!draft} aria-label={`跳转到 ${mark.label}`} onClick={() => request({ ...context, type: "seek", markId: mark.id, seconds: mark.time }, "play")}>跳转到 {mediaTime(mark.time)}</Button>}
          {view === "workspace" && <>{tool("编辑标记", "mark", () => beginMark(mark))}{tool("删除标记", "mark", () => request({ ...context, type: "mark-delete", markId: mark.id }, "mark"))}</>}
        </div>
      </li>)}</ol>
      {!marks.length && <p className="text-ui-hint">尚未提供时间轴标记。</p>}
      {view === "inline" && marks.length > 3 && <p className="text-ui-hint">展示前 3 个标记，共 {marks.length} 个。</p>}
    </section>
    {view === "workspace" && <>
      <section aria-label="字幕列表" onKeyDown={mediaListKeys} className="min-w-0 space-y-3">
        <h4 className="text-block-title">字幕</h4>
        <ol className="min-w-0 space-y-3">{subtitles.map(subtitle => <li key={subtitle.id} tabIndex={supports("play") ? undefined : 0} className="min-w-0 space-y-2">
          <p className="text-ui-hint">{mediaTime(subtitle.start)}–{mediaTime(subtitle.end)}</p><p className="whitespace-pre-wrap break-words text-read-body">{subtitle.text}</p>
          {supports("play") && <Button type="button" variant="ghost" data-media-seek="" disabled={!!draft} aria-label={`跳转到 ${mediaTime(subtitle.start)} 的字幕`} onClick={() => request({ ...context, type: "seek", subtitleId: subtitle.id, seconds: subtitle.start }, "play")}>跳转到 {mediaTime(subtitle.start)}</Button>}
        </li>)}</ol>
        {!subtitles.length && <p className="text-ui-hint">尚未提供字幕。</p>}
      </section>
      <div className="flex flex-wrap gap-2">{tool("新增标记", "mark", () => beginMark())}{tool("选择视频片段", "clip", () => { setFeedback(""); setDraft({ ...context, baseline, kind: "clip", start: "", end: "" }) })}</div>
    </>}
    {draft && <section aria-label="视频草稿" className="min-w-0 space-y-3">
      {draft.videoId === videoId && readOnlyReason === undefined && (draft.kind === "mark" ? <>
        <Field><FieldLabel htmlFor={`${id}-time`}>标记时间（秒）</FieldLabel><Input nativeInput id={`${id}-time`} type="number" min={0} max={video.duration} step="any" value={draft.time} readOnly={stale} onChange={event => setDraft({ ...draft, time: event.target.value })} /></Field>
        <Field><FieldLabel htmlFor={`${id}-label`}>标记文字</FieldLabel><Input nativeInput id={`${id}-label`} value={draft.label} readOnly={stale} onChange={event => setDraft({ ...draft, label: event.target.value })} /></Field>
        <div role="group" aria-label="标记类型" className="flex flex-wrap gap-2">{(Object.keys(markLabels) as AgentVideoMark["kind"][]).map(kind => <Button key={kind} type="button" variant="outline" aria-pressed={draft.markKind === kind} disabled={stale} onClick={() => { if (!stale) setDraft({ ...draft, markKind: kind }) }}>{markLabels[kind]}</Button>)}</div>
      </> : <MediaRangeFields start={draft.start} end={draft.end} duration={video.duration} disabled={stale} onChange={(start, end) => setDraft({ ...draft, start, end })} />)}
      <MediaDraftActions stale={stale} valid={draftValid} onDiscard={() => { setDraft(null); setFeedback("") }} onConfirm={() => {
        if (stale || !draftValid) return
        if (draft.kind === "mark" && time !== null) onIntent?.({ videoId: draft.videoId, version: draft.version, ...(draft.markId ? { type: "mark-update", markId: draft.markId } : { type: "mark-create" }), time, label: draft.label, kind: draft.markKind })
        else if (draft.kind === "clip" && start !== null && end !== null) onIntent?.({ videoId: draft.videoId, version: draft.version, type: "clip-request", start, end })
        setDraft(null); setFeedback("请求已提交，结果待确认。")
      }} />
    </section>}
    {feedback && <p role="status" className="text-ui-hint">{feedback}</p>}
  </MediaFrame>
}
