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
  const [embeddedWidth, setEmbeddedWidth] = useState("240")
  const books=sample==="textbooks"?textbooks:directoryDepthExamples[sample]
  const embeddedBooks = books.map(book => {
    const course = book.directories.course
    const firstId = course.nodes[course.rootId].children[0]
    return { ...book, directories: { ...book.directories, course: { ...course, nodes: { ...course.nodes, [firstId]: { ...course.nodes[firstId], title: "从图像与代数表达式两种角度理解函数性质及其实际应用（含 f(x) = x²）" } } } } }
  })
  return <><div className="mt-6 space-y-3"><p className="text-ui-action" id="directory-depth-label">目录层级示例</p><ToggleGroup multiple={false} value={[sample]} onValueChange={values=>{if(values[0])setSample(values[0])}} aria-labelledby="directory-depth-label" className="flex-wrap">{["textbooks","2","3","4","5"].map(value=><Toggle key={value} value={value}>{value==="textbooks"?"现有教材":`${value} 级`}</Toggle>)}</ToggleGroup><p className="text-ui-hint text-muted-foreground">{sample==="textbooks"?"现有教材包含 2—4 级混合结构。":"当前为独立演示数据，不改变现有教材。"}首层目录计为第 1 级，课程与知识点分别选择。</p></div><DemoSection title="弹出式课程与知识点选择" description="逐级缩进与层级标记共同区分父子关系；勾选分组包含全部下级。">
    <TextbookRangePicker key={sample} textbooks={books} selections={selections} onSelectionsChange={setSelections} />
  </DemoSection><DemoSection title="内嵌目录树" description={'layout="embedded" 适用于页面侧栏；emptySelectionLabel 自定义空选择提示，默认“未选择”。已选数量汇总所有教材的课程与知识点，“清空”清除这些选择。默认 layout="split" 保留完整摘要。下方为含长中文与公式的示例数据，选择独立记录。'}>
    <div className="mb-4 space-y-2"><p id="embedded-width-label" className="text-ui-action">容器宽度</p><ToggleGroup multiple={false} value={[embeddedWidth]} onValueChange={values => { if (values[0]) setEmbeddedWidth(values[0]) }} aria-labelledby="embedded-width-label" className="flex-wrap">{["200", "240", "280", "320"].map(width => <Toggle key={width} value={width}>{width}px</Toggle>)}</ToggleGroup></div>
    <div className="max-w-full" style={{ width: Number(embeddedWidth) }}><TextbookDirectory key={sample} textbooks={embeddedBooks} selections={embeddedSelections} onSelectionsChange={setEmbeddedSelections} layout="embedded" emptySelectionLabel="未选择（显示全部）" /></div>
  </DemoSection><Collapsible className="mt-8"><CollapsibleTrigger render={<Button variant="ghost" />}><ChevronDown />展开基础树示例</CollapsibleTrigger><CollapsiblePanel><div className="pt-4"><DemoSection title="完整目录树" description="使用上方同一组层级数据，保留展开、键盘定位和父子联动；选择独立记录。"><TextbookDirectory key={sample} textbooks={books} selections={treeSelections} onSelectionsChange={setTreeSelections} /></DemoSection></div></CollapsiblePanel></Collapsible></>
}
