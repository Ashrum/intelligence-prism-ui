"use client"

import { useRef, useState } from "react"
import { Button } from "../button"
import { AgentResourceRetriever, type AgentResource, type AgentResourceIntent, type AgentResourcePreview, type AgentResourceResult, type AgentResourceRetrieverProps } from "../agent-resource-retriever"

const unknown = { state: "unknown" } as const
const absent = { state: "absent" } as const
const facts: AgentResource["facts"] = { hit: { state: "confirmed", description: "固定检索样本" }, preview: absent, read: unknown, context: unknown, citation: unknown }
const source = { id: "example-school-library", label: "校本资源库 · 固定示例", location: "几何教学资料" }
const license = { state: "available", name: "校内教学使用（示例许可）" } as const
const limitation = "示例许可仅支持预览，不允许读取或引用。"
const imageResource: AgentResource = {
  id: "example-area-image", version: "example-image-v1", title: "勾股定理：用正方形面积比较解释直角三角形三边的关系", kind: "image",
  summary: <>围绕 <math className="prism-math" aria-label="a 平方加 b 平方等于 c 平方"><msup><mi>a</mi><mn>2</mn></msup><mo>+</mo><msup><mi>b</mi><mn>2</mn></msup><mo>=</mo><msup><mi>c</mi><mn>2</mn></msup></math> 组织面积观察；此简介是人工示例。</>,
  source, license, versionLabel: "示例 v1", date: "2026-09-26（示例）", applicability: "数学 · 八年级 · 勾股定理 · 建立面积与边长平方的联系（示例）",
  format: "SVG（示例）", duration: "不适用", size: null,
  facts: { ...facts, read: { state: "confirmed", description: "示例记录：本机读取图示", version: "示例 v1", location: "面积图示" }, context: absent, citation: absent },
  actions: { preview: {}, read: {}, "open-source": {} },
}
export const resourceRetrieverExamples: Record<"teaching" | "textbook", { title: string; query: string; scope: string; resources: readonly AgentResource[] }> = {
  teaching: {
    title: "勾股定理教学资源 · 固定示例", query: "勾股定理", scope: "八年级数学 / 勾股定理 / 面积法与教学应用（示例）",
    resources: [
      imageResource,
      { ...imageResource, id: "example-explanation-article", title: "勾股定理的面积法讲解", kind: "article", summary: "用于对照拼接前后的面积关系；人工编写的文章节选。", format: "文本", size: "约 300 字（示例）", facts, actions: { preview: {}, read: {}, "open-source": {} } },
      { ...imageResource, id: "example-demonstration-video", title: "勾股定理拼图演示视频", kind: "video", summary: "预览入口仅展示示例简介；没有可播放的视频文件。", source: { id: "example-video-library", label: "教学视频库 · 固定示例" },
        license: { state: "restricted", name: "教学视频示例许可", reason: limitation }, format: "MP4（示例）", duration: "03:20（示例）", size: null, facts: { ...facts, preview: unknown },
        actions: { preview: {}, read: { disabledReason: limitation }, unread: { disabledReason: limitation }, "open-source": {}, "request-permission": {} } },
      { ...imageResource, id: "example-lesson", title: "勾股定理课例：从学生对图形面积的不同解释出发，组织比较、质疑与回看，并保留尚未确认的教学适用条件", kind: "lesson", summary: "固定课例摘要，尚未提供实际教学记录。", source: { id: null, label: null },
        license: { state: "unknown", name: null }, version: null, versionLabel: null, date: null, applicability: null, format: null, duration: null, size: null,
        facts: { hit: facts.hit, preview: unknown, read: unknown, context: unknown, citation: { state: "unavailable", description: "示例引用记录暂不可核对" } },
        actions: { read: { disabledReason: "未取得可用许可，暂不能读取。" } } },
    ],
  },
  textbook: {
    title: "教材章节页检索 · 固定示例", query: "勾股定理", scope: "教材版本未确认 / 八年级 / 勾股定理章节（示例）",
    resources: [
      { ...imageResource, id: "example-textbook-page", title: "勾股定理章节 · 面积关系页", kind: "textbook-page", summary: "人工编写的章节定位示例，不含真实教材页面。", source: { id: "example-textbook", label: "教材目录样本", location: "勾股定理章节 · 页码未知" },
        version: null, versionLabel: null, date: null, license: { state: "confirmation-required", name: null, reason: "需核对教材版本和本次使用范围。" }, format: "教材页摘要", size: null, facts,
        actions: { preview: {}, read: { disabledReason: "需核对教材版本和本次使用范围。" }, "open-source": {} } },
      { ...imageResource, id: "example-textbook-exercise", title: "勾股定理章节 · 练习页", kind: "textbook-page", summary: "仅展示章节页定位的结构，不提供真实教材内容。", source: { id: "example-textbook", label: "教材目录样本", location: "勾股定理章节 · 页码未知" },
        version: null, versionLabel: null, date: null, license: { state: "confirmation-required", name: null, reason: "需核对教材版本和本次使用范围。" }, format: "教材页摘要", size: null, facts,
        actions: { preview: {}, read: { disabledReason: "需核对教材版本和本次使用范围。" }, "open-source": {} } },
    ],
  },
}

