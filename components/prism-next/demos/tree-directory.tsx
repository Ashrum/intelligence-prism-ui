"use client"

import { useState } from "react"
import { DemoSection } from "@/components/prism-next/demo-parts"
import { TextbookDirectory, type DirectorySelections } from "@/components/prism-next/textbook-directory"
import { textbooks } from "@/lib/prism-next/textbook-directory"
import { TextbookRangePicker } from "@/components/prism-next/textbook-range-picker"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { Button } from "@/components/coss/button"
import { ChevronDown } from "lucide-react"
import { directoryDepthExamples } from "@/lib/prism-next/fixtures/directory-depth"
import { ToggleGroup, ToggleGroupItem as Toggle } from "@/components/coss/toggle-group"

export function TreeDirectoryDemo() {
  const [sample,setSample]=useState("textbooks")
  const [selections, setSelections] = useState<DirectorySelections>({})
  const [treeSelections, setTreeSelections] = useState<DirectorySelections>({})
  const [embeddedSelections, setEmbeddedSelections] = useState<DirectorySelections>({})
  const [showEmptyLabel, setShowEmptyLabel] = useState(false)
  const [titleAction, setTitleAction] = useState<"select" | "locate">("select")
  const [multiSelect, setMultiSelect] = useState<"always" | "toggle">("toggle")
  const [bookCount, setBookCount] = useState("single")
  const [embeddedWidth, setEmbeddedWidth] = useState("240")
  const books=sample==="textbooks"?textbooks:directoryDepthExamples[sample]
  const embeddedBooks = (bookCount === "single" ? books.slice(0, 1) : books).map(book => {
    const course = book.directories.course
    const firstId = course.nodes[course.rootId].children[0]
    return { ...book, directories: { ...book.directories, course: { ...course, nodes: { ...course.nodes, [firstId]: { ...course.nodes[firstId], title: "从图像与代数表达式两种角度理解函数性质及其实际应用（含 f(x) = x²）" } } } } }
  })
  return <><div className="mt-6 space-y-3"><p className="text-ui-action" id="directory-depth-label">目录层级示例</p><ToggleGroup multiple={false} value={[sample]} onValueChange={values=>{if(values[0])setSample(values[0])}} aria-labelledby="directory-depth-label" className="flex-wrap">{["textbooks","2","3","4","5"].map(value=><Toggle key={value} value={value}>{value==="textbooks"?"现有教材":`${value} 级`}</Toggle>)}</ToggleGroup><p className="text-ui-hint text-muted-foreground">{sample==="textbooks"?"现有教材包含 2—4 级混合结构。":"当前为独立演示数据，不改变现有教材。"}首层目录计为第 1 级，课程与知识点分别选择。</p></div><DemoSection title="弹出式课程与知识点选择" description="逐级缩进与层级标记共同区分父子关系；勾选分组包含全部下级。">
    <TextbookRangePicker key={sample} textbooks={books} selections={selections} onSelectionsChange={setSelections} />
  </DemoSection><DemoSection title="内嵌目录树" description={'layout="embedded" 适用于页面侧栏，默认 multiSelect="toggle" + titleAction="select"：点标题单选、再点取消；打开“多选”后，标题和复选框均勾选或取消。关闭多选时，当前目录归并为单个节点则保留，多于一个则清空。可对比 always 与标题定位模式。单教材只显示名称，多教材显示切换控件。已选行按全部教材的课程与知识点归并汇总；单个显示标题，多个显示项数，默认空选择不占行。“清空”清除所传教材的选择。操作说明通过读屏提供，多选开关附带 Tooltip。下方包含长中文与公式，并可切换 2—5 级目录。'}>
    <div className="mb-4 space-y-2"><p id="embedded-width-label" className="text-ui-action">容器宽度</p><ToggleGroup multiple={false} value={[embeddedWidth]} onValueChange={values => { if (values[0]) setEmbeddedWidth(values[0]) }} aria-labelledby="embedded-width-label" className="flex-wrap">{["200", "240", "280", "320"].map(width => <Toggle key={width} value={width}>{width}px</Toggle>)}</ToggleGroup></div>
    <div className="mb-4 space-y-2"><p id="embedded-title-action-label" className="text-ui-action">标题操作</p><ToggleGroup multiple={false} value={[titleAction]} onValueChange={values => { if (values[0] === "select" || values[0] === "locate") setTitleAction(values[0]) }} aria-labelledby="embedded-title-action-label"><Toggle value="select">标题单选</Toggle><Toggle value="locate">标题定位</Toggle></ToggleGroup></div>
    <div className="mb-4 space-y-2"><p id="embedded-multi-select-label" className="text-ui-action">多选方式</p><ToggleGroup multiple={false} value={[multiSelect]} onValueChange={values => { if (values[0] === "toggle" || values[0] === "always") setMultiSelect(values[0]) }} aria-labelledby="embedded-multi-select-label"><Toggle value="toggle">显式开关</Toggle><Toggle value="always">始终勾选</Toggle></ToggleGroup></div>
    <div className="mb-4 space-y-2"><p id="embedded-books-label" className="text-ui-action">教材数量</p><ToggleGroup multiple={false} value={[bookCount]} onValueChange={values => { if (values[0]) setBookCount(values[0]) }} aria-labelledby="embedded-books-label"><Toggle value="single">单教材</Toggle><Toggle value="multiple">多教材</Toggle></ToggleGroup></div>
    <Button className="mb-3" variant="ghost" size="sm" aria-pressed={showEmptyLabel} onClick={() => setShowEmptyLabel(value => !value)}>自定义空选择提示</Button>
    <div className="max-w-full" style={{ width: Number(embeddedWidth) }}><TextbookDirectory key={sample} textbooks={embeddedBooks} selections={embeddedSelections} onSelectionsChange={setEmbeddedSelections} layout="embedded" titleAction={titleAction} multiSelect={multiSelect} emptySelectionLabel={showEmptyLabel ? "未选择（显示全部）" : undefined} /></div>
  </DemoSection><Collapsible className="mt-8"><CollapsibleTrigger render={<Button variant="ghost" />}><ChevronDown />展开基础树示例</CollapsibleTrigger><CollapsiblePanel><div className="pt-4"><DemoSection title="完整目录树" description="使用上方同一组层级数据，保留展开、键盘定位和父子联动；选择独立记录。"><TextbookDirectory key={sample} textbooks={books} selections={treeSelections} onSelectionsChange={setTreeSelections} /></DemoSection></div></CollapsiblePanel></Collapsible></>
}
