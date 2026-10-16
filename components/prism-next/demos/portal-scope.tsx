"use client"

import { useId, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/coss/button"
import { Input } from "@/components/coss/input"
import { Label } from "@/components/coss/label"
import { Menu, MenuTrigger, MenuItem, MenuSub, MenuSubTrigger } from "@/components/coss/menu"
import { Dialog, DialogTrigger, DialogTitle, DialogDescription, DialogClose } from "@/components/coss/dialog"
import { ToastPrimitive, toastManager } from "@/components/coss/toast"
import { MenuPopup, MenuSubPopup, DialogPopup, ToastProvider } from "../scoped-overlays"
import { PrismScopeProvider } from "../prism-scope"
import { QuestionSelect } from "../question-controls"
import { AgentObjectPicker } from "../agent-object-picker"
import { ComparisonChart } from "../charts/basic-charts"
import type { PrismTheme } from "@/lib/prism-next/config"

const kinds = [{ value: "example", label: "例题讲解" }, { value: "practice", label: "长中文课堂练习与讲评材料" }]
const candidates = [{ id: "class-a", name: "高二三班", status: "available" as const }, { id: "class-b", name: "高二四班 · 长中文教学主题与跨课次讲评材料", status: "available" as const }]
const chartData = [{ id: "a", label: "例题", value: 32 }, { id: "b", label: "练习", value: 48 }]

function PreviewScope({ theme, children }: { theme: PrismTheme; children: ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null)
  // Each mounted preview owns its queue. Leaving it discards its notifications.
  const [manager] = useState(() => ToastPrimitive.createToastManager())
  return <section data-agent-preview="" data-ui-version="coss-v1" data-prism-theme={theme} className="min-w-0 space-y-4 border bg-background p-4 text-foreground">
    <div ref={setTarget} data-portal-scope-target={theme} />
    <PrismScopeProvider theme={theme} portalContainer={target}>
      <ToastProvider toastManager={manager} timeout={0}>{children}</ToastProvider>
    </PrismScopeProvider>
  </section>
}

function LocalToastButton({ label }: { label: string }) {
  const manager = ToastPrimitive.useToastManager()
  return <div className="flex flex-wrap gap-2">
    <Button variant="outline" onClick={() => manager.add({ title: `${label}通知`, description: "固定示例提示，没有提交业务任务。", type: "info" })}>触发{label}通知</Button>
    <Button variant="ghost" onClick={() => manager.close()}>关闭{label}通知</Button>
  </div>
}

function ScopedControls() {
  const id = useId()
  const [kind, setKind] = useState("example")
  const [selected, setSelected] = useState<readonly string[]>([])
  const [query, setQuery] = useState("")
  const [feedback, setFeedback] = useState("")
  const input = useRef<HTMLInputElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  return <>
    <h3 className="text-block-title">局部主题预览</h3>
    <div className="space-y-2"><Label htmlFor={`${id}-kind`}>材料类型</Label><QuestionSelect id={`${id}-kind`} label="局部材料类型" value={kind} items={kinds} onChange={setKind} /></div>
    <AgentObjectPicker title="搜索班级" objectType={{ id: "class", label: "班级" }} selection={{ mode: "single" }} view="workspace" density="compact"
      candidates={candidates.filter(item => item.name.includes(query))} selectedCandidates={candidates} selectedIds={selected} onSelectionChange={setSelected}
      searchValue={query} onSearchChange={setQuery} result={{ state: "ready" }} />
    <div className="flex flex-wrap gap-2">
      <Menu><MenuTrigger render={<Button variant="outline" />}>局部材料操作</MenuTrigger>
        <MenuPopup><MenuItem onClick={() => setFeedback("已选择示例材料。")}>选择材料</MenuItem>
          <MenuSub><MenuSubTrigger>材料示例子菜单</MenuSubTrigger><MenuSubPopup><MenuItem onClick={() => setFeedback("已选择长中文讲评材料示例。")}>长中文讲评材料示例</MenuItem></MenuSubPopup></MenuSub>
        </MenuPopup>
      </Menu>
      <Dialog><DialogTrigger ref={trigger} render={<Button variant="outline" />}>局部对话框</DialogTrigger>
        <DialogPopup initialFocus={input} finalFocus={trigger} closeProps={{ "aria-label": "关闭局部对话框" }} className="gap-4 p-6">
          <DialogTitle>材料说明</DialogTitle><DialogDescription>检查局部主题、嵌套选择与关闭回焦。</DialogDescription>
          <Label htmlFor={`${id}-title`}>材料标题</Label><Input ref={input} id={`${id}-title`} defaultValue="二次函数课堂讲评" />
          <Label htmlFor={`${id}-dialog-kind`}>对话框材料类型</Label><QuestionSelect id={`${id}-dialog-kind`} label="对话框材料类型" value={kind} items={kinds} onChange={setKind} />
          <p className="text-read-body">长中文材料中的公式：<math className="prism-math" aria-label="x 等于负 b 除以二 a"><mi>x</mi><mo>=</mo><mo>−</mo><mfrac><mi>b</mi><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></math>。</p>
          <DialogClose render={<Button variant="outline" />}>完成查看</DialogClose>
        </DialogPopup>
      </Dialog>
    </div>
    {feedback && <p role="status" className="text-ui-hint">{feedback}</p>}
    <LocalToastButton label="局部" />
    <ComparisonChart label="局部主题材料数量 · 固定示例" data={chartData} height={220} />
  </>
}

/** Review fixture on the existing Menu page; not a catalog component or a Workspace flow. */
export function PortalScopeDemo() {
  const [outerTheme, setOuterTheme] = useState<"light" | "paper" | "dark">("light")
  const [innerTheme, setInnerTheme] = useState<PrismTheme>("blueprint")
  const [mounted, setMounted] = useState(true)
  const id = useId()
  return <section id="portal-scope" className="min-w-0 space-y-4">
    <h2 className="text-section-title">嵌套主题与浮层容器</h2>
    <p className="text-ui-hint">外层和局部预览各自持有通知；离开局部预览后再进入，局部通知不会恢复。</p>
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2"><Label htmlFor={`${id}-outer`}>外层核心主题</Label><QuestionSelect id={`${id}-outer`} label="外层核心主题" value={outerTheme} onChange={value => setOuterTheme(value as typeof outerTheme)} items={[{ value: "light", label: "浅色" }, { value: "paper", label: "暖纸" }, { value: "dark", label: "深色" }]} /></div>
      <div className="space-y-2"><Label htmlFor={`${id}-inner`}>局部主题</Label><QuestionSelect id={`${id}-inner`} label="局部主题" value={innerTheme} onChange={value => setInnerTheme(value as PrismTheme)} items={[{ value: "blueprint", label: "蓝图" }, { value: "blueprint-night", label: "蓝图夜色" }, { value: "light", label: "浅色" }, { value: "paper", label: "暖纸" }, { value: "dark", label: "深色" }]} /></div>
      <Button variant="outline" onClick={() => setMounted(value => !value)}>{mounted ? "离开局部预览" : "进入局部预览"}</Button>
      <Button variant="outline" onClick={() => toastManager.add({ title: "全局通知", description: "保持页面全局主题。", type: "info" })}>触发全局通知</Button>
    </div>
    <PreviewScope theme={outerTheme}>
      <h3 className="text-block-title">外层核心主题对照</h3>
      <LocalToastButton label="外层" />
      <ComparisonChart label="核心主题材料数量 · 固定示例" data={chartData} height={220} />
      {mounted && <PreviewScope theme={innerTheme}><ScopedControls /></PreviewScope>}
    </PreviewScope>
  </section>
}
