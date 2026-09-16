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
  const books=sample==="textbooks"?textbooks:directoryDepthExamples[sample]
  return <><div className="mt-6 space-y-3"><p className="text-sm font-medium" id="directory-depth-label">目录层级示例</p><ToggleGroup multiple={false} value={[sample]} onValueChange={values=>{if(values[0])setSample(values[0])}} aria-labelledby="directory-depth-label" className="flex-wrap">{["textbooks","2","3","4","5"].map(value=><Toggle key={value} value={value}>{value==="textbooks"?"现有教材":`${value} 级`}</Toggle>)}</ToggleGroup><p className="text-sm text-muted-foreground">{sample==="textbooks"?"现有教材包含 2—4 级混合结构。":"当前为独立演示数据，不改变现有教材。"}首层目录计为第 1 级，课程与知识点分别选择。</p></div><DemoSection title="弹出式课程与知识点选择" description="逐级缩进与层级标记共同区分父子关系；勾选分组包含全部下级。">
    <TextbookRangePicker key={sample} textbooks={books} selections={selections} onSelectionsChange={setSelections} />
  </DemoSection><Collapsible className="mt-8"><CollapsibleTrigger render={<Button variant="ghost" />}><ChevronDown />展开基础树示例</CollapsibleTrigger><CollapsiblePanel><div className="pt-4"><DemoSection title="完整目录树" description="使用上方同一组层级数据，保留展开、键盘定位和父子联动；选择独立记录。"><TextbookDirectory key={sample} textbooks={books} selections={treeSelections} onSelectionsChange={setTreeSelections} /></DemoSection></div></CollapsiblePanel></Collapsible></>
}
