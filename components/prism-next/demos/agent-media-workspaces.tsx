"use client"

import { AgentDemoPreview, useAgentDemoPresentation } from "./agent-demo-presentation"

import { useRef, useState } from "react"
import { Button } from "@/components/coss/button"
import { AgentAudioTranscript, type AgentAudioCapabilities, type AgentAudioSegment, type AgentAudioIntent } from "../agent-audio-transcript"
import { AgentVideoTimeline, type AgentVideoCapabilities, type AgentVideoMark, type AgentVideoSubtitle, type AgentVideoIntent } from "../agent-video-timeline"

export const audioTranscriptExample: readonly AgentAudioSegment[] = [
  { id: "intro", start: 0, end: 20, speaker: "教师", text: "今天我们先辨认直角三角形中的直角边与斜边。", confidence: { label: "待人工核对", source: "示例记录" } },
  { id: "question", start: 20, end: 45, speaker: "学生", text: "旋转图形以后，斜边还是直角对面的那条边吗？", confidence: { label: "待人工核对", source: "示例记录" } },
  { id: "unknown", start: 45, end: 70, text: "先找直角，再辨认边的位置。" },
  { id: "formula", start: 70, end: 110, speaker: "教师", text: "在直角三角形中，a² + b² = c²；两条直角边为 3 和 4，斜边为 5。", confidence: { label: "待人工核对", source: "示例记录" } },
  { id: "practice", start: 110, end: 145, speaker: "教师", text: "请说明每一次代入公式之前怎样确认适用条件，并比较另一种旋转方向下判断边的依据。", confidence: { label: "待人工核对", source: "示例记录" } },
  { id: "summary", start: 145, end: 180, speaker: "教师", text: "先判断条件，再列式，最后检验答案。", confidence: { label: "待人工核对", source: "示例记录" } },
]
export const videoTimelineExample: readonly AgentVideoMark[] = [
  { id: "opening", time: 0, kind: "chapter", label: "观察直角三角形" },
  { id: "equation", time: 65, kind: "chapter", label: "列式：a² + b² = c²" },
  { id: "exercise", time: 100, kind: "chapter", label: "练习与条件检查" },
  { id: "rotation", time: 30, kind: "chapter", label: "旋转图形，辨认直角边与斜边的位置关系" },
]
export const videoSubtitleExample: readonly AgentVideoSubtitle[] = [
  { id: "s1", start: 0, end: 15, text: "请先指出图中的直角。" },
  { id: "s2", start: 30, end: 50, text: "图形旋转之后，边的角色保持不变。" },
  { id: "s3", start: 65, end: 85, text: "a² + b² = c²，c 表示斜边。" },
]
const yes = { supported: true } as const
export const audioExampleCapabilities: AgentAudioCapabilities = { play: yes, transcribe: { supported: false, reason: "尚未接入语音转写服务。" }, "edit-transcript": yes, clip: yes, export: { supported: false, reason: "尚未提供可下载的文件。" } }
export const videoExampleCapabilities: AgentVideoCapabilities = { play: yes, subtitle: { supported: false, reason: "尚未接入字幕生成服务。" }, mark: yes, clip: { supported: false, reason: "尚未接入视频剪辑服务。" }, export: { supported: false, reason: "尚未提供可下载的文件。" } }

