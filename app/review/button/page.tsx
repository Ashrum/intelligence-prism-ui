"use client"

import { useEffect, useRef, useState } from "react"
import type { MouseEventHandler, ReactNode } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import styles from "./review.module.css"

const variants = [
  { tone: "primary", name: "主操作", label: "保存设置", busy: "保存中" },
  { tone: "secondary", name: "次操作", label: "暂存草稿", busy: "暂存中" },
  { tone: "outline", name: "轮廓", label: "导出记录", busy: "导出中" },
  { tone: "ghost", name: "轻操作", label: "取消", busy: "处理中" },
  { tone: "ai-soft", name: "AI 次操作", label: "AI 建议", busy: "生成中" },
  { tone: "ai-primary", name: "AI 主操作", label: "智能分析", busy: "分析中" },
  { tone: "destructive", name: "危险操作", label: "删除任务", busy: "删除中" },
] as const

type Tone = (typeof variants)[number]["tone"]
type Snapshot = "hover" | "pressed" | "focus"
type PreviewButtonProps = {
  tone: Tone
  label: string
  loadingLabel?: string
  loading?: boolean
  disabled?: boolean
  snapshot?: Snapshot
  icon?: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
}

// Both columns use the repository's real Button. The left column uses the
// current production prism-button classes, rather than an HTML reproduction.
function CurrentButton({ tone, label, loading, disabled, icon, onClick }: PreviewButtonProps) {
  return (
    <Button
      type="button"
      className={`prism-button prism-button--${tone}`}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {loading && <span className="loading-mark" aria-hidden="true" />}
      {icon}{label}
    </Button>
  )
}

