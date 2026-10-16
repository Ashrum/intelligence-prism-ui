"use client"

// Supervisor-only interactive fixture. Not registered as a component or route.
import { useState } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "@/components/coss/button"
import { QuestionCard } from "@/components/prism-next/question-card"
import { QuestionDetails, type QuestionDetailTab } from "@/components/prism-next/question-details"
import { questionSamples } from "@/components/prism-next/fixtures/question-samples"
import { questionMetadata } from "@/components/prism-next/fixtures/question-metadata"
import type { DirectorySelections } from "@/components/prism-next/textbook-directory"

const themes = ["light", "paper", "dark", "blueprint", "blueprint-night"] as const
const diagram = new URL("./question-diagram-white.svg", import.meta.url).href
function Sample() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<QuestionDetailTab>("answer")
  const [links, setLinks] = useState<DirectorySelections>({})
  const original = questionSamples[3]
  const image = <img src={diagram} width={480} height={310} className="h-auto w-full max-w-full" alt="白底矩形 ONMP 坐标图，复用题目样本的既有图形" />
  const question = { ...original, stem: <>{original.stem}{image}</>, explanation: <>{original.explanation}{image}</> }
  return <QuestionCard question={question} detailsOpen={open} onDetailsOpenChange={setOpen} details={<QuestionDetails question={question} metadata={questionMetadata[question.id]} links={links} onLinksChange={setLinks} tab={tab} onTabChange={setTab} />} />
}
export function P75QuestionDetailFixture() {
  const [theme, setTheme] = useState<(typeof themes)[number]>("blueprint")
  const [nested, setNested] = useState(false)
  return <section data-agent-preview="" data-prism-theme={theme} data-p75-fixture="" className="min-w-0 space-y-4 bg-background p-3 text-foreground">
    <p className="text-ui-body">P75 验收夹具：白底图来自既有 CoordinateDiagram；题面与解析均包含图片。展开详情并切换三个 Tab。</p>
    <div className="flex flex-wrap gap-2">{themes.map(value => <Button key={value} variant="outline" onClick={() => setTheme(value)} aria-pressed={theme === value}>{value}</Button>)}<Button variant="outline" onClick={() => setNested(!nested)} aria-pressed={nested}>嵌套核心主题</Button></div>
    <Sample />
    {nested && themes.slice(0, 3).map(value => <div key={value} data-agent-preview="" data-prism-theme={value} className="min-w-0 space-y-3 bg-background p-3 text-foreground"><p className="text-ui-body">{value} 嵌套预览</p><Sample /></div>)}
  </section>
}
export function mount(container: HTMLElement) {
  const root = createRoot(container)
  root.render(<P75QuestionDetailFixture />)
  return () => root.unmount()
}