export function AudioTranscriptExample({ unavailable = false }: { unavailable?: boolean }) {
  const presentation = useAgentDemoPresentation()
  const [view, setView] = useState<"inline" | "workspace">("inline")
  const [compact, setCompact] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [segments, setSegments] = useState(unavailable ? audioTranscriptExample.map(segment => ({ ...segment, speaker: undefined, confidence: undefined })) : audioTranscriptExample)
  const [revision, setRevision] = useState(1)
  const [feedback, setFeedback] = useState("全部为模拟内容，未保存；未提供音频文件。")
  const trigger = useRef<HTMLButtonElement | null>(null)
  const restoreFocus = useRef(false)
  const panel = useRef<HTMLElement | null>(null)
  function intent(value: AgentAudioIntent) {
    if (value.audioId !== "demo-audio" || value.version !== `demo-${revision}`) return
    if (value.type === "edit-segment") { setSegments(segments.map(segment => segment.id === value.segmentId ? { ...segment, text: value.text } : segment)); setRevision(revision + 1); setFeedback("模拟转写已更新，未保存；刷新后还原。") }
    else if (value.type === "clip-request") setFeedback(`已记录 ${value.start}–${value.end} 秒的片段请求，没有生成音频文件。`)
    else if (value.type === "seek") setFeedback(`已请求定位到 ${value.seconds} 秒；示例没有可播放文件。`)
    else setFeedback("来源为固定课堂讲解模拟材料，没有真实来源文件。")
  }
  if (presentation.previewOnly) return <AgentDemoPreview feedback={feedback}><AgentAudioTranscript audioId="demo-audio" version={`demo-${revision}`} audio={{ title: unavailable ? "不可播放录音（模拟）" : "课堂讲解录音（模拟）", duration: 180, versionLabel: `录音 v${revision}（模拟）`, source: { label: "课堂讲解固定示例", openable: true }, description: "勾股定理课堂讲解与学生追问。", availability: unavailable ? { state: "unavailable", reason: "原录音暂不可用。" } : { state: "available" } }}
      segments={segments} capabilities={audioExampleCapabilities} readOnlyReason={unavailable ? "此示例仅供回看。" : undefined}   onIntent={intent}
      details={<p>点击时间只记录定位请求，确认片段不生成文件；同一页面中的转写修改仍未保存。</p>} view={presentation.view ?? "inline"} density={presentation.density ?? "default"} onExpand={presentation.onExpand} onBack={presentation.onBack} /></AgentDemoPreview>
  return <section ref={panel} tabIndex={-1} aria-label="课堂录音示例" className={`min-w-0 space-y-3 ${narrow ? "max-w-[320px]" : ""}`}>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" aria-pressed={compact} onClick={() => setCompact(!compact)}>紧凑密度</Button><Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 窄容器</Button></div>
    <p role="status" className="text-ui-hint">{feedback}</p>
    <AgentAudioTranscript audioId="demo-audio" version={`demo-${revision}`} audio={{ title: unavailable ? "不可播放录音（模拟）" : "课堂讲解录音（模拟）", duration: 180, versionLabel: `录音 v${revision}（模拟）`, source: { label: "课堂讲解固定示例", openable: true }, description: "勾股定理课堂讲解与学生追问。", availability: unavailable ? { state: "unavailable", reason: "原录音暂不可用。" } : { state: "available" } }}
      segments={segments} capabilities={audioExampleCapabilities} readOnlyReason={unavailable ? "此示例仅供回看。" : undefined} view={view} density={compact ? "compact" : "default"} onIntent={intent}
      onExpand={button => { trigger.current = button; setView("workspace"); panel.current?.focus() }}
      onBack={() => { restoreFocus.current = true; setView("inline") }}
      details={<p>点击时间只记录定位请求，确认片段不生成文件；同一页面中的转写修改仍未保存。</p>} />
    <span ref={node => { if (node && restoreFocus.current) { restoreFocus.current = false; const button = panel.current?.querySelector<HTMLButtonElement>('button[data-media-expand]'); (button ?? trigger.current)?.focus() } }} />
  </section>
}

