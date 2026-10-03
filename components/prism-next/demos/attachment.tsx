"use client"

import { useState } from "react"
import { DemoSection, Feedback } from "../demo-parts"
import { Attachment, PaperCard, PaperCardGrid, type AttachmentProps, type PaperCardProps } from "../attachment"

const request = { id: "upload-1", label: "本次资料上传" }
const base = { id: "material", name: "高二数学期中考试批阅资料与标准答案评分细则最终核对版本.pdf", type: "PDF", sizeBytes: 8808038, actions: { remove: {} } }
export const attachmentFixtures: readonly AttachmentProps["item"][] = [
  { ...base, id: "selected", status: { state: "selected" } },
  { ...base, id: "uploading", status: { state: "uploading", request, progress: 42 } },
  { ...base, id: "unknown-progress", status: { state: "uploading", request } },
  { ...base, id: "processing", status: { state: "uploaded" }, processing: { label: "正在处理 · 识别题目与评分依据", tone: "info" } },
  { ...base, id: "uploaded", status: { state: "uploaded" } },
  { ...base, id: "failed", status: { state: "failed", request, reason: "上传连接中断，请核对网络后重试。", retry: {} } },
  { ...base, id: "processing-completed", status: { state: "uploaded" }, processing: { label: "解析已完成", tone: "success" } },
  { ...base, id: "processing-failed", status: { state: "uploaded" }, processing: { label: "解析失败", tone: "error", description: "评分依据页面无法识别，请核对原文件后重试。", retry: { requestId: "parse-1" } } },
]
export const paperCardFixtures: readonly PaperCardProps[] = [
  { id: "student-1", studentName: "张雨桐", examNumber: "20260118", pageCount: 6, status: { label: "已接收", tone: "success" } },
  { id: "student-2", studentName: "李明泽", examNumber: "20260119", pageCount: 6, status: { label: "扫描中", tone: "info" } },
  { id: "student-3", studentName: "王子睿", examNumber: "20260120", pageCount: 6, status: { label: "批阅中", tone: "info" } },
  { id: "student-4", studentName: "欧阳慕容雨桐长中文姓名待核对", examNumber: "20260121", pageCount: 5, status: { label: "异常", tone: "error" }, reason: "第二页边缘裁切且第三页与第四页的作答区域存在重叠，请核对原件后重新扫描相关页，保留学生跨页作答的完整内容。" },
  { id: "student-5", studentName: "陈思远", status: { label: "未交", tone: "neutral" } },
  { id: "student-6", studentName: "刘若曦", examNumber: "20260123", pageCount: 6, paperSize: "A3", status: { label: "已完成", tone: "success" } },
  { id: "student-7", studentName: "周梓涵", examNumber: "20260124", pageCount: 6, status: { label: "已接收", tone: "success" } },
  { id: "student-8", studentName: "赵一诺", pageCount: 4, status: { label: "已完成", tone: "success" } },
]
// Explicit illustrative page, not an actual received student scan.
const exampleThumbnail = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297"><rect width="210" height="297" fill="white"/><g fill="black" font-family="serif" font-size="12"><text x="20" y="35">Mathematics</text><text x="20" y="75">1. y = x² − 4</text><text x="20" y="125">2. a² + b² = c²</text></g><g stroke="gray"><path d="M20 95H190M20 145H190M20 170H190M20 195H190M20 220H190M20 245H190"/></g></svg>')}`

