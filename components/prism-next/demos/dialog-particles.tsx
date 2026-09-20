"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/coss/button"
import { Checkbox } from "@/components/coss/checkbox"
import { Label } from "@/components/coss/label"
import { Textarea } from "@/components/coss/textarea"
import { Form } from "@/components/coss/form"
import { Dialog, DialogTrigger, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogPanel, DialogFooter, DialogClose } from "@/components/coss/dialog"
import { AlertDialog, AlertDialogPopup, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogClose } from "@/components/coss/alert-dialog"
import { DemoSection, Feedback } from "@/components/prism-next/demo-parts"

const guidance = [
  ["题干与条件", "先确认题干完整、条件相互一致。定义域、参数范围、单位和图示标注均属于材料的一部分，不应只核对最后答案。"],
  ["公式与符号", "核对分式、根号、上下标以及向量记号。相近字形需要结合上下文判断，不能因视觉相似而合并为同一个符号。"],
  ["推导与等价关系", "逐步检查变形是否保持等价。分母非零、根式有意义、对数真数为正等条件，应在需要的位置明确说明。"],
  ["边界与特殊情形", "对取等、端点、零值和退化情形单独核对。通用表达式若不适用于特殊情况，应给出独立结论。"],
  ["数字与单位", "保留必要的有效数字，核对中间过程的近似是否影响最终结论。表格与公式中的单位需要一致。"],
  ["图形与文字", "图形用于帮助理解，不能替代题干中未给出的条件。比例示意图与精确作图应让阅读者能够区分。"],
  ["修订记录", "备注应说明需要修改的位置与原因，并尽量给出能够直接执行的建议。已经确认的结论不应被新建议覆盖。"],
  ["完成复核", "再次检查标题、适用范围和修订备注。保存失败时保留当前输入，确认成功后再结束本次编辑。"],
]

export function DialogParticles() {
  return <>
    <DemoSection title="长内容与固定操作区" description="正文在对话框内滚动，标题和底部操作保持可用。" sources={["p-dialog-5"]}>
      <Dialog><DialogTrigger render={<Button variant="outline" />}>查看完整复核说明</DialogTrigger><DialogPopup showCloseButton={false}><DialogHeader><DialogTitle>材料复核说明</DialogTitle><DialogDescription>从题干到修订记录，按内容逐项核对。</DialogDescription></DialogHeader><DialogPanel><div className="space-y-6">{guidance.map(([title, text], index) => <section key={title}><h3 className="mb-2 font-semibold">{index + 1}. {title}</h3><p className="text-read-body">{text}</p></section>)}</div></DialogPanel><DialogFooter><DialogClose render={<Button />}>完成阅读</DialogClose></DialogFooter></DialogPopup></Dialog>
    </DemoSection>
    <SaveDialogParticle />
  </>
}

function SaveDialogParticle() {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [saved, setSaved] = useState("请补充判别式等于零的例子。")
  const [draft, setDraft] = useState(saved)
  const [pending, setPending] = useState(false)
  const [failNext, setFailNext] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  function changeOpen(value: boolean) {
    if (pendingRef.current) return
    if (!value && draft !== saved) { setDiscarding(false); setConfirmOpen(true); return }
    if (value) { setDraft(saved); setError(""); setMessage(""); setDiscarding(false) }
    setOpen(value)
  }
  function submit() {
    if (pendingRef.current) return
    if (!draft.trim()) { setError("请输入修订备注。"); inputRef.current?.focus(); return }
    pendingRef.current = true; setPending(true); setError("")
    const shouldFail = failNext
    setFailNext(false)
    timer.current = setTimeout(() => {
      pendingRef.current = false; setPending(false); timer.current = null
      if (shouldFail) { setError("本次模拟保存失败，输入已保留。请重试。"); return }
      setSaved(draft.trim()); setDraft(draft.trim()); setOpen(false); setMessage("修订备注已保存。")
    }, 800)
  }
  return <DemoSection title="提交等待、失败保留与关闭确认" description="开启失败演示后首次保存会失败；重试使用原输入，未保存时关闭会先确认。" sources={["p-dialog-4"]}>
    <div className="mb-4"><Label><Checkbox checked={failNext} onCheckedChange={setFailNext} disabled={pending} />模拟下次保存失败</Label></div>
    <Dialog open={open} onOpenChange={changeOpen}><DialogTrigger ref={triggerRef} render={<Button variant="outline" />}>编辑修订备注</DialogTrigger><DialogPopup closeProps={{ "aria-label": "关闭修订备注", disabled: pending }} finalFocus={triggerRef}><DialogHeader><DialogTitle>编辑修订备注</DialogTitle><DialogDescription>保存结果确认前，当前输入会保留在此处。</DialogDescription></DialogHeader><Form className="contents" noValidate onSubmit={event => { event.preventDefault(); submit() }}><DialogPanel><Label htmlFor="particle-save-notes">修订备注</Label><Textarea id="particle-save-notes" ref={inputRef} value={draft} onChange={event => { setDraft(event.target.value); setError("") }} readOnly={pending} aria-invalid={!!error && !draft.trim()} aria-describedby="particle-save-feedback" maxLength={500} /><p className="mt-2 text-right text-ui-hint text-muted-foreground prism-numeric">{draft.length} / 500</p><div id="particle-save-feedback" className="mt-3 min-h-6 text-ui-body">{error ? <p role="alert" className="text-destructive-foreground">{error}</p> : <p role="status" className="text-muted-foreground">{pending ? "正在保存，请稍候……" : "本页为交互演示，不向服务器发送数据。"}</p>}</div></DialogPanel><DialogFooter><DialogClose render={<Button variant="ghost" disabled={pending} />}>取消</DialogClose><Button type="submit" loading={pending}>{error && draft.trim() ? "重试保存" : "保存备注"}</Button></DialogFooter></Form></DialogPopup>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}><AlertDialogPopup finalFocus={discarding ? triggerRef : inputRef}><AlertDialogHeader><AlertDialogTitle>放弃未保存的修改？</AlertDialogTitle><AlertDialogDescription>关闭后恢复上一次保存的备注。继续编辑可以保留当前输入。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogClose render={<Button variant="ghost" />}>继续编辑</AlertDialogClose><Button variant="outline" onClick={() => { setDiscarding(true); setConfirmOpen(false); setDraft(saved); setError(""); setOpen(false) }}>放弃修改</Button></AlertDialogFooter></AlertDialogPopup></AlertDialog>
    </Dialog><Feedback>{message || `已保存备注：${saved}`}</Feedback>
  </DemoSection>
}
