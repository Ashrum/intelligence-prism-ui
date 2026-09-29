"use client"
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react"
import { AudioLines, Mic, Square } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Popover, PopoverTrigger, PopoverPopup } from "@/components/coss/popover"
import "./agent-conversation.css"

export const dictationLabels = { idle: "听写就绪", requesting: "正在请求麦克风权限", listening: "正在听写", recognizing: "正在识别", inserted: "听写已插入", error: "听写失败", denied: "麦克风权限被拒绝", unsupported: "浏览器不支持听写", "not-connected": "听写服务未接入" } as const
export const voiceModeLabels = { idle: "语音对话就绪", connecting: "正在连接语音对话", listening: "语音对话正在听", answering: "正在语音回答", ended: "语音对话已结束", "not-connected": "语音对话服务未接入" } as const
export type AgentDictation = { state: keyof typeof dictationLabels; interim?: string; final?: string; reason?: string; level?: number; /** Host epoch milliseconds; never inferred from mount or start intent. */ startedAt?: number }
export type AgentVoiceMode = { state: keyof typeof voiceModeLabels; description?: string }
export type AgentVoiceIntent = { type: "dictation-start" | "dictation-stop" | "voice-mode-start" | "voice-mode-stop" | "privacy-confirm" | "privacy-cancel" }
export type AgentVoicePrivacy = { open: boolean; description: ReactNode }
export function isDictating(state: AgentDictation["state"]) { return ["requesting", "listening", "recognizing"].includes(state) }
export function isVoiceActive(state: AgentVoiceMode["state"]) { return ["connecting", "listening", "answering"].includes(state) }

export function dictationElapsed(startedAt: number | undefined, now: number | undefined) {
  if (startedAt === undefined || now === undefined || !Number.isFinite(startedAt) || !Number.isFinite(now)) return undefined
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
}

/** Timer refreshes a host timestamp, never advances recognition state. */
export function AgentDictationIndicator({ dictation, disabled, onIntent }: { dictation: AgentDictation; disabled?: boolean; onIntent: (intent: AgentVoiceIntent) => void }) {
  const active = isDictating(dictation.state)
  const [now, setNow] = useState<number>()
  useEffect(() => {
    if (!active || dictation.startedAt === undefined || !Number.isFinite(dictation.startedAt)) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active, dictation.startedAt])
  if (!active) return null
  const elapsed = dictationElapsed(dictation.startedAt, now)
  const label = dictation.state === "requesting" ? "正在请求麦克风…" : dictation.state === "recognizing" ? "正在识别…" : "正在听"
  return <Button data-dictation-indicator type="button" variant="ghost" size="sm" className="h-auto min-w-0 whitespace-normal" disabled={disabled} aria-label={`${label}，停止听写`} onClick={() => onIntent({ type: "dictation-stop" })}>
    <span aria-hidden="true" className="agent-dictation-dot size-2 shrink-0 rounded-full bg-destructive motion-safe:animate-pulse" />
    <span>{label}</span>{elapsed !== undefined && <span aria-hidden="true" className="tabular-nums text-ui-meta">{elapsed}</span>}
  </Button>
}

/** Only activity boundaries announce; interim, level and timer updates are silent. */
export function AgentDictationAnnouncement({ state }: { state: AgentDictation["state"] }) {
  const active = isDictating(state), previous = useRef(false)
  const [message, setMessage] = useState("")
  useEffect(() => {
    if (previous.current === active) return
    previous.current = active
    setMessage(active ? "听写已开始" : "听写已结束")
  }, [active])
  return <span data-dictation-announcement role="status" aria-live="polite" aria-atomic="true" className="sr-only">{message}</span>
}

function DictationEqualizer({ level }: { level?: number }) {
  const bounded = level !== undefined && Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : undefined
  return <span aria-hidden="true" className="agent-dictation-equalizer flex h-3.5 items-center gap-[2.5px]" data-level-known={bounded !== undefined}>
    {[0, 1, 2].map(index => <span key={index} className="agent-dictation-bar w-[2.5px] rounded-full bg-current" style={{ height: bounded === undefined ? "100%" : `${20 + bounded * 80}%`, animationDelay: `${index * 150}ms` }} />)}
  </span>
}

/** Unavailable actions explain the host fact without emitting a start intent. */
function UnavailableVoiceButton({ label, description, disabled, voice = false, portalContainer }: {
  label: string; description: string; disabled: boolean; voice?: boolean; portalContainer?: RefObject<HTMLElement | null>
}) {
  const id = useId(), root = useRef<HTMLSpanElement>(null)
  return <span ref={root} className="inline-flex">
    <span id={id} className="sr-only">{description}</span>
    <Popover>
      <PopoverTrigger render={<Button type="button" variant={voice ? "default" : "ghost"} size="icon-sm" className={voice ? "rounded-full" : undefined} aria-label={label} aria-describedby={id} aria-pressed={false} disabled={disabled} />}>
        {voice ? <AudioLines aria-hidden="true" /> : <Mic aria-hidden="true" />}
      </PopoverTrigger>
      <PopoverPopup side="top" portalProps={{ container: portalContainer ?? root }} aria-label={label}>
        <p className="text-ui-hint">{description}</p>
      </PopoverPopup>
    </Popover>
  </span>
}

