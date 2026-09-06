"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { ComponentProps, ReactNode, RefObject } from "react"
import Link from "next/link"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import styles from "./review.module.css"

type Density = "comfortable" | "compact"
type TabsKind = "page" | "surface"
type Option = {
  value: string
  label: string
  content: ReactNode
  count?: number
  disabled?: boolean
}

const pageOptions: Option[] = [
  { value: "overview", label: "概览", content: "今日新增 128 份教育证据，6 项等待人工复核。" },
  { value: "evidence", label: "教育证据", content: "证据来源覆盖课堂观察、作业表现与阶段测评。" },
  { value: "records", label: "处理记录", content: "最近一次批量处理于 14:32 完成，未发现异常记录。" },
]

const surfaceOptions: Option[] = [
  { value: "summary", label: "摘要", content: "本周期学习表现稳定，知识掌握度较上周提升 4.2%。" },
  { value: "details", label: "明细", content: "共采集 128 份证据，其中 116 份已完成结构化处理。" },
  { value: "sources", label: "来源", content: "课堂观察 48 份、作业表现 52 份、阶段测评 28 份。" },
]

const pageBoundaryOptions: Option[] = [
  { value: "all", label: "全部教育证据", content: "显示当前范围内的全部教育证据。", count: 128 },
  { value: "long", label: "跨学科学习过程长期趋势", content: "长标签保持完整，不压缩文字。", count: 24 },
  { value: "disabled", label: "已归档记录", content: "禁用项不可激活。", count: 8, disabled: true },
]

const segmentedBoundaryOptions: Option[] = [
  { value: "learner", label: "按学生成长证据组织", content: "按学生组织长期证据链。", count: 36 },
  { value: "knowledge", label: "按题目与知识点组织", content: "按题目与知识点聚合诊断结果。", count: 128 },
  { value: "class", label: "班级视角", content: "该视角暂不可用。", disabled: true },
]

function keepOptionVisible(option: HTMLElement) {
  const viewport = option.closest<HTMLElement>("[data-review-scroll]")
  if (!viewport) return
  const optionRect = option.getBoundingClientRect()
  const viewportRect = viewport.getBoundingClientRect()
  const inset = 4
  if (optionRect.left < viewportRect.left + inset) {
    viewport.scrollLeft -= viewportRect.left + inset - optionRect.left
  } else if (optionRect.right > viewportRect.right - inset) {
    viewport.scrollLeft += optionRect.right - viewportRect.right + inset
  }
}

function useMovingIndicator(
  trackRef: RefObject<HTMLElement | null>,
  activeSelector: string,
  targetSelector?: string,
) {
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    let readyFrame = 0
    let initialized = false

    const measure = () => {
      const active = track.querySelector<HTMLElement>(activeSelector)
      const target = targetSelector ? active?.closest<HTMLElement>(targetSelector) : active
      if (!target) return

      track.style.setProperty("--indicator-x", `${target.offsetLeft}px`)
      track.style.setProperty("--indicator-y", `${target.offsetTop}px`)
      track.style.setProperty("--indicator-width", `${target.offsetWidth}px`)
      track.style.setProperty("--indicator-height", `${target.offsetHeight}px`)
      track.dataset.indicatorVisible = "true"

      const focusedOption = document.activeElement instanceof HTMLElement
        ? document.activeElement.closest<HTMLElement>("[data-review-option]")
        : null
      keepOptionVisible(focusedOption && track.contains(focusedOption) ? focusedOption : target)

      if (!initialized) {
        initialized = true
        readyFrame = requestAnimationFrame(() => {
          track.dataset.indicatorReady = "true"
        })
      }
    }

    track.dataset.indicatorReady = "false"
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(track)
    track.querySelectorAll<HTMLElement>("[data-review-option]").forEach((option) => resizeObserver.observe(option))

    const mutationObserver = new MutationObserver(measure)
    mutationObserver.observe(track, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "disabled"],
    })

    measure()
    void document.fonts?.ready.then(measure)

    return () => {
      cancelAnimationFrame(readyFrame)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      delete track.dataset.indicatorReady
      delete track.dataset.indicatorVisible
    }
  }, [activeSelector, targetSelector, trackRef])
}

