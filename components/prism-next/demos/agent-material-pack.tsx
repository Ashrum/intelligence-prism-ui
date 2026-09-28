"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "../button"
import { AgentObjectViewer } from "../agent-object-viewer"
import {
  AgentMaterialPack, type AgentMaterialPackProps, type AgentMaterialPackIntent,
  type AgentMaterialPackItem, type AgentMaterialPackPreview,
} from "../agent-material-pack"

const availableActions = { remove: {}, move: {}, "edit-note": {}, preview: {}, "open-source": {} }
const videoRestriction = "仅获准在校内课堂播放，跨校使用前需核对许可。"
const invalidSource = "原链接已下架，暂不能预览或打开来源。"
const resource = (resourceId: string, title: string, type: string, categoryId: string, source: string): AgentMaterialPackItem => ({
  resource: { resourceId, versionId: `${resourceId}-v1`, source: { id: source, label: source === "sample-school" ? "校内教学资源（示例）" : "教研组共享资料（示例）" } },
  title, type, categoryId, versionLabel: "第一版", note: "", license: { state: "available", name: "校内教学使用（示例）" },
  availability: { state: "available" }, actions: availableActions,
})
export const materialPackExamples = {
  pythagoras: {
    pack: { id: "sample-pythagoras-pack", title: "勾股定理复习素材包", version: { id: "sample-pack-draft-2", label: "整理稿第二版" }, baseVersion: { id: "sample-pack-v1", label: "第一版" } },
    categories: [{ id: "diagrams", title: "图示", count: 2 }, { id: "videos", title: "视频", count: 1 }, { id: "exercises", title: "练习题", count: 1 }],
    items: [
      { ...resource("sample-area-diagram", "用三个正方形面积解释勾股定理的图示", "图片", "diagrams", "sample-school"), note: "用于提纲中的面积关系回顾。" },
      { ...resource("sample-lost-diagram", "从直角三角形的三边关系逐步推导并核对面积拼合的长中文示意材料", "图片", "diagrams", "sample-school"), availability: { state: "invalid", reason: invalidSource }, actions: { ...availableActions, preview: { disabledReason: invalidSource }, "open-source": { disabledReason: invalidSource } } },
      { ...resource("sample-proof-video", "勾股定理拼图证明短片", "视频", "videos", "sample-school"), license: { state: "restricted", name: "校内课堂许可（示例）", reason: videoRestriction } },
      { ...resource("sample-triangle-exercise", "已知两条直角边求斜边的复习练习", "练习题", "exercises", "sample-school"), note: "先说明各字母对应的边，再代入计算。" },
    ],
    summary: { count: 4, sourceComposition: "校内资源 4 项。", license: "3 项校内教学可用，1 项仅限课堂播放。", availability: "3 项可访问，1 项来源失效。" },
    reuseRecords: [{ id: "sample-reuse-outline", resourceIds: ["sample-area-diagram"], target: { objectId: "sample-lesson-outline", versionId: "sample-outline-v2", label: "勾股定理复习提纲", versionLabel: "第二版", location: "面积关系回顾" }, description: "固定示例记录；引用关系不随整理操作变化。" }],
    changes: ["新增拼图证明短片，练习题归入独立分类。"],
  },
  research: {
    pack: { id: "sample-research-pack", title: "教研共享材料包", version: { id: "sample-research-draft", label: "讨论稿" }, baseVersion: { id: "sample-research-base", label: "共享初稿" } },
    categories: [{ id: "discussion", title: "研讨依据", count: 2 }, { id: "teaching", title: "教学设计", count: 2 }],
    items: [
      { ...resource("sample-research-article", "关于勾股定理多种证明方法的共同研读文章", "文章", "discussion", "sample-research"), license: { state: "unknown", name: null } },
      { ...resource("sample-summary-data", "只含汇总信息的课堂观察材料", "文章", "discussion", "sample-research"), versionLabel: null, resource: { resourceId: "sample-summary-data", versionId: null, source: { id: "sample-research", label: "教研组共享资料（示例）" } }, license: { state: "unknown", name: null } },
      { ...resource("sample-research-outline", "从面积观察到代数表达的共同备课提纲", "提纲", "teaching", "sample-research"), license: { state: "unknown", name: null } },
      { ...resource("sample-research-slides", "例题讲解与错误辨析课件", "课件", "teaching", "sample-research"), license: { state: "unknown", name: null } },
    ],
    summary: { count: 4, sourceComposition: "教研组共享资料 4 项。", license: "全部素材的使用许可尚未确认。", availability: "已提供可查看的示例元信息。" },
    reuseRecords: [{ id: "sample-research-reuse", target: { objectId: "sample-research-discussion", versionId: "sample-discussion-v1", label: "九年级数学教研讨论稿", versionLabel: "第一版", location: "讨论依据" }, description: "固定示例中的已有引用，不表示已向同事共享。" }],
    changes: [],
  },
} satisfies Record<string, Pick<AgentMaterialPackProps, "pack" | "items" | "categories" | "summary" | "reuseRecords" | "changes">>