/** Display host facts only; this component never accesses a microphone or inserts text. */
export function AgentVoiceButtons({ dictation, voice, onIntent, onStart, disabled = false, privacy, portalContainer }: {
  dictation: AgentDictation; voice: AgentVoiceMode; onIntent: (intent: AgentVoiceIntent) => void
  onStart?: () => void; disabled?: boolean; privacy?: AgentVoicePrivacy; portalContainer?: RefObject<HTMLElement | null>
}) {
  const dictating = isDictating(dictation.state), talking = isVoiceActive(voice.state)
  const emit = (type: AgentVoiceIntent["type"]) => { onIntent({ type }); if (type.endsWith("-start")) onStart?.() }
  return <>
    {["not-connected", "unsupported"].includes(dictation.state) ? <UnavailableVoiceButton portalContainer={portalContainer} label="开始听写" description={`${dictationLabels[dictation.state]}${dictation.reason ? `：${dictation.reason}` : ""}`} disabled={disabled || talking || Boolean(privacy?.open)} /> : <Button type="button" variant="ghost" size="icon-sm" className={dictating ? "bg-info/10 text-info-foreground hover:bg-info/20" : undefined} aria-label={dictating ? "停止听写" : "开始听写"} aria-pressed={dictating}
      aria-description={dictating && (dictation.level === undefined || !Number.isFinite(dictation.level)) ? "麦克风电平未知" : undefined}
      disabled={disabled || (!dictating && (talking || Boolean(privacy?.open)))} onClick={() => emit(dictating ? "dictation-stop" : "dictation-start")}>
      {dictating ? <DictationEqualizer level={dictation.level} /> : <Mic aria-hidden="true" />}
    </Button>}
    {voice.state === "not-connected" ? <UnavailableVoiceButton portalContainer={portalContainer} voice label="开始语音对话" description={`${voiceModeLabels[voice.state]}${voice.description ? `：${voice.description}` : ""}`} disabled={disabled || dictating || Boolean(privacy?.open)} /> : <Button type="button" size="icon-sm" className="rounded-full" aria-label={talking ? "结束语音对话" : "开始语音对话"} aria-pressed={talking}
      disabled={disabled || (!talking && (dictating || Boolean(privacy?.open)))} onClick={() => emit(talking ? "voice-mode-stop" : "voice-mode-start")}><AudioLines aria-hidden="true" /></Button>}
  </>
}
export function AgentVoiceStatus({ dictation, voice, privacy, onIntent, hideUnavailable = false, promptStatus = false }: {
  dictation: AgentDictation; voice: AgentVoiceMode; privacy?: AgentVoicePrivacy; onIntent: (intent: AgentVoiceIntent) => void; hideUnavailable?: boolean; promptStatus?: boolean
}) {
  const id = useId()
  return <div className="space-y-2 text-ui-hint" data-agent-voice>
    <div role={promptStatus ? undefined : "status"} aria-live={promptStatus ? undefined : "polite"} aria-atomic={promptStatus ? undefined : true} className="space-y-1">
      {!promptStatus && <>
      {(!hideUnavailable || !["not-connected", "unsupported"].includes(dictation.state)) && <p>{dictationLabels[dictation.state]}{dictation.reason && `：${dictation.reason}`}</p>}
      {dictation.interim && <p className="whitespace-pre-wrap break-words">识别中：{dictation.interim}</p>}
      {dictation.final && <p className="whitespace-pre-wrap break-words">识别结果：{dictation.final}</p>}
      </>}
      {promptStatus && ["error", "denied"].includes(dictation.state) && <p>{dictationLabels[dictation.state]}{dictation.reason && `：${dictation.reason}`}</p>}
      {(!hideUnavailable || voice.state !== "not-connected") && <p role={promptStatus ? "status" : undefined}>{voiceModeLabels[voice.state]}{voice.description && `：${voice.description}`}</p>}
    </div>
    {isVoiceActive(voice.state) && <Button type="button" variant="outline" size="sm" onClick={() => onIntent({ type: "voice-mode-stop" })}><Square aria-hidden="true" />结束语音对话</Button>}
    {privacy?.open && <section aria-labelledby={`${id}-privacy`} className="space-y-3 rounded-lg border p-3">
      <h3 id={`${id}-privacy`} className="text-item-title">使用语音前请确认</h3><div>{privacy.description}</div>
      <div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => onIntent({ type: "privacy-confirm" })}>确认使用语音</Button><Button type="button" size="sm" variant="outline" onClick={() => onIntent({ type: "privacy-cancel" })}>取消</Button></div>
    </section>}
  </div>
}
