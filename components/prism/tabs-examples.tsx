"use client"

import { useEffect, useId, useRef, useState } from "react"
import { AlertCircle, Check, FileText, Loader2, MessageSquare, PencilLine, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextField } from "@/components/ui/text-field"

type Density = "comfortable" | "compact"
type LoadState = "idle" | "loading" | "ready" | "error"
const records = [
  ["课堂观察", "方程建模", "待复核"],
  ["作业表现", "条件引用", "已复核"],
  ["阶段测评", "几何证明", "待复核"],
  ["课堂观察", "解题过程", "已复核"],
]

export function PageTabsExample({ density = "comfortable" }: { density?: Density }) {
  const [active, setActive] = useState("overview")
  const [state, setState] = useState<LoadState>("idle")
  const [rows, setRows] = useState<string[][] | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const size = density === "compact" ? "compact" : "default"
  useEffect(() => () => { if (timer.current !== null) clearTimeout(timer.current) }, [])

  function load(outcome: "ready" | "empty" | "error" = "ready") {
    if (timer.current !== null) return
    setState("loading")
    timer.current = setTimeout(() => {
      if (outcome !== "error") setRows(outcome === "empty" ? [] : records)
      setState(outcome === "error" ? "error" : "ready")
      timer.current = null
    }, 1100)
  }
  function select(value: string) {
    setActive(value)
    if (value === "evidence" && state === "idle") load()
  }

  return <div className="tabs-scene">
    <div className="tabs-object-heading"><h3>九年级 1 班 · 数学</h3><span>本周 · 示例数据</span></div>
    <Tabs value={active} onValueChange={select} activationMode="manual">
      <TabsList variant="line" aria-label="班级教育证据内容">
        <TabsTrigger value="overview">概览</TabsTrigger>
        <TabsTrigger value="evidence"><span className="selection-label">教育证据<span className="selection-count" aria-label={rows === null ? "数量待加载" : `${rows.length} 份`}>{rows === null ? "—" : rows.length}</span><span className="tabs-notice-slot">{state === "loading" && <span className="tabs-notice"><Loader2 className="tabs-loading-icon" aria-hidden="true" /><span className="sr-only">加载中</span></span>}{state === "error" && <span className="tabs-notice tabs-notice--error"><AlertCircle aria-hidden="true" /><span className="sr-only">加载失败</span></span>}</span></span></TabsTrigger>
        <TabsTrigger value="records">处理记录</TabsTrigger>
      </TabsList>
      <div className="tabs-panel-region">
        <TabsContent value="overview"><div className="tabs-reading"><h4>本周证据概览</h4><p>本周有 4 份教育证据，其中 2 项待教师复核。</p></div></TabsContent>
        <TabsContent value="evidence">
          <div className="tabs-reading">
            <div className="tabs-panel-feedback" role="status">
              {state === "loading" ? <><Loader2 className="tabs-loading-icon" aria-hidden="true" /><span>{rows === null ? "正在加载教育证据…" : "正在更新，保留上次结果。"}</span></>
                : state === "error" ? <><AlertCircle className="tabs-error-icon" aria-hidden="true" /><span>{rows === null ? "证据加载失败，请重试。" : "更新失败，仍显示上次结果。"}</span></>
                : state === "ready" ? <><Check aria-hidden="true" /><span>{rows?.length ? `已加载 ${rows.length} 份教育证据。` : "当前范围暂无教育证据。"}</span></>
                : <span>进入此面板后加载教育证据。</span>}
            </div>
            <div aria-busy={state === "loading"}>
              {rows !== null && rows.length > 0 && <table className="tabs-evidence-table"><thead><tr><th scope="col">来源</th><th scope="col">观察内容</th><th scope="col">复核状态</th></tr></thead><tbody>{rows.map(([source, topic, review], i) => <tr key={i}><td>{source}</td><th scope="row">{topic}</th><td>{review}</td></tr>)}</tbody></table>}
              {rows?.length === 0 && <p className="tabs-empty-copy">此范围没有可显示的记录。空内容仍可进入，标签保持可用。</p>}
              {rows === null && state === "loading" && <div className="tabs-loading-lines" aria-hidden="true"><span /><span /><span /></div>}
            </div>
            <div className="tabs-example-actions"><Button type="button" variant="outline" size={size} loading={state === "loading"} loadingLabel="正在加载" onClick={() => load()}><RefreshCw aria-hidden="true" />{state === "error" ? "重试加载" : "重新加载"}</Button><Button type="button" variant="ghost" size={size} disabled={state === "loading"} onClick={() => load("error")}>模拟失败</Button><Button type="button" variant="ghost" size={size} disabled={state === "loading"} onClick={() => load("empty")}>模拟空结果</Button></div>
          </div>
        </TabsContent>
        <TabsContent value="records"><div className="tabs-reading"><h4>同一班级的处理记录</h4><p>14:32 · 完成证据整理。</p><p>14:36 · 2 项证据进入待复核。生成完成与人工复核分别记录。</p></div></TabsContent>
      </div>
    </Tabs>
  </div>
}

