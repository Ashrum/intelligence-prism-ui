"use client"

import { useRef, useState } from "react"
import { Button } from "../button"
import { QuestionCard } from "../question-card"
import { questionSamples } from "../fixtures/question-samples"
import { AgentCollectionBasket, type AgentCollectionBasketProps, type AgentCollectionChange, type AgentCollectionEntry, type AgentCollectionGroup, type AgentCollectionIdentity, type AgentCollectionIntent, type AgentCollectionItem, type AgentCollectionSync } from "../agent-collection-basket"

const move = { up: {}, down: {} }
const preparationGroups = [{ id: "intro", label: "课堂导入", count: 2 }, { id: "reading", label: "拓展阅读", count: 1 }]
const groupOptions = [{ id: null, label: "未分组" }, ...preparationGroups.map(({ id, label }) => ({ id, label }))]
export const collectionBasketExamples: Record<"questions" | "preparation", { collection: AgentCollectionIdentity; items: AgentCollectionItem[]; groups: AgentCollectionGroup[]; destination: string }> = {
  questions: {
    collection: { id: "example-questions", title: "单元练习试题篮（示例）", type: "题目集合", source: "本页选题示例", version: "示例集合 v1" },
    items: questionSamples.slice(0, 3).map((question, index): AgentCollectionEntry => ({
      id: question.id, title: question.title, type: question.kind, source: "示例题库", version: "题目示例 v1",
      summary: index === 0 ? "含根式与分式条件，完整题干可在管理视图核对。" : undefined,
      fields: [{ label: "分值", value: `${question.points} 分` }], selectable: {},
      issue: index === 2 ? { state: "invalid", reason: "示例题库已下架此题，使用前请移除或查看替代题。" } : undefined,
      actions: { remove: {}, move, ...(index === 2 ? { resolve: [{ id: "replacement", label: "查看替代题" }] } : {}) },
    })),
    groups: [], destination: "用于组卷",
  },
  preparation: {
    collection: { id: "example-preparation", title: "《火烧云》备课素材包（示例）", type: "教学素材集合", source: "本页备课示例", version: "示例集合 v1" },
    groups: preparationGroups, destination: "用于备课",
    items: [
      { id: "cloud-image", title: "傍晚天空中火烧云的颜色与形态变化图片", type: "图片", source: "课堂素材库（示例）", version: "图片 v2", groupId: "intro", summary: "用于观察色彩与形态。", selectable: {}, actions: { remove: {}, move, group: { options: groupOptions } } },
      { id: "cloud-video", title: "从云层移动观察晚霞变化的短视频", type: "视频", source: "教学资源库（示例）", version: "视频 v1", groupId: "intro", fields: [{ label: "时长", value: "02:10" }], selectable: {}, actions: { remove: {}, move, group: { options: groupOptions } } },
      { id: "cloud-article", title: "课文中的比喻与观察顺序：从一句话到完整段落的阅读材料", type: "文章", source: "校本资料（示例）", version: "文章 v3", groupId: "reading", summary: "带着观察顺序与修辞两个问题阅读。", selectable: {}, actions: { remove: {}, move, group: { options: groupOptions } } },
    ],
  },
}