export function AttachmentDemo() {
  const [feedback, setFeedback] = useState("尚未发出操作请求")
  const [selected, setSelected] = useState("student-1")
  const attachmentAction: AttachmentProps["onAction"] = intent => setFeedback(`已发出 ${intent.kind} 请求：${intent.fileId}；等待调用方处理`)
  const viewPaper = (id: string) => { setSelected(id); setFeedback(`已发出查看请求：${id}；当前预览选择已更新`) }
  return <>
    <DemoSection title="批阅资料 PDF · 生命周期 × 三尺寸" description="静态外部事实，点击只记录意图，不推进上传或处理状态。">
      <Feedback>{feedback}</Feedback>
      <div className="grid gap-6 lg:grid-cols-3">{(["sm", "md", "lg"] as const).map(size => <section key={size} className="min-w-0 space-y-3" aria-label={`${size} 附件`}><h3 className="text-block-title">{size}</h3>{attachmentFixtures.map(item => <Attachment key={item.id} size={size} item={item} view={{}} onAction={attachmentAction} />)}</section>)}</div>
    </DemoSection>
    <DemoSection title="Paper Card 试卷卡 · 8 名学生" description="当前预览由调用方控制；未接入扫描图像时只显示纸张占位。网格内容可独立滚动，边缘渐隐提示尚有内容。">
      <Feedback>{feedback}</Feedback>
      <PaperCardGrid maxHeight={520}>{paperCardFixtures.map(item => <PaperCard key={item.id} {...item} selected={selected === item.id} onView={viewPaper} />)}</PaperCardGrid>
    </DemoSection>
    <DemoSection title="紧凑试卷卡 · 缩略页与占位" description="80px 纸张缩略页与查看按钮发出同一请求；无图保留纸张图形，未交文案由调用方提供。">
      <PaperCardGrid compact maxHeight={480} className="max-w-3xl">
        <PaperCard {...paperCardFixtures[0]} compact thumbnailUrl={exampleThumbnail} onView={viewPaper} />
        <PaperCard {...paperCardFixtures[3]} compact onView={viewPaper} onResolve={id => setFeedback(`已发出异常处理请求：${id}`)} resolveLabel="核对扫描异常" />
        <PaperCard {...paperCardFixtures[4]} compact placeholder viewLabel="查看提交记录" onView={viewPaper} />
        <PaperCard {...paperCardFixtures[5]} compact orientation="landscape" thumbnailUrl={exampleThumbnail} onView={viewPaper} />
      </PaperCardGrid><Feedback>{feedback}</Feedback>
    </DemoSection>
    <DemoSection title="缩略图 URL · 图片与文档" description="左侧为图片文件缩略图；右侧文档使用类型占位。">
      <div className="grid gap-4 sm:grid-cols-2"><Attachment item={{ ...base, id: "image", name: "数学样张.png", type: "image/png", status: { state: "uploaded" } }} thumbnailUrl={exampleThumbnail} view={{}} onAction={attachmentAction} /><Attachment item={{ ...base, id: "document", name: "评分依据.docx", type: "Word", status: { state: "selected" } }} onAction={attachmentAction} /></div>
      <div className="mt-4 w-48 max-w-full"><PaperCard id="sample" studentName="姓名未提供" thumbnailUrl={exampleThumbnail} pageCount={1} paperSize="A3" orientation="landscape" status={{ label: "状态未提供" }} onView={viewPaper} /></div>
    </DemoSection>
    <DemoSection title="Loading / Empty / Error" description="加载状态替代卡片；重试只通知调用方。">
      <div className="grid gap-4 sm:grid-cols-3">{(["loading", "empty", "error"] as const).map(state => <PaperCardGrid key={state} state={state} emptyMessage="尚未接收学生试卷" errorMessage="学生试卷列表加载失败，请重试" onRetry={() => setFeedback("已发出网格重试请求；等待调用方处理")} />)}</div>
      <Feedback>{feedback}</Feedback>
    </DemoSection>
    <DemoSection title="三主题 · 320px · 长中文与公式" description="主题沿用智能曜彩；窄容器保留文件尾名、独立操作和状态文字，异常原因 title 保留全文。">
      <div className="flex flex-wrap items-start gap-4">{(["light", "paper", "dark"] as const).map(theme => <section key={theme} data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} className="w-80 max-w-full space-y-3 p-3" aria-label={`${theme} 320px`}>
        <h3 className="text-item-title">{theme} · 320px</h3>
        {[attachmentFixtures[3], attachmentFixtures[6], attachmentFixtures[7]].map(item => <Attachment key={item.id} item={item} view={{}} onAction={attachmentAction} />)}
        <p className="text-ui-hint">样张公式：<math><mi>y</mi><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn></math></p>
        <PaperCardGrid maxHeight={420}>{[paperCardFixtures[3], paperCardFixtures[4]].map(item => <PaperCard key={item.id} {...item} selected={selected === item.id} onView={viewPaper} />)}</PaperCardGrid>
        <PaperCardGrid compact maxHeight={420}>
          <PaperCard {...paperCardFixtures[3]} compact thumbnailUrl={exampleThumbnail} onView={viewPaper} onResolve={id => setFeedback(`已发出核对请求：${id}`)} />
          <PaperCard {...paperCardFixtures[4]} compact placeholder onView={viewPaper} />
        </PaperCardGrid>
        <Feedback>{feedback}</Feedback>
      </section>)}</div>
    </DemoSection>
  </>
}
