"use client"

import { useRef, useState, type CSSProperties } from "react"
import { CheckIcon, MapPinIcon, RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Badge } from "@/components/coss/badge"
import { Field, FieldLabel } from "@/components/coss/field"
import { Textarea } from "@/components/coss/textarea"
import { DemoSection } from "./demo-parts"
import { QuestionSelect } from "./question-controls"
import { QuestionWorkPanel } from "./question-work-panel"
import { scanRegions, scanDecisionError, type ScanDecision, type ScanRegion } from "@/lib/prism-next/visual-analysis-model"

export function AnswerReviewMapDemo() {
  const [selected, setSelected] = useState(scanRegions[0].id)
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState("100")
  const [filter, setFilter] = useState("all")
  const [decisions, setDecisions] = useState<Record<string, ScanDecision>>({})
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ScanDecision>({ text: "", note: "", outcome: "checked" })
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const canvas = useRef<HTMLDivElement>(null)
  const row = scanRegions.find(item => item.id === selected)!
  const pending = scanRegions.filter(item => !decisions[item.id])
  const matches = (item: ScanRegion, value: string) => value === "all" || (value === "pending" ? !decisions[item.id] : item.kind === value)
  const visible = scanRegions.filter(item => matches(item, filter))
  const visiblePending = visible.filter(item => !decisions[item.id])
  const pageRows = scanRegions.filter(item => item.page === page)
  function locate(item: ScanRegion) { setSelected(item.id); setPage(item.page); setOpen(false); setNotice(`已定位第 ${item.page} 页 · 第 ${item.question} 题。`); requestAnimationFrame(() => canvas.current?.querySelector<HTMLElement>(`[data-region="${item.id}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" })) }
  function inspect() { setDraft(decisions[row.id] ?? { text: row.kind === "recognition" ? "8" : row.text, note: "", outcome: "checked" }); setError(""); setOpen(true) }
  function save() { const error = scanDecisionError(row, draft); if (error) { setError(error); return } setDecisions(previous => ({ ...previous, [row.id]: { ...draft } })); setOpen(false); setNotice(`第 ${row.question} 题已记录：${draft.outcome === "rescan" ? "需补扫，问题尚未解决" : "定位核对完成"}。评分保持不变。`) }
  return <DemoSection title="从题号直接定位到答卷区域" description="纸面区域、题号导航与核对记录联动，支持跨页、缩放和逐项处理。">
    <div className="analytics-workspace q-workbench space-y-5">
      <div className="flex flex-wrap items-center gap-3"><Badge variant="outline">答卷排版示意 · 非真实扫描</Badge><span className="text-sm text-muted-foreground">人工预设区域与待核对事项，未运行 OCR 或自动评分。</span></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><QuestionSelect label="答卷问题筛选" value={filter} onChange={value => { setFilter(value); const first = scanRegions.find(item => matches(item, value)); if (first) locate(first); else setOpen(false) }} items={[{ value: "all", label: "全部核对事项" }, { value: "pending", label: "尚未处理" }, { value: "recognition", label: "识别文本" }, { value: "scoring", label: "评分依据" }, { value: "blank", label: "空白区域" }]}/><QuestionSelect label="答卷缩放" value={zoom} onChange={setZoom} items={[{ value: "100", label: "适合宽度" }, { value: "125", label: "放大 125%" }, { value: "150", label: "放大 150%" }]}/></div><span className="text-sm tabular-nums">尚未处理 {pending.length} · 需补扫 {Object.values(decisions).filter(item => item.outcome === "rescan").length}</span></div>
      <div className="review-map-layout"><nav aria-label="答卷题号定位" className="review-map-nav"><p className="mb-3 text-xs text-muted-foreground">2 页 · 4 个核对区域</p>{visible.map(item => <Button key={item.id} variant={selected === item.id ? "secondary" : "ghost"} className="review-map-nav-item" aria-pressed={selected === item.id} onClick={() => locate(item)}><span className="font-medium">第 {item.question} 题 <span className="font-normal text-muted-foreground">· 第 {item.page} 页</span></span><span className="text-xs text-muted-foreground">{decisions[item.id] ? decisions[item.id].outcome === "rescan" ? "需补扫" : "已记录核对" : item.title}</span></Button>)}{!visible.length && <p className="text-sm leading-6 text-muted-foreground">此筛选下没有核对事项。</p>}<Button className="mt-4" size="sm" variant="outline" disabled={!visiblePending.length} onClick={() => { const index = visiblePending.findIndex(item => item.id === selected); locate(visiblePending[(index + 1) % visiblePending.length]) }}>下一个未处理</Button></nav>
        <div className="min-w-0 space-y-3"><div className="flex items-center justify-between gap-3 text-sm"><span>第 {page} / 2 页</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 1} onClick={() => locate(scanRegions.find(item => item.page === 1)!)}>上一页</Button><Button size="sm" variant="outline" disabled={page === 2} onClick={() => locate(scanRegions.find(item => item.page === 2)!)}>下一页</Button></div></div>
          <div className="review-sheet-viewport" ref={canvas} tabIndex={0} aria-label="可滚动的答卷示意页"><div className="review-sheet" style={{ width: `${zoom}%` }}>
            <header className="review-sheet-heading"><p>函数应用 · 答卷示意</p><span>SYN-SCAN · 第 {page} 页</span><hr/><span>以下为排版文本，定位区域用于交互演示。</span></header>
            {pageRows.map(item => <div key={item.id} className="review-sheet-region" data-region={item.id} style={{ left: `${item.rect[0]}%`, top: `${item.rect[1]}%`, width: `${item.rect[2]}%`, height: `${item.rect[3]}%` } as CSSProperties}>
              <div className="review-sheet-answer"><h4>第 {item.question} 题</h4><p>{item.text || "（此区域未见作答文字）"}</p>{item.kind === "scoring" && <span>作答区 · 保留原记录，等待教师对照题意</span>}</div>
              <button type="button" className="review-region-hit" data-selected={selected === item.id} data-checked={decisions[item.id]?.outcome === "checked"} aria-label={`定位第 ${item.question} 题：${item.title}`} aria-pressed={selected === item.id} onClick={() => locate(item)}><span>{decisions[item.id]?.outcome === "checked" ? <CheckIcon/> : <MapPinIcon/>}第 {item.question} 题</span></button>
            </div>)}
            <footer className="review-sheet-footer">答卷示意 · 原纸面保持白底深字 · {page} / 2</footer>
          </div></div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="text-sm font-medium">{matches(row, filter) ? "当前" : "最近定位（不在筛选内）"}：第 {row.question} 题 · {row.title}</p><p className="mt-1 text-xs leading-6 text-muted-foreground">{row.id} · {decisions[row.id] ? decisions[row.id].outcome === "rescan" ? "已申请补扫，仍需跟进" : "已记录定位核对" : "等待核对"}</p></div><Button aria-controls={`scan-review-${row.id}`} onClick={inspect}>核对当前区域</Button></div>
        </div></div>
      <p role="status" className="min-h-6 text-sm">{notice || "选择题号或纸面标记，再打开当前区域核对。查看区域不会自动标记完成。"}</p>
      <QuestionWorkPanel id={`scan-review-${row.id}`} open={open} title="核对答卷区域" description={`第 ${row.page} 页 · 第 ${row.question} 题 · ${row.id}`} onClose={() => setOpen(false)} footer={<><Button onClick={save}>保存核对记录</Button><Button variant="outline" onClick={() => setOpen(false)}>取消</Button></>}>
        <div className="space-y-5 text-sm leading-7"><Badge variant="outline">演示数据 · 不修改题目评分</Badge><section><h3 className="font-semibold">纸面原记录</h3><blockquote className="mt-3 border-l-2 pl-4">{row.text || "该区域为空，尚未判断是否漏扫。"}</blockquote></section><p>{row.expected}</p>{row.kind === "recognition" && <Field><FieldLabel htmlFor="scan-corrected">核对后的识别文本</FieldLabel><Textarea id="scan-corrected" value={draft.text} onChange={event => setDraft({ ...draft, text: event.target.value })}/></Field>}<Field><FieldLabel>处理结论</FieldLabel><QuestionSelect label="区域核对结论" value={draft.outcome} onChange={outcome => setDraft({ ...draft, outcome: outcome as ScanDecision["outcome"] })} items={[{ value: "checked", label: "区域已核对，保留记录" }, { value: "rescan", label: "需要补扫，继续跟进" }]}/></Field><Field><FieldLabel htmlFor="scan-review-note">核对依据</FieldLabel><Textarea id="scan-review-note" placeholder="记录看到的原始内容及需要继续处理的问题" value={draft.note} onChange={event => setDraft({ ...draft, note: event.target.value })}/></Field>{error && <p role="alert" className="text-destructive-foreground">{error}</p>}{decisions[row.id] && <Button variant="ghost" onClick={() => { setDecisions(previous => { const next = { ...previous }; delete next[row.id]; return next }); setOpen(false); setNotice(`第 ${row.question} 题已恢复待处理。`) }}><RotateCcwIcon/>恢复待处理</Button>}</div>
      </QuestionWorkPanel>
    </div>
  </DemoSection>
}
