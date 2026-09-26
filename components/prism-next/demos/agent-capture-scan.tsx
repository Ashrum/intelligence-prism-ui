"use client"

import { useId, useRef, useState } from "react"
import { AlertDialog, AlertDialogPopup, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogClose } from "@/components/coss/alert-dialog"
import { Label } from "@/components/coss/label"
import { Button } from "../button"
import { QuestionSelect } from "../question-controls"
import { DocumentRegionViewer } from "../document-region-viewer"
import { RootFormula } from "../math-content"
import { AgentCaptureScan, type AgentCapturePage, type AgentCapturePreview, type AgentCaptureReceipt, type AgentCaptureSave, type AgentCaptureScanIntent, type AgentCaptureScanProps } from "../agent-capture-scan"

const pageActions = { inspect: {}, recapture: {}, remove: {}, reorder: {} }
function Thumbnail() {
  return <svg viewBox="0 0 100 120" role="img" aria-label="人工绘制的页面缩略示意" className="h-24 max-w-full" fill="none" stroke="currentColor">
    <rect x="12" y="4" width="76" height="110" /><path d="M24 22h48M24 38h48M24 54h48M24 70h32M24 86h48M24 102h24" />
  </svg>
}
const page = (id: string, name: string): AgentCapturePage => ({ id, name, source: "课堂作答扫描样本（示例）", capturedAt: "2026-09-26 09:30（示例）",
  quality: { state: "clear" }, needsRecapture: false, usage: { state: "unused" }, thumbnail: <Thumbnail />, actions: pageActions })
export type CaptureExampleState = Pick<AgentCaptureScanProps, "captureSet" | "pages" | "capturedCount" | "totalPages" | "qualitySummary" | "receipt"> & { revision: number }
export const captureScanExamples: Record<"paper" | "board", CaptureExampleState> = {
  paper: {
    captureSet: { id: "sample-answer-pages", title: "试卷作答扫描（示例）", version: { id: "sample-v1", label: "示例页集 1" } }, revision: 1,
    capturedCount: 4, totalPages: 4, qualitySummary: "2 页清晰、1 页模糊、1 页倾斜。", receipt: { state: "idle" },
    pages: [page("sample-page-1", "第 1 页"), { ...page("sample-page-2", "第 2 页"), quality: { state: "skewed", reason: "纸张略有倾斜，请核对左侧题号是否完整。" } },
      { ...page("sample-page-3", "第 3 页"), quality: { state: "blurry", reason: "解答过程中的分式与指数模糊，需要重新采集后再核对。" }, needsRecapture: true },
      { ...page("sample-page-4", "第 4 页"), usage: { state: "used", label: "本次数学批阅（示例）", removalImpact: "删除后，本次批阅将缺少这页原始作答，需要核对受影响的批阅记录。" } }],
  },
  board: {
    captureSet: { id: "sample-board-pages", title: "板书拍照：保留学生对二次函数图像、对称轴与求根公式适用条件的不同解释（示例）", version: { id: "sample-v1", label: "示例页集 1" } }, revision: 1,
    capturedCount: 1, totalPages: null, qualitySummary: null,
    receipt: { state: "unconfirmed", operation: "capture", request: { id: "sample-board-request", label: "本轮板书采集" }, reason: "尚未收到本轮采集结果，不能判断是否还有页面到达。" },
    pages: [{ ...page("sample-board-1", "板书全景：从图像观察到公式推导，保留右下角学生补充的适用条件与待核对问题"), source: "课堂板书样本（示例）", capturedAt: null,
      quality: { state: "unknown" }, needsRecapture: null, usage: { state: "unknown" } }],
  },
}

/** Demo host only: edit a draft after checking the exact set/version and, for used pages, separate confirmation. */
export function applyCaptureExample(current: CaptureExampleState, intent: AgentCaptureScanIntent, confirmedRemoval = false): CaptureExampleState {
  if (intent.setId !== current.captureSet.id || intent.versionId !== current.captureSet.version.id || !["idle", "succeeded", "failed"].includes(current.receipt.state)) return current
  if (intent.type !== "reorder" && intent.type !== "remove-page") return current
  const from = current.pages.findIndex(item => item.id === intent.pageId), target = current.pages[from]
  if (!target || target.lockedReason !== undefined) return current
  const pages = [...current.pages]
  if (intent.type === "reorder") {
    if (!Number.isInteger(intent.toIndex) || intent.toIndex < 0 || intent.toIndex >= pages.length || intent.toIndex === from
      || pages.slice(Math.min(from, intent.toIndex), Math.max(from, intent.toIndex) + 1).some(item => !item.actions?.reorder || item.actions.reorder.disabledReason !== undefined || item.lockedReason !== undefined)) return current
    const [moving] = pages.splice(from, 1); pages.splice(intent.toIndex, 0, moving)
  } else {
    if (!target.actions?.remove || target.actions.remove.disabledReason !== undefined || target.usage.state === "unknown"
      || (target.usage.state === "used" && (!confirmedRemoval || !target.usage.removalImpact.trim()))) return current
    pages.splice(from, 1)
  }
  const revision = current.revision + 1
  return { ...current, pages, revision, capturedCount: pages.length, qualitySummary: "页集合已调整，逐页质量沿用原示例记录。",
    captureSet: { ...current.captureSet, version: { id: `sample-v${revision}`, label: `示例页集 ${revision}` } } }
}

