"use client"

import { useId, useRef, useState, type ReactNode } from "react"
import { Check, Info, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/coss/alert"
import { Card, CardDescription, CardFrame, CardFrameHeader, CardFrameTitle, CardHeader, CardPanel, CardTitle } from "@/components/coss/card"
import { Checkbox } from "@/components/coss/checkbox"
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle, DialogTrigger } from "@/components/coss/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/coss/field"
import { Form } from "@/components/coss/form"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Radio, RadioGroup } from "@/components/coss/radio-group"
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/coss/select"
import { Switch } from "@/components/coss/switch"
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/coss/tabs"
import { Textarea } from "@/components/coss/textarea"
import { Badge } from "./badge"
import { Button } from "./button"
import { BlueprintSectionHeader, BpMinor } from "./blueprint/blueprint"
import { useHorizontalChoiceScroll } from "./use-horizontal-choice-scroll"

const kinds = [
  { value: "example", label: "例题讲解" },
  { value: "concept", label: "知识梳理与完整推导说明" },
  { value: "practice", label: "练习解析" },
  { value: "archived", label: "已归档材料（不可选）", disabled: true },
]
const kindLabel = (value: string | null) => kinds.find(item => item.value === value)?.label ?? "尚未选择"
const sampleIndex = [
  ["button", "Button"], ["input", "Input"], ["textarea", "Textarea"], ["select", "Select"],
  ["dialog", "Dialog"], ["checkbox", "Checkbox"], ["radio", "RadioGroup"], ["switch", "Switch"],
  ["tabs", "Tabs"], ["card", "Card"], ["badge", "Badge"], ["alert", "Alert"],
]

function Sample({ id, number, name, title, children }: { id: string; number: string; name: string; title: string; children: ReactNode }) {
  return <section id={id} data-blueprint-component={name} aria-labelledby={`${id}-heading`} className="min-w-0 space-y-4">
    <h4 id={`${id}-heading`} className="bp-sample-title text-block-title"><span className="bp-index">{number} · {name}</span><span>{title}</span></h4>
    {children}
  </section>
}

