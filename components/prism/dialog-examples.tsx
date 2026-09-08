"use client"

import { useRef, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { TextField } from "@/components/ui/text-field"
import { evidenceLabel, SelectionField } from "@/components/prism/select-examples"

type Settings = { title: string; evidence: string }

export function DialogExamples() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Settings>({ title: "课堂证据复核", evidence: "classroom" })
  const [applied, setApplied] = useState<Settings | null>(null)
  const [errors, setErrors] = useState({ title: "", evidence: "" })
  const [feedback, setFeedback] = useState("")
  const titleRef = useRef<HTMLInputElement>(null)
  const evidenceRef = useRef<HTMLButtonElement>(null)
  const editRef = useRef<HTMLButtonElement>(null)
  const composing = useRef(false)
  const cleared = useRef(false)
  const hasDraft = Boolean(draft.title || draft.evidence)

  return <div className="preview-stack">
    <section className="dialog-example" aria-labelledby="review-settings-title">
      <div><h3 id="review-settings-title">复核设置</h3><p className="button-demo-note">九年级 1 班 · 数学。简短设置在弹窗内完成，确认后更新本页摘要。</p></div>
      <Dialog open={open} onOpenChange={next => { setOpen(next); if (!next) { composing.current = false; setFeedback("草稿已保留，可重新打开继续修改。") } }}>
        <DialogTrigger asChild><Button ref={editRef}>编辑复核设置</Button></DialogTrigger>
        <DialogContent className="prism-dialog-content" showCloseButton={false} onOpenAutoFocus={event => { event.preventDefault(); titleRef.current?.focus() }}>
          <DialogHeader><DialogTitle>编辑复核设置</DialogTitle><DialogDescription>九年级 1 班 · 数学。关闭会保留本页草稿，确认后才更新摘要。</DialogDescription></DialogHeader>
          <DialogClose asChild><Button variant="ghost" size="icon" className="prism-dialog-close" aria-label="关闭设置"><X aria-hidden="true" /></Button></DialogClose>
          <form noValidate className="dialog-settings-form" onSubmit={event => {
            event.preventDefault()
            if (composing.current) return
            const nextErrors = { title: draft.title.trim() ? "" : "请填写记录名称。", evidence: draft.evidence ? "" : "请选择证据类型。" }
            setErrors(nextErrors)
            if (nextErrors.title || nextErrors.evidence) { requestAnimationFrame(() => (nextErrors.title ? titleRef.current : evidenceRef.current)?.focus()); return }
            const confirmed = { ...draft, title: draft.title.trim() }
            composing.current = false; setDraft(confirmed); setApplied(confirmed); setOpen(false); setFeedback("设置已确认。")
          }}>
            <TextField label="记录名称" required ref={titleRef} value={draft.title} error={errors.title} description="使用能辨认本次复核的名称。" onChange={event => { setDraft(current => ({ ...current, title: event.target.value })); setErrors(current => ({ ...current, title: "" })) }} onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }} onKeyDown={event => { if (event.key === "Enter" && (composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) event.preventDefault() }} />
            <SelectionField label="证据类型" required value={draft.evidence} onValueChange={value => { setDraft(current => ({ ...current, evidence: value })); setErrors(current => ({ ...current, evidence: "" })) }} triggerRef={evidenceRef} error={errors.evidence} description="单选。历史归档尚未开放。" />
            <DialogFooter className="prism-dialog-footer"><DialogClose asChild><Button variant="outline">关闭并保留草稿</Button></DialogClose><Button type="submit">确认设置</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div className="selection-result"><span>上次确认的设置</span>{applied ? <><strong>{applied.title}</strong><p>{evidenceLabel(applied.evidence)}</p></> : <p>尚未确认设置。</p>}</div>
    </section>

    <section id="alert-dialog" className="control-boundary" aria-labelledby="clear-draft-title">
      <h3 id="clear-draft-title">Alert Dialog · 清空草稿</h3>
      <p className="button-demo-note">本页草稿：{draft.title || "未填写名称"} · {evidenceLabel(draft.evidence)}。关闭弹窗无需再次确认，清空内容才需要确认。</p>
      <AlertDialog onOpenChange={next => { if (next) cleared.current = false }}>
        <AlertDialogTrigger asChild><Button variant="outline" disabled={!hasDraft}>清空草稿</Button></AlertDialogTrigger>
        <AlertDialogContent className="prism-dialog-content prism-alert-content" onCloseAutoFocus={event => { if (cleared.current) { event.preventDefault(); editRef.current?.focus() } }}>
          <AlertDialogHeader><AlertDialogTitle>清空本页草稿？</AlertDialogTitle><AlertDialogDescription>将清空“{draft.title || "未命名复核"}”的名称与证据类型。上次确认的设置仍会保留。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="prism-dialog-footer"><AlertDialogCancel>保留草稿</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => { composing.current = false; cleared.current = true; setDraft({ title: "", evidence: "" }); setErrors({ title: "", evidence: "" }); setFeedback("草稿已清空，上次确认的设置保持不变。") }}>清空草稿</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
    <p className="control-feedback" role="status">{feedback}</p>
    <p className="button-demo-note">草稿与确认结果仅保留在当前页面，刷新后恢复示例初始内容。</p>
  </div>
}