function ResourcePreviewExample({ resource }: { resource: AgentResource }) {
  return <div className="min-w-0 space-y-2 text-read-body">
    <p className="text-ui-hint">人工示例预览，不是真实资源文件；查看不改变读取或引用记录。</p>
    {resource.kind === "image" ? <figure className="space-y-2">
      <svg viewBox="0 0 300 150" className="h-auto w-full max-w-[360px]" role="img" aria-label="三块正方形面积分别为九、十六和二十五的示意图" fill="none" stroke="currentColor">
        <rect x="10" y="80" width="60" height="60" /><rect x="90" y="60" width="80" height="80" /><rect x="190" y="40" width="100" height="100" />
      </svg><figcaption>三块正方形面积：9 + 16 = 25（示意）</figcaption>
    </figure> : resource.kind === "video" ? <p>仅有视频简介，没有视频文件可供播放。</p>
      : <p>以直角边为边长的两个正方形，面积之和等于以斜边为边长的正方形面积。此段仅用于核对阅读排版。</p>}
  </div>
}

/** All state here is labelled fixture data; the reusable component never runs a search. */
export function ResourceRetrieverExample({ purpose, narrow = false }: { purpose: keyof typeof resourceRetrieverExamples; narrow?: boolean }) {
  const fixture = resourceRetrieverExamples[purpose]
  const [query, setQuery] = useState(fixture.query), [kind, setKind] = useState("all"), [sort, setSort] = useState("provided")
  const [result, setResult] = useState<AgentResourceResult>({ state: "ready" })
  const [preview, setPreview] = useState<AgentResourcePreview | null>(null)
  const [more, setMore] = useState<NonNullable<AgentResourceRetrieverProps["page"]["more"]>>({ cursor: "example-next-batch", state: "ready" })
  const [feedback, setFeedback] = useState("本页仅有固定样本；许可、读取和引用均为示例记录，未连接检索或执行服务。")
  const workspace = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement>(null)
  const resourceSet = { id: `example-resources-${purpose}`, version: `example-query-${query}-${kind}-${sort}` }
  const filtered = fixture.resources.filter(resource => resource.title.includes(query.trim()) && (kind === "all" || resource.kind === kind))
  const resources = sort === "title" ? [...filtered].sort((left, right) => left.title.localeCompare(right.title, "zh-CN")) : filtered
  function act(intent: AgentResourceIntent) {
    if (intent.resourceSetId !== resourceSet.id || intent.baseVersion !== resourceSet.version) return
    if (intent.type === "query") { setQuery(intent.value); setPreview(null); return }
    if (intent.type === "filter") { setKind(intent.value.kind); setPreview(null); return }
    if (intent.type === "sort") { setSort(intent.value); return }
    if (intent.type === "load-more") { setMore({ cursor: intent.cursor, state: "error", message: "固定样本没有下一批；此处演示追加失败，原结果保留。" }); return }
    if (intent.type === "preview") {
      setPreview({ resourceId: intent.resourceId, resourceVersion: intent.resourceVersion, requestedBy: "user", state: "ready" })
      setFeedback("已打开人工示例预览；预览记录、读取、Agent 本次参考和成果引用仍取各自提供的事实。"); return
    }
    const messages = { read: "已记录读取请求；服务未接入，读取和上下文记录保持原样。", unread: "已记录移出请求；服务未接入，不改写历史读取或成果引用。", "open-source": "固定样本没有真实来源链接；仅记录本页打开请求。", "request-permission": "已记录许可申请请求；未连接申请服务，许可仍受限。" }
    setFeedback(messages[intent.type])
  }
  const common: AgentResourceRetrieverProps = {
    title: fixture.title, resourceSet, resources, query: { value: query }, scope: fixture.scope,
    filters: { fields: [{ id: "kind", label: "资源类型", options: [{ value: "all", label: "全部类型" }, { value: "image", label: "图片" }, { value: "video", label: "视频" }, { value: "article", label: "文章" }, { value: "lesson", label: "课例" }, { value: "textbook-page", label: "教材页" }] }], value: { kind } },
    sort: { label: "排列方式", value: sort, options: [{ value: "provided", label: "样本原顺序" }, { value: "title", label: "按名称" }], description: "仅对固定样本排列，不代表相关性评分。" },
    result: result.state === "ready" && !resources.length ? { state: "empty", message: "固定样本中没有匹配结果。" } : result,
    page: { total: purpose === "teaching" ? null : resources.length, label: "固定样本", more },
    sourceFailures: purpose === "teaching" ? [{ source: { id: "example-remote-source", label: "外部课例库（示例）" }, message: "连接失败；其他来源的样本仍可查看，总数未知。" }] : [],
    preview, renderPreview: resource => <ResourcePreviewExample resource={resource} />, onIntent: act,
    onExpand: element => { trigger.current = element; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    details: <p>筛选和排序仅用于本页固定样本。未知字段没有从文件名、简介或点击补齐；许可申请与读取请求不生成成功记录。预览内容仅在点击后挂载，刷新还原。</p>,
  }
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例 · 来源、许可与使用记录均为人工样本。两态与紧凑用法共用查询和预览目标。</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="检索状态示例">
      {(["ready", "loading", "empty", "error"] as const).map(state => <Button key={state} type="button" size="navigation" variant="outline" aria-pressed={result.state === state}
        onClick={() => { setPreview(null); setResult(state === "error" ? { state, message: "示例检索服务暂不可用。" } : state === "empty" ? { state, message: "示例当前没有命中。" } : { state }) }}>{({ ready: "结果样本", loading: "加载样本", empty: "空结果样本", error: "错误样本" })[state]}</Button>)}
    </div><p role="status" className="break-words text-ui-hint">{feedback}</p>
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "推荐短列表"], ["workspace", "default", "完整检索与来源"], ["inline", "compact", "紧凑资源列表"],
    ] as const).map(([view, density, label]) => <section key={label} aria-label={label} ref={view === "workspace" ? workspace : undefined} tabIndex={view === "workspace" ? -1 : undefined}
      className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3>
      <AgentResourceRetriever {...common} view={view} density={density} resources={view === "workspace" ? resources : resources.slice(0, 2)} preview={preview && (view === "workspace" || resources.slice(0, 2).some(resource => resource.id === preview.resourceId)) ? preview : null} />
    </section>)}</div>
  </div>
}

export function AgentResourceRetrieverDemo() {
  const [purpose, setPurpose] = useState<keyof typeof resourceRetrieverExamples>("teaching"), [narrow, setNarrow] = useState(false)
  return <section id="resource-retriever" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">资源检索器 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["teaching", "textbook"] as const).map(value => <Button key={value} type="button" size="navigation" variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "teaching" ? "勾股定理教学资源" : "教材章节页检索"}</Button>)}
      <Button type="button" size="navigation" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div><ResourceRetrieverExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