/** Fixture host owns the only example list. No Provider, storage, network or business handoff. */
export function CollectionBasketExample({ purpose, narrow }: { purpose: keyof typeof collectionBasketExamples; narrow: boolean }) {
  const example = collectionBasketExamples[purpose]
  const [items, setItems] = useState<readonly AgentCollectionItem[]>(example.items)
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([])
  const [groupBy, setGroupBy] = useState<"none" | "group">("none")
  const [sync, setSync] = useState<AgentCollectionSync>({ state: "local" })
  const [changes, setChanges] = useState<readonly AgentCollectionChange[]>([])
  const [revision, setRevision] = useState(1)
  const [feedback, setFeedback] = useState("尚未请求操作。")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement | null>(null)
  const sequence = useRef(0)

  function act(intent: AgentCollectionIntent) {
    if (intent.kind === "destination") { setFeedback(`已请求${example.destination}；此示例未创建试卷或教案。`); return }
    if (intent.kind === "resolve") { setFeedback("已请求查看替代题；此示例未连接题库，原失效记录保留。"); return }
    if (intent.kind === "sync") { setFeedback("已请求检查同步；没有取得新记录，同步状态保持不变。"); return }
    let next = [...items]
    if (intent.kind === "remove" || intent.kind === "clear" || intent.kind === "batch") {
      const ids = intent.kind === "remove" ? [intent.itemId] : intent.targets.map(target => target.itemId)
      next = next.filter(item => !ids.includes(item.id))
      setSelectedIds(previous => previous.filter(id => !ids.includes(id)))
      setChanges([{ id: `example-change-${++sequence.current}`, kind: "removed", description: `本页示例中的 ${ids.length} 项` }])
      setFeedback("本页示例已移除所选条目；原题目与素材保留。")
    } else if (intent.kind === "move") {
      const from = next.findIndex(item => item.id === intent.itemId), to = next.findIndex(item => item.id === intent.adjacentId)
      if (from < 0 || to < 0) return
      ;[next[from], next[to]] = [next[to], next[from]]
      setFeedback("本页示例顺序已调整。")
    } else if (intent.kind === "group") {
      next = next.map(item => item.id === intent.itemId && item.access !== "restricted" ? { ...item, groupId: intent.groupId } : item)
      setFeedback("本页示例分组已调整。")
    }
    setItems(next); setRevision(value => value + 1); setSync({ state: "local" })
  }

  const common: AgentCollectionBasketProps = {
    collection: { ...example.collection, version: `示例集合 v${revision}` }, items,
    // These values belong to this fixture host, never to the collection component.
    summary: { count: items.length, unit: purpose === "questions" ? "道题" : "项", fields: purpose === "questions" ? [{ label: "总分（含失效题）", value: `${items.reduce((sum, item) => sum + (questionSamples.find(question => question.id === item.id)?.points ?? 0), 0)} 分` }] : undefined },
    groups: example.groups.map(group => ({ ...group, count: items.filter(item => item.access !== "restricted" && item.groupId === group.id).length })),
    sync, changes, selectedIds, onSelectionChange: setSelectedIds, groupBy, onGroupByChange: setGroupBy, onAction: act,
    inlineLimit: 1,
    clear: { id: "clear", label: "清空集合", disabledReason: items.length ? undefined : "集合已经为空。" },
    destinations: [{ id: "prepare", label: example.destination, disabledReason: items.length ? undefined : "请先选择条目。" }],
    batchActions: [{ id: "remove-selected", label: "移除已选", itemIds: selectedIds, disabledReason: selectedIds.length ? undefined : "请先选择条目。" }],
    onExpand: button => { trigger.current = button; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest" }) },
    renderItem: purpose === "questions" ? item => {
      const question = questionSamples.find(question => question.id === item.id)
      return question ? <QuestionCard question={question} compact showPoints={false} /> : null
    } : undefined,
    notice: "仅为本页示例；刷新后还原。",
    details: <p>题目分值与分组数量由本页示例提供。加入集合不代表已读取材料、创建成果或发布；真实同步和去向服务尚未接入。</p>,
  }
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例 · 三处呈现共用同一份本页集合与选择。</p>
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="同步记录示例"><span className="text-ui-action">同步记录</span>
      {(["local", "synced", "failed", "unknown"] as const).map(state => <Button key={state} type="button" size="navigation" variant="outline" aria-pressed={sync.state === state}
        onClick={() => setSync(state === "failed" ? { state, description: "示例同步服务未保存本次修改，集合仍在本页。", action: { id: "check-sync", label: "检查同步" } } : { state, ...(state === "unknown" ? { description: "示例保存记录暂不可核对。" } : {}) })}>
        {({ local: "本页暂存", synced: "已同步（示例）", failed: "同步失败", unknown: "状态未确认" })[state]}
      </Button>)}
      <Button type="button" variant="outline" size="navigation" onClick={() => { setItems([]); setSelectedIds([]); setChanges([]); setSync({ state: "local" }); setRevision(value => value + 1) }}>空集合示例</Button>
      <Button type="button" variant="outline" size="navigation" onClick={() => {
        setItems(example.items); setSelectedIds([]); setRevision(value => value + 1); setSync({ state: "local" })
        setChanges([{ id: `example-change-${++sequence.current}`, kind: "added", description: `${example.items.length} 项固定示例` }])
      }}>载入示例集合</Button>
    </div>
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "对话摘要"], ["workspace", "default", "完整集合管理"], ["inline", "compact", "紧凑集合摘要"],
    ] as const).map(([view, density, label]) => <section key={label} ref={view === "workspace" ? workspace : undefined} tabIndex={view === "workspace" ? -1 : undefined}
      aria-label={label} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentCollectionBasket {...common} view={view} density={density} />
    </section>)}</div>
  </div>
}

export function AgentCollectionBasketDemo() {
  const [purpose, setPurpose] = useState<keyof typeof collectionBasketExamples>("questions")
  const [narrow, setNarrow] = useState(false)
  return <section id="collection-basket" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">集合篮 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["questions", "preparation"] as const).map(value => <Button key={value} type="button" size="navigation" variant={purpose === value ? "secondary" : "outline"}
      aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "questions" ? "试题篮示例" : "备课素材包示例"}</Button>)}
      <Button type="button" size="navigation" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <CollectionBasketExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
