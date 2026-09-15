"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Label } from "@/components/coss/label"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem, SelectGroup, SelectGroupLabel, SelectSeparator, SelectButton } from "@/components/coss/select"
import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxEmpty, ComboboxItem, ComboboxList, ComboboxPopup, ComboboxValue, ComboboxInput, ComboboxGroup, ComboboxGroupLabel, ComboboxCollection, ComboboxTrigger } from "@/components/coss/combobox"
import { DemoSection, Feedback } from "@/components/prism-next/demo-parts"

const subjectGroups = [
  { label: "理科", items: [{ label: "数学", value: "math" }, { label: "物理", value: "physics" }, { label: "化学", value: "chemistry" }] },
  { label: "文科", items: [{ label: "语文", value: "chinese" }, { label: "历史", value: "history" }, { label: "地理", value: "geography" }] },
]
const subjects = subjectGroups.flatMap(group => group.items)
const visibility = [
  { label: "私有草稿", value: "private", description: "仅自己可见，适合尚在整理的材料。" },
  { label: "教研团队", value: "team", description: "任教团队成员可以阅读并参与复核。" },
  { label: "全校共享", value: "school", description: "学校教师可以查看已完成的材料。" },
]
const classes = ["高一（1）班", "高一（2）班", "高二（1）班", "高二（2）班"]
const classItems = classes.map(value => ({ value, label: value }))

