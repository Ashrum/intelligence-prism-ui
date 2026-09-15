"use client"

import { useState } from "react"
import { DemoSection } from "@/components/prism-next/demo-parts"
import { TextbookDirectory, type DirectorySelections } from "@/components/prism-next/textbook-directory"
import { textbooks } from "@/lib/prism-next/textbook-directory"
import { TextbookRangePicker } from "@/components/prism-next/textbook-range-picker"
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/coss/collapsible"
import { Button } from "@/components/coss/button"
import { ChevronDown } from "lucide-react"

export function TreeDirectoryDemo() {
  const [selections, setSelections] = useState<DirectorySelections>({})
  const [treeSelections, setTreeSelections] = useState<DirectorySelections>({})
  return <><DemoSection title="弹出式课程与知识点选择" description="按章节快速复选，随时查看来源和调整已选范围。示例包含四层目录，不代表出版社完整教材。">
    <TextbookRangePicker textbooks={textbooks} selections={selections} onSelectionsChange={setSelections} />
  </DemoSection><Collapsible className="mt-8"><CollapsibleTrigger render={<Button variant="ghost" />}><ChevronDown />展开基础树示例</CollapsibleTrigger><CollapsiblePanel><div className="pt-4"><DemoSection title="完整目录树" description="保留展开、键盘定位和父子联动的基础示例，选择独立记录。"><TextbookDirectory textbooks={textbooks} selections={treeSelections} onSelectionsChange={setTreeSelections} /></DemoSection></div></CollapsiblePanel></Collapsible></>
}
