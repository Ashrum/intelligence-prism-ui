import { DifficultyMix } from "@/components/prism-next/difficulty-mix"

export const metadata = { title: "难度构成" }

export default function Page() {
  return <div className="prism-content space-y-4">
    <div className="prism-page-heading"><h1>难度构成</h1><p>宿主提供基础、巩固、提升题数。全零表示难度未标注。</p></div>
    <DifficultyMix basic={5} consolidate={5} advance={2} />
    <DifficultyMix basic={0} consolidate={10} advance={2} />
    <DifficultyMix basic={0} consolidate={0} advance={0} />
    <p className="text-ui-hint">basic、consolidate、advance 为非负整数题数，className 为可选布局类。difficultySwatches 提供相同的三档配色供筛选选项复用。</p>
    <a className="text-ui-body underline" href="/next/components/facet-filter">试卷筛选面板示例</a>
  </div>
}