export function SelectParticles() {
  const [subject, setSubject] = useState("math")
  const [scope, setScope] = useState(visibility[0])
  const [selected, setSelected] = useState<string[]>([classes[0]])
  const [widthValue, setWidthValue] = useState("pending")
  const widths = [{ value: "pending", label: "待复核" }, { value: "done", label: "已复核" }, { value: "supplement", label: "待补充公式推导与说明" }]
  return <>
    <DemoSection title="分组选项" description="相关选项分组呈现，学科名称保持直接可读。" sources={["p-select-6"]}>
      <div className="max-w-64"><Label htmlFor="particle-subject">学科</Label><Select items={subjects} value={subject} onValueChange={v => v && setSubject(v)}>
        <SelectTrigger id="particle-subject"><SelectValue /></SelectTrigger>
        <SelectPopup>{subjectGroups.map((group, i) => <SelectGroup key={group.label}>{i > 0 && <SelectSeparator />}<SelectGroupLabel>{group.label}</SelectGroupLabel>{group.items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup>)}</SelectPopup>
      </Select></div><Feedback>已选择：{subjects.find(item => item.value === subject)?.label}</Feedback>
    </DemoSection>
    <DemoSection title="带说明的选项" description="说明留在选项内，收起时只显示名称，保留标准控件高度。" sources={["p-select-18"]}>
      <div className="max-w-80"><Label htmlFor="particle-scope">可见范围</Label><Select value={scope} onValueChange={v => v && setScope(v)} itemToStringValue={item => item.value}>
        <SelectTrigger id="particle-scope"><SelectValue>{item => <span className="truncate">{item.label}</span>}</SelectValue></SelectTrigger>
        <SelectPopup alignItemWithTrigger={false}>{visibility.map(item => <SelectItem key={item.value} value={item}><span className="flex flex-col"><span>{item.label}</span><span className="text-xs text-muted-foreground">{item.description}</span></span></SelectItem>)}</SelectPopup>
      </Select></div><Feedback>{scope.description}</Feedback>
    </DemoSection>
    <DemoSection title="多选与已选摘要" description="少量选项直接多选；选中较多时显示名称与数量。" sources={["p-select-7"]}>
      <div className="max-w-64"><Label htmlFor="particle-classes">适用班级</Label><Select multiple items={classItems} value={selected} onValueChange={setSelected}>
        <SelectTrigger id="particle-classes"><SelectValue>{values => values.length ? `${values[0]}${values.length > 1 ? `（另 ${values.length - 1} 个）` : ""}` : "选择班级"}</SelectValue></SelectTrigger>
        <SelectPopup alignItemWithTrigger={false}>{classes.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectPopup>
      </Select></div><Feedback>{selected.length ? `适用班级：${selected.join("、")}` : "尚未选择班级。"}</Feedback>
    </DemoSection>
    <DemoSection title="随内容确定宽度" description="短状态保持紧凑，较长内容自然扩展；保留 coss 的默认最小宽度。" sources={["p-select-21"]}>
      <Label htmlFor="particle-auto-width">复核状态</Label><Select items={widths} value={widthValue} onValueChange={v => v && setWidthValue(v)}><SelectTrigger id="particle-auto-width" className="w-fit max-w-full"><SelectValue /></SelectTrigger><SelectPopup>{widths.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup></Select>
    </DemoSection>
  </>
}

const topicGroups = [
  { value: "algebra", label: "代数与函数", items: [{ value: "quadratic", label: "一元二次方程" }, { value: "monotonicity", label: "函数的单调性" }, { value: "series", label: "数列求和" }] },
  { value: "geometry", label: "几何", items: [{ value: "vector", label: "平面向量" }, { value: "conic", label: "圆锥曲线" }, { value: "solid", label: "立体几何" }] },
]
const topics = topicGroups.flatMap(group => group.items)
type Topic = (typeof topics)[number]

export function ComboboxParticles() {
  const [selected, setSelected] = useState<Topic[]>([topics[0], topics[1]])
  const [grouped, setGrouped] = useState<Topic | null>(null)
  const [popup, setPopup] = useState<Topic | null>(null)
  return <>
    <DemoSection title="可搜索多选" description="已选知识点保留为标签，可逐项移除，也可继续输入搜索。" sources={["p-combobox-9"]}>
      <div className="max-w-md"><Label htmlFor="particle-topics">知识点</Label><Combobox multiple items={topics} value={selected} onValueChange={setSelected}>
        <ComboboxChips><ComboboxValue>{(values: Topic[]) => <>{values.map(item => <ComboboxChip key={item.value} aria-label={item.label} removeProps={{ "aria-label": `移除${item.label}` }}>{item.label}</ComboboxChip>)}<ComboboxChipsInput id="particle-topics" placeholder={values.length ? undefined : "搜索并选择知识点"} /></>}</ComboboxValue></ComboboxChips>
        <ComboboxPopup><ComboboxEmpty>没有匹配的知识点。</ComboboxEmpty><ComboboxList>{(item: Topic) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxPopup>
      </Combobox></div><Feedback>已选择 {selected.length} 个知识点。</Feedback>
    </DemoSection>
    <DemoSection title="按主题分组搜索" description="搜索缩小候选范围，分组帮助判断知识点所属领域。" sources={["p-combobox-8"]}>
      <div className="max-w-80"><Label htmlFor="particle-grouped-topic">知识领域</Label><Combobox items={topicGroups} value={grouped} onValueChange={setGrouped}>
        <ComboboxInput id="particle-grouped-topic" placeholder="搜索知识点" showClear clearProps={{ "aria-label": "清除知识领域" }} triggerProps={{ "aria-label": "展开知识领域" }} />
        <ComboboxPopup><ComboboxEmpty>没有匹配的知识点。</ComboboxEmpty><ComboboxList>{(group: typeof topicGroups[number]) => <ComboboxGroup key={group.value} items={group.items}><ComboboxGroupLabel>{group.label}</ComboboxGroupLabel><ComboboxCollection>{(item: Topic) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxCollection></ComboboxGroup>}</ComboboxList></ComboboxPopup>
      </Combobox></div><Feedback>{grouped ? `已选择：${grouped.label}` : "尚未选择知识领域。"}</Feedback>
    </DemoSection>
    <DemoSection title="选择框内展开搜索" description="收起时保持选择框形态，搜索输入位于弹层内。" sources={["p-combobox-18"]}>
      <div className="max-w-64"><Label htmlFor="particle-popup-topic">关联知识点</Label><Combobox items={topics} value={popup} onValueChange={setPopup}>
        <ComboboxTrigger id="particle-popup-topic" render={<SelectButton />}><ComboboxValue placeholder="选择知识点" /></ComboboxTrigger>
        <ComboboxPopup aria-label="关联知识点"><div className="border-b p-2"><ComboboxInput aria-label="搜索关联知识点" className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]" placeholder="输入知识点名称" showTrigger={false} startAddon={<Search />} /></div><ComboboxEmpty>没有匹配的知识点。</ComboboxEmpty><ComboboxList>{(item: Topic) => <ComboboxItem key={item.value} value={item}>{item.label}</ComboboxItem>}</ComboboxList></ComboboxPopup>
      </Combobox></div><Feedback>{popup ? `已关联：${popup.label}` : "尚未关联知识点。"}</Feedback>
    </DemoSection>
  </>
}