function PagePreview() {
  const [zoom, setZoom] = useState(100), [selected, setSelected] = useState<string>()
  return <div className="min-w-0 space-y-3"><p className="text-ui-hint">人工原稿示意，非真实扫描图或识别结果。</p>
    <div className="flex flex-wrap gap-2">{[75, 100, 150].map(value => <Button key={value} type="button" size="navigation" variant="outline" aria-pressed={zoom === value} onClick={() => setZoom(value)}>{value}%</Button>)}</div>
    <DocumentRegionViewer label="人工原稿示意" zoom={zoom} selectedId={selected} onSelect={setSelected}
      header={<p className="text-block-title">二次函数课堂作答 · 人工示意</p>}
      regions={[{ id: "formula-region", label: "公式区域", rect: [8, 22, 84, 26], content: <RootFormula /> },
        { id: "reason-region", label: "说明区域", rect: [8, 56, 84, 26], content: <p className="text-read-body">先核对判别式，再说明图像与横轴交点的关系。</p> }]} />
  </div>
}

export function CaptureScanExample({ purpose, narrow = false }: { purpose: keyof typeof captureScanExamples; narrow?: boolean }) {
  const id = useId(), trigger = useRef<HTMLButtonElement | null>(null), workspace = useRef<HTMLElement | null>(null)
  const [state, setState] = useState(captureScanExamples[purpose]), [save, setSave] = useState<AgentCaptureSave["state"]>("unsaved")
  const [preview, setPreview] = useState<AgentCapturePreview | null>(null), [pendingRemoval, setPendingRemoval] = useState<Extract<AgentCaptureScanIntent, { type: "remove-page" }> | null>(null)
  const [feedback, setFeedback] = useState("固定示例，尚未发出操作请求。")
  function receive(intent: AgentCaptureScanIntent) {
    if (intent.setId !== state.captureSet.id || intent.versionId !== state.captureSet.version.id) return
    if (intent.type === "inspect-page") { setPreview({ ...intent, requestedBy: "user", state: "ready" }); setFeedback("已打开人工原稿示意，质量与后续使用记录保持原样。"); return }
    if (intent.type === "remove-page") {
      const target = state.pages.find(page => page.id === intent.pageId)
      if (target?.usage.state === "used") { setPendingRemoval(intent); return }
    }
    if (intent.type === "reorder" || intent.type === "remove-page") {
      const next = applyCaptureExample(state, intent)
      if (next !== state) { setState(next); setSave("unsaved"); setPreview(null); setFeedback("本页示例草稿已调整，尚未保存；后续处理记录未改变。") }
      return
    }
    setFeedback(intent.type === "confirm-set" ? "已收到页集合确认请求；示例未接保存服务，保存与处理状态保持原样。"
      : `已收到${intent.type === "capture-request" ? "继续采集" : "补采／替换"}请求；示例未接相机、扫描仪或上传，页数和质量保持原样。`)
  }
  const common: AgentCaptureScanProps = { ...state, save: { state: save }, actions: { capture: {}, confirm: state.pages.some(page => page.needsRecapture === true) ? { disabledReason: "请先补采模糊页，再确认本次页集合。" } : {} },
    onIntent: receive, preview, renderPreview: page => <PagePreview key={`${state.captureSet.version.id}-${page.id}`} />,
    onExpand: button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) },
    details: <p>页名随原稿身份保留，顺序由列表位置表达。质量、来源、采集时间和后续使用都是预置示例记录。上移、下移与指定位置均可替代拖拽；本页调整不写入业务数据。</p>,
  }
  const removalPage = pendingRemoval && state.pages.find(page => page.id === pendingRemoval.pageId)
  const removalCurrent = !!pendingRemoval && pendingRemoval.versionId === state.captureSet.version.id && removalPage?.usage.state === "used"
    && !["saving", "conflict", "unconfirmed"].includes(save) && ["idle", "succeeded", "failed"].includes(state.receipt.state)
  const receiptChoice = (receipt: AgentCaptureReceipt) => receipt.state === "running" ? "uploading" : receipt.state
  function loadReceipt(value: string) {
    const request = { id: "sample-capture-request", label: "本轮页面采集（示例）" }
    const receipt: AgentCaptureReceipt = value === "uploading" ? { state: "running", operation: "upload", request, progress: 45 }
      : value === "unconfirmed" ? { state: "unconfirmed", operation: "capture", request, reason: "尚未收到本轮采集结果，不能判断是否还有页面到达。" }
        : value === "failed" ? { state: "failed", operation: "upload", request, reason: "示例上传连接中断，已采集页面保留。" }
          : value === "succeeded" ? { state: "succeeded", operation: "capture", request } : value === "unknown" ? { state: "unknown" } : { state: "idle" }
    setState(current => ({ ...current, receipt })); setFeedback("已载入独立示例回执；没有执行设备采集、上传或质量检查。")
  }
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-end gap-3"><div className="min-w-0 space-y-2"><Label htmlFor={`${id}-receipt`}>独立采集／上传回执示例</Label>
      <QuestionSelect id={`${id}-receipt`} label="独立采集／上传回执示例" value={receiptChoice(state.receipt)} onChange={loadReceipt}
        items={[{ value: "idle", label: "暂无请求" }, { value: "uploading", label: "上传中 45%" }, { value: "succeeded", label: "采集已完成" }, { value: "failed", label: "上传失败" }, { value: "unconfirmed", label: "采集回执未确认" }, { value: "unknown", label: "采集状态未知" }]} />
    </div><div className="min-w-0 space-y-2"><Label htmlFor={`${id}-save`}>独立保存记录示例</Label>
      <QuestionSelect id={`${id}-save`} label="独立保存记录示例" value={save} onChange={value => setSave(value as AgentCaptureSave["state"])}
        items={[{ value: "unsaved", label: "未保存" }, { value: "saved", label: "已保存（示例）" }, { value: "saving", label: "保存中" }, { value: "error", label: "保存失败" }, { value: "conflict", label: "版本冲突" }, { value: "unconfirmed", label: "保存回执未确认" }, { value: "unknown", label: "未知" }]} />
    </div>{preview && <Button type="button" variant="outline" onClick={() => setPreview(null)}>收起大图</Button>}</div>
    <p className="text-ui-hint">固定示例；切换记录仅用于评审，不代表执行了采集、上传、保存或批阅。</p><p role="status" className="text-ui-hint">{feedback}</p>
    {([["inline", "default", "快速采集"], ["workspace", "default", "批量页与页序"], ["inline", "compact", "紧凑采集摘要"]] as const).map(([view, density, label]) => <section key={`${view}-${density}`} aria-label={label} tabIndex={view === "workspace" ? -1 : undefined} ref={view === "workspace" ? workspace : undefined} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentCaptureScan {...common} view={view} density={density} />
    </section>)}
    <AlertDialog open={!!pendingRemoval} onOpenChange={open => { if (!open) setPendingRemoval(null) }}>
      <AlertDialogPopup><AlertDialogHeader><AlertDialogTitle>确认删除示例页</AlertDialogTitle>
        <AlertDialogDescription>{removalCurrent && removalPage?.usage.state === "used" ? `${removalPage.name}：${removalPage.usage.removalImpact}` : "页面版本或可操作状态已变化，请关闭后重新核对。"}</AlertDialogDescription>
      </AlertDialogHeader><AlertDialogFooter><AlertDialogClose render={<Button type="button" variant="outline" />}>保留页面</AlertDialogClose>
        <Button type="button" disabled={!removalCurrent} onClick={() => {
          if (!pendingRemoval || !removalCurrent) return
          setState(current => applyCaptureExample(current, pendingRemoval, true)); setPendingRemoval(null); setPreview(null); setSave("unsaved")
          setFeedback("已从本页示例草稿删除，尚未保存；既有批阅记录未被改写。")
        }}>确认删除（示例）</Button>
      </AlertDialogFooter></AlertDialogPopup>
    </AlertDialog>
  </div>
}

export function AgentCaptureScanDemo() {
  const [purpose, setPurpose] = useState<keyof typeof captureScanExamples>("paper"), [narrow, setNarrow] = useState(false)
  return <section id="capture-scan" className="mb-12 min-w-0 space-y-5"><h2 className="text-section-title">采集扫描 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["paper", "board"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "paper" ? "四页试卷作答示例" : "板书拍照示例"}</Button>)}
      <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button></div>
    <CaptureScanExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