export function LocalTabsExample({ density = "comfortable" }: { density?: Density }) {
  const [active, setActive] = useState("source")
  const [draft, setDraft] = useState("补充几何证明的条件引用。")
  const [applied, setApplied] = useState("补充几何证明的条件引用。")
  const [attempted, setAttempted] = useState(false)
  const [message, setMessage] = useState("批注仅在当前页面保留。")
  const input = useRef<HTMLTextAreaElement>(null)
  const changed = draft !== applied
  const error = attempted && !draft.trim()

  function apply() {
    setAttempted(true)
    if (!draft.trim()) { input.current?.focus(); return }
    setApplied(draft.trim())
    setDraft(draft.trim())
    setMessage("批注已应用到本页。")
  }
  return <div className="tabs-local-scene">
    <div className="tabs-object-heading"><h3>课堂观察 · 几何证明</h3><span>记录 03</span></div>
    <Tabs value={active} onValueChange={setActive}>
      <TabsList layout="equal" aria-label="课堂观察记录内容">
        <TabsTrigger value="source"><FileText aria-hidden="true" />原文</TabsTrigger>
        <TabsTrigger value="notes"><MessageSquare aria-hidden="true" />教师批注<span className="tabs-notice-slot">{error ? <span className="tabs-notice tabs-notice--error"><AlertCircle aria-hidden="true" /><span className="sr-only">1 项待修正</span></span> : changed ? <span className="tabs-notice"><PencilLine aria-hidden="true" /><span className="sr-only">未应用修改</span></span> : null}</span></TabsTrigger>
      </TabsList>
      <div className="tabs-panel-region">
        <TabsContent value="source"><div className="tabs-reading"><p>学生能够完成方程建模，几何证明中仍有条件引用不完整的问题。</p><div className="tabs-applied-note"><h4>已应用批注</h4><p>{applied}</p></div></div></TabsContent>
        <TabsContent value="notes"><div className="tabs-reading">
          <TextField multiline ref={input} label="教师批注" density={density} value={draft} onChange={event => setDraft(event.target.value)} error={error ? "请填写批注，再应用到记录。" : undefined} description="切换到原文再返回，保留正在编辑的内容。" />
          <div className="tabs-example-actions"><Button type="button" size={density === "compact" ? "compact" : "default"} onClick={apply}>应用批注</Button><Button type="button" variant="ghost" size={density === "compact" ? "compact" : "default"} disabled={!changed && !error} onClick={() => { setDraft(applied); setAttempted(false); setMessage("已恢复上次批注。") }}>撤回修改</Button></div>
        </div></TabsContent>
      </div>
    </Tabs>
    <p className="tabs-local-feedback" role="status">{error ? <><AlertCircle className="tabs-error-icon" aria-hidden="true" />教师批注有 1 项待修正。</> : changed ? <><PencilLine aria-hidden="true" />有未应用修改，已应用批注保持不变。</> : <><Check aria-hidden="true" />{message}</>}</p>
  </div>
}

function DetailTabsExample() {
  const [vertical, setVertical] = useState(false)
  const scene = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = scene.current
    if (!element) return
    const update = () => setVertical(element.clientWidth >= 560)
    const observer = new ResizeObserver(update)
    update(); observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return <div className="tabs-scene" ref={scene}>
    <div className="tabs-object-heading"><h3>教学任务 · 方程与几何</h3><span>任务详情</span></div>
    <Tabs defaultValue="details" orientation={vertical ? "vertical" : "horizontal"} activationMode="manual" className="tabs-detail-layout">
      <TabsList variant="line" aria-label="教学任务详情分组"><TabsTrigger value="details">基本信息</TabsTrigger><TabsTrigger value="scope">班级与范围</TabsTrigger><TabsTrigger value="history">处理记录</TabsTrigger></TabsList>
      <div className="tabs-panel-region"><TabsContent value="details"><div className="tabs-reading"><h4>任务信息</h4><p>本周数学课堂观察，围绕方程建模与几何证明整理证据。</p></div></TabsContent><TabsContent value="scope"><div className="tabs-reading"><h4>适用范围</h4><p>九年级 1 班 · 数学 · 本周。</p><p>这里只切换任务详情分组，不改变任务或班级。</p></div></TabsContent><TabsContent value="history"><div className="tabs-reading"><h4>处理记录</h4><p>已整理 4 份教育证据，2 项等待教师复核。</p></div></TabsContent></div>
    </Tabs>
  </div>
}

