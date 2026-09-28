"use client"

import { useId, useRef, useState } from "react"
import { Label } from "@/components/coss/label"
import { AgentObjectPicker, type AgentObjectCandidate, type AgentObjectPickerProps, type AgentObjectPickerResult } from "../agent-object-picker"
import { Button } from "../button"
import { QuestionSelect } from "../question-controls"

type PickerFixture = Pick<AgentObjectPickerProps, "title" | "objectType" | "selection" | "candidates" | "details">
export const objectPickerExamples: Record<"classes" | "students", PickerFixture> = {
  classes: {
    title: "选择班级 · 示例", objectType: { id: "class", label: "班级" }, selection: { mode: "single" },
    candidates: [
      { id: "example-class-three", name: "高二三班", description: "数学 · 本周二次函数讲评", status: "available", recommendation: { reason: "与当前备课安排一致", source: "本周课表 · 固定示例" } },
      { id: "example-class-four", name: "高二四班", description: "数学 · 需结合长中文教学主题核对的跨课次练习安排与讲评材料", status: "available", recent: true },
      { id: "example-class-restricted", status: "restricted", disclosure: { name: "其他班级", reason: "不在当前任教范围内，班级明细不可查看。" } },
    ],
    details: <p>班级和推荐依据均为固定示例。课堂主题可涉及对称轴 <math className="prism-math" aria-label="x 等于负 b 除以二 a"><mi>x</mi><mo>=</mo><mo>−</mo><mfrac><mi>b</mi><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></math>；选择班级不会启动备课或发布任务。</p>,
  },
  students: {
    title: "选择学生 · 示例", objectType: { id: "student", label: "学生" }, selection: { mode: "multiple", max: 5 },
    candidates: [
      { id: "example-student-lin", name: "林同学", description: "高二三班 · 练习讲评", status: "available", recommendation: { reason: "列在本次讲评名单中", source: "教师提供的名单 · 固定示例" } },
      { id: "example-student-chen", name: "陈同学", description: "高二三班", status: "available", recommendation: { reason: "列在本次讲评名单中", source: "教师提供的名单 · 固定示例" } },
      { id: "example-student-wen", name: "温同学", description: "高二四班", status: "available", recent: true },
      { id: "example-student-li", name: "李同学", description: "高二三班", status: "available" },
      { id: "example-student-yang", name: "杨同学", description: "高二四班", status: "available" },
      { id: "example-student-zhou", name: "周同学", description: "高二四班", status: "available" },
      { id: "example-student-archived", name: "已归档学生", description: "高二三班", status: "archived", reason: "学籍记录已归档，不能加入本次名单。" },
      { id: "example-student-unavailable", name: "待核对学生", description: "高二四班", status: "unavailable", reason: "当前名单记录暂不可用，请核对后重试。" },
      { id: "example-student-more", name: "吴同学", description: "高二三班", status: "available" },
    ],
    details: <p>学生名称、最近使用和推荐均为示例。搜索只匹配已提供的示例名单；选择和确认都不会布置练习或发送通知。</p>,
  },
}

export function ObjectPickerExample({ purpose, narrow = false }: { purpose: "classes" | "students"; narrow?: boolean }) {
  const stateId = useId()
  const fixture = objectPickerExamples[purpose]
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([])
  const [searchValue, setSearchValue] = useState("")
  const [filter, setFilter] = useState<Record<string, string>>({ class: "all" })
  const [state, setState] = useState<AgentObjectPickerResult["state"]>("ready")
  const [count, setCount] = useState(8)
  const [request, setRequest] = useState("")
  const workspace = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  // This fixture host supplies search results. The reusable component never runs this matcher.
  const matches = (item: AgentObjectCandidate) => {
    const text = item.status === "restricted" ? item.disclosure.name : `${item.name} ${item.description ?? ""}`
    return text.includes(searchValue) && (filter.class === "all" || text.includes(filter.class))
  }
  const candidates = fixture.candidates.slice(0, count).filter(matches)
  const result: AgentObjectPickerResult = state === "error" ? { state, message: "示例名单暂时无法取得，请切回可用状态继续。" }
    : state === "empty" || state === "ready" && !candidates.length ? { state: "empty", message: "没有匹配的示例对象。" } : { state }
  const common: AgentObjectPickerProps = { ...fixture, candidates, selectedCandidates: fixture.candidates,
    selectedIds, onSelectionChange: setSelectedIds, searchValue, onSearchChange: setSearchValue, result,
    filters: purpose === "students" ? { fields: [{ id: "class", label: "所在班级", options: [{ value: "all", label: "全部示例班级" }, { value: "高二三班", label: "高二三班" }, { value: "高二四班", label: "高二四班" }] }], value: filter, onChange: setFilter } : undefined,
    loadMore: count < fixture.candidates.length ? { onLoad: () => setCount(fixture.candidates.length) } : undefined,
    onExpand: element => { trigger.current = element; workspace.current?.focus({ preventScroll: true }); workspace.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    onBack: () => { trigger.current?.focus(); trigger.current?.scrollIntoView({ block: "nearest", behavior: "instant" }) },
    onConfirm: ids => setRequest(`已请求确认 ${ids.length} 项示例选择；尚未提交任务。`),
  }
  return <div className="min-w-0 space-y-5">
    <p className="text-ui-hint">固定示例 · 三处共用选择、搜索与筛选；状态由下方控件手动切换。</p>
    <div className="space-y-2"><Label htmlFor={stateId}>候选状态示例</Label>
      <QuestionSelect id={stateId} label="候选状态示例" value={state} onChange={value => setState(value as AgentObjectPickerResult["state"])}
        items={[{ value: "ready", label: "可用" }, { value: "loading", label: "加载中" }, { value: "empty", label: "空结果" }, { value: "error", label: "加载失败" }]} />
    </div>
    {request && <p role="status" className="text-ui-hint">{request}</p>}
    <div className="grid min-w-0 gap-6">{([
      ["inline", "default", "快捷选择"], ["workspace", "default", "完整搜索与选择"], ["inline", "compact", "紧凑选择"],
    ] as const).map(([view, density, label]) => <section key={label} aria-label={label} ref={view === "workspace" ? workspace : undefined}
      tabIndex={view === "workspace" ? -1 : undefined} className={`min-w-0 space-y-3 ${narrow ? "w-full max-w-[320px]" : ""}`}>
      <h3 className="text-block-title">{label}</h3><AgentObjectPicker {...common} view={view} density={density} />
    </section>)}</div>
  </div>
}

export function AgentObjectPickerDemo() {
  const [purpose, setPurpose] = useState<"classes" | "students">("classes")
  const [narrow, setNarrow] = useState(false)
  return <section id="object-picker" className="mb-12 min-w-0 space-y-5">
    <h2 className="text-section-title">对象选择器 v0.1 · 设计候选</h2>
    <div className="flex flex-wrap gap-3">{(["classes", "students"] as const).map(value => <Button key={value} type="button" size="navigation"
      variant={purpose === value ? "secondary" : "outline"} aria-pressed={purpose === value} onClick={() => setPurpose(value)}>{value === "classes" ? "选择班级示例" : "选择学生示例"}</Button>)}
      <Button type="button" size="navigation" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(value => !value)}>320px 窄容器</Button>
    </div>
    <ObjectPickerExample key={purpose} purpose={purpose} narrow={narrow} />
  </section>
}
