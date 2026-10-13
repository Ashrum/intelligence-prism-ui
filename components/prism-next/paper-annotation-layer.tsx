"use client"

import type { CSSProperties, ReactNode } from "react"
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from "@/components/coss/tooltip"

export type PaperAnnotation = {
  id: string
  /** One-based slot in the complete, ordered pages array (including missing/digital pages). */
  page: number
  /** Normalized source coordinates, before viewing rotation. */
  rect: { x: number; y: number; width: number; height: number }
  mark?: "correct" | "partial" | "wrong" | "blank"
  score?: { earned: number; full: number }
  note?: string
}
export type PaperTotal = { earned: number; full: number; page: number; anchor?: "top-right" | "top-left" }
export type PaperAnnotationOptions = {
  annotations?: readonly PaperAnnotation[]
  annotationsVisible?: boolean
  paperTotal?: PaperTotal
}
export type PaperAnnotationPageProps = {
  /** Physical page dimensions in mm; swap width/height for landscape. */
  pageSize: { width: number; height: number }
  /** Calibration translation in mm: positive x = right, positive y = down. */
  offset?: { x: number; y: number }
  className?: string
  /** Layout only. Omit for true physical mm size; screen hosts may scale the container. */
  style?: CSSProperties
}
export type PaperAnnotationLayerProps = PaperAnnotationPageProps & PaperAnnotationOptions & { page: number }

const WIDTH = 800
const labels = { correct: "正确", partial: "部分正确", wrong: "错误", blank: "未作答" }
const validSize = (size: PaperAnnotationPageProps["pageSize"]) => Number.isFinite(size.width) && size.width > 0 && Number.isFinite(size.height) && size.height > 0
const validPage = (page: number) => Number.isInteger(page) && page > 0
const validScore = (score: { earned: number; full: number }) => Number.isFinite(score.earned) && Number.isFinite(score.full)
function validAnnotation(item: PaperAnnotation) {
  const { x, y, width, height } = item.rect
  return validPage(item.page) && [x, y, width, height].every(Number.isFinite) && x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= 1 && y + height <= 1
}
function scoreText(item: PaperAnnotation) {
  if (!item.score || !validScore(item.score)) return undefined
  return item.mark === "correct" && item.score.earned === item.score.full ? `${item.score.earned}` : `${item.score.earned} / ${item.score.full}`
}

/** Conservative full-em cells keep CJK, formulas and long unbroken text inside the paper.
 * No browser measurements: SSR, screen and print share exactly the same line breaks. */
export function paperAnnotationNoteLines(note: string, width: number): string[] {
  const capacity = Math.max(1, Math.floor(width / 12))
  const graphemes = [...new Intl.Segmenter("zh", { granularity: "grapheme" }).segment(note.replace(/\r\n?/g, "\n"))].map(part => part.segment)
  const lines: string[][] = [[]]
  let truncated = false
  for (const char of graphemes) {
    if (char === "\n" || lines.at(-1)!.length >= capacity) {
      if (lines.length === 3) { truncated = true; break }
      lines.push([])
      if (char === "\n") continue
    }
    lines.at(-1)!.push(char)
  }
  if (truncated) lines[2] = [...lines[2].slice(0, capacity - 1), "…"]
  return lines.map(line => line.join(""))
}
function noteLayout(item: PaperAnnotation, height: number) {
  const x = Math.min(item.rect.x * WIDTH, WIDTH - 36)
  const width = Math.min(Math.max(36, item.rect.width * WIDTH), WIDTH - x)
  const lines = paperAnnotationNoteLines(item.note ?? "", width)
  return { x, y: Math.max(0, Math.min((item.rect.y + item.rect.height) * height, height - lines.length * 18)), width, lines }
}
function offsetUnits(pageSize: PaperAnnotationPageProps["pageSize"], offset?: PaperAnnotationPageProps["offset"]) {
  return { x: Number.isFinite(offset?.x) ? offset!.x * WIDTH / pageSize.width : 0, y: Number.isFinite(offset?.y) ? offset!.y * WIDTH / pageSize.width : 0 }
}
function PaperInkFrame({ pageSize, className, style, children }: PaperAnnotationPageProps & { children: ReactNode }) {
  // Existing light destructive text token on physical white paper; never invert with site theme.
  return <div data-paper-annotation-sheet data-agent-preview data-prism-theme="light" className={`relative pointer-events-none ${className ?? ""}`} style={{ width: `${pageSize.width}mm`, height: `${pageSize.height}mm`, color: "var(--destructive-foreground)", ...style }}>{children}</div>
}
function Mark({ mark }: { mark: NonNullable<PaperAnnotation["mark"]> }) {
  return <g data-annotation-mark={mark} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    {(mark === "correct" || mark === "partial") && <path d="M3 13 L10 21 L24 4" />}
    {mark === "partial" && <path d="M14 9 L21 16" />}
    {mark === "wrong" && <path d="M5 5 L21 21 M21 5 L5 21" />}
    {mark === "blank" && <><circle cx={13} cy={13} r={10} /><path d="M6 20 L20 6" /></>}
  </g>
}

