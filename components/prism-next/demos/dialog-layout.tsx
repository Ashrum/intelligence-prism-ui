"use client"

import { useId, useRef, useState } from "react"
import { ScanLine, Upload } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Textarea } from "@/components/coss/textarea"
import { Form } from "@/components/coss/form"
import { DialogClose } from "@/components/coss/dialog"
import { AlertDialog, AlertDialogPopup, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogClose } from "@/components/coss/alert-dialog"
import { DemoSection, Feedback } from "../demo-parts"
import { PaperThumbnail } from "../paper-preview"
import { DialogLayout, DialogEvidence, DialogSection, DialogOptionTile, DialogQuietActions, DialogQuietAction, DialogOptionGrid, DialogOptionGridItem, DialogChoiceList, DialogChoice, DialogRecord, DialogNotice, type DialogLayoutProps } from "../dialog-layout"

const people = [
  { value: "a", title: "成员甲", description: "编号 001 · 1 页", group: "received", status: { label: "待补充", tone: "warning" as const } },
  { value: "b", title: "成员乙", description: "编号 002 · 2 页", group: "received" },
  { value: "c", title: "成员丙", description: "编号 003 · 2 页", group: "received" },
  { value: "d", title: "成员丁", description: "编号 004 · 等待接收", group: "waiting" },
  { value: "e", title: "成员戊与需要完整显示的较长中文姓名", description: "编号 005 · 等待接收", group: "waiting" },
  { value: "f", title: "成员己", description: "编号 006", group: "waiting", disabledReason: "当前不可选择" },
]
const examples = [
  { id: "dispose", title: "处理异常", description: "媒体栏、主次选项与安静操作；操作只反馈请求。" },
  { id: "assign", title: "从多人中选择", description: "宿主搜索与分组单选共用一个受控值。" },
  { id: "record", title: "查看记录", description: "记录事实与两个同等权重的操作。" },
  { id: "reason", title: "选择理由", description: "提示、单选理由与宿主提供的其他理由输入。" },
  { id: "small", title: "无媒体栏 · sm", description: "小尺寸外壳、单操作全宽，可关闭品牌细线。" },
  { id: "long", title: "长内容滚动", description: "仅正文滚动，头部和操作区保持可用。" },
] as const