/** Uses the existing Prism / coss controls. State belongs only to this preview. */
export function BlueprintFoundationDemo() {
  const id = useId()
  const [action, setAction] = useState("按钮只更新此处的演示说明，不启动业务任务。")
  const [name, setName] = useState("二次方程的实数根")
  const [invalidName, setInvalidName] = useState("")
  const [notes, setNotes] = useState("先核对题干条件与单位，再逐步检查公式推导。长中文说明应完整换行，不因窄容器而省略。")
  const [invalidNotes, setInvalidNotes] = useState("")
  const [kind, setKind] = useState<string | null>("example")
  const [requiredKind, setRequiredKind] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [scope, setScope] = useState("self")
  const [showHint, setShowHint] = useState(true)
  const [tab, setTab] = useState("content")
  const tabScroll = useHorizontalChoiceScroll(tab)
  const [underlineTab, setUnderlineTab] = useState("summary")
  const underlineScroll = useHorizontalChoiceScroll(underlineTab)
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState({ name: "二次方程的实数根", kind: "example" })
  const [draftName, setDraftName] = useState(saved.name)
  const [draftKind, setDraftKind] = useState<string | null>(saved.kind)
  const [dialogError, setDialogError] = useState(false)
  const [dialogMessage, setDialogMessage] = useState("当前为固定样例；打开对话框可编辑本页预览。")
  const dialogInput = useRef<HTMLInputElement>(null)
  const dialogTrigger = useRef<HTMLButtonElement>(null)
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const invalidNameEmpty = !invalidName.trim()
  const invalidNotesEmpty = !invalidNotes.trim()
  const selectItems = () => kinds.map(item => <SelectItem key={item.value} value={item.value} disabled={item.disabled}>{item.label}</SelectItem>)
  function changeOpen(next: boolean) {
    if (next) { setDraftName(saved.name); setDraftKind(saved.kind); setDialogError(false) }
    setOpen(next)
  }
  function savePreview() {
    if (!draftName.trim() || !draftKind) { setDialogError(true); dialogInput.current?.focus(); return }
    const next = { name: draftName.trim(), kind: draftKind }
    setSaved(next)
    setDialogMessage(`已更新本页演示：${next.name} · ${kindLabel(next.kind)}。刷新页面后恢复固定样例。`)
    setOpen(false)
  }

  return <section ref={setPortalRoot} id="common-components" data-blueprint-foundations="" aria-labelledby={`${id}-heading`} className="space-y-8 border bg-card p-4 sm:p-6">
    <BlueprintSectionHeader headingId={`${id}-heading`} code="01" folio={{ kind: "section", value: "01 / 02" }} title="常用基础组件 · 蓝图适配" description="首批 12 项，直接使用现有 Prism / coss 组件。状态和材料均为固定演示事实，输入、选择与保存只作用于本页预览。" />
    <nav aria-label="基础组件样例索引" className="flex flex-wrap gap-x-5 gap-y-2 text-ui-hint">
      {sampleIndex.map(([anchor, name], index) => <a key={anchor} href={`#${id}-${anchor}`}>{String(index + 1).padStart(2, "0")} {name}</a>)}
    </nav>

    <section aria-labelledby={`${id}-first-group`} data-blueprint-foundation-group="first-five" className="space-y-7">
      <BpMinor id={`${id}-first-group`} code="01–05" label="操作与输入" />
      <Sample id={`${id}-button`} number="01" name="Button" title="按钮">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setAction("已查看主要按钮的点击反馈。")}>主要按钮示例</Button>
          <Button variant="outline" onClick={() => setAction("已查看次要按钮的点击反馈。")}>次要按钮示例</Button>
          <Button variant="ghost" onClick={() => setAction("已查看低优先级按钮的点击反馈。")}>低优先级按钮示例</Button>
          <Button variant="outline" size="icon" aria-label="查看图标按钮说明" onClick={() => setAction("已查看图标按钮的点击反馈。图标按钮保留可访问名称。")}><Info aria-hidden="true" /></Button>
          <Button variant="destructive-outline" onClick={() => setAction("已查看危险操作样式，没有执行删除。")}>危险操作示例</Button>
          <Button variant="outline" disabled aria-describedby={`${id}-button-unavailable`}>禁用按钮</Button>
          <Button loading aria-busy="true" aria-label="处理中，固定状态演示">处理中</Button>
        </div>
        <p id={`${id}-button-unavailable`} className="text-ui-hint text-muted-foreground">禁用样例：所需材料未提供。加载样例为固定属性，不会自动完成。</p>
        <p role="status" className="text-ui-hint text-muted-foreground">{action}</p>
      </Sample>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-8">
        <Sample id={`${id}-input`} number="02" name="Input" title="单行输入">
          <Field><FieldLabel id={`${id}-name-label`}>材料名称 · 有效值</FieldLabel><Input id={`${id}-name`} aria-labelledby={`${id}-name-label`} aria-describedby={`${id}-name-help`} value={name} onChange={event => setName(event.target.value)} /><FieldDescription id={`${id}-name-help`}>支持编辑与键盘选择，当前输入仅留在本页。</FieldDescription></Field>
          <Field invalid={invalidNameEmpty}><FieldLabel id={`${id}-invalid-name-label`}>材料名称 · 必填校验</FieldLabel><Input id={`${id}-invalid-name`} aria-labelledby={`${id}-invalid-name-label`} aria-describedby={`${id}-invalid-name-help${invalidNameEmpty ? ` ${id}-invalid-name-error` : ""}`} value={invalidName} onChange={event => setInvalidName(event.target.value)} aria-invalid={invalidNameEmpty} /><FieldError id={`${id}-invalid-name-error`} match={invalidNameEmpty}>请输入材料名称。</FieldError><FieldDescription id={`${id}-invalid-name-help`}>填写任意非空名称后，本项错误消失。</FieldDescription></Field>
          <Field><FieldLabel id={`${id}-readonly-name-label`}>材料编号 · 只读</FieldLabel><Input id={`${id}-readonly-name`} aria-labelledby={`${id}-readonly-name-label`} aria-describedby={`${id}-readonly-name-help`} readOnly value="BP-2026-014" /><FieldDescription id={`${id}-readonly-name-help`}>可以聚焦、选择和复制，不能修改。</FieldDescription></Field>
          <Field disabled><FieldLabel id={`${id}-disabled-name-label`}>归档名称 · 禁用</FieldLabel><Input id={`${id}-disabled-name`} aria-labelledby={`${id}-disabled-name-label`} aria-describedby={`${id}-disabled-name-help`} disabled value="归档材料示例" /><FieldDescription id={`${id}-disabled-name-help`}>固定禁用状态，不接收编辑。</FieldDescription></Field>
        </Sample>

        <Sample id={`${id}-textarea`} number="03" name="Textarea" title="多行输入">
          <Field><FieldLabel htmlFor={`${id}-notes`}>复核说明 · 有效值</FieldLabel><Textarea id={`${id}-notes`} value={notes} onChange={event => setNotes(event.target.value)} /><FieldDescription>保留完整中文内容，允许多行输入。</FieldDescription></Field>
          <Field invalid={invalidNotesEmpty}><FieldLabel htmlFor={`${id}-invalid-notes`}>修改理由 · 必填校验</FieldLabel><Textarea id={`${id}-invalid-notes`} value={invalidNotes} onChange={event => setInvalidNotes(event.target.value)} aria-invalid={invalidNotesEmpty} /><FieldError match={invalidNotesEmpty}>请补充修改理由。</FieldError><FieldDescription>输入非空理由后，本项错误消失。</FieldDescription></Field>
          <Field><FieldLabel htmlFor={`${id}-readonly-notes`}>原始说明 · 只读</FieldLabel><Textarea id={`${id}-readonly-notes`} readOnly value="固定说明：核对判别式与取值范围。" /><FieldDescription>内容可选择复制，原始说明保持只读。</FieldDescription></Field>
          <Field disabled><FieldLabel htmlFor={`${id}-disabled-notes`}>归档说明 · 禁用</FieldLabel><Textarea id={`${id}-disabled-notes`} disabled value="此处为不可编辑的归档说明样例。" /><FieldDescription>固定禁用状态，不接收编辑。</FieldDescription></Field>
        </Sample>

        <Sample id={`${id}-select`} number="04" name="Select" title="下拉选择">
          <Field><FieldLabel htmlFor={`${id}-kind`}>材料类型</FieldLabel><Select items={kinds} value={kind} onValueChange={setKind}><SelectTrigger id={`${id}-kind`}><SelectValue placeholder="选择材料类型" /></SelectTrigger><SelectPopup portalProps={{ container: portalRoot }}>{selectItems()}</SelectPopup></Select><FieldDescription>当前选择：{kindLabel(kind)}。方向键选择，Esc 关闭。</FieldDescription></Field>
          <Field invalid={!requiredKind}><FieldLabel htmlFor={`${id}-required-kind`}>用途 · 必填校验</FieldLabel><Select items={kinds} value={requiredKind} onValueChange={setRequiredKind}><SelectTrigger id={`${id}-required-kind`} aria-invalid={!requiredKind}><SelectValue placeholder="请选择用途" /></SelectTrigger><SelectPopup portalProps={{ container: portalRoot }}>{selectItems()}</SelectPopup></Select><FieldError match={!requiredKind}>请选择一种用途。</FieldError></Field>
          <Field disabled><FieldLabel htmlFor={`${id}-disabled-kind`}>归档类型 · 禁用</FieldLabel><Select items={kinds} value="example" disabled><SelectTrigger id={`${id}-disabled-kind`}><SelectValue /></SelectTrigger><SelectPopup portalProps={{ container: portalRoot }}>{selectItems()}</SelectPopup></Select><FieldDescription>归档状态只展示固定选择。</FieldDescription></Field>
        </Sample>

        <Sample id={`${id}-dialog`} number="05" name="Dialog" title="对话框">
          <p className="text-ui-body">编辑材料名称与类型，验证弹层中的输入、下拉选择和焦点返回。</p>
          <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger ref={dialogTrigger} render={<Button variant="outline" />}>打开演示对话框</DialogTrigger>
            <DialogPopup portalProps={{ container: portalRoot }} initialFocus={dialogInput} finalFocus={dialogTrigger} closeProps={{ "aria-label": "关闭演示对话框" }}>
              <DialogHeader><DialogTitle>编辑本页演示材料</DialogTitle><DialogDescription>保存仅更新下方的卡片样例，不发送网络请求；取消或关闭会放弃本次输入。</DialogDescription></DialogHeader>
              <Form className="contents" noValidate onSubmit={event => { event.preventDefault(); savePreview() }}>
                <DialogPanel className="space-y-5">
                  <Field invalid={dialogError && !draftName.trim()}><FieldLabel id={`${id}-dialog-name-label`}>演示材料名称</FieldLabel><Input id={`${id}-dialog-name`} aria-labelledby={`${id}-dialog-name-label`} aria-describedby={dialogError && !draftName.trim() ? `${id}-dialog-name-error` : undefined} ref={dialogInput} value={draftName} onChange={event => setDraftName(event.target.value)} aria-invalid={dialogError && !draftName.trim()} /><FieldError id={`${id}-dialog-name-error`} match={dialogError && !draftName.trim()}>请输入演示材料名称。</FieldError></Field>
                  <Field invalid={dialogError && !draftKind}><FieldLabel htmlFor={`${id}-dialog-kind`}>演示材料类型</FieldLabel><Select items={kinds} value={draftKind} onValueChange={setDraftKind}><SelectTrigger id={`${id}-dialog-kind`} aria-invalid={dialogError && !draftKind}><SelectValue /></SelectTrigger><SelectPopup portalProps={{ container: portalRoot }}>{selectItems()}</SelectPopup></Select><FieldError match={dialogError && !draftKind}>请选择演示材料类型。</FieldError></Field>
                </DialogPanel>
                <DialogFooter><DialogClose render={<Button variant="ghost" />}>取消</DialogClose><Button type="submit">保存本页演示</Button></DialogFooter>
              </Form>
            </DialogPopup>
          </Dialog>
          <p role="status" className="text-ui-hint text-muted-foreground">{dialogMessage}</p>
        </Sample>
      </div>
    </section>

    <section aria-labelledby={`${id}-remaining-group`} data-blueprint-foundation-group="remaining-seven" className="space-y-7">
      <BpMinor id={`${id}-remaining-group`} code="06–12" label="选择、导航与内容反馈" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-8">
        <Sample id={`${id}-checkbox`} number="06" name="Checkbox" title="复选框">
          <Label className="flex"><Checkbox aria-labelledby={`${id}-checkbox-label`} checked={checked} onCheckedChange={setChecked} /><span id={`${id}-checkbox-label`} className="min-w-0">将完整公式推导加入本页预览</span></Label>
          <Label className="flex"><Checkbox aria-labelledby={`${id}-checkbox-disabled-label`} checked disabled /><span id={`${id}-checkbox-disabled-label`} className="min-w-0">已选中 · 禁用样例</span></Label>
          <Label className="flex"><Checkbox aria-labelledby={`${id}-checkbox-mixed-label`} indeterminate disabled /><span id={`${id}-checkbox-mixed-label`} className="min-w-0">部分选中 · 禁用样例</span></Label>
          <div className="space-y-2">
            <Label className="flex"><Checkbox checked readOnly aria-invalid="true" aria-labelledby={`${id}-checkbox-invalid-label`} aria-describedby={`${id}-checkbox-invalid-error`} /><span id={`${id}-checkbox-invalid-label`} className="min-w-0">已选中 · 错误样例</span></Label>
            <p id={`${id}-checkbox-invalid-error`} className="text-ui-hint text-destructive-foreground">固定校验错误：该选项与材料条件冲突。此处为只读状态演示。</p>
          </div>
          <p role="status" className="text-ui-hint text-muted-foreground">预览选项：{checked ? "已选中" : "未选中"}。</p>
        </Sample>

        <Sample id={`${id}-radio`} number="07" name="RadioGroup" title="单选组">
          <RadioGroup value={scope} onValueChange={value => setScope(String(value))} aria-label="示例材料可见范围">
            <Label className="flex"><Radio aria-labelledby={`${id}-scope-self-label`} value="self" /><span id={`${id}-scope-self-label`} className="min-w-0">个人预览</span></Label>
            <Label className="flex"><Radio aria-labelledby={`${id}-scope-team-label`} value="team" /><span id={`${id}-scope-team-label`} className="min-w-0">教研团队共同核对长中文题干与公式</span></Label>
            <Label className="flex"><Radio aria-labelledby={`${id}-scope-school-label`} value="school" disabled /><span id={`${id}-scope-school-label`} className="min-w-0">全校范围 · 禁用样例</span></Label>
          </RadioGroup>
          <p role="status" className="text-ui-hint text-muted-foreground">当前示例选项：{scope === "self" ? "个人预览" : "教研团队"}，没有修改实际权限。</p>
        </Sample>

        <Sample id={`${id}-switch`} number="08" name="Switch" title="开关">
          <Label className="flex"><Switch aria-labelledby={`${id}-switch-label`} checked={showHint} onCheckedChange={setShowHint} /><span id={`${id}-switch-label`} className="min-w-0">显示本页补充说明</span></Label>
          <Label className="flex"><Switch aria-labelledby={`${id}-switch-disabled-label`} checked={false} disabled /><span id={`${id}-switch-disabled-label`} className="min-w-0">不可用设置 · 禁用样例</span></Label>
          <p role="status" className="text-ui-hint text-muted-foreground">{showHint ? "补充说明：开关只控制这段文字的显示内容。" : "补充说明已隐藏。"}</p>
        </Sample>

        <Sample id={`${id}-tabs`} number="09" name="Tabs" title="标签页">
          <p className="text-ui-hint text-muted-foreground">分段式</p>
          <Tabs value={tab} onValueChange={value => setTab(String(value))} className="min-w-0">
            <div {...tabScroll} className="min-w-0 max-w-full overflow-x-auto px-1 py-1">
              <TabsList aria-label="基础组件材料预览" data-variant="default"><TabsTab value="content">题干内容</TabsTab><TabsTab value="notes">长中文推导与复核说明</TabsTab><TabsTab value="locked" disabled>不可用材料</TabsTab></TabsList>
            </div>
            <TabsPanel value="content" className="py-3 text-ui-body">固定题干样例：说明二次项系数不为零，再讨论判别式与实数根。</TabsPanel>
            <TabsPanel value="notes" className="py-3 text-ui-body">固定复核说明：先检查条件与公式，再核对单位及结论。长标签在窄容器内独立横向滚动。</TabsPanel>
          </Tabs>
          <p className="text-ui-hint text-muted-foreground">下划线式</p>
          <Tabs value={underlineTab} onValueChange={value => setUnderlineTab(String(value))} className="min-w-0">
            <div {...underlineScroll} className="min-w-0 max-w-full overflow-x-auto px-1 py-1">
              <TabsList aria-label="基础组件补充信息" variant="underline" data-variant="underline"><TabsTab value="summary">材料摘要</TabsTab><TabsTab value="source">来源与版本记录</TabsTab><TabsTab value="unavailable" disabled>未提供记录</TabsTab></TabsList>
            </div>
            <TabsPanel value="summary" className="py-3 text-ui-body">固定摘要：一元二次方程的实数根。</TabsPanel>
            <TabsPanel value="source" className="py-3 text-ui-body">示例来源：教研材料样本 · 版本 BP-2026-014。</TabsPanel>
          </Tabs>
        </Sample>

        <Sample id={`${id}-card`} number="10" name="Card" title="卡片">
          <Card><CardHeader><CardTitle>本页材料样例</CardTitle><CardDescription>卡片本身只读；在上方对话框修改演示内容。</CardDescription></CardHeader><CardPanel className="space-y-2"><p className="text-ui-body break-words">名称：{saved.name}</p><p className="text-ui-hint text-muted-foreground">类型：{kindLabel(saved.kind)}</p></CardPanel></Card>
          <CardFrame><CardFrameHeader><CardFrameTitle>带分组框的只读卡片</CardFrameTitle></CardFrameHeader><Card><CardPanel><p className="text-ui-body">固定说明：章节框与内容面共享结构线，保留长中文段落的完整阅读空间。</p></CardPanel></Card></CardFrame>
        </Sample>

        <Sample id={`${id}-badge`} number="11" name="Badge" title="徽章">
          <div className="flex flex-wrap gap-2"><Badge variant="outline">草稿</Badge><Badge variant="info">待确认</Badge><Badge variant="success">已通过</Badge><Badge variant="warning">需补充</Badge><Badge variant="error">有错误</Badge></div>
          <p className="text-ui-hint text-muted-foreground">五种固定状态样例。标签文字保留状态含义，不单独依赖颜色。</p>
        </Sample>

        <Sample id={`${id}-alert`} number="12" name="Alert" title="提示">
          <Alert variant="info" role="note"><Info aria-hidden="true" /><AlertTitle>信息样例</AlertTitle><AlertDescription>当前材料为演示草稿，可继续核对完整题干和条件。</AlertDescription></Alert>
          <Alert variant="success" role="note"><Check aria-hidden="true" /><AlertTitle>成功样例</AlertTitle><AlertDescription>这是固定的成功状态样例，不代表发生了实际保存。</AlertDescription></Alert>
          <Alert variant="warning" role="note"><TriangleAlert aria-hidden="true" /><AlertTitle>提醒样例</AlertTitle><AlertDescription>请补充判别式等于零时的说明，并注明二次项系数不为零。</AlertDescription></Alert>
          <Alert variant="error" role="note"><TriangleAlert aria-hidden="true" /><AlertTitle>错误样例</AlertTitle><AlertDescription>固定校验样例：缺少二次项系数不为零的条件，需要补充后再核对。</AlertDescription></Alert>
        </Sample>
      </div>
    </section>
  </section>
}
