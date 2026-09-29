"use client"
import { useId, useRef, type ReactNode, type RefObject } from "react"
import { AudioLines, Mic, Square } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Popover, PopoverTrigger, PopoverPopup } from "@/components/coss/popover"

export const dictationLabels = { idle: "听写就绪", requesting: "正在请求麦克风权限", listening: "正在听写", recognizing: "正在识别", inserted: "听写已插入", error: "听写失败", denied: "麦克风权限被拒绝", unsupported: "浏览器不支持听写", "not-connected": "听写服务未接入" } as const
export const voiceModeLabels = { idle: "语音对话就绪", connecting: "正在连接语音对话", listening: "语音对话正在听", answering: "正在语音回答", ended: "语音对话已结束", "not-connected": "语音对话服务未接入" } as const
export type AgentDictation = { state: keyof typeof dictationLabels; interim?: string; final?: string; reason?: string; level?: number }
export type AgentVoiceMode = { state: keyof typeof voiceModeLabels; description?: string }
export type AgentVoiceIntent = { type: "dictation-start" | "dictation-stop" | "voice-mode-start" | "voice-mode-stop" | "privacy-confirm" | "privacy-cancel" }
export type AgentVoicePrivacy = { open: boolean; description: ReactNode }
export function isDictating(state: AgentDictation["state"]) { return ["requesting", "listening", "recognizing"].includes(state) }
export function isVoiceActive(state: AgentVoiceMode["state"]) { return ["connecting", "listening", "answering"].includes(state) }

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
    {["not-connected", "unsupported"].includes(dictation.state) ? <UnavailableVoiceButton portalContainer={portalContainer} label="开始听写" description={`${dictationLabels[dictation.state]}${dictation.reason ? `：${dictation.reason}` : ""}`} disabled={disabled || talking || Boolean(privacy?.open)} /> : <Button type="button" variant="ghost" size="icon-sm" aria-label={dictating ? "停止听写" : "开始听写"} aria-pressed={dictating}
      disabled={disabled || (!dictating && (talking || Boolean(privacy?.open)))} onClick={() => emit(dictating ? "dictation-stop" : "dictation-start")}>
      {dictating ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
    </Button>}
    {voice.state === "not-connected" ? <UnavailableVoiceButton portalContainer={portalContainer} voice label="开始语音对话" description={`${voiceModeLabels[voice.state]}${voice.description ? `：${voice.description}` : ""}`} disabled={disabled || dictating || Boolean(privacy?.open)} /> : <Button type="button" size="icon-sm" className="rounded-full" aria-label={talking ? "结束语音对话" : "开始语音对话"} aria-pressed={talking}
      disabled={disabled || (!talking && (dictating || Boolean(privacy?.open)))} onClick={() => emit(talking ? "voice-mode-stop" : "voice-mode-start")}><AudioLines aria-hidden="true" /></Button>}
  </>
}
export function AgentVoiceStatus({ dictation, voice, privacy, onIntent, hideUnavailable = false }: {
  dictation: AgentDictation; voice: AgentVoiceMode; privacy?: AgentVoicePrivacy; onIntent: (intent: AgentVoiceIntent) => void; hideUnavailable?: boolean
}) {
  const id = useId()
  const level = dictation.level !== undefined && Number.isFinite(dictation.level) ? Math.min(1, Math.max(0, dictation.level)) : undefined
  return <div className="space-y-2 text-ui-hint" data-agent-voice>
    <div role="status" aria-live="polite" aria-atomic="true" className="space-y-1">
      {(!hideUnavailable || !["not-connected", "unsupported"].includes(dictation.state)) && <p>{dictationLabels[dictation.state]}{dictation.reason && `：${dictation.reason}`}</p>}
      {dictation.interim && <p className="whitespace-pre-wrap break-words">识别中：{dictation.interim}</p>}
      {dictation.final && <p className="whitespace-pre-wrap break-words">识别结果：{dictation.final}</p>}
      {(!hideUnavailable || voice.state !== "not-connected") && <p>{voiceModeLabels[voice.state]}{voice.description && `：${voice.description}`}</p>}
    </div>
    {dictation.state === "listening" && (level === undefined
      ? <p className="flex items-center gap-2"><span aria-hidden="true" className="size-2 rounded-full bg-current" />麦克风电平未知</p>
      : <div className="flex items-center gap-2"><label htmlFor={`${id}-level`}>麦克风电平</label><meter id={`${id}-level`} min={0} max={1} value={level}>{Math.round(level * 100)}%</meter></div>)}
    {isVoiceActive(voice.state) && <Button type="button" variant="outline" size="sm" onClick={() => onIntent({ type: "voice-mode-stop" })}><Square aria-hidden="true" />结束语音对话</Button>}
    {privacy?.open && <section aria-labelledby={`${id}-privacy`} className="space-y-3 rounded-lg border p-3">
      <h3 id={`${id}-privacy`} className="text-item-title">使用语音前请确认</h3><div>{privacy.description}</div>
      <div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => onIntent({ type: "privacy-confirm" })}>确认使用语音</Button><Button type="button" size="sm" variant="outline" onClick={() => onIntent({ type: "privacy-cancel" })}>取消</Button></div>
    </section>}
  </div>
}
