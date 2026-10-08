"use client"

import { useMemo, useState } from "react"
import type { DirectorySelections, TextbookDefinition } from "@/components/prism-next/textbook-directory"
import { ExplorationDirectory } from "./directory-picker"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Toggle } from "@/components/coss/toggle"
import { Button } from "@/components/coss/button"
import { OutlineView, DrillView, AncestorView, ExplorationFacts } from "./directory-views"
import { explorationBooks } from "./directory-fixture"
import type { DirectoryData, DirectoryKind } from "@/lib/prism-next/textbook-directory"
import "./tree-directory.css"

const variants = [
  { id: "A", title: "大纲树", idea: "窄缩进与引导线，完整浏览教材结构。", View: OutlineView },
  { id: "B", title: "逐级钻取", idea: "每次只看一级，选择与进入下级分开。", View: DrillView },
  { id: "C", title: "吸顶祖先树", idea: "保留完整树，滚动时始终显示当前祖先路径。", View: AncestorView },
]

export function initialDirectoryPath(data: DirectoryData) {
  return Object.values(data.paths).reduce<string[]>((longest, path) => path.length > longest.length ? path : longest, []).slice(0, -1)
}

function Choices({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <div className="grid gap-2"><p className="text-ui-action">{label}</p><ToggleGroup aria-label={label} multiple={false} value={[value]} onValueChange={values => { if (values[0]) onChange(values[0]) }} className="flex-wrap">
    {options.map(option => <ToggleGroupItem key={option} value={option}>{option}</ToggleGroupItem>)}
  </ToggleGroup></div>
}

function ComparisonPanel({ variant, books, kind, onKindChange, width, callbackMode }: {
  variant: typeof variants[number]; books: TextbookDefinition[]; kind: DirectoryKind; onKindChange: (kind: DirectoryKind) => void; width: string; callbackMode: boolean
}) {
  const [switchRequests, setSwitchRequests] = useState(0)
  const [selections, setSelections] = useState<DirectorySelections>({})
  const entries = books.flatMap(book => (["course", "knowledge"] as DirectoryKind[]).flatMap(type => (selections[`${book.id}:${type}`] ?? []).map(id => ({ id, title: book.directories[type].nodes[id]?.title ?? id }))))
  return <section id={`directory-${variant.id}`} className="min-w-0 scroll-mt-6 space-y-3" aria-label={`${variant.id} 版${variant.title}`}>
    <div><div className="flex flex-wrap items-center gap-x-4 gap-y-1"><h2 className="text-block-title">{variant.id} · {variant.title}</h2><nav aria-label={`${variant.id} 版比较跳转`} className="flex gap-3 text-ui-hint">{variants.map(target => <a key={target.id} href={`#directory-${target.id}`} className="text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-ring">跳到 {target.id}</a>)}</nav></div><p className="text-ui-hint">{variant.idea}</p></div>
    <div className="directory-exploration-frame max-w-full border p-2" style={{ width: Number(width) }}>
      <ExplorationDirectory textbooks={books} selections={selections} onSelectionsChange={setSelections} kind={kind} onKindChange={onKindChange} View={variant.View} initialExpanded={initialDirectoryPath} onTextbookSwitch={callbackMode ? () => setSwitchRequests(value => value + 1) : undefined} />
    </div>
    <p className="max-w-full break-words text-ui-hint" style={{ width: Number(width) }}>{entries.length === 1 ? `宿主已选：${entries[0].title}` : entries.length ? `宿主已选 ${entries.length} 个叶节点` : "宿主未选择，显示全部。"}</p>
    <details className="max-w-full text-ui-hint" style={{ width: Number(width) }}>
      <summary className="cursor-pointer">宿主选择回显 · {entries.length} 个叶节点</summary>
      {entries.length ? <ul className="mt-2 space-y-2">{entries.map(entry => <li key={entry.id} className="break-words">{entry.title}<code className="block break-all text-ui-hint">{entry.id}</code></li>)}</ul> : <p>未选择，宿主显示全部。</p>}
    </details>
    {callbackMode && <p role="status" className="text-ui-hint">宿主收到 {switchRequests} 次教材切换请求；未接入教材服务。</p>}
    <p role="status" className="sr-only">{variant.id} 版宿主收到 {entries.length} 个叶节点。</p>
  </section>
}

export function TreeDirectoryExploration() {
  const [width, setWidth] = useState("280")
  const [depth, setDepth] = useState("5")
  const [bookMode, setBookMode] = useState("多教材")
  const [kind, setKind] = useState<DirectoryKind>("course")
  const [callbackMode, setCallbackMode] = useState(false)
  const [showCounts, setShowCounts] = useState(true)
  const [reset, setReset] = useState(0)
  const fixture = useMemo(() => explorationBooks(depth), [depth])
  const books = bookMode === "单教材" ? fixture.books.slice(0, 1) : fixture.books
  return <div className="directory-exploration-layout space-y-6">
    <p className="text-ui-body">A 看全貌，B 逐级进入，C 滚动保留祖先位置；三版共用教材数据和选择规则。</p>
    <div className="flex flex-wrap items-end gap-4">
      <Choices label="容器宽度（px）" value={width} options={["240", "280", "320"]} onChange={setWidth} />
      <Choices label="数据层级" value={depth} options={["2", "3", "4", "5"]} onChange={setDepth} />
      <Choices label="教材数量" value={bookMode} options={["单教材", "多教材"]} onChange={setBookMode} />
      <Choices label="目录种类（三版同步）" value={kind === "course" ? "课程目录" : "知识点目录"} options={["课程目录", "知识点目录"]} onChange={value => setKind(value === "课程目录" ? "course" : "knowledge")} />
      <Toggle pressed={callbackMode} onPressedChange={setCallbackMode}>宿主接管教材切换</Toggle>
      <Toggle pressed={showCounts} onPressedChange={setShowCounts} aria-label="显示题数">显示题数</Toggle>
      <Button variant="outline" onClick={() => setReset(value => value + 1)}>重置三版选择与位置</Button>
    </div>
    <p className="text-ui-hint">教材及题数均为演示数据，包含 0 与未提供题数；切换层级或教材数量会重置三版，其他展示开关保留选择。每版选择独立，可按同一路径比较。</p>
    <ExplorationFacts.Provider value={{ counts: fixture.counts, showCounts, initialPath: initialDirectoryPath }}>
      <div className="directory-exploration-comparison grid items-start gap-6">
        {variants.map(variant => <ComparisonPanel key={`${depth}:${bookMode}:${reset}:${variant.id}`} variant={variant} books={books} kind={kind} onKindChange={setKind} width={width} callbackMode={callbackMode} />)}
      </div>
    </ExplorationFacts.Provider>
  </div>
}
