"use client"

import { useId, useState, type KeyboardEvent, type ReactNode, type Ref } from "react"
import { Button } from "@/components/coss/button"
import { Card } from "@/components/coss/card"
import { Field, FieldLabel } from "@/components/coss/field"
import { Input } from "@/components/coss/input"
import { RecordDetails, type AgentRecordViewProps } from "./agent-record-parts"

export type AgentMediaCapability = { supported: true; reason?: string } | { supported: false; reason: string }
export type AgentMediaAvailability = { state: "available" } | { state: "unavailable"; reason: string } | { state: "unknown"; reason?: string }
export type AgentMediaMetadata = {
  title: string
  description?: string
  src?: string
  duration?: number
  versionLabel?: string
  source?: { label: string; openable?: boolean }
  availability: AgentMediaAvailability
}
export type AgentMediaViewProps = Omit<AgentRecordViewProps, "onExpand"> & {
  readOnlyReason?: string
  notice?: string
}

export function mediaSeconds(value: string): number | null {
  if (!value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}
export function validMediaTime(value: number, duration?: number) {
  return Number.isFinite(value) && value >= 0 && (duration === undefined || (Number.isFinite(duration) && value <= duration))
}
export function validMediaRange(start: number, end: number, duration?: number) {
  return validMediaTime(start, duration) && validMediaTime(end, duration) && start < end
}
export function mediaTime(value?: number) {
  if (value === undefined || !Number.isFinite(value) || value < 0) return "时长未知"
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`
}
export function mediaListKeys(event: KeyboardEvent<HTMLElement>) {
  if (event.nativeEvent.isComposing || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-media-seek]"))
  const index = buttons.indexOf(event.target as HTMLButtonElement)
  if (index < 0) return
  const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : event.key === "ArrowDown" ? Math.min(index + 1, buttons.length - 1) : event.key === "ArrowUp" ? Math.max(0, index - 1) : undefined
  if (next === undefined) return
  event.preventDefault(); buttons[next]?.focus()
}

function playbackReasons(media: AgentMediaMetadata, capability: AgentMediaCapability) {
  const reasons = new Set<string>()
  if (!media.src?.trim()) reasons.add("未提供播放地址。")
  if (!capability.supported) reasons.add(capability.reason.trim() || "当前不支持播放。")
  if (media.availability.state !== "available") reasons.add(media.availability.reason?.trim() || (media.availability.state === "unknown" ? "可用性未知。" : "材料暂不可用。"))
  return reasons
}

/** Internal presentation reuse for semantics 31/32; no catalog entry or media engine. */
export function MediaFrame({ media, kind, view = "inline", density = "default", capabilities, labels, summary, children, actions, details, notice, readOnlyReason, invalid, receiver }: AgentMediaViewProps & {
  media: AgentMediaMetadata; kind: "audio" | "video"; capabilities: Record<string, AgentMediaCapability>; labels: Record<string, string>
  summary: string; children: ReactNode; actions: ReactNode; invalid: boolean; receiver: boolean
}) {
  const id = useId()
  const reasons = new Map<string, string[]>()
  for (const [key, capability] of Object.entries(capabilities)) {
    if (key === "play" && !capability.supported) continue
    const reason = capability.reason?.trim() || (!capability.supported ? "暂不支持" : "")
    if (reason) reasons.set(reason, [...(reasons.get(reason) ?? []), `${labels[key]}${capability.supported ? "" : "不支持"}`])
  }
  for (const reason of playbackReasons(media, capabilities.play)) reasons.set(reason, [...(reasons.get(reason) ?? []), `${kind === "audio" ? "音频" : "视频"}不可播放`])
  return <Card data-agent-media={kind} data-view={view} data-density={density} aria-labelledby={`${id}-title`} className={`min-w-0 ${density === "compact" ? "gap-3 p-4" : "gap-5 p-5"}`}>
    <header className="min-w-0 space-y-2">
      <h3 id={`${id}-title`} className="break-words text-block-title">{media.title}</h3>
      <p className="break-words text-ui-hint">{media.versionLabel?.trim() || "版本未确认"} · {mediaTime(media.duration)} · {summary}</p>
      <p className="break-words text-ui-hint">来源：{media.source?.label.trim() || "未确认"}</p>
      {readOnlyReason !== undefined && <p className="text-ui-hint">只读版本：{readOnlyReason.trim() || "当前仅供查看。"}</p>}
      {[...reasons].map(([reason, scope]) => <p key={reason} className="break-words text-ui-hint">{scope.join("、")}：{reason}</p>)}
      {invalid && <p className="text-ui-hint">对象、版本或时间信息未确认，暂不可操作。</p>}
      {!receiver && <p className="text-ui-hint">当前仅供浏览，暂未提供操作入口。</p>}
    </header>
    {children}
    <div className="flex flex-wrap gap-2">{actions}</div>
    <p className="break-words text-ui-hint">{notice || "文字和时间范围仅供核对；确认只提交请求，不代表已保存或已生成媒体文件。"}</p>
    <RecordDetails>{details}</RecordDetails>
  </Card>
}

export function NativeMedia({ media, kind, capability, mediaRef, poster }: {
  media: AgentMediaMetadata; kind: "audio" | "video"; capability: AgentMediaCapability
  mediaRef?: Ref<HTMLAudioElement> | Ref<HTMLVideoElement>; poster?: string
}) {
  const id = useId()
  const [failed, setFailed] = useState(false)
  const reasons = playbackReasons(media, capability)
  const name = kind === "audio" ? "音频" : "视频"
  return <section className="min-w-0 space-y-2" aria-label={`${name}播放`}>
    <p id={`${id}-description`} className="break-words text-ui-hint">{media.description?.trim() || "未提供媒体说明。"}</p>
    {failed && <p role="status" className="break-words text-ui-hint">{name}不可播放：媒体加载失败，请核对文件或播放地址。</p>}
    {reasons.size || failed ? null : kind === "audio"
      ? <audio ref={mediaRef as Ref<HTMLAudioElement>} controls preload="none" src={media.src} aria-label={media.title} aria-describedby={`${id}-description`} onError={() => setFailed(true)} className="w-full min-w-0" />
      : <video ref={mediaRef as Ref<HTMLVideoElement>} controls playsInline preload="none" src={media.src} poster={poster} aria-label={media.title} aria-describedby={`${id}-description`} onError={() => setFailed(true)} className="h-auto max-h-96 w-full min-w-0" />}
  </section>
}

export function MediaRangeFields({ start, end, onChange, disabled, duration }: { start: string; end: string; onChange: (start: string, end: string) => void; disabled: boolean; duration?: number }) {
  const id = useId()
  return <div className="grid min-w-0 gap-3 sm:grid-cols-2">
    <Field><FieldLabel htmlFor={`${id}-start`}>起始时间（秒）</FieldLabel><Input nativeInput id={`${id}-start`} type="number" min={0} max={duration} step="any" value={start} readOnly={disabled} onChange={event => onChange(event.target.value, end)} /></Field>
    <Field><FieldLabel htmlFor={`${id}-end`}>结束时间（秒）</FieldLabel><Input nativeInput id={`${id}-end`} type="number" min={0} max={duration} step="any" value={end} readOnly={disabled} onChange={event => onChange(start, event.target.value)} /></Field>
  </div>
}

export function MediaDraftActions({ stale, valid, onConfirm, onDiscard }: { stale: boolean; valid: boolean; onConfirm: () => void; onDiscard: () => void }) {
  return <>
    <p className="text-ui-hint">尚有未确认草稿，请确认或放弃后再返回。</p>
    {stale && <p role="status" className="text-ui-hint">材料或可用操作已变化，草稿保留但不可提交；请放弃后重新选择。</p>}
    {!valid && !stale && <p className="text-ui-hint">请填写有效内容；时间须为非负数，片段结束晚于起始且不超过已知时长。</p>}
    <div className="flex flex-wrap gap-2"><Button type="button" disabled={stale || !valid} onClick={() => { if (!stale && valid) onConfirm() }}>确认请求</Button><Button type="button" variant="outline" onClick={onDiscard}>放弃草稿</Button></div>
  </>
}
