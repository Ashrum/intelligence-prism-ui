"use client"

import { useState } from "react"
import { Dialog, DialogTrigger, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogPanel } from "@/components/coss/dialog"
import { MaterialIntake, type MaterialIntakeProps } from "../material-intake"
import { type AgentFileItem } from "../agent-file-input"
import { Button } from "../button"
import { DemoSection, Feedback } from "../demo-parts"

const limits = { accept: ".pdf,image/*", acceptLabel: "PDF / 图片", maxFileSize: 20 * 1024 * 1024, maxFiles: 10 }
const supported = { status: "supported" } as const
const request = { id: "student-upload-1", label: "学生答题卡上传" }
export const materialIntakeBase: MaterialIntakeProps = {
  title: "准备接收试卷原卷", description: "可通过数据站扫描，也可直接上传 PDF 或图片。",
  station: { name: "教学数据站 02", connection: "connected", location: "高中部 2 楼教师文印室", mode: "自动接收", receivedPages: 0 },
  platform: "web", state: { kind: "waiting" }, files: [], limits,
  capabilities: { select: supported, drop: supported, upload: { status: "unsupported", reason: "上传服务未接入；选择只保留本机文件信息。" } },
  steps: [{ id: "receive", label: "扫描 / 上传", state: "current" }, { id: "recognize", label: "自动识别", state: "upcoming" }, { id: "review", label: "核对并保存", state: "upcoming" }],
}
const receivedFiles: AgentFileItem[] = ["标准答案答题卡正面.pdf", "标准答案答题卡背面.png"].map((name, index) => ({
  id: `answer-${index}`, name, type: index === 0 ? "application/pdf" : "image/png", sizeBytes: 430080,
  source: { kind: "existing", label: "数据站接收" }, version: "v1", status: { state: "received", request: { id: `scan-${index}`, label: "答案答题卡扫描" } }, actions: { remove: {} },
}))
const reviewedSteps = materialIntakeBase.steps.map(step => ({ ...step, state: step.id === "review" ? "current" as const : "done" as const }))
export const materialIntakeFixtures: { label: string; props: MaterialIntakeProps }[] = [
  { label: "试卷原卷 · 等待接收", props: materialIntakeBase },
  { label: "标准答案答题卡 · 2 个文件待核对", props: { ...materialIntakeBase, title: "准备接收标准答案答题卡", state: { kind: "review" }, files: receivedFiles, station: { ...materialIntakeBase.station, receivedPages: 2 }, steps: reviewedSteps } },
  { label: "学生答题卡 · Web 上传进行中", props: { ...materialIntakeBase, title: "准备接收学生答题卡", state: { kind: "receiving" }, files: [{ ...receivedFiles[0], id: "student-upload", name: "高二数学学生答题卡.pdf", source: { kind: "local" }, status: { state: "uploading", request, progress: 42 } }], station: { ...materialIntakeBase.station, mode: "Web 上传", receivedPages: 3 } } },
  { label: "张明第 2 页 · 单页替换等待", props: { ...materialIntakeBase, title: "重新接收张明第 2 页", platform: "android", mode: { kind: "replace-page", targetLabel: "张明第 2 页" }, description: "请放入张明试卷第 2 页，或选择对应文件。" } },
  { label: "张明第 2 页 · 已接收待核对", props: { ...materialIntakeBase, title: "重新接收张明第 2 页", state: { kind: "review" }, mode: { kind: "replace-page", targetLabel: "张明第 2 页" }, files: [{ ...receivedFiles[1], id: "replacement", name: "张明第2页.png" }], station: { ...materialIntakeBase.station, mode: "指定页面接收", receivedPages: 1 }, steps: reviewedSteps } },
  { label: "数据站未连接 · 仍可选择文件", props: { ...materialIntakeBase, platform: "device", station: { name: "教学数据站 02", connection: "disconnected" } } },
  { label: "校验失败 · 重新接收", props: { ...materialIntakeBase, state: { kind: "invalid", reason: "接收页面与张明第 2 页不一致，请核对学生与页码后重新接收。" }, mode: { kind: "replace-page", targetLabel: "张明第 2 页" }, files: [{ ...receivedFiles[1], status: { state: "invalid", validation: "type", reason: "文件内容不是指定页面" } }] } },
  { label: "只收 2 页 · 数据站可用", props: { ...materialIntakeBase, mode: { kind: "limited", pageLimit: 2 }, station: { ...materialIntakeBase.station, connection: "available" } } },
  { label: "数据站离线 · 接收状态未知", props: { ...materialIntakeBase, state: { kind: "unknown" }, station: { connection: "offline" }, steps: materialIntakeBase.steps.map(step => ({ ...step, state: "upcoming" })) } },
  { label: "Loading", props: { ...materialIntakeBase, state: { kind: "loading" } } },
  { label: "Error", props: { ...materialIntakeBase, state: { kind: "error", reason: "暂时无法取得接收信息，请重新加载。" } } },
]