function OverflowTabsExample() {
  const reason = useId()
  return <div className="control-narrow tabs-overflow-example">
    <Tabs defaultValue="all" activationMode="manual">
      <TabsList variant="line" aria-label="窄容器中的教育证据"><TabsTrigger value="all"><span className="selection-label">全部教育证据<span className="selection-count">128</span></span></TabsTrigger><TabsTrigger value="long"><span className="selection-label">跨学科学习过程长期趋势<span className="selection-count">24</span></span></TabsTrigger><TabsTrigger value="archive" disabled aria-describedby={reason}>归档记录</TabsTrigger></TabsList>
      <div className="tabs-panel-region"><TabsContent value="all"><p>显示同一范围内的全部教育证据。</p></TabsContent><TabsContent value="long"><p>长标签保持完整，标签条独立滚动，页面内容留在原位。</p></TabsContent><TabsContent value="archive"><p>归档记录不可用。</p></TabsContent></div>
    </Tabs>
    <p id={reason} className="button-demo-note">归档记录不可用：当前用户没有查看权限。</p>
  </div>
}

export function TabsExamples() {
  const [density, setDensity] = useState<Density>("comfortable")
  return <div className="preview-stack component-control-preview tabs-examples" data-density={density}>
    <div className="control-preview-toolbar"><span>界面密度</span><SegmentedControl label="Tabs 界面密度" value={density} onValueChange={v => setDensity(v as Density)} items={[["comfortable", "舒适 · 36px"], ["compact", "紧凑 · 32px"]]} /></div>
    <section className="tabs-example-section"><div className="tabs-example-heading"><h3>页面内容</h3><p>页面样式 · 手动激活。进入教育证据可查看加载、刷新、失败重试和空内容。</p></div><PageTabsExample density={density} /></section>
    <section className="tabs-example-section"><div className="tabs-example-heading"><h3>卡片、弹窗与详情区中的局部内容</h3><p>局部样式 · 等分排列。编辑批注后切换，观察未应用与错误状态如何保留。</p></div><LocalTabsExample density={density} /></section>
    <section className="tabs-example-section"><div className="tabs-example-heading"><h3>侧向详情</h3><p>复用页面样式，纵向排列；窄屏转为横向，键盘方向与排列一致。</p></div><DetailTabsExample /></section>
    <section className="tabs-example-section"><div className="tabs-example-heading"><h3>长标签、数量与禁用项</h3><p>304px 窄容器。Hover、按下和键盘聚焦均可操作；禁用原因保持可读。</p></div><OverflowTabsExample /></section>
  </div>
}

export function TabsUsageNotes() {
  return <div className="field-behavior-note tabs-usage-note">
    <h2>状态与场景规则</h2>
    <table className="field-behavior-table"><thead><tr><th scope="col">状态</th><th scope="col">表现与处理</th></tr></thead><tbody>
      <tr><th scope="row">默认、Hover、按下</th><td>默认中性文字；Hover显露局部表面；按下加深局部响应，不改变尺寸或移动正文。</td></tr>
      <tr><th scope="row">选中与键盘焦点</th><td>页面使用曜蓝文字与指示线，局部使用白色选中面。焦点另用 2px 边界，聚焦和选中可同时识别。</td></tr>
      <tr><th scope="row">禁用与空内容</th><td>不可用标签退出操作顺序，并在面板外说明原因；零条记录仍可打开，显示空内容与可用行动。</td></tr>
      <tr><th scope="row">首次加载与刷新</th><td>标签身份和对象范围保持不变；首次加载在面板内提示，刷新保留上次结果。切换面板不会清除已取得的内容。</td></tr>
      <tr><th scope="row">失败与待修正</th><td>标签使用错误图标提示对应面板，面板内说明原因与修正入口。错误色不取代选中位置；焦点和错误可同时表达。</td></tr>
      <tr><th scope="row">数量与未应用修改</th><td>数量保持中性；未应用用编辑图标与就近文字说明。草稿由场景保留，切换不代表应用，也不代表已长期保存。</td></tr>
    </tbody></table>
    <p className="button-demo-note">有等待的面板使用手动激活；已在本地准备好的内容可随方向键立即激活。参考 <a href="https://www.w3.org/WAI/ARIA/apg/patterns/tabs/">WAI-ARIA Tabs</a>。</p>
    <p className="button-demo-note">页面与局部样式共用横向、纵向与等分布局。触控时标签操作高度至少 44px。纯视角或时间粒度选择使用 Segmented Control；跨页面导航使用链接。可关闭的多文档页签需要额外处理关闭后的焦点与未保存内容，本轮不加入基础 Tabs。</p>
  </div>
}
