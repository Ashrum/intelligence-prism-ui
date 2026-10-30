"use client"

import { useState } from "react"
import { File, Image as ImageIcon, Play, X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { InputGroupAddon } from "@/components/coss/input-group"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/coss/progress"
import { cn } from "@/lib/utils"
import "./agent-prompt-attachments.css"
import "./blueprint/prompt-attachments.css"

export type AgentPromptRichAttachment = {
  id: string
  name: string
  kind?: "image" | "video" | "document" | "file"
  thumbnailUrl?: string
  durationLabel?: string
  metaLabel?: string
  status?: "ready" | "uploading" | "error"
  progress?: number
  errorReason?: string
  /** Host-controlled current preview selection. */
  selected?: boolean
}

const kinds = { image: "图片", video: "视频", document: "文档", file: "文件" }
function progressValue(value?: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined
}
function Thumbnail({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false)
  return src && !failed
    // Host-owned blob/data URLs must not go through a remote image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
    : <span className="flex h-full w-full items-center justify-center" title={failed ? "缩略图加载失败" : "未提供缩略图"}><ImageIcon aria-hidden="true" className="size-5" /></span>
}

/** Internal composition: the host owns files, upload lifecycle and preview/focus return. */
export function AgentPromptAttachmentStrip({ items, disabled, onRemove, onOpen }: {
  items: readonly AgentPromptRichAttachment[]
  disabled: boolean
  onRemove: (id: string) => void
  onOpen?: (id: string) => void
}) {
  return <InputGroupAddon align="block-start" className="agent-prompt-attachment-container min-w-0">
    <ul aria-label="附件条" className="agent-prompt-attachments m-0 flex w-full min-w-0 list-none items-start overflow-x-auto">
      {items.map(item => {
        const kind = item.kind ?? "file", name = item.name.trim() || "名称未提供", progress = progressValue(item.progress)
        const media = kind === "image" || kind === "video"
        const state = item.status === "ready" ? "就绪" : item.status === "uploading" ? `上传中，${progress === undefined ? "进度未提供" : `${progress}%`}` : item.status === "error" ? `失败：${item.errorReason || "原因未提供"}` : "状态未提供"
        const accessibleName = `${kinds[kind]}：${name}；${state}`
        const chars = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(name)].map(part => part.segment)
        const tail = Math.min(8, Math.floor(chars.length / 2))
        const type = /\.([a-z0-9]{1,8})$/i.exec(name)?.[1].toUpperCase() ?? kinds[kind]
        const content = media ? <>
          <Thumbnail key={item.thumbnailUrl ?? "missing"} src={item.thumbnailUrl} />
          {kind === "video" && <span className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="bp-prompt-attachment-play rounded-sm bg-background text-foreground"><Play aria-hidden="true" className="size-4" /></span></span>}
          {kind === "video" && item.durationLabel && <span className="bp-prompt-attachment-meta absolute bottom-0 left-0 max-w-full truncate bg-background px-1 text-ui-meta text-foreground">{item.durationLabel}</span>}
        </> : <>
          <span className="bp-prompt-attachment-meta flex h-9 w-10 shrink-0 items-center justify-center rounded-sm bg-muted text-ui-meta text-muted-foreground">{type === "文件" ? <File aria-hidden="true" className="size-4" /> : type}</span>
          <span className="min-w-0 flex-1 space-y-1">
            <span aria-hidden="true" className="flex min-w-0 text-ui-hint"><span className="min-w-0 truncate">{chars.slice(0, chars.length - tail).join("")}</span><span className="shrink-0">{chars.slice(chars.length - tail).join("")}</span></span>
            {item.metaLabel && <span className="bp-prompt-attachment-meta block truncate text-ui-meta text-muted-foreground" title={item.metaLabel}>{item.metaLabel}</span>}
          </span>
        </>
        const faceClass = cn("bp-prompt-attachment-face relative flex shrink-0 items-center gap-2 overflow-hidden rounded-md border border-input bg-background text-foreground", media ? "agent-prompt-attachment-media p-0" : "agent-prompt-attachment-file py-1 pl-2 pr-8")
        return <li key={item.id} data-prompt-attachment={item.id} data-attachment-status={item.status} className={cn("relative shrink-0 space-y-1", media ? "agent-prompt-attachment-media-item" : "agent-prompt-attachment-file-item")}>
          {onOpen ? <Button type="button" variant="outline" size={null} className={faceClass} aria-label={accessibleName} title={name} data-selected={item.selected || undefined} aria-current={item.selected ? "true" : undefined} disabled={disabled} onClick={() => { if (!disabled) onOpen(item.id) }}>{content}</Button>
            : <div role="group" tabIndex={0} aria-label={accessibleName} title={name} data-selected={item.selected || undefined} aria-current={item.selected ? "true" : undefined} className={cn(faceClass, "outline-none focus-visible:ring-2 focus-visible:ring-ring")}>{content}</div>}
          <Button type="button" variant="outline" size={null} className="bp-prompt-attachment-remove absolute border-[1.5px] p-0" aria-label={`${item.status === "uploading" ? "取消上传" : "移除附件"}：${name}`} disabled={disabled} onClick={() => { if (!disabled) onRemove(item.id) }}><X aria-hidden="true" className="size-[11px]" /></Button>
          {item.status === "uploading" && <div className="space-y-1">
            <p className="bp-prompt-attachment-meta break-words text-ui-meta">{progress === undefined ? "上传中 · 进度未提供" : `${progress}%`}</p>
            <Progress value={progress ?? null} aria-label={`${name}上传进度`}><ProgressTrack><ProgressIndicator className="motion-reduce:transition-none" /></ProgressTrack></Progress>
          </div>}
          {item.status === "error" && <p role="status" className="text-ui-hint text-destructive-foreground [overflow-wrap:anywhere]">失败：{item.errorReason || "原因未提供"}</p>}
        </li>
      })}
    </ul>
  </InputGroupAddon>
}