// Temporary design candidate. After approval, move the accepted behavior and
// styles into the shared Button; remove this route, its styles and nav link.
function CandidateButton({
  tone, label, loadingLabel, loading, disabled = false,
  snapshot, icon, onClick,
}: PreviewButtonProps) {
  const busyLabel = loadingLabel?.trim() || label
  // Controlled async buttons pass loading={isLoading}, including while idle.
  // Reserve their busy content up front; leave ordinary actions at natural width.
  const hasLoadingState = loading !== undefined || Boolean(loadingLabel?.trim())

  return (
    <Button
      type="button"
      className={styles.candidate}
      data-tone={tone}
      data-loading={loading || undefined}
      data-preview={snapshot}
      disabled={disabled}
      aria-disabled={loading || disabled || undefined}
      aria-busy={loading || undefined}
      aria-label={loading ? busyLabel : label}
      onClick={(event) => {
        if (loading || disabled) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
    >
      <span className={styles.idle} aria-hidden="true">{icon}{label}</span>
      {hasLoadingState && (
        <span className={styles.busy} aria-hidden="true">
          <span className={styles.spinner} />{busyLabel}
        </span>
      )}
    </Button>
  )
}

function iconFor(tone: Tone) {
  return tone.startsWith("ai-") ? <Sparkles aria-hidden="true" /> : undefined
}

export default function ButtonReviewPage() {
  const [density, setDensity] = useState("comfortable")
  const [reduceMotion, setReduceMotion] = useState(false)
  const [running, setRunning] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState("点击任一按钮体验；所有操作均为浏览器内演示，不提交业务数据。")
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) clearTimeout(timer)
      pending.clear()
    }
  }, [])

  function run(id: string, label: string) {
    // A ref guards repeat activation even before React commits the busy state.
    if (timers.current.has(id)) return
    timers.current.set(id, setTimeout(() => {
      timers.current.delete(id)
      setRunning((previous) => ({ ...previous, [id]: false }))
      setMessage(`${label}：演示完成，可重新操作。`)
    }, 1800))
    setRunning((previous) => ({ ...previous, [id]: true }))
    setMessage(`${label}：正在处理。`)
  }

  function reset() {
    for (const timer of timers.current.values()) clearTimeout(timer)
    timers.current.clear()
    setRunning({})
    setMessage("已取消所有演示任务；按钮恢复原状态。")
  }

  return (
    <main id="main-content" tabIndex={-1} className={styles.review}
      data-density={density} data-motion={reduceMotion ? "reduce" : "system"}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>临时设计评审 · v0.2 · 未替换正式组件</p>
          <h1>Button</h1>
          <p>同一站点、同一 Button 骨架。比较操作层级、按压反馈与等待状态。</p>
        </div>
        <Link href="/components/button" className={styles.back}>返回正式 Button →</Link>
      </header>

      <div className={styles.controls}>
        <label>界面密度
          <select value={density} onChange={(event) => setDensity(event.currentTarget.value)}>
            <option value="comfortable">舒适 · 36px</option>
            <option value="compact">紧凑 · 32px</option>
          </select>
        </label>
        <label><input type="checkbox" checked={reduceMotion}
          onChange={(event) => setReduceMotion(event.currentTarget.checked)} />减少候选动效</label>
        <Button type="button" variant="outline" onClick={reset}>重置演示</Button>
      </div>
      <p className={styles.status} role="status" aria-live="polite">{message}</p>

      <Tabs defaultValue="comparison" className="page-tabs">
        <TabsList variant="line" className="page-tabs-list" aria-label="Button 评审视图">
          <TabsTrigger value="comparison" className="page-tabs-trigger">交互对照</TabsTrigger>
          <TabsTrigger value="states" className="page-tabs-trigger">候选完整状态</TabsTrigger>
        </TabsList>
        <TabsContent value="comparison" className={styles.panel}>
          <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Button 交互对照，可横向滚动">
            <table className={styles.table}>
              <caption>相同文案、图标与密度；点击观察状态变化。</caption>
              <thead><tr><th scope="col">变体</th><th scope="col">现有组件</th><th scope="col">设计候选</th></tr></thead>
              <tbody>{variants.map((item) => (
                <tr key={item.tone}>
                  <th scope="row">{item.name}<small>{item.tone}</small></th>
                  <td><CurrentButton tone={item.tone} label={item.label} icon={iconFor(item.tone)}
                    loading={!!running[`current-${item.tone}`]}
                    onClick={() => run(`current-${item.tone}`, `现有 · ${item.label}`)} /></td>
                  <td><CandidateButton tone={item.tone} label={item.label} icon={iconFor(item.tone)}
                    loadingLabel={item.busy} loading={!!running[`candidate-${item.tone}`]}
                    onClick={() => run(`candidate-${item.tone}`, `候选 · ${item.label}`)} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <section className={styles.notes} aria-labelledby="review-boundary">
            <h2 id="review-boundary">本轮只审核四件事</h2>
            <p>次操作是否应更中性；按压是否清楚但不跳动；AI 等待时是否保留智绯；按钮与相邻操作是否保持位置。</p>
            <p>候选为等待文案预留宽度，因此部分默认按钮会更宽。这是待评审的取舍，不预设候选优于现状。</p>
            <div className={styles.loadingDemo}>
              <CandidateButton tone="ai-primary" label="智能分析" loadingLabel="正在生成分析"
                icon={<Sparkles aria-hidden="true" />} loading={!!running["layout"]}
                onClick={() => run("layout", "布局稳定性")} />
              <CandidateButton tone="outline" label="相邻操作" onClick={reset} />
            </div>
            <h3>等待文案回退</h3>
            <p>未传、空值或纯空白等待文案均保留原文案，并显示处理指示。异步操作从空闲时就传入 loading 布尔值，确保切换不跳宽；普通操作不额外占位。</p>
            <div className={styles.loadingDemo}>
              <CandidateButton tone="primary" label="未传等待文案"
                loading={!!running["fallback-omitted"]}
                onClick={() => run("fallback-omitted", "未传等待文案")} />
              <CandidateButton tone="outline" label="空值等待文案" loadingLabel=""
                loading={!!running["fallback-empty"]}
                onClick={() => run("fallback-empty", "空值等待文案")} />
              <CandidateButton tone="ai-primary" label="空白等待文案" loadingLabel="   "
                icon={<Sparkles aria-hidden="true" />} loading={!!running["fallback-blank"]}
                onClick={() => run("fallback-blank", "空白等待文案")} />
            </div>
          </section>
        </TabsContent>
        <TabsContent value="states" className={styles.panel}>
          <p className={styles.explanation}>Hover、Pressed、Focus 为固定视觉示例，不代表当前键盘焦点。实际交互请在“交互对照”页验证。</p>
          <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="候选完整状态，可横向滚动">
            <table className={`${styles.table} ${styles.stateTable}`}>
              <caption>同一候选的状态矩阵</caption>
              <thead><tr>{["变体", "Default", "Hover", "Pressed", "Focus", "Loading", "Disabled"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
              <tbody>{variants.map((item) => (
                <tr key={item.tone}>
                  <th scope="row">{item.name}</th>
                  {([undefined, "hover", "pressed", "focus"] as const).map((snapshot) => (
                    <td key={snapshot ?? "default"}><CandidateButton tone={item.tone} label={item.label}
                      loadingLabel={item.busy} icon={iconFor(item.tone)} snapshot={snapshot} /></td>
                  ))}
                  <td><CandidateButton tone={item.tone} label={item.label} loadingLabel={item.busy} icon={iconFor(item.tone)} loading /></td>
                  <td><CandidateButton tone={item.tone} label={item.label} loadingLabel={item.busy} icon={iconFor(item.tone)} disabled /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
      <footer className={styles.footer}>审核通过后，将确认的规则回填公共 Button 与正式规范；删除此临时路由、专属样式及导航入口。不保留第二套组件。</footer>
    </main>
  )
}