export type MaterialPackExampleState = typeof materialPackExamples.pythagoras | typeof materialPackExamples.research
/** Example-page editing only; original resource references are kept intact. No save/reuse receipt is produced. */
export function applyMaterialPackExample(state: Pick<AgentMaterialPackProps, "pack" | "items" | "categories" | "summary" | "reuseRecords" | "changes">, intent: AgentMaterialPackIntent) {
  if (intent.packId !== state.pack.id || intent.versionId !== state.pack.version.id || intent.baseVersionId !== state.pack.baseVersion.id) return state
  if (intent.type === "rename-pack") return { ...state, pack: { ...state.pack, title: intent.title } }
  if (intent.type === "category-rename") return { ...state, categories: state.categories.map(category => category.id === intent.categoryId ? { ...category, title: intent.title } : category) }
  if (intent.type === "category-create") {
    let ordinal = state.categories.length + 1
    while (state.categories.some(category => category.id === `example-category-${ordinal}`)) ordinal++
    return { ...state, categories: [...state.categories, { id: `example-category-${ordinal}`, title: `新分类 ${ordinal}`, count: 0 }] }
  }
  // Deleting populated categories is left pending; the page must decide and confirm the destination.
  if (intent.type === "category-delete") return state.items.some(item => item.categoryId === intent.categoryId) ? state : { ...state, categories: state.categories.filter(category => category.id !== intent.categoryId) }
  if (!["move", "remove", "edit-note"].includes(intent.type) || !("resource" in intent)) return state
  const current = state.items.find(item => item.resource.resourceId === intent.resource.resourceId && item.resource.versionId === intent.resource.versionId)
  if (!current) return state
  let next = [...state.items]
  if (intent.type === "edit-note") next = next.map(item => item === current ? { ...item, note: intent.note } : item)
  if (intent.type === "remove") next = next.filter(item => item !== current)
  if (intent.type === "move") {
    if (intent.target.categoryId !== null && !state.categories.some(category => category.id === intent.target.categoryId)) return state
    const rest = next.filter(item => item !== current), siblings = rest.filter(item => item.categoryId === intent.target.categoryId)
    if (!Number.isInteger(intent.target.index) || intent.target.index < 0 || intent.target.index > siblings.length) return state
    const before = siblings[intent.target.index], last = siblings.at(-1)
    const at = before ? rest.indexOf(before) : last ? rest.indexOf(last) + 1 : rest.length
    rest.splice(at, 0, { ...current, categoryId: intent.target.categoryId }); next = rest
  }
  return { ...state, items: next, categories: state.categories.map(category => ({ ...category, count: next.filter(item => item.categoryId === category.id).length })),
    summary: { ...state.summary, count: next.length, sourceComposition: "本页示例已调整，请重新核对来源构成。", license: "请按保留素材的许可说明核对使用范围。", availability: "请按保留素材的可用性说明核对。" } }
}

function MaterialPreview({ item }: { item: AgentMaterialPackItem }) {
  return <AgentObjectViewer object={{ id: item.resource.resourceId, type: item.type, name: "当前素材内容" }}
    version={{ id: item.resource.versionId || "", label: item.versionLabel || "版本未确认", state: "current" }}
    source={item.resource.source.label || undefined} access={{ state: "available", scope: "人工示例，仅供组件评审" }} activeSection="content" view="workspace" density="compact"
    sections={[{ id: "content", title: "内容节选", content: <div className="min-w-0 space-y-3"><p className="text-read-body">直角三角形的两条直角边为 a、b，斜边为 c。</p>
      <div className="max-w-full overflow-x-auto text-read-body"><math><mrow><msup><mi>a</mi><mn>2</mn></msup><mo>+</mo><msup><mi>b</mi><mn>2</mn></msup><mo>=</mo><msup><mi>c</mi><mn>2</mn></msup></mrow></math></div>
      <p className="text-ui-hint">人工内容示意；视频和课件没有接入真实文件，打开预览不生成读取或引用记录。</p></div> }]} />
}

