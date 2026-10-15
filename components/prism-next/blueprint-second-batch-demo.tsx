"use client"

import { useId, useRef, useState, type ReactNode } from "react"
import { FileText, Info, Search, X } from "lucide-react"
import { AlertDialog, AlertDialogClose, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogPopup, AlertDialogTitle, AlertDialogTrigger } from "@/components/coss/alert-dialog"
import { Combobox, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxPopup } from "@/components/coss/combobox"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/coss/empty"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/coss/field"
import { Form } from "@/components/coss/form"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/coss/input-group"
import { Menu, MenuCheckboxItem, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuTrigger } from "@/components/coss/menu"
import { Popover, PopoverClose, PopoverDescription, PopoverPopup, PopoverTitle, PopoverTrigger } from "@/components/coss/popover"
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from "@/components/coss/progress"
import { Sheet, SheetClose, SheetDescription, SheetFooter, SheetHeader, SheetPanel, SheetPopup, SheetTitle, SheetTrigger } from "@/components/coss/sheet"
import { Skeleton } from "@/components/coss/skeleton"
import { Textarea } from "@/components/coss/textarea"
import { ToastPrimitive, ToastProvider } from "@/components/coss/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from "@/components/coss/tooltip"
import { Button } from "./button"
import { QuestionMath } from "./question-content"

type Topic = { value: string; label: string; disabled?: boolean }
const topics: Topic[] = [
  { value: "quadratic", label: "一元二次方程" },
  { value: "function", label: "二次函数的图像、性质与完整推导说明" },
  { value: "geometry", label: "平面几何与辅助线" },
  { value: "archived", label: "已归档知识点（不可选）", disabled: true },
]
const sampleIndex = [
  ["input-group", "InputGroup"], ["combobox", "Combobox"], ["toggle-group", "ToggleGroup"], ["progress", "Progress"],
  ["menu", "Menu"], ["popover", "Popover"], ["tooltip", "Tooltip"], ["toast", "Toast"],
  ["alert-dialog", "AlertDialog"], ["sheet", "Sheet"], ["skeleton", "Skeleton"], ["empty", "Empty"],
]
const toastSamples = [
  { type: "info", label: "信息", description: "固定信息样例：请核对完整题干、条件与公式。" },
  { type: "success", label: "成功", description: "固定成功样式，不表示发生了实际保存或发布。" },
  { type: "error", label: "错误", description: "固定错误样例：材料缺少必要条件，当前没有执行提交。" },
  { type: "warning", label: "提醒", description: "固定提醒样例：请补充长中文说明，避免遗漏适用范围。" },
  { type: "loading", label: "加载", description: "固定等待样式，没有运行任务；请手动关闭本条通知。" },
] as const

function Sample({ id, number, name, title, children }: { id: string; number: string; name: string; title: string; children: ReactNode }) {
  return <section id={id} data-blueprint-component={name} aria-labelledby={`${id}-heading`} className="min-w-0 space-y-4">
    <h4 id={`${id}-heading`} className="text-block-title">{number} · {name} {title}</h4>
    {children}
  </section>
}