export function VideoTimelineExample() {
  const presentation = useAgentDemoPresentation()
  const [view, setView] = useState<"inline" | "workspace">("inline")
  const [compact, setCompact] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [clip, setClip] = useState(false)
  const [marks, setMarks] = useState(videoTimelineExample)
  const [revision, setRevision] = useState(1)
  const [feedback, setFeedback] = useState("全部为模拟内容，未保存；未提供视频文件。")
  const panel = useRef<HTMLElement | null>(null)
  const restoreFocus = useRef(false)
  function intent(value: AgentVideoIntent) {
    if (value.videoId !== "demo-video" || value.version !== `demo-${revision}`) return
    if (value.type === "mark-create") setMarks([...marks, { id: `added-${revision}`, time: value.time, label: value.label, kind: value.kind }])
    else if (value.type === "mark-update") setMarks(marks.map(mark => mark.id === value.markId ? { ...mark, time: value.time, label: value.label, kind: value.kind } : mark))
    else if (value.type === "mark-delete") setMarks(marks.filter(mark => mark.id !== value.markId))
    else { setFeedback(value.type === "clip-request" ? `已记录 ${value.start}–${value.end} 秒的片段请求，没有生成视频文件。` : value.type === "seek" ? `已请求定位到 ${value.seconds} 秒；示例没有可播放文件。` : "来源为固定教学视频示例，没有真实来源文件。"); return }
    setRevision(revision + 1); setFeedback("模拟标记已更新，未保存；刷新后还原。")
  }
  if (presentation.previewOnly) return <AgentDemoPreview feedback={feedback}><AgentVideoTimeline videoId="demo-video" version={`demo-${revision}`} video={{ title: "教学视频（模拟）", duration: 140, versionLabel: `视频 v${revision}（模拟）`, source: { label: "勾股定理教学固定示例", openable: true }, description: "观察图形、辨认边、列式与练习四个章节。", availability: { state: "available" } }} marks={marks} subtitles={videoSubtitleExample} capabilities={{ ...videoExampleCapabilities, clip: clip ? yes : videoExampleCapabilities.clip }}   onIntent={intent}
      details={<p>字幕与章节由示例提供，播放和查看不代表已读取或已引用。</p>} view={presentation.view ?? "inline"} density={presentation.density ?? "default"} onExpand={presentation.onExpand} onBack={presentation.onBack} /></AgentDemoPreview>
  return <section ref={panel} tabIndex={-1} aria-label="教学视频示例" className={`min-w-0 space-y-3 ${narrow ? "max-w-[320px]" : ""}`}>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" aria-pressed={compact} onClick={() => setCompact(!compact)}>紧凑密度</Button><Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 窄容器</Button><Button type="button" variant="outline" aria-pressed={clip} onClick={() => setClip(!clip)}>演示片段请求</Button></div>
    <p role="status" className="text-ui-hint">{feedback}</p>
    <AgentVideoTimeline videoId="demo-video" version={`demo-${revision}`} video={{ title: "教学视频（模拟）", duration: 140, versionLabel: `视频 v${revision}（模拟）`, source: { label: "勾股定理教学固定示例", openable: true }, description: "观察图形、辨认边、列式与练习四个章节。", availability: { state: "available" } }} marks={marks} subtitles={videoSubtitleExample} capabilities={{ ...videoExampleCapabilities, clip: clip ? yes : videoExampleCapabilities.clip }} view={view} density={compact ? "compact" : "default"} onIntent={intent}
      onExpand={() => { setView("workspace"); panel.current?.focus() }} onBack={() => { restoreFocus.current = true; setView("inline") }}
      details={<p>字幕与章节由示例提供，播放和查看不代表已读取或已引用。</p>} />
    <span ref={node => { if (node && restoreFocus.current) { restoreFocus.current = false; panel.current?.querySelector<HTMLButtonElement>('button[data-media-expand]')?.focus() } }} />
  </section>
}

export function AgentAudioTranscriptDemo() {
  const presentation = useAgentDemoPresentation()
  if (presentation.previewOnly) return <AudioTranscriptExample />
  return <section id={presentation.embedded ? undefined : "audio-transcript"} className="min-w-0 space-y-5 py-6">{!presentation.embedded && <h2 className="text-section-title">音频与转写</h2>}<AudioTranscriptExample /><AudioTranscriptExample unavailable /></section>
}
export function AgentVideoTimelineDemo() {
  const presentation = useAgentDemoPresentation()
  if (presentation.previewOnly) return <VideoTimelineExample />
  return <section id={presentation.embedded ? undefined : "video-timeline"} className="min-w-0 space-y-5 py-6">{!presentation.embedded && <h2 className="text-section-title">视频与时间轴</h2>}<VideoTimelineExample /></section>
}