export function MaterialPackExample({ purpose, narrow = false }: { purpose: keyof typeof materialPackExamples; narrow?: boolean }) {
  const [state, setState] = useState<Pick<AgentMaterialPackProps, "pack" | "items" | "categories" | "summary" | "reuseRecords" | "changes">>(materialPackExamples[purpose])
  const [preview, setPreview] = useState<AgentMaterialPackPreview | null>(null)
  const [feedback, setFeedback] = useState("固定示例，尚未发出操作请求。")
  const [view, setView] = useState<"inline" | "workspace">("inline"), [density, setDensity] = useState<"default" | "compact">("default")
  const region = useRef<HTMLElement | null>(null), expand = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (!expand.current) return
    if (view === "workspace") region.current?.focus({ preventScroll: true })
    else region.current?.querySelector<HTMLButtonElement>("[data-material-expand]")?.focus({ preventScroll: true })
  }, [view])
  function receive(intent: AgentMaterialPackIntent) {
    if (intent.type === "preview") {
      setPreview({ packId: intent.packId, versionId: intent.versionId, baseVersionId: intent.baseVersionId, resourceId: intent.resource.resourceId, resourceVersionId: intent.resource.versionId, requestedBy: "user", state: "ready" })
      setFeedback("已打开人工内容示意，复用记录保持原样。"); return
    }
    const next = applyMaterialPackExample(state, intent)
    if (next !== state) {
      setState(next); setPreview(null); setFeedback("本页示例草稿已调整，尚未保存；原资源和已有引用记录保持不变。"); return
    }
    setFeedback(intent.type === "category-delete" ? "已收到删除分类请求，需先决定分类中素材的去向；当前分类与素材保留。"
      : intent.type === "add-request" ? "已收到查找素材请求，接入后由资源检索器提供候选；本示例未添加新素材。"
        : intent.type === "reuse-request" ? "已收到用于其他教学对象的请求，尚未选择目标或形成新引用。"
          : intent.type === "confirm" ? "已收到素材包确认请求，尚未保存。" : "已收到打开来源请求，本示例未连接原始资源。")
  }
  const common: AgentMaterialPackProps = { ...state, save: { state: "unsaved" }, onIntent: receive,
    actions: { "add-request": {}, "category-create": {}, "category-rename": {}, "category-delete": {}, "rename-pack": {}, "reuse-request": purpose === "research" ? { disabledReason: "共享许可尚未确认，请先核对目标对象的使用范围。" } : {}, confirm: {} },
    preview, renderPreview: item => <MaterialPreview item={item} />,
    onExpand: button => { expand.current = button; setView("workspace") },
    onBack: () => { setView("inline"); setPreview(null) },
    details: <p>分类、备注和顺序由本页示例维护，不保存到资料库。删除有内容的分类先保留原样，等待决定素材去向；确认、复用和打开来源均只显示请求反馈。</p>,
  }
  return <div className="min-w-0 space-y-4">
    <p className="text-ui-hint">固定示例；来源、许可、保存和复用记录均为评审样本，没有连接真实服务。</p>
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" aria-pressed={density === "compact"} onClick={() => setDensity(value => value === "default" ? "compact" : "default")}>紧凑密度</Button>
      {preview && <Button type="button" variant="outline" onClick={() => setPreview(null)}>收起素材预览</Button>}</div>
    <p role="status" className="break-words text-ui-hint">{feedback}</p>
    <section aria-label={view === "inline" ? "素材包摘要" : "整理素材包"} tabIndex={-1} ref={region}
      className={`min-w-0 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <AgentMaterialPack {...common} view={view} density={density} />
    </section>
  </div>
}

export function AgentMaterialPackDemo() {
  const [purpose, setPurpose] = useState<keyof typeof materialPackExamples>("pythagoras"), [narrow, setNarrow] = useState(false)
  return <section id="material-pack" className="mb-12 min-w-0 space-y-5"><h2 className="text-section-title">素材包 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-2">{(["pythagoras", "research"] as const).map(value => <Button key={value} type="button" variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "pythagoras" ? "勾股定理复习示例" : "教研共享示例"}</Button>)}
      <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button></div>
    <MaterialPackExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
