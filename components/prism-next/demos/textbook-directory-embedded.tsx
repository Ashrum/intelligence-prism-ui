"use client"

import { useEffect, useMemo, useState } from "react"
import { TextbookDirectory, type DirectorySelections } from "@/components/prism-next/textbook-directory"
import type { TextbookDefinition, TextbookSubject } from "@/components/prism-next/textbook-directory"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Toggle } from "@/components/coss/toggle"
import { Button } from "@/components/coss/button"
import { directoryDemoBooks } from "./fixtures/textbook-directory"
import { clearDirectoryMemory, defaultDirectorySelections, restoreDirectorySelections, restoreDirectoryCurrentNodes, saveDirectorySelections } from "./textbook-directory-memory"
import type { DirectoryKind } from "@/lib/prism-next/textbook-directory"
import "../textbook-directory.css"

function Choices({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <div className="grid gap-2"><p className="text-ui-action">{label}</p><ToggleGroup aria-label={label} multiple={false} value={[value]} onValueChange={values => { if (values[0]) onChange(values[0]) }} className="flex-wrap">
    {options.map(option => <ToggleGroupItem key={option} value={option}>{option}</ToggleGroupItem>)}
  </ToggleGroup></div>
}

function DirectoryPanel({ books, subjects, kind, onKindChange, width, callbackMode, counts }: {
  books: TextbookDefinition[]; subjects: TextbookSubject[]; kind: DirectoryKind; onKindChange: (kind: DirectoryKind) => void; width: string; callbackMode: boolean; counts?: Readonly<Record<string, number>>
}) {
  const [switchRequests, setSwitchRequests] = useState(0)
  const [selections, setSelections] = useState<DirectorySelections>(() => defaultDirectorySelections(books))
  const [currentNodes, setCurrentNodes] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)
  const [reset, setReset] = useState(0)
  // Restore after hydration, before mounting the interactive picker. Never write
  // SSR defaults back over saved values (including an explicitly empty array).
  useEffect(() => {
    const restored = restoreDirectorySelections(books, () => sessionStorage)
    setSelections(restored); setCurrentNodes(restoreDirectoryCurrentNodes(books, restored, () => sessionStorage)); setReady(true)
  }, [books])
  useEffect(() => {
    if (!ready) return
    const saved = saveDirectorySelections(books, selections, () => sessionStorage, currentNodes)
    if (saved !== selections && (JSON.stringify(saved) !== JSON.stringify(selections) || Object.keys(currentNodes).length)) { setSelections(saved); setCurrentNodes({}) }
  }, [books, ready, selections, currentNodes])
  const entries = books.flatMap(book => (["course", "knowledge"] as DirectoryKind[]).flatMap(type => (selections[`${book.id}:${type}`] ?? []).map(id => ({ id, title: book.directories[type].nodes[id]?.title ?? id }))))
  return <section id="embedded-directory" className="min-w-0 space-y-3" aria-label="内嵌大纲目录">
    <h2 className="text-block-title">教材大纲树</h2>
    <Button variant="outline" onClick={() => { clearDirectoryMemory(() => sessionStorage); setSelections(defaultDirectorySelections(books)); setCurrentNodes({}); setReset(value => value + 1) }}>清除记忆，回到首次进入状态</Button>
    <div className="textbook-directory-frame max-w-full border p-2" style={{ width: Number(width) }}>
      {ready ? <TextbookDirectory layout="embedded" titleAction="select" multiSelect="dialog" allOption={{}} counts={counts} key={reset} textbooks={books} subjects={subjects} currentNodes={currentNodes} onCurrentNodesChange={setCurrentNodes} selections={selections} onSelectionsChange={setSelections} kind={kind} onKindChange={onKindChange} onTextbookSwitch={callbackMode ? () => setSwitchRequests(value => value + 1) : undefined} /> : <p role="status" className="text-ui-hint">正在恢复目录选择…</p>}
    </div>
    <details className="max-w-full text-ui-hint" style={{ width: Number(width) }}>
      <summary className="cursor-pointer">宿主选择回显 · {entries.length} 个叶节点</summary>
      {entries.length ? <ul className="mt-2 space-y-2">{entries.map(entry => <li key={entry.id} className="break-words">{entry.title}<code className="block break-all text-ui-hint">{entry.id}</code></li>)}</ul> : <p>全部，宿主不限定目录范围。</p>}
    </details>
    {callbackMode && <p role="status" className="text-ui-hint">宿主收到 {switchRequests} 次教材切换请求；未接入教材服务。</p>}
  </section>
}

export function EmbeddedTextbookDirectoryDemo() {
  const [width, setWidth] = useState("280")
  const [depth, setDepth] = useState("5")
  const [scale, setScale] = useState<"small" | "large">("large")
  const [bookMode, setBookMode] = useState("多教材")
  const [kind, setKind] = useState<DirectoryKind>("course")
  const [callbackMode, setCallbackMode] = useState(false)
  const [showCounts, setShowCounts] = useState(true)
  const fixture = useMemo(() => directoryDemoBooks(depth, scale), [depth, scale])
  const books = useMemo(() => bookMode === "单教材" ? fixture.books.slice(0, 1) : fixture.books, [bookMode, fixture])
  return <div className="textbook-directory-demo space-y-6">
    <p className="text-ui-body">大纲树保留完整教材结构。点标题只看这一项；看全部点“全部”；多选用“多选”按钮，仅选择当前章节或知识点。切换教材时依次选择学科、版本和书册。</p>
    <div className="flex flex-wrap items-end gap-4">
      <Choices label="容器宽度（px）" value={width} options={["240", "280", "320"]} onChange={setWidth} />
      <Choices label="数据层级" value={depth} options={["2", "3", "4", "5"]} onChange={setDepth} />
      <Choices label="教材规模" value={scale === "large" ? "多学科 · 大规模" : "单学科 · 3 版本"} options={["多学科 · 大规模", "单学科 · 3 版本"]} onChange={value => setScale(value === "多学科 · 大规模" ? "large" : "small")} />
      <Choices label="教材数量" value={bookMode} options={["单教材", "多教材"]} onChange={setBookMode} />
      <Choices label="目录种类" value={kind === "course" ? "课程目录" : "知识点目录"} options={["课程目录", "知识点目录"]} onChange={value => setKind(value === "课程目录" ? "course" : "knowledge")} />
      <Toggle pressed={callbackMode} onPressedChange={setCallbackMode}>宿主接管教材切换</Toggle>
      <Toggle pressed={showCounts} onPressedChange={setShowCounts} aria-label="显示题数">显示题数</Toggle>
    </div>
    <p className="text-ui-hint">教材及题数均为演示数据，包含 0 与未提供题数。首次进入课程选第一课，知识点选全部；宿主按教材与目录种类在当前会话中保存选择，刷新后恢复。</p>
      <DirectoryPanel key={`${depth}:${bookMode}:${scale}`} books={books} subjects={fixture.subjects} kind={kind} onKindChange={setKind} width={width} callbackMode={callbackMode} counts={showCounts ? fixture.counts : undefined} />
  </div>
}