function OptionLabel({ option, id }: { option: Option; id?: string }) {
  return (
    <span id={id} className={styles.optionLabel}>
      <span>{option.label}</span>
      {typeof option.count === "number" && <span className={styles.count}>{option.count}</span>}
    </span>
  )
}

type MovingTabsProps = Omit<ComponentProps<typeof Tabs>, "children"> & {
  kind: TabsKind
  label: string
  options: Option[]
  narrow?: boolean
}

function MovingTabs({ kind, label, options, narrow = false, ...props }: MovingTabsProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  useMovingIndicator(trackRef, '[data-slot="tabs-trigger"][data-state="active"]')

  return (
    <Tabs {...props} className={styles.tabsRoot}>
      <div className={`${styles.scroller} ${narrow ? styles.narrow : ""}`} data-review-scroll>
        <TabsList
          ref={trackRef}
          variant={kind === "page" ? "line" : "default"}
          aria-label={label}
          className={`${styles.tabsTrack} ${kind === "page" ? styles.pageTrack : styles.surfaceTrack}`}
        >
          <span
            aria-hidden="true"
            className={kind === "page" ? styles.pageIndicator : styles.surfaceIndicator}
            data-review-indicator
          />
          {options.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              data-review-option
              className={`${styles.tabTrigger} ${kind === "page" ? styles.pageTrigger : styles.surfaceTrigger}`}
            >
              <OptionLabel option={option} />
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className={styles.panelFrame}>
        {options.map((option) => (
          <TabsContent key={option.value} value={option.value} className={styles.panel}>
            {option.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}

function CurrentTabs({
  kind,
  label,
  options,
  ...props
}: Omit<MovingTabsProps, "narrow">) {
  return (
    <Tabs
      {...props}
      className={`${kind === "page" ? "page-tabs" : "surface-tabs"} ${styles.currentTabsRoot}`}
    >
      <TabsList
        variant={kind === "page" ? "line" : "default"}
        aria-label={label}
        className={`${kind === "page" ? "page-tabs-list" : "surface-tabs-list"} ${kind === "page" ? styles.currentPageTrack : styles.currentSurfaceTrack}`}
      >
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={`${kind === "page" ? "page-tabs-trigger" : "surface-tabs-trigger"} ${styles.currentTabTrigger}`}
          >
            <OptionLabel option={option} />
          </TabsTrigger>
        ))}
      </TabsList>
      <div className={styles.panelFrame}>
        {options.map((option) => (
          <TabsContent key={option.value} value={option.value} className={styles.panel}>
            {option.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}

type SegmentedProps = Omit<ComponentProps<typeof RadioGroup>, "children"> & {
  idPrefix: string
  label: string
  options: Option[]
  narrow?: boolean
}

function MovingSegmented({ idPrefix, label, options, narrow = false, ...props }: SegmentedProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  useMovingIndicator(
    trackRef,
    '[data-slot="radio-group-item"][data-state="checked"]',
    '[data-review-segment-label="true"]',
  )

  return (
    <div className={`${styles.scroller} ${narrow ? styles.narrow : ""}`} data-review-scroll>
      <RadioGroup
        {...props}
        ref={trackRef}
        aria-label={label}
        orientation="horizontal"
        className={styles.segmentTrack}
      >
        <span aria-hidden="true" className={styles.segmentIndicator} data-review-indicator />
        {options.map((option) => {
          const labelId = `${idPrefix}-${option.value}-label`
          return (
            <Label
              key={option.value}
              data-review-option
              data-review-segment-label="true"
              data-disabled={option.disabled || undefined}
              className={styles.segmentLabel}
            >
              <RadioGroupItem
                value={option.value}
                disabled={option.disabled}
                aria-labelledby={labelId}
                className={styles.segmentItem}
                onFocus={(event) => {
                  // Keep selection with focus even when a short keypress ends before Radix moves focus.
                  if (event.currentTarget.dataset.state !== "checked") event.currentTarget.click()
                }}
              />
              <OptionLabel id={labelId} option={option} />
            </Label>
          )
        })}
      </RadioGroup>
    </div>
  )
}

function CurrentSegmented({ idPrefix, label, options, ...props }: SegmentedProps) {
  return (
    <RadioGroup
      {...props}
      aria-label={label}
      orientation="horizontal"
      className={`segmented-control segmented-control--md ${styles.currentSegmentTrack}`}
    >
      {options.map((option) => {
        const labelId = `${idPrefix}-${option.value}-label`
        return (
          <Label key={option.value} className={`segmented-item-label ${styles.currentSegmentLabel}`}>
            <RadioGroupItem
              value={option.value}
              disabled={option.disabled}
              aria-labelledby={labelId}
              className="segmented-item"
            />
            <OptionLabel id={labelId} option={option} />
          </Label>
        )
      })}
    </RadioGroup>
  )
}

function PerspectivePanel({ value }: { value: string }) {
  return (
    <div className={styles.perspective} data-perspective={value} aria-live="polite">
      {value === "student" ? (
        <>
          <strong>学生视角</strong>
          <p>按学生聚合课堂、作业与测评证据，优先呈现成长变化。</p>
        </>
      ) : (
        <>
          <strong>题目视角</strong>
          <p>按题目与知识点聚合正确率、错因和待复核记录。</p>
        </>
      )}
    </div>
  )
}

function ReviewSection({
  id,
  title,
  description,
  note,
  children,
}: {
  id: string
  title: string
  description: string
  note: string
  children: ReactNode
}) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 id={id}>{title}</h2>
          <p>{description}</p>
        </div>
        <span className={styles.spec}>{note}</span>
      </div>
      {children}
    </section>
  )
}

export default function TabsReviewPage() {
  const [density, setDensity] = useState<Density>("comfortable")
  const [systemMotion, setSystemMotion] = useState("读取中")
  const [currentPage, setCurrentPage] = useState("overview")
  const [candidatePage, setCandidatePage] = useState("overview")
  const [currentSurface, setCurrentSurface] = useState("summary")
  const [candidateSurface, setCandidateSurface] = useState("summary")
  const [currentSegment, setCurrentSegment] = useState("student")
  const [candidateSegment, setCandidateSegment] = useState("student")
  const [boundarySegment, setBoundarySegment] = useState("learner")

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setSystemMotion(media.matches ? "系统已减少动效" : "系统标准动效")
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return (
    <main id="main-content" tabIndex={-1} className={styles.review} data-density={density}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>临时站内评审 · 不影响正式组件</p>
          <h1>Tabs 与 Segmented Control</h1>
          <p>比较选中识别、文字节奏、表面比例与连续切换。Tabs 与单选控件沿用各自语义。</p>
        </div>
        <Link href="/components/tabs" className={styles.back}>返回正式 Tabs →</Link>
      </header>

      <div className={styles.toolbar}>
        <Label className={styles.densityField}>
          <span>界面密度</span>
          <select value={density} onChange={(event) => setDensity(event.currentTarget.value as Density)}>
            <option value="comfortable">舒适 · 36px</option>
            <option value="compact">紧凑 · 32px</option>
          </select>
        </Label>
        <span className={styles.motionStatus}>{systemMotion}</span>
      </div>

      <ReviewSection
        id="page-tabs-review"
        title="Page Tabs"
        description="用于页面一级内容分组；候选以曜蓝文字与移动下划线标识当前页。"
        note="36 / 32px · 间距 24 / 16px · 180ms"
      >
        <div className={styles.comparison}>
          <div className={styles.example}>
            <div className={styles.exampleTitle}><strong>现状</strong><span>每项下划线显隐</span></div>
            <CurrentTabs
              kind="page"
              label="现状 Page Tabs"
              value={currentPage}
              onValueChange={setCurrentPage}
              activationMode="manual"
              options={pageOptions}
            />
          </div>
          <div className={styles.example}>
            <div className={styles.exampleTitle}><strong>候选</strong><span>下划线连续移动</span></div>
            <MovingTabs
              kind="page"
              label="候选 Page Tabs"
              value={candidatePage}
              onValueChange={setCandidatePage}
              activationMode="manual"
              options={pageOptions}
            />
          </div>
        </div>
        <p className={styles.keyboardNote}>手动激活：方向键只移动焦点，Enter 或 Space 才改变选中项与下划线。</p>
        <div className={styles.boundary}>
          <div><strong>窄容器与长标签</strong><span>数量、禁用项、仅选项区域滚动</span></div>
          <MovingTabs
            kind="page"
            label="Page Tabs 边界条件"
            defaultValue="all"
            options={pageBoundaryOptions}
            narrow
          />
        </div>
      </ReviewSection>

      <ReviewSection
        id="surface-tabs-review"
        title="Surface Tabs"
        description="用于同一模块内的内容切换；候选选中表面平滑移动，内容面板不跟随滑动。"
        note="36 / 32px · 外圆角 8px · 内圆角 6px"
      >
        <div className={styles.comparison}>
          <div className={styles.example}>
            <div className={styles.exampleTitle}><strong>现状</strong><span>选中背景即时切换</span></div>
            <CurrentTabs
              kind="surface"
              label="现状 Surface Tabs"
              value={currentSurface}
              onValueChange={setCurrentSurface}
              options={surfaceOptions}
            />
          </div>
          <div className={styles.example}>
            <div className={styles.exampleTitle}><strong>候选</strong><span>白色表面连续移动</span></div>
            <MovingTabs
              kind="surface"
              label="候选 Surface Tabs"
              value={candidateSurface}
              onValueChange={setCandidateSurface}
              options={surfaceOptions}
            />
          </div>
        </div>
      </ReviewSection>

      <ReviewSection
        id="segmented-review"
        title="Segmented Control"
        description="用于即时选择同一内容区的组织方式；保持单选语义，不创建 TabPanel。"
        note="36 / 32px · 单选立即生效 · 180ms"
      >
        <div className={styles.comparison}>
          <div className={styles.example}>
            <div className={styles.exampleTitle}><strong>现状</strong><span>选中背景即时切换</span></div>
            <CurrentSegmented
              idPrefix="current-perspective"
              label="现状查看视角"
              value={currentSegment}
              onValueChange={setCurrentSegment}
              options={[
                { value: "student", label: "学生视角", content: null },
                { value: "question", label: "题目视角", content: null },
              ]}
            />
            <PerspectivePanel value={currentSegment} />
          </div>
          <div className={styles.example}>
            <div className={styles.exampleTitle}><strong>候选</strong><span>选中背景连续移动</span></div>
            <MovingSegmented
              idPrefix="candidate-perspective"
              label="候选查看视角"
              value={candidateSegment}
              onValueChange={setCandidateSegment}
              options={[
                { value: "student", label: "学生视角", content: null },
                { value: "question", label: "题目视角", content: null },
              ]}
            />
            <PerspectivePanel value={candidateSegment} />
          </div>
        </div>
        <div className={styles.boundary}>
          <div><strong>长标签与禁用项</strong><span>完整名称、数量与窄容器滚动</span></div>
          <MovingSegmented
            idPrefix="segment-boundary"
            label="Segmented Control 边界条件"
            value={boundarySegment}
            onValueChange={setBoundarySegment}
            options={segmentedBoundaryOptions}
            narrow
          />
        </div>
      </ReviewSection>
    </main>
  )
}
