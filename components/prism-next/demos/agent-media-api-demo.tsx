"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/coss/button"
import { Dialog, DialogTrigger, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/coss/dialog"
import { AgentPromptBar, type AgentPromptRichAttachment } from "../agent-prompt-bar"
import { AttachmentPlayBadge } from "../agent-prompt-attachments"
import { NativeMedia } from "../agent-media-parts"
import { themeOptions } from "@/lib/prism-next/config"

// Local, generated silent VP8 fixtures: 48 frames at 24 fps. No remote media.
export const lightboxVideoExamples = [
  { id: "landscape", title: "横向视频 640 × 360", src: "/demos/media-p124/landscape.webm" },
  { id: "portrait", title: "竖向视频 360 × 640", src: "/demos/media-p124/portrait.webm" },
] as const
// Deliberately square poster to exercise metadata-derived video proportions.
export const lightboxPoster = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="white"/><path d="M40 28L96 64L40 100Z" fill="black"/></svg>')
export const attachmentFailureExamples: readonly AgentPromptRichAttachment[] = [
  { id: "empty", kind: "image", name: "空文件.png", status: "error", errorReason: "文件为空或大小无效" },
  { id: "mp3", kind: "file", name: "课堂录音.mp3", metaLabel: "MP3 · 1 MB", status: "error", errorReason: "类型不支持，请选择图片、视频、PDF 或 DOCX" },
  { id: "large", kind: "document", name: "高一2班二次函数单元作答与订正记录及课堂观察完整归档材料.pdf", metaLabel: "PDF · 25 MB", status: "error", errorReason: "超过示例大小限制 20 MB" },
  { id: "unknown", kind: "video", name: "未提供原因.mp4", status: "error", errorReason: "" },
]

export function AgentMediaApiDemo() {
  const [theme, setTheme] = useState("blueprint"), [narrow, setNarrow] = useState(false)
  const [items, setItems] = useState<readonly AgentPromptRichAttachment[]>(attachmentFailureExamples)
  const [draft, setDraft] = useState("请结合抛物线 y = x² 分析这些附件。"), [action, setAction] = useState("尚未操作")
  const [open, setOpen] = useState(false), [index, setIndex] = useState(0)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const video = lightboxVideoExamples[index]
  return <section id="media-api" aria-label="灯箱与失败原因示例" className="space-y-4">
    <h2 className="text-section-title">灯箱视频（横、竖）与附件失败原因汇总</h2>
    <p className="text-ui-hint">本机合成无声视频与固定失败样例，不代表真实上传或校验。方形 poster 用于检查原始视频比例；原生控件手动播放。</p>
    <div role="group" aria-label="媒体适配主题" className="flex flex-wrap gap-2">{themeOptions.map(option => <Button key={option.value} type="button" variant={theme === option.value ? "secondary" : "outline"} size="sm" aria-pressed={theme === option.value} onClick={() => setTheme(option.value)}>{option.label}</Button>)}</div>
    <Button type="button" variant="outline" size="sm" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>390px 容器</Button>
    <div data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} className="max-w-full space-y-4 border bg-background p-4 text-foreground" style={{ width: narrow ? 390 : "100%" }}>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="grid grid-cols-2 gap-3">{lightboxVideoExamples.map((item, i) => <DialogTrigger key={item.id} render={<Button type="button" variant="outline" size={null} className="bp-prompt-attachment-face relative aspect-video min-w-0 overflow-hidden p-4" />} aria-label={`打开${item.title}`} onClick={event => { trigger.current = event.currentTarget; setIndex(i) }}>
          <span className="self-start text-ui-hint">{item.title}</span><AttachmentPlayBadge durationLabel="0:02" />
        </DialogTrigger>)}</div>
        <DialogPopup data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} className="max-w-5xl" style={{ width: narrow ? "min(390px, 100%)" : undefined }} bottomStickOnMobile={false} showCloseButton={false} finalFocus={() => trigger.current ?? false}>
          <DialogHeader><DialogTitle>{video.title}</DialogTitle><DialogDescription>本机合成视频；可用高度 65dvh，按原始比例显示。</DialogDescription></DialogHeader>
          <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-4" onKeyDown={event => {
            // Do not intercept the native player's seek/volume keys.
            if (event.target instanceof HTMLVideoElement || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); setIndex(current => 1 - current) }
          }}>
            <NativeMedia key={video.id} media={{ title: video.title, description: "合成渐变画面，四边浅色边框应完整可见。", src: video.src, availability: { state: "available" } }} kind="video" capability={{ supported: true }} poster={lightboxPoster} fit="contain" preload="metadata" containerClassName="w-full" mediaClassName="max-h-[65dvh] max-w-full" />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setIndex(current => 1 - current)}>切换横竖视频</Button>
              <span className="text-ui-hint">{index + 1} / 2</span>
              <a href={video.src} download className="prism-link">下载合成视频</a>
              <DialogClose render={<Button type="button" variant="outline" />}>关闭视频预览</DialogClose>
            </div>
          </div>
        </DialogPopup>
      </Dialog>
      <h3 className="text-block-title">附件失败原因汇总</h3>
      <AgentPromptBar value={draft} onValueChange={setDraft} onIntent={intent => setAction(JSON.stringify(intent))} sources={[]} commands={[]} models={[]} showModelSelector={false} density="compact" dictation={{ state: "not-connected" }} voice={{ state: "not-connected" }} richAttachments={items} attachmentErrorDisplay="summary" onRemoveAttachment={id => { setItems(current => current.filter(item => item.id !== id)); setAction(`移除附件：${id}`) }} />
      <Button type="button" variant="outline" onClick={() => { setItems(attachmentFailureExamples); setAction("已重置失败样例") }}>重置失败样例</Button>
      <p role="status" className="text-ui-hint">操作：{action}</p>
    </div>
  </section>
}