export function DialogLayoutDemo() {
  const [active, setActive] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>("a")
  const [query, setQuery] = useState("")
  const [reason, setReason] = useState<string | null>("readable")
  const [other, setOther] = useState("")
  const [feedback, setFeedback] = useState("")
  const [removeOpen, setRemoveOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const removeTriggerRef = useRef<HTMLButtonElement>(null)
  const readingRef = useRef<HTMLParagraphElement>(null)
  const close = () => { setRemoveOpen(false); setActive(null) }
  const openChange = (open: boolean) => { if (!open) close() }
  const request = (label: string) => setFeedback(`已触发“${label}”请求。`)
  const selectedPerson = people.find(person => person.value === selected)
  const media = <DialogEvidence title="材料甲" status={{ label: "待核对", tone: "warning" }} facts={["编号 001 · 2 页", "原始图像未接入"]}
    thumbnail={<PaperThumbnail page={{ id: "sample-paper", paperSize: "A4" }} label="材料甲" />} onView={() => request("查看大图")} />
  const message = feedback && <p role="status" className="text-ui-hint text-muted-foreground">{feedback}</p>
  const compactMedia = <div className="dialog-layout-media-fallback space-y-2"><p className="text-ui-hint text-muted-foreground">材料甲 · 编号 001 · 2 页 · 待核对</p><Button variant="ghost" onClick={() => request("查看大图")}>查看材料大图</Button></div>
  return <>
    <p className="mb-6 text-ui-hint text-muted-foreground">本页为中性示例数据；不连接扫描、上传或保存服务。</p>
    {examples.map(example => <DemoSection key={example.id} id={example.id} title={example.title} description={example.description} sources={example.id === "dispose" ? ["p-dialog-3", "p-alert-dialog-1"] : example.id === "long" ? ["p-dialog-5"] : undefined}>
      <Button variant="outline" aria-haspopup="dialog" onClick={event => { triggerRef.current = event.currentTarget; setFeedback(""); setActive(example.id) }}>打开{example.title}</Button>
    </DemoSection>)}
    <DialogFormDemo />
    <DemoSection id="references" title="参考与取舍" description="沿用 COSS 控件和曜彩版式，补齐交互能力。">
      <ul className="space-y-3 text-ui-body">
        <li><a href="https://coss.com/ui/particles?tags=dialog" target="_blank" rel="noreferrer" className="underline underline-offset-4">COSS Dialog particles ↗</a><p className="text-ui-hint text-muted-foreground">表单、嵌套确认与长内容的组合依据。</p></li>
        <li><a href="https://base-ui.com/react/components/dialog" target="_blank" rel="noreferrer" className="underline underline-offset-4">Base UI Dialog ↗</a><p className="text-ui-hint text-muted-foreground">初始焦点、关闭回焦与外部点击控制。</p></li>
        <li><a href="https://www.radix-ui.com/primitives/docs/components/dialog#close-after-asynchronous-form-submission" target="_blank" rel="noreferrer" className="underline underline-offset-4">Radix Dialog ↗</a><p className="text-ui-hint text-muted-foreground">提交结果确认后再关闭，失败保留输入。</p></li>
        <li><a href="https://react-aria.adobe.com/Modal" target="_blank" rel="noreferrer" className="underline underline-offset-4">React Aria Modal ↗</a><p className="text-ui-hint text-muted-foreground">分别处理外部点击与 Esc，避免误丢草稿。</p></li>
        <li><a href="https://www.carbondesignsystem.com/building-blocks/core/components/modal/guidelines#overflow-content" target="_blank" rel="noreferrer" className="underline underline-offset-4">Carbon Modal ↗</a><p className="text-ui-hint text-muted-foreground">正文滚动，标题与操作区保持可用。</p></li>
      </ul>
    </DemoSection>
    <DialogLayout open={active === "dispose"} onOpenChange={openChange} finalFocus={triggerRef} size="lg" title="材料甲的版式需要核对" closeLabel="关闭异常处理" eyebrow="处理异常" media={media}
      description="这份材料的版式与当前模板不一致，请选择处理方式。"
      footerStart={<Button variant="ghost" onClick={() => request("查看记录")}>查看记录（1）</Button>}
      footerEnd={<DialogClose render={<Button variant="outline" />}>关闭</DialogClose>}>
      {compactMedia}<DialogSection title="重新接收"><div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <DialogOptionTile emphasis="primary" icon={<ScanLine />} title="数据站接收" description="通过数据站重新接收材料" onClick={() => request("数据站接收")} />
        <DialogOptionTile icon={<Upload />} title="上传文件" description="选择本机的图片或 PDF" onClick={() => request("上传文件")} />
      </div></DialogSection>
      <DialogSection title="其他处理"><DialogQuietActions>
        <DialogQuietAction title="按现状使用" description="补充理由后交由宿主处理" onClick={() => request("按现状使用")} />
        <DialogQuietAction title="移出当前范围" description="这份材料将不参与当前任务" onClick={event => { removeTriggerRef.current = event.currentTarget; setRemoveOpen(true) }} />
      </DialogQuietActions></DialogSection>{message}
      <RemovalConfirmation open={removeOpen} onOpenChange={setRemoveOpen} finalFocus={removeTriggerRef} onConfirm={() => { setRemoveOpen(false); request("移出当前范围") }} />
    </DialogLayout>
    <DialogLayout open={active === "assign"} onOpenChange={openChange} finalFocus={triggerRef} size="xl" title="这份材料属于谁？" closeLabel="关闭成员选择" eyebrow="选择成员" media={media} initialFocus={searchRef}
      footerStart={<Button variant="ghost" onClick={event => { removeTriggerRef.current = event.currentTarget; setRemoveOpen(true) }}>移出这份材料</Button>}
      footerEnd={<><DialogClose render={<Button variant="outline" />}>取消</DialogClose><Button disabled={!selectedPerson || !!selectedPerson.disabledReason} onClick={() => request(`关联到${selectedPerson?.title}`)}>确认关联</Button></>}>
      {compactMedia}<div className="space-y-2"><Label htmlFor="dialog-member-search">搜索成员</Label><Input ref={searchRef} id="dialog-member-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="输入姓名或编号" /></div>
      <DialogOptionGrid label="材料所属成员" value={selected} onValueChange={setSelected} emptyText="没有符合条件的成员" groups={[
        { id: "received", title: "已有材料", description: "关联到已接收的材料", children: people.filter(person => person.group === "received" && `${person.title}${person.description}`.includes(query.trim())).map(person => <DialogOptionGridItem key={person.value} {...person} />) },
        { id: "waiting", title: "等待材料", description: "作为一份新材料", children: people.filter(person => person.group === "waiting" && `${person.title}${person.description}`.includes(query.trim())).map(person => <DialogOptionGridItem key={person.value} {...person} />) },
      ]} />
      <DialogNotice>结果预告：{selectedPerson ? `将关联到${selectedPerson.title}` : "尚未选择成员"}。</DialogNotice>{message}
      <RemovalConfirmation open={removeOpen} onOpenChange={setRemoveOpen} finalFocus={removeTriggerRef} onConfirm={() => { setRemoveOpen(false); request("移出材料") }} />
    </DialogLayout>
    <DialogLayout open={active === "record"} onOpenChange={openChange} finalFocus={triggerRef} title="材料甲的处理记录" closeLabel="关闭记录" eyebrow="查看记录" media={media} footerLayout="equal"
      footerStart={<Button variant="outline" onClick={() => request("撤销处理")}>撤销处理</Button>} footerEnd={<DialogClose render={<Button variant="outline" />}>关闭</DialogClose>}>
      {compactMedia}<DialogRecord rows={[{ label: "原始情况", value: "版式需要核对" }, { label: "处理方式", value: "按现状使用" }, { label: "处理理由", value: "内容完整，可以辨认" }, { label: "处理人", value: "成员甲" }, { label: "时间", value: "10 月 4 日 13:00" }]} />{message}
    </DialogLayout>
    <DialogLayout open={active === "reason"} onOpenChange={openChange} finalFocus={triggerRef} title="为什么按现状使用？" closeLabel="关闭理由选择" eyebrow="选择理由" media={media}
      footerEnd={<><DialogClose render={<Button variant="outline" />}>返回</DialogClose><Button disabled={!reason || (reason === "other" && !other.trim())} onClick={() => request("提交理由")}>确认理由</Button></>}>
      {compactMedia}<DialogNotice tone="warning">版式不一致的材料可能影响后续处理，请先核对内容。</DialogNotice>
      <DialogChoiceList label="使用理由" value={reason} onValueChange={setReason} other={reason === "other" ? <div className="space-y-2"><Label htmlFor="dialog-other-reason">其他理由</Label><Textarea id="dialog-other-reason" value={other} onChange={event => setOther(event.target.value)} /></div> : undefined}>
        <DialogChoice value="readable" title="内容完整，可以辨认" /><DialogChoice value="checked" title="已人工核对无误" /><DialogChoice value="version" title="材料采用了另一种版式，但需要的信息仍然完整" /><DialogChoice value="other" title="其他" />
      </DialogChoiceList>{message}
    </DialogLayout>
    <DialogLayout open={active === "small"} onOpenChange={openChange} finalFocus={triggerRef} size="sm" accent={false} footerLayout="equal" title="材料说明" closeLabel="关闭材料说明" description="短任务可以只使用标题、正文和底栏。" footer={<DialogClose render={<Button variant="outline" />}>关闭</DialogClose>}>
      <DialogNotice tone="info">请先核对材料名称与编号。</DialogNotice>
      <DialogOptionTile title="继续核对" description="等待宿主提供可用材料" disabled disabledReason="材料尚未接入" />
    </DialogLayout>
    <DialogLayout open={active === "long"} onOpenChange={openChange} finalFocus={triggerRef} initialFocus={readingRef} bodyLabel="完整核对说明" size="lg" title="长中文与公式材料的完整核对说明" closeLabel="关闭完整说明" eyebrow="阅读说明" footerEnd={<DialogClose render={<Button variant="outline" />}>完成阅读</DialogClose>}>
      <p ref={readingRef} tabIndex={-1} className="text-ui-hint text-muted-foreground">共 12 项核对说明。可聚焦正文后使用方向键或 Page Down 阅读。</p>
      {Array.from({ length: 12 }, (_, index) => <DialogSection key={index} title={`核对项 ${index + 1}`}><p className="text-read-body">逐项核对较长的中文说明、材料名称以及上下文信息，保留完整内容和处理依据。正文可以滚动，标题和底部操作保持可用。</p><p className="text-read-body">公式：<math aria-label="x 的平方加 y 的平方等于一"><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>y</mi><mn>2</mn></msup><mo>=</mo><mn>1</mn></math>。</p></DialogSection>)}
    </DialogLayout>
  </>
}

function RemovalConfirmation({ open, onOpenChange, finalFocus, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; finalFocus: DialogLayoutProps["finalFocus"]; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogPopup bottomStickOnMobile={false} className="overflow-hidden" initialFocus={cancelRef} finalFocus={finalFocus}>
      <AlertDialogHeader><AlertDialogTitle>移出材料甲？</AlertDialogTitle><AlertDialogDescription>确认将触发材料甲的移出请求，由宿主决定处理结果。</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogClose render={<Button ref={cancelRef} variant="ghost" />}>保留材料</AlertDialogClose><Button variant="destructive" onClick={onConfirm}>确认移出</Button></AlertDialogFooter>
    </AlertDialogPopup>
  </AlertDialog>
}

function DialogFormDemo() {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [saved, setSaved] = useState({ title: "材料甲", notes: "请核对编号与页码。" })
  const [draft, setDraft] = useState(saved)
  const [status, setStatus] = useState<"idle" | "waiting" | "error">("idle")
  const [error, setError] = useState("")
  const [invalidTitle, setInvalidTitle] = useState(false)
  const [message, setMessage] = useState("")
  const waiting = status === "waiting"
  const dirty = draft.title !== saved.title || draft.notes !== saved.notes
  const changeOpen: DialogLayoutProps["onOpenChange"] = (next, details) => {
    if (!next && (waiting || dirty)) {
      details.cancel()
      if (!waiting) { setDiscarding(false); setConfirmOpen(true) }
      return
    }
    setOpen(next)
  }
  function submit() {
    if (waiting) return
    if (!draft.title.trim()) {
      setInvalidTitle(true); setStatus("error"); setError("请输入材料标题。"); inputRef.current?.focus()
      return
    }
    setInvalidTitle(false); setError(""); setStatus("waiting"); inputRef.current?.focus()
  }
  return <DemoSection id="form" title="表单、等待与关闭确认" description="提交后手动返回演示结果，体验失败保留、重试与未保存确认。" sources={["p-dialog-1", "p-dialog-4"]}>
    <Button ref={triggerRef} variant="outline" aria-haspopup="dialog" onClick={() => { setDraft(saved); setStatus("idle"); setError(""); setInvalidTitle(false); setConfirmOpen(false); setDiscarding(false); setMessage(""); setOpen(true) }}>打开编辑材料说明</Button>
    <Feedback>{message || `本页记录：${saved.title} · ${saved.notes || "未填写备注"}`}</Feedback>
    <DialogLayout open={open} onOpenChange={changeOpen} initialFocus={inputRef} finalFocus={triggerRef} disablePointerDismissal={waiting} closeDisabled={waiting} title="编辑材料说明" closeLabel="关闭材料编辑" eyebrow="表单编辑" description="修改材料标题与备注。提交前关闭会先确认未提交的修改。"
      footerEnd={<><DialogClose render={<Button variant="outline" disabled={waiting} />}>取消</DialogClose><Button type="submit" form={`${id}-form`} loading={waiting}>{status === "error" && !invalidTitle ? "重试提交" : "提交修改"}</Button></>}>
      <Form id={`${id}-form`} noValidate className="space-y-4" onSubmit={event => { event.preventDefault(); submit() }} aria-busy={waiting}>
        <div className="space-y-2"><Label htmlFor={`${id}-title`}>材料标题（必填）</Label><Input ref={inputRef} id={`${id}-title`} name="title" value={draft.title} readOnly={waiting} required maxLength={120} aria-invalid={invalidTitle} aria-describedby={`${id}-feedback`} onChange={event => { setDraft({ ...draft, title: event.target.value }); setInvalidTitle(false); setError(""); setStatus("idle") }} /></div>
        <div className="space-y-2"><Label htmlFor={`${id}-notes`}>核对备注</Label><Textarea id={`${id}-notes`} name="notes" value={draft.notes} readOnly={waiting} maxLength={500} onChange={event => { setDraft({ ...draft, notes: event.target.value }); if (!invalidTitle) { setError(""); setStatus("idle") } }} /><p className="text-right text-ui-hint text-muted-foreground prism-numeric">{draft.notes.length} / 500</p></div>
      </Form>
      <div id={`${id}-feedback`}>{error ? <p role="alert" className="text-ui-hint text-destructive-foreground">{error}</p> : <p role="status" className="text-ui-hint text-muted-foreground">{waiting ? "等待本页演示响应，当前输入已保留。" : "只更新本页示例记录。等待与结果由下方演示控件提供。"}</p>}</div>
      {waiting && <fieldset className="space-y-3 rounded-xl border p-3"><legend className="px-1 text-ui-hint">演示响应</legend><p className="text-ui-hint text-muted-foreground">选择本次提交的返回结果。</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setStatus("error"); setError("本次演示返回失败。当前输入已保留，可以重试。"); inputRef.current?.focus() }}>返回失败</Button><Button variant="outline" onClick={() => { const next = { title: draft.title.trim(), notes: draft.notes.trim() }; setSaved(next); setDraft(next); setStatus("idle"); setOpen(false); setMessage(`本页记录已更新：${next.title}。`) }}>返回成功</Button></div></fieldset>}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogPopup bottomStickOnMobile={false} className="overflow-hidden" initialFocus={cancelRef} finalFocus={discarding ? triggerRef : inputRef}>
          <AlertDialogHeader><AlertDialogTitle>放弃未提交的修改？</AlertDialogTitle><AlertDialogDescription>放弃后恢复本页上一次确认的记录。继续编辑会保留当前标题与备注。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogClose render={<Button ref={cancelRef} variant="ghost" />}>继续编辑</AlertDialogClose><Button variant="destructive-outline" onClick={() => { setDiscarding(true); setConfirmOpen(false); setDraft(saved); setError(""); setInvalidTitle(false); setStatus("idle"); setOpen(false); setMessage("已放弃本次修改，本页记录保持上一次确认的内容。") }}>放弃修改</Button></AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </DialogLayout>
  </DemoSection>
}
