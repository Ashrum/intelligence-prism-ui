"use client"
import { useState } from "react"
import { DemoSection } from "../demo-parts"
import { Button } from "../button"
import { PaperPreview, PaperPreviewDialog, type PaperPreviewPage, type PaperPreviewProps } from "../paper-preview"

export const studentPaperPages: PaperPreviewPage[] = Array.from({ length: 6 }, (_, i) => ({ id: `student-${i}`, paperSize: "A4", quality: i === 1 ? "unknown" : "normal", anomaly: i === 1 ? "缺页，等待补扫" : undefined }))
export const markingMaterialPages: PaperPreviewPage[] = Array.from({ length: 12 }, (_, i) => ({ id: `material-${i}`, paperSize: "A3", quality: "normal" }))
const reviewPages: PaperPreviewPage[] = [{ id: "review-1", paperSize: "A4", quality: "normal", regions: [{ id: "answer-3", label: "第 3 题推导过程", rect: [8, 42, 84, 24] }, { id: "identity", label: "姓名与考号", rect: [8, 8, 84, 12] }] }]
export const gesturePaperPages: PaperPreviewPage[] = [
  { ...reviewPages[0], id: "gesture-a3", paperSize: "A3", orientation: "landscape", imageUrl: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="420" height="297" viewBox="0 0 420 297"><rect width="420" height="297" fill="white"/><path d="M34 90H386M34 110H386M34 220H386" stroke="black"/><text x="34" y="60">A3 · 1 → 2</text><text x="34" y="170">y = (x - 1)² - 4</text></svg>')}`, alt: "固定 A3 横版测试纸：上方页码与下方公式用于核对旋转方向" },
  { ...reviewPages[0], id: "gesture-a4" },
]
const versions = [{ id: "v2", label: "V2", current: true }, { id: "v1", label: "V1", validated: true, restorable: true }]

export function PaperPreviewDemo() {
  const [notice, setNotice] = useState("")
  const [narrow, setNarrow] = useState(false)
  const [selectedRegionId, setRegion] = useState("answer-3")
  const student: PaperPreviewProps = {
    title: "张明 · 高二数学期中考试学生试卷", subtitle: "考号 20260124 · 应收 6 页 · 当前收到 5 页", pages: studentPaperPages, defaultPage: 1,
    status: { label: "待补扫", variant: "warning" }, information: [{ label: "学生", value: "张明" }, { label: "考号", value: "20260124" }, { label: "接收时间", value: "2026-09-30 14:32:18" }, { label: "扫描质量", value: "第 2 页缺失，其余页面清晰" }], versions,
    actions: [{ id: "rescan-page", label: "重新扫描异常页", primary: true }, { id: "rescan-all", label: "重新扫描整份" }, { id: "back", label: "返回验收" }],
    onAction: actionId => setNotice(`操作请求：${actionId === "back" ? "返回验收" : actionId === "rescan-all" ? "重新扫描整份" : "重新扫描异常页"}；等待处理。`),
    onSetCurrentVersion: () => setNotice("已请求设为当前扫描件，等待处理；当前仍为 V2。"),
    hasPrev: false, hasNext: true, onNext: () => setNotice("已请求查看下一份。"), onRetry: () => setNotice("已请求重新加载。"),
  }
  return <>
    <DemoSection title="学生试卷 · 缺页与扫描版本" description="6 页试卷；第 2 页缺失。页面顶部可切换浅色、暖纸、深色。">
      <div className="mb-4 flex flex-wrap gap-2"><Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>320px 窄容器</Button><PaperPreviewDialog {...student} triggerLabel="全屏查看学生试卷" onClose={() => setNotice("已关闭试卷预览。")} /></div>
      <div style={narrow ? { width: 320, maxWidth: "100%" } : undefined}><PaperPreview {...student} /></div>
      <p role="status" className="pt-3 text-ui-hint">{notice || "尚无操作请求。"}</p>
    </DemoSection>
    <DemoSection title="批阅资料 · 12 页 A3 原卷">
      <PaperPreview title="高二物理期中考试 · 试卷原卷" subtitle="批阅资料 · PDF · 8.4 MB" pages={markingMaterialPages} status={{ label: "完成版面解析" }} information={[{ label: "文件", value: "高二物理期中试卷" }, { label: "类型", value: "PDF" }, { label: "上传时间", value: "2026-09-30 14:18:03" }, { label: "解析状态", value: "完整，可用于批阅" }]} versions={versions} actions={[{ id: "rescan-material", label: "再次扫描此资料", primary: true }]} onAction={() => setNotice("已请求再次扫描此资料。")} onSetCurrentVersion={student.onSetCurrentVersion} />
    </DemoSection>
    <DemoSection title="人工复核 · 原卷区域定位与长中文">
      <PaperPreview title="李华 · 主观题第 3 题：二次函数配方法的推导与结论核对" subtitle="请对照学生原始作答，检查等号两侧的变形是否保持等价，核实结论与计算过程是否一致。" pages={reviewPages} selectedRegionId={selectedRegionId} onRegionSelect={(_, regionId) => setRegion(regionId)} status={{ label: "待人工复核" }} information={[{ label: "学生", value: "李华" }, { label: "考号", value: "20260126" }]} informationSlot={<p className="text-read-body">核对关系：<math><mi>y</mi><mo>=</mo><msup><mrow><mo>(</mo><mi>x</mi><mo>−</mo><mn>1</mn><mo>)</mo></mrow><mn>2</mn></msup><mo>−</mo><mn>4</mn></math></p>} />
    </DemoSection>
    <DemoSection title="旋转与手势" description="固定测试纸含 A3 横版与答题区域。Ctrl/⌘+滚轮或双指捏合缩放；放大后拖动；双击或双指轻点切换适合页面与 100%。视口内可用 +、-、0、R、Shift+R。旋转按页保留，缩略图不旋转。">
      <PaperPreview title="旋转、缩放与区域对齐核对" pages={gesturePaperPages} selectedRegionId={selectedRegionId} onRegionSelect={(_, value) => setRegion(value)} onRotationChange={(pageId, value) => setNotice(`${pageId} 查看角度 ${value}°`)} onZoomChange={value => setNotice(`查看缩放：${value}`)} />
      <p role="status" className="pt-3 text-ui-hint">{notice || "尚无查看操作。"}</p>
    </DemoSection>
    <DemoSection title="加载、无页面与加载失败">
      <div className="grid gap-6">{(["loading", "empty", "error"] as const).map(state => <PaperPreview key={state} title="高二数学答题卡" subtitle="扫描资料" pages={[]} state={state} onRetry={student.onRetry} />)}</div>
    </DemoSection>
    <DemoSection title="三主题 · 320px 信息栏下移">
      <div className="flex flex-wrap gap-4">{(["light", "paper", "dark"] as const).map(theme => <div key={theme} data-agent-preview data-prism-theme={theme} data-ui-version="coss-v1" className="w-80 max-w-full p-3"><p className="pb-3 text-item-title">{theme === "light" ? "浅色" : theme === "paper" ? "暖纸" : "深色"}</p><PaperPreview {...student} pages={gesturePaperPages} defaultRotation={{ "gesture-a3": 90 }} selectedRegionId={selectedRegionId} onRegionSelect={(_, value) => setRegion(value)} /></div>)}</div>
    </DemoSection>
  </>
}