/** Transparent, shared screen/overprint drawing. No scan, background, score computation or print side effects. */
export function PaperAnnotationLayer({ annotations = [], annotationsVisible = true, paperTotal, page, pageSize, offset, ...layout }: PaperAnnotationLayerProps) {
  if (!annotationsVisible || !validPage(page) || !validSize(pageSize)) return null
  const items = annotations.filter(item => item.page === page && validAnnotation(item))
  const total = paperTotal?.page === page && validScore(paperTotal) ? paperTotal : undefined
  if (!items.length && !total) return null
  const height = WIDTH * pageSize.height / pageSize.width, shift = offsetUnits(pageSize, offset)
  return <PaperInkFrame pageSize={pageSize} {...layout}>
    <svg data-paper-annotation-layer aria-hidden="true" focusable="false" viewBox={`0 0 ${WIDTH} ${height}`} className="block h-full w-full overflow-hidden" fill="currentColor">
      <g data-annotation-offset transform={`translate(${shift.x} ${shift.y})`}>
        {items.map(item => {
          const score = scoreText(item), note = item.note ? noteLayout(item, height) : undefined
          const groupWidth = (item.mark ? 32 : 0) + (score ? score.length * 10 : 0)
          const x = Math.max(0, Math.min((item.rect.x + item.rect.width) * WIDTH - 26, WIDTH - groupWidth - 8))
          const y = Math.max(0, Math.min(item.rect.y * height, height - 26))
          return <g key={item.id} data-annotation-id={item.id}>
            <g data-annotation-result transform={`translate(${x} ${y})`}>
              {item.mark && <Mark mark={item.mark} />}
              {score !== undefined && <text x={item.mark ? 32 : 0} y={19} className="text-item-title tabular-nums">{score}</text>}
            </g>
            {note && <text data-annotation-note className="text-ui-meta">{note.lines.map((line, index) => <tspan key={index} x={note.x} y={note.y + 12 + index * 18}>{line}</tspan>)}</text>}
          </g>
        })}
        {total && <g data-paper-total={total.anchor ?? "top-right"} transform={`translate(${total.anchor === "top-left" ? 24 : WIDTH - 24} 40)`}>
          <text textAnchor={total.anchor === "top-left" ? "start" : "end"} textDecoration="underline" className="text-page-title tabular-nums">{total.earned} / {total.full}</text>
        </g>}
      </g>
    </svg>
    <ul className="sr-only print:hidden" aria-label={`第 ${page} 页批阅结果`}>
      {items.map(item => <li key={item.id}>批注 {item.id}：{item.mark ? labels[item.mark] : "判定未提供"}；{item.score && validScore(item.score) ? `得 ${item.score.earned} 分，满分 ${item.score.full} 分` : "得分未提供"}{item.note ? `；错因：${item.note}` : ""}</li>)}
      {total && <li>整卷总分：{total.earned} / {total.full}</li>}
    </ul>
    <TooltipProvider><div className="absolute inset-0 print:hidden">
      {items.filter(item => item.note).map(item => {
        const note = noteLayout(item, height)
        return <Tooltip key={item.id}><TooltipTrigger render={<button type="button" />} aria-label={`批注 ${item.id}，错因：${item.note}`} data-annotation-note-trigger={item.id}
          className="pointer-events-auto absolute focus-visible:outline-2 focus-visible:outline-ring" style={{ left: `${(note.x + shift.x) / WIDTH * 100}%`, top: `${(note.y + shift.y) / height * 100}%`, width: `${note.width / WIDTH * 100}%`, height: `${note.lines.length * 18 / height * 100}%` }} onPointerDown={event => event.stopPropagation()} />
          <TooltipPopup className="max-w-80 whitespace-pre-wrap break-words print:hidden">{item.note}</TooltipPopup>
        </Tooltip>
      })}
    </div></TooltipProvider>
  </PaperInkFrame>
}

/** Red-only calibration reference: inset 10 mm crosses and physical 10 mm edge ticks. */
export function PaperAnnotationCalibration({ pageSize, offset, ...layout }: PaperAnnotationPageProps) {
  if (!validSize(pageSize) || pageSize.width < 20 || pageSize.height < 20) return null
  const unit = WIDTH / pageSize.width, height = pageSize.height * unit, shift = offsetUnits(pageSize, offset)
  const cross = (x: number, y: number) => `M${x - 3} ${y}h6 M${x} ${y - 3}v6`
  const crosses = [[10, 10], [pageSize.width - 10, 10], [10, pageSize.height - 10], [pageSize.width - 10, pageSize.height - 10], [pageSize.width / 2, pageSize.height / 2]]
  const xs = Array.from({ length: Math.floor((pageSize.width - 10) / 10) }, (_, i) => (i + 1) * 10)
  const ys = Array.from({ length: Math.floor((pageSize.height - 10) / 10) }, (_, i) => (i + 1) * 10)
  return <PaperInkFrame pageSize={pageSize} {...layout}>
    <svg data-paper-annotation-calibration role="img" aria-label="套打校准页：四角距边 10 毫米十字、中心十字、四边每 10 毫米刻度" viewBox={`0 0 ${WIDTH} ${height}`} className="block h-full w-full overflow-hidden" fill="none" stroke="currentColor">
      <g data-annotation-offset transform={`translate(${shift.x} ${shift.y})`}><g transform={`scale(${unit})`} strokeWidth={.3}>
        {crosses.map(([x, y], i) => <path key={i} data-calibration-cross={i} d={cross(x, y)} />)}
        {xs.map(x => <path key={`x${x}`} data-calibration-tick-x={x} d={`M${x} 8v4 M${x} ${pageSize.height - 12}v4`} />)}
        {ys.map(y => <path key={`y${y}`} data-calibration-tick-y={y} d={`M8 ${y}h4 M${pageSize.width - 12} ${y}h4`} />)}
      </g></g>
    </svg>
  </PaperInkFrame>
}
