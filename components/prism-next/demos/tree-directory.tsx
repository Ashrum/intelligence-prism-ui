"use client"

import { useState } from "react"
import { DemoSection } from "@/components/prism-next/demo-parts"
import { TextbookDirectory, type DirectorySelections } from "@/components/prism-next/textbook-directory"
import { textbooks } from "@/lib/prism-next/textbook-directory"

export function TreeDirectoryDemo() {
  const [selections, setSelections] = useState<DirectorySelections>({})
  return <DemoSection title="教材目录与知识点选择" description="选择教材，在两种目录中搜索并勾选范围。以下使用精简示例目录，不代表出版社完整教材。">
    <TextbookDirectory textbooks={textbooks} selections={selections} onSelectionsChange={setSelections} />
  </DemoSection>
}