/** Existing coss components and per-instance preview state; no task runtime or global toast manager. */
export function BlueprintSecondBatchDemo() {
  const id = useId()
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const [toastManager] = useState(() => ToastPrimitive.createToastManager())
  const [query, setQuery] = useState("二次函数")
  const [page, setPage] = useState("")
  const queryInput = useRef<HTMLInputElement>(null)
  const invalidPage = !/^[1-9]\d*$/.test(page)
  const [topic, setTopic] = useState<Topic | null>(topics[0])
  const [requiredTopic, setRequiredTopic] = useState<Topic | null>(null)
  const [mode, setMode] = useState(["read"])
  const [details, setDetails] = useState(["conditions"])
  const [menuChecked, setMenuChecked] = useState(true)
  const [menuDensity, setMenuDensity] = useState("complete")
  const [menuMessage, setMenuMessage] = useState("菜单操作只更新本页预览说明。")
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [note, setNote] = useState("核对题干条件后，再检查每一步推导。")
  const [noteDraft, setNoteDraft] = useState(note)
  const popoverInput = useRef<HTMLTextAreaElement>(null)
  const popoverTrigger = useRef<HTMLButtonElement>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const alertTrigger = useRef<HTMLButtonElement>(null)
  const alertCancel = useRef<HTMLButtonElement>(null)
  const [alertMessage, setAlertMessage] = useState("此处只演示确认清空本页备注，不删除材料。")
  const sheetTrigger = useRef<HTMLButtonElement>(null)
  const sheetClose = useRef<HTMLButtonElement>(null)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [showMaterial, setShowMaterial] = useState(false)

  function openPopover(next: boolean) {
    if (next) setNoteDraft(note)
    setPopoverOpen(next)
  }
  function showToast(sample: (typeof toastSamples)[number]) {
    const toastId = toastManager.add({
      title: `${sample.label}状态样例`, description: sample.description, type: sample.type, timeout: 0,
      actionProps: { children: "关闭通知", "aria-label": `关闭${sample.label}状态样例`, onClick: () => toastManager.close(toastId) },
    })
  }
  const topicOptions = (item: Topic) => <ComboboxItem key={item.value} value={item} disabled={item.disabled}>{item.label}</ComboboxItem>

  return <section ref={setPortalRoot} id="common-components-two" data-blueprint-batch-two="" aria-labelledby={`${id}-heading`} className="space-y-8 border bg-card p-4 text-foreground sm:p-6">
    <header className="space-y-2">
      <h2 id={`${id}-heading`} className="text-section-title">常用组件 · 第二批</h2>
      <p className="text-ui-hint text-muted-foreground">12 类现有组件的蓝图样例。进度、加载与通知均为明确标注的状态快照；输入、选项、备注和开合只作用于本页。</p>
    </header>
    <nav aria-label="第二批组件样例索引" className="flex flex-wrap gap-x-5 gap-y-2 text-ui-hint">
      {sampleIndex.map(([anchor, name], index) => <a key={anchor} href={`#${id}-${anchor}`}>{index + 13} {name}</a>)}
    </nav>

    <section aria-labelledby={`${id}-input-section-heading`} data-blueprint-foundation-group="input-and-progress" className="space-y-7">
      <h3 id={`${id}-input-section-heading`} className="text-item-title">输入、选择与进度</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-8">
        <Sample id={`${id}-input-group`} number="13" name="InputGroup" title="输入组合">
          <Field>
            <FieldLabel id={`${id}-query-label`}>材料关键词</FieldLabel>
            <InputGroup aria-labelledby={`${id}-query-label`}>
              <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
              <InputGroupInput id={`${id}-query`} ref={queryInput} aria-labelledby={`${id}-query-label`} aria-describedby={`${id}-query-help`} value={query} onChange={event => setQuery(event.target.value)} />
              <InputGroupAddon align="inline-end"><Button variant="ghost" size="icon-xs" disabled={!query} aria-label="清除本页关键词" onClick={() => { setQuery(""); queryInput.current?.focus() }}><X aria-hidden="true" /></Button></InputGroupAddon>
            </InputGroup>
            <FieldDescription id={`${id}-query-help`}>可编辑与清除；关键词没有发送到搜索服务。</FieldDescription>
          </Field>
          <Field invalid={invalidPage}>
            <FieldLabel id={`${id}-page-label`}>起始页 · 必填校验</FieldLabel>
            <InputGroup aria-labelledby={`${id}-page-label`}>
              <InputGroupInput id={`${id}-page`} aria-labelledby={`${id}-page-label`} aria-describedby={invalidPage ? `${id}-page-error` : `${id}-page-help`} inputMode="numeric" value={page} onChange={event => setPage(event.target.value)} aria-invalid={invalidPage || undefined} />
              <InputGroupAddon align="inline-end"><InputGroupText>页</InputGroupText></InputGroupAddon>
            </InputGroup>
            <FieldError id={`${id}-page-error`} match={invalidPage}>请输入大于零的整数页码。</FieldError>
            <FieldDescription id={`${id}-page-help`}>填写有效页码后清除本项错误。</FieldDescription>
          </Field>
          <Field><FieldLabel id={`${id}-group-readonly-label`}>材料编号 · 只读</FieldLabel><InputGroup><InputGroupInput id={`${id}-group-readonly`} aria-labelledby={`${id}-group-readonly-label`} readOnly value="BP-2026-024" /></InputGroup><FieldDescription>编号可选择复制。</FieldDescription></Field>
          <Field disabled><FieldLabel id={`${id}-group-disabled-label`}>归档关键词 · 禁用</FieldLabel><InputGroup><InputGroupInput id={`${id}-group-disabled`} aria-labelledby={`${id}-group-disabled-label`} disabled value="归档材料" /></InputGroup><FieldDescription>此项固定禁用。</FieldDescription></Field>
        </Sample>

        <Sample id={`${id}-combobox`} number="14" name="Combobox" title="搜索选择">
          <Field>
            <FieldLabel id={`${id}-topic-label`}>关联知识点</FieldLabel>
            <Combobox items={topics} value={topic} onValueChange={setTopic}>
              <ComboboxInput id={`${id}-topic`} aria-labelledby={`${id}-topic-label`} placeholder="搜索并选择知识点" showClear clearProps={{ "aria-label": "清除关联知识点" }} triggerProps={{ "aria-label": "展开关联知识点" }} />
              <ComboboxPopup portalProps={{ container: portalRoot }}><ComboboxEmpty>没有匹配的知识点。</ComboboxEmpty><ComboboxList>{topicOptions}</ComboboxList></ComboboxPopup>
            </Combobox>
            <FieldDescription>当前选择：{topic?.label ?? "尚未选择"}。输入缩小范围，方向键选择，Esc 关闭。</FieldDescription>
          </Field>
          <Field invalid={!requiredTopic}>
            <FieldLabel id={`${id}-required-topic-label`}>必选知识点 · 校验</FieldLabel>
            <Combobox items={topics} value={requiredTopic} onValueChange={setRequiredTopic}>
              <ComboboxInput id={`${id}-required-topic`} aria-labelledby={`${id}-required-topic-label`} aria-invalid={!requiredTopic || undefined} placeholder="请选择知识点" showClear clearProps={{ "aria-label": "清除必选知识点" }} triggerProps={{ "aria-label": "展开必选知识点" }} />
              <ComboboxPopup portalProps={{ container: portalRoot }}><ComboboxEmpty>没有匹配的知识点。</ComboboxEmpty><ComboboxList>{topicOptions}</ComboboxList></ComboboxPopup>
            </Combobox>
            <FieldError match={!requiredTopic}>请从候选项中选择知识点，仅输入文字不算选中。</FieldError>
          </Field>
          <Field disabled><FieldLabel id={`${id}-disabled-topic-label`}>归档知识点 · 禁用</FieldLabel><Combobox items={topics} value={topics[0]} disabled><ComboboxInput id={`${id}-disabled-topic`} aria-labelledby={`${id}-disabled-topic-label`} triggerProps={{ "aria-label": "归档知识点不可展开" }} /><ComboboxPopup portalProps={{ container: portalRoot }}><ComboboxList>{topicOptions}</ComboboxList></ComboboxPopup></Combobox><FieldDescription>固定禁用状态，不接受搜索或更改。</FieldDescription></Field>
        </Sample>

        <Sample id={`${id}-toggle-group`} number="15" name="ToggleGroup" title="切换组">
          <p id={`${id}-mode-label`} className="text-ui-action">单选视图</p>
          <ToggleGroup aria-labelledby={`${id}-mode-label`} multiple={false} variant="outline" value={mode} onValueChange={values => { if (values.length) setMode(values) }}>
            <ToggleGroupItem value="read">阅读</ToggleGroupItem><ToggleGroupItem value="review">复核</ToggleGroupItem><ToggleGroupItem value="archive" disabled>归档</ToggleGroupItem>
          </ToggleGroup>
          <p id={`${id}-detail-label`} className="text-ui-action">多选说明</p>
          <ToggleGroup aria-labelledby={`${id}-detail-label`} multiple value={details} onValueChange={setDetails} className="max-w-full flex-wrap">
            <ToggleGroupItem value="conditions">题干条件</ToggleGroupItem><ToggleGroupItem value="derivation">完整推导说明</ToggleGroupItem><ToggleGroupItem value="locked" disabled>未提供</ToggleGroupItem>
          </ToggleGroup>
          <p role="status" className="text-ui-hint text-muted-foreground">当前为{mode[0] === "read" ? "阅读" : "复核"}视图样例，选中 {details.length} 项说明；没有改变材料状态。</p>
        </Sample>

        <Sample id={`${id}-progress`} number="16" name="Progress" title="固定进度快照">
          {[{ value: 0, label: "尚未开始快照" }, { value: 40, label: "进行中快照" }, { value: 100, label: "完成快照" }].map(snapshot => <Progress key={snapshot.value} value={snapshot.value}><div className="flex flex-wrap items-center justify-between gap-2"><ProgressLabel>{snapshot.label}</ProgressLabel><ProgressValue /></div><ProgressTrack><ProgressIndicator /></ProgressTrack></Progress>)}
          <Progress value={null} aria-valuetext="未提供进度"><div className="flex flex-wrap items-center justify-between gap-2"><ProgressLabel>进度未知快照</ProgressLabel><span className="text-ui-hint">未提供进度</span></div><ProgressTrack /></Progress>
          <p className="text-ui-hint text-muted-foreground">数值来自固定样例，不随点击或时间推进；未知状态不补造百分比。</p>
        </Sample>
      </div>
    </section>

    <section aria-labelledby={`${id}-overlay-heading`} data-blueprint-foundation-group="menus-and-feedback" className="space-y-7">
      <h3 id={`${id}-overlay-heading`} className="text-item-title">菜单、浮层与通知</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-8">
        <Sample id={`${id}-menu`} number="17" name="Menu" title="菜单">
          <Menu><MenuTrigger render={<Button variant="outline" />}>打开样例菜单</MenuTrigger>
            <MenuPopup portalProps={{ container: portalRoot }} className="w-72 max-w-[calc(100vw-2rem)]">
              <MenuGroup><MenuGroupLabel>本页样例选项</MenuGroupLabel><MenuItem onClick={() => setMenuMessage("已选择查看完整说明，只更新本页反馈。")}>查看完整的中文题干与推导说明</MenuItem><MenuItem disabled>发布材料（未接入）</MenuItem></MenuGroup>
              <MenuSeparator /><MenuCheckboxItem checked={menuChecked} onCheckedChange={setMenuChecked}>显示补充说明</MenuCheckboxItem>
              <MenuGroup><MenuGroupLabel>阅读密度</MenuGroupLabel><MenuRadioGroup value={menuDensity} onValueChange={value => setMenuDensity(String(value))}><MenuRadioItem value="complete">完整阅读</MenuRadioItem><MenuRadioItem value="compact">紧凑摘要</MenuRadioItem></MenuRadioGroup></MenuGroup>
              <MenuSeparator /><MenuItem variant="destructive" onClick={() => setMenuMessage("已预览危险菜单项的点击反馈，没有删除材料。")}>危险操作样例</MenuItem>
            </MenuPopup>
          </Menu>
          <p role="status" className="text-ui-hint text-muted-foreground">{menuMessage} 补充说明{menuChecked ? "已选中" : "未选中"}，密度为{menuDensity === "complete" ? "完整阅读" : "紧凑摘要"}。</p>
        </Sample>

        <Sample id={`${id}-popover`} number="18" name="Popover" title="轻量编辑浮层">
          <Popover open={popoverOpen} onOpenChange={openPopover}><PopoverTrigger ref={popoverTrigger} render={<Button variant="outline" />}>编辑本页备注</PopoverTrigger>
            <PopoverPopup portalProps={{ container: portalRoot }} initialFocus={popoverInput} finalFocus={popoverTrigger} className="w-80 max-w-[calc(100vw-2rem)]">
              <Form className="space-y-4" onSubmit={event => { event.preventDefault(); setNote(noteDraft); setPopoverOpen(false) }}>
                <div className="space-y-2"><PopoverTitle>本页备注样例</PopoverTitle><PopoverDescription>只更新页面内的说明；关闭或取消会放弃本次输入。</PopoverDescription></div>
                <Field><FieldLabel htmlFor={`${id}-note`}>演示备注</FieldLabel><Textarea id={`${id}-note`} ref={popoverInput} value={noteDraft} onChange={event => setNoteDraft(event.target.value)} /></Field>
                <div className="flex flex-wrap justify-end gap-2"><PopoverClose render={<Button variant="ghost" />}>取消备注编辑</PopoverClose><Button type="submit">应用本页备注</Button></div>
              </Form>
            </PopoverPopup>
          </Popover>
          <p role="status" className="text-ui-hint text-muted-foreground break-words">本页备注：{note || "空白"}</p>
        </Sample>

        <Sample id={`${id}-tooltip`} number="19" name="Tooltip" title="辅助说明">
          <TooltipProvider><Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}><TooltipTrigger aria-describedby={tooltipOpen ? `${id}-field-tooltip` : undefined} render={<Button variant="outline" size="icon" aria-label="查看字段说明" />}><Info aria-hidden="true" /></TooltipTrigger><TooltipPopup id={`${id}-field-tooltip`} role="tooltip" portalProps={{ container: portalRoot }}>字段说明：只补充说明，不替代常驻标签。</TooltipPopup></Tooltip></TooltipProvider>
          <p className="text-ui-hint text-muted-foreground">鼠标悬停或键盘聚焦可查看说明。必要信息始终留在页面中。</p>
        </Sample>

        <Sample id={`${id}-toast`} number="20" name="Toast" title="通知状态样例">
          <ToastProvider toastManager={toastManager} portalProps={{ container: portalRoot }} position="bottom-right" limit={3}>
            <div className="flex flex-wrap gap-2">{toastSamples.map(sample => <Button key={sample.type} variant="outline" onClick={() => showToast(sample)}>{sample.label}通知样例</Button>)}<Button variant="ghost" onClick={() => toastManager.close()}>关闭本页全部通知</Button></div>
          </ToastProvider>
          <p className="text-ui-hint text-muted-foreground">通知由点击显式打开，可在通知内关闭；固定加载样例不会自动完成。本实例独立管理通知，不向全站队列发送消息。</p>
        </Sample>
      </div>
    </section>

    <section aria-labelledby={`${id}-dialog-group-heading`} data-blueprint-foundation-group="dialogs-and-placeholders" className="space-y-7">
      <h3 id={`${id}-dialog-group-heading`} className="text-item-title">确认、侧面板与占位</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-8">
        <Sample id={`${id}-alert-dialog`} number="21" name="AlertDialog" title="操作确认">
          <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}><AlertDialogTrigger ref={alertTrigger} render={<Button variant="destructive-outline" />}>清空演示备注</AlertDialogTrigger>
            <AlertDialogPopup portalProps={{ container: portalRoot }} initialFocus={alertCancel} finalFocus={alertTrigger}>
              <AlertDialogHeader><AlertDialogTitle>清空本页演示备注？</AlertDialogTitle><AlertDialogDescription>只清空浮层样例中的本页备注，不删除材料，不发送请求；刷新后恢复固定样例。</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogClose ref={alertCancel} render={<Button variant="ghost" />}>保留本页备注</AlertDialogClose><Button variant="destructive" onClick={() => { setNote(""); setAlertMessage("本页演示备注已清空，可以在编辑浮层中重新填写。"); setAlertOpen(false) }}>确认清空本页示例</Button></AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialog>
          <p role="status" className="text-ui-hint text-muted-foreground">{alertMessage}</p>
        </Sample>

        <Sample id={`${id}-sheet`} number="22" name="Sheet" title="长内容侧面板">
          <Sheet><SheetTrigger ref={sheetTrigger} render={<Button variant="outline" />}>打开长内容侧面板</SheetTrigger>
            <SheetPopup side="right" portalProps={{ container: portalRoot }} initialFocus={sheetClose} finalFocus={sheetTrigger} closeProps={{ ref: sheetClose, "aria-label": "关闭长内容侧面板" }}>
              <SheetHeader><SheetTitle>材料阅读说明</SheetTitle><SheetDescription>固定长内容样例。正文在面板内滚动，关闭后回到原入口。</SheetDescription></SheetHeader>
              <SheetPanel className="space-y-6">
                <div className="space-y-2"><p className="text-read-body">一元二次方程的一般形式：</p><QuestionMath block label="a x 平方加 b x 加 c 等于零，a 不等于零"><mi>a</mi><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mi>b</mi><mi>x</mi><mo>+</mo><mi>c</mi><mo>=</mo><mn>0</mn><mo>，</mo><mi>a</mi><mo>≠</mo><mn>0</mn></QuestionMath></div>
                {Array.from({ length: 8 }, (_, index) => <section key={index} className="space-y-2"><h5 className="text-item-title">{index + 1}. 核对条件与推导</h5><p className="text-read-body">阅读题干时保留完整的中文说明，先确认已知条件、适用范围与单位，再逐步核对每一步推导和结论。遇到长段落时，在侧面板内部继续阅读，不压缩字号，也不省略影响判断的内容。</p></section>)}
              </SheetPanel>
              <SheetFooter><SheetClose render={<Button variant="outline" />}>完成阅读并关闭</SheetClose></SheetFooter>
            </SheetPopup>
          </Sheet>
          <p className="text-ui-hint text-muted-foreground">仅使用现有右侧面板，不增加新的业务页面布局。</p>
        </Sample>

        <Sample id={`${id}-skeleton`} number="23" name="Skeleton" title="加载占位">
          <p role="status" className="text-ui-hint text-muted-foreground">{showSkeleton ? "正在预览固定加载状态，没有实际请求。" : "正在预览已提供内容的固定快照。"}</p>
          <div aria-busy={showSkeleton} aria-label="材料内容快照" className="min-h-32 space-y-3">
            {showSkeleton ? <div aria-hidden="true" className="space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div> : <><h5 className="text-item-title">二次方程的实数根</h5><p className="text-ui-body">固定内容样例：先核对二次项系数，再讨论判别式与实数根。</p></>}
          </div>
          <Button variant="outline" onClick={() => setShowSkeleton(value => !value)}>{showSkeleton ? "显示内容快照" : "显示加载快照"}</Button>
        </Sample>

        <Sample id={`${id}-empty`} number="24" name="Empty" title="空状态">
          {showMaterial ? <div className="space-y-4"><p role="status" className="text-ui-body">固定材料样例：二次方程的实数根。</p><Button variant="outline" onClick={() => setShowMaterial(false)}>恢复空状态样例</Button></div> : <Empty className="px-3 py-6 md:py-8"><EmptyHeader><EmptyMedia variant="icon"><FileText aria-hidden="true" /></EmptyMedia><EmptyTitle>暂无本页演示材料</EmptyTitle><EmptyDescription>这里展示空状态样例；可以切换到固定材料预览，没有创建或上传任务。</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={() => setShowMaterial(true)}>显示固定材料样例</Button></EmptyContent></Empty>}
        </Sample>
      </div>
    </section>
  </section>
}
