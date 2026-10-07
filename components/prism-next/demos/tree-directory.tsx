"use client"

import { useState } from "react"
import Link from "next/link"
import { DemoSection } from "@/components/prism-next/demo-parts"
import { TextbookDirectory, type DirectorySelections } from "@/components/prism-next/textbook-directory"
import { textbooks } from "@/lib/prism-next/textbook-directory"
import { TextbookRangePicker } from "@/components/prism-next/textbook-range-picker"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/components/coss/dialog"
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
  const [hostSwitchOpen, setHostSwitchOpen] = useState(false)
  const [hostBookIndex, setHostBookIndex] = useState(0)
  const [longHeader, setLongHeader] = useState(false)
  const [embeddedWidth, setEmbeddedWidth] = useState("240")
  const books=sample==="textbooks"?textbooks:directoryDepthExamples[sample]
  const headerBooks = books.map((book, index) => ({ ...book,
    volume: longHeader ? "普通高中数学课程标准实验教材必修第一册（含函数与代数综合应用）" : sample === "textbooks" ? ["必修第一册", "必修第二册"][index] : book.title,
    subject: "数学", edition: longHeader ? "面向完整教学过程的长版本名称示例" : "示例版",
  }))
  const embeddedBooks = (bookCount === "multiple" ? headerBooks : [headerBooks[bookCount === "host" ? hostBookIndex % headerBooks.length : 0]]).map(book => {
    const course = book.directories.course
    const firstId = course.nodes[course.rootId].children[0]
    return { ...book, directories: { ...book.directories, course: { ...course, nodes: { ...course.nodes, [firstId]: { ...course.nodes[firstId], title: "从图像与代数表达式两种角度理解函数性质及其实际应用（含 f(x) = x²）" } } } } }
  })
  return <><Link href="/next/explorations/tree-directory" className="mt-6 inline-block text-ui-action underline">比较教材目录的三版设计探索</Link><div className="mt-6 space-y-3"><p className="text-ui-action" id="directory-depth-label">目录层级示例</p><ToggleGroup multiple={false} value={[sample]} onValueChange={values=>{if(values[0])setSample(values[0])}} aria-labelledby="directory-depth-label" className="flex-wrap">{["textbooks","2","3","4","5"].map(value=><Toggle key={value} value={value}>{value==="textbooks"?"现有教材":`${value} 级`}</Toggle>)}</ToggleGroup><p className="text-ui-hint text-muted-foreground">{sample==="textbooks"?"现有教材包含 2—4 级混合结构。":"当前为独立演示数据，不改变现有教材。"}首层目录计为第 1 级，课程与知识点分别选择。</p></div><DemoSection title="弹出式课程与知识点选择" description="逐级缩进与层级标记共同区分父子关系；勾选分组包含全部下级。">
    <TextbookRangePicker key={sample} textbooks={books} selections={selections} onSelectionsChange={setSelections} />
  </DemoSection><DemoSection title="内嵌目录树" description={'layout="embedded" 适用于页面侧栏，默认 multiSelect="toggle" + titleAction="select"：点标题单选、再点取消；打开“多选”后，标题和复选框均勾选或取消。关闭多选时，当前目录归并为单个节点则保留，多于一个则清空。可对比 always 与标题定位模式。教材以书形封面、册名与学科版本呈现。单教材无回调不显示按钮；宿主回调示例打开示例弹窗；多教材使用内置菜单。已选行按全部教材的课程与知识点归并汇总；单个显示标题，多个显示项数，默认空选择不占行。“清空”清除所传教材的选择。操作说明通过读屏提供，多选开关附带 Tooltip。下方包含长中文与公式，并可切换 2—5 级目录。'}>
    <div className="mb-4 space-y-2"><p id="embedded-width-label" className="text-ui-action">容器宽度</p><ToggleGroup multiple={false} value={[embeddedWidth]} onValueChange={values => { if (values[0]) setEmbeddedWidth(values[0]) }} aria-labelledby="embedded-width-label" className="flex-wrap">{["200", "240", "280", "320"].map(width => <Toggle key={width} value={width}>{width}px</Toggle>)}</ToggleGroup></div>
    <div className="mb-4 space-y-2"><p id="embedded-title-action-label" className="text-ui-action">标题操作</p><ToggleGroup multiple={false} value={[titleAction]} onValueChange={values => { if (values[0] === "select" || values[0] === "locate") setTitleAction(values[0]) }} aria-labelledby="embedded-title-action-label"><Toggle value="select">标题单选</Toggle><Toggle value="locate">标题定位</Toggle></ToggleGroup></div>
    <div className="mb-4 space-y-2"><p id="embedded-multi-select-label" className="text-ui-action">多选方式</p><ToggleGroup multiple={false} value={[multiSelect]} onValueChange={values => { if (values[0] === "toggle" || values[0] === "always") setMultiSelect(values[0]) }} aria-labelledby="embedded-multi-select-label"><Toggle value="toggle">显式开关</Toggle><Toggle value="always">始终勾选</Toggle></ToggleGroup></div>
    <div className="mb-4 space-y-2"><p id="embedded-books-label" className="text-ui-action">教材切换场景</p><ToggleGroup multiple={false} value={[bookCount]} onValueChange={values => { if (values[0]) setBookCount(values[0]) }} aria-labelledby="embedded-books-label" className="flex-wrap"><Toggle value="single">单教材无回调</Toggle><Toggle value="host">单教材有回调</Toggle><Toggle value="multiple">多教材</Toggle></ToggleGroup></div>
    <Button className="mb-3 mr-2" variant="ghost" size="sm" aria-pressed={longHeader} onClick={() => setLongHeader(value => !value)}>长教材名称与版本</Button>
    <Button className="mb-3" variant="ghost" size="sm" aria-pressed={showEmptyLabel} onClick={() => setShowEmptyLabel(value => !value)}>自定义空选择提示</Button>
    <div className="max-w-full" style={{ width: Number(embeddedWidth) }}><TextbookDirectory key={sample} textbooks={embeddedBooks} onTextbookSwitch={bookCount === "host" ? () => setHostSwitchOpen(true) : undefined} selections={embeddedSelections} onSelectionsChange={setEmbeddedSelections} layout="embedded" titleAction={titleAction} multiSelect={multiSelect} emptySelectionLabel={showEmptyLabel ? "未选择（显示全部）" : undefined} /></div>
    <Dialog open={hostSwitchOpen} onOpenChange={setHostSwitchOpen}><DialogPopup closeProps={{ "aria-label": "关闭宿主切换示例" }}>
      <DialogHeader><DialogTitle>宿主切换教材（示例）</DialogTitle><DialogDescription>此弹窗由示例宿主通过 onTextbookSwitch 打开；选择后回传教材，不接入真实班级或教材服务。</DialogDescription></DialogHeader>
      <div className="flex flex-col gap-2 px-4 pb-4 sm:px-6">{headerBooks.map((book, index) => <Button key={book.id} variant="outline" className="max-w-full justify-start" onClick={() => { setHostBookIndex(index); setHostSwitchOpen(false) }}><span className="truncate" title={book.title}>{book.title}</span></Button>)}</div>
    </DialogPopup></Dialog>
  </DemoSection><Collapsible className="mt-8"><CollapsibleTrigger render={<Button variant="ghost" />}><ChevronDown />展开基础树示例</CollapsibleTrigger><CollapsiblePanel><div className="pt-4"><DemoSection title="完整目录树" description="使用上方同一组层级数据，保留展开、键盘定位和父子联动；选择独立记录。"><TextbookDirectory key={sample} textbooks={books} selections={treeSelections} onSelectionsChange={setTreeSelections} /></DemoSection></div></CollapsiblePanel></Collapsible></>
}
