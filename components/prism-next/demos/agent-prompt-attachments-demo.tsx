"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/coss/button"
import { AgentPromptBar, type AgentPromptRichAttachment } from "../agent-prompt-bar"
import { themeOptions } from "@/lib/prism-next/config"

const thumbnail = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="white"/><path d="M8 54H56M12 8V56M16 14Q32 78 50 14" fill="none" stroke="black" stroke-width="2"/></svg>')
export const promptAttachmentExamples: readonly AgentPromptRichAttachment[] = [
  { id: "image", kind: "image", name: "抛物线课堂板书.png", thumbnailUrl: thumbnail, status: "ready" },
  { id: "video", kind: "video", name: "抛物线课堂片段.mp4", thumbnailUrl: thumbnail, durationLabel: "01:24", status: "ready" },
  { id: "pdf", kind: "document", name: "高一2班二次函数单元作答与订正记录.pdf", metaLabel: "PDF · 45 页", status: "ready" },
  { id: "word", kind: "document", name: "二次函数讲义.docx", metaLabel: "Word · 6 页", status: "ready" },
  { id: "upload", kind: "file", name: "课堂补充材料.zip", metaLabel: "ZIP · 8 MB", status: "uploading", progress: 42 },
  { id: "error", kind: "file", name: "超出限制的材料.zip", metaLabel: "ZIP · 25 MB", status: "error", errorReason: "超过示例大小限制 20 MB" },
]

export function AgentPromptAttachmentsDemo() {
  const [theme, setTheme] = useState("blueprint"), [narrow, setNarrow] = useState(false)
  const [items, setItems] = useState<readonly AgentPromptRichAttachment[]>(promptAttachmentExamples)
  const [draft, setDraft] = useState("请结合附件中的抛物线 y = x² 说明解题过程。")
  const [action, setAction] = useState("尚未操作")
  const nextId = useRef(0)
  return <section id="attachments" aria-label="附件条示例" className="space-y-4">
    <h2 className="text-section-title">附件条</h2>
    <p className="text-ui-hint">合成附件示例。上传进度固定为 42%；拖入或粘贴只登记文件名，不读取内容、不上传。预览入口记录意图。</p>
    <div role="group" aria-label="附件条主题" className="flex flex-wrap gap-2">{themeOptions.map(option => <Button key={option.value} type="button" variant={theme === option.value ? "secondary" : "outline"} size="sm" aria-pressed={theme === option.value} onClick={() => setTheme(option.value)}>{option.label}</Button>)}</div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>390px 容器</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => { setItems(promptAttachmentExamples); setAction("已重置合成样例") }}>重置附件样例</Button>
    </div>
    <div data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} className="max-w-full border bg-background p-4 text-foreground" style={{ width: narrow ? 390 : "100%" }}>
      <AgentPromptBar value={draft} onValueChange={setDraft} sources={[]} commands={[]} models={[]} showModelSelector={false} density="compact"
        dictation={{ state: "not-connected" }} voice={{ state: "not-connected" }} richAttachments={items}
        sendDisabledReason={items.some(item => !item.status) ? "本机文件尚未上传（示例），请移除后发送" : undefined}
        onRemoveAttachment={id => { setItems(current => current.filter(item => item.id !== id)); setAction(`${items.find(item => item.id === id)?.status === "uploading" ? "取消上传" : "移除附件"}：${id}`) }}
        onOpenAttachment={id => setAction(`预览请求：${id}（示例未接入预览器）`)}
        onDropFiles={files => {
          setItems(current => [...current, ...files.map(file => ({ id: `local-${++nextId.current}`, kind: "file" as const, name: file.name, metaLabel: "本机选择 · 未上传" }))])
          setAction(`已接收 ${files.length} 个本机文件（未上传）`)
        }}
        onIntent={intent => setAction(JSON.stringify(intent))} />
    </div>
    <p role="status" className="text-ui-hint">附件操作：{action}</p>
  </section>
}