function IntakeFixture({ props, onCancel }: { props: MaterialIntakeProps; onCancel?: () => void }) {
  const [feedback, setFeedback] = useState("尚未发出操作请求")
  const [local, setLocal] = useState<AgentFileItem[]>([])
  const select = (files: File[]) => {
    // Host-side metadata validation only; no file reads, uploads or reception transition.
    const newItems = files.map((file, index): AgentFileItem => {
      const validation = props.files.length + local.length + files.length > props.limits.maxFiles ? "count"
        : file.size > props.limits.maxFileSize ? "size"
          : file.type === "application/pdf" || file.type.startsWith("image/") || /\.pdf$/i.test(file.name) ? undefined : "type"
      return { id: `local-${local.length + index}`, name: file.name, type: file.type, sizeBytes: file.size, source: { kind: "local" },
        status: validation ? { state: "invalid", validation, reason: validation === "count" ? "文件数量超限" : validation === "size" ? "文件大小超限" : "请选择 PDF 或图片" } : { state: "selected" }, actions: { remove: {} } }
    })
    setLocal(current => [...current, ...newItems])
    setFeedback(`已选择 ${files.length} 个本机文件；等待调用方接收，尚未上传`)
  }
  return <div className="min-w-0 space-y-3"><MaterialIntake {...props} files={[...props.files, ...local]} onFilesSelected={select}
    confirmDisabledReason={props.confirmDisabledReason || (local.some(item => item.status.state === "selected" || item.status.state === "invalid") ? "有文件未上传或校验失败" : undefined)}
    onRemove={intent => setFeedback(`已发出移除请求：${intent.fileId}；等待调用方处理`)}
    onRetry={intent => setFeedback(`已发出${intent.kind === "load" ? "重新加载" : "重新接收"}请求；等待调用方处理`)}
    onChangeStation={() => setFeedback("已发出更换数据站请求；等待调用方打开数据站选择")}
    onCancel={() => { setFeedback("已发出取消请求"); onCancel?.() }} onConfirm={() => setFeedback("已发出完成并保存请求；等待调用方核对与保存回执")} />
    <Feedback>{feedback}</Feedback></div>
}

export function MaterialIntakeDemo() {
  const [open, setOpen] = useState(false)
  return <>
    {materialIntakeFixtures.map(({ label, props }, index) => <DemoSection key={label} title={label} description={index === 0 ? "状态为调用方传入的固定记录；操作只记录请求，未连接真实上传或数据站。" : undefined}><div className="max-w-2xl"><IntakeFixture props={props} /></div></DemoSection>)}
    <DemoSection title="对话框接收" description="关闭与取消返回原触发入口；接收状态由调用方提供。">
      <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button variant="outline" />}>打开资料接收</DialogTrigger>
        <DialogPopup className="max-w-2xl" closeProps={{ "aria-label": "关闭资料接收" }}><DialogHeader><DialogTitle>资料接收</DialogTitle><DialogDescription>接收后统一核对并保存。</DialogDescription></DialogHeader>
          <DialogPanel><IntakeFixture props={materialIntakeBase} onCancel={() => setOpen(false)} /></DialogPanel>
        </DialogPopup></Dialog>
    </DemoSection>
    <DemoSection title="三主题 · 320px · 长中文与公式" description="保留完整状态、禁用原因与当前步骤；完整流程可在局部横向滚动。">
      <div className="flex flex-wrap items-start gap-4">{(["light", "paper", "dark"] as const).map(theme => <section key={theme} aria-label={`${theme} 320px`} data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} className="w-80 max-w-full space-y-3 p-3">
        <h3 className="text-item-title">{theme} · 320px</h3>
        <IntakeFixture props={{ ...materialIntakeFixtures[1].props, title: "准备接收高二数学期中考试标准答案答题卡与评分依据完整核对版本", files: [{ ...receivedFiles[0], name: "高二数学期中考试标准答案答题卡与评分依据完整核对版本.pdf" }] }} />
        <p className="text-ui-hint">资料公式：<math><mi>y</mi><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn></math></p>
      </section>)}</div>
    </DemoSection>
  </>
}
