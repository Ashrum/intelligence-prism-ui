"use client"

import { useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/coss/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/coss/input-group"
import { Group, GroupSeparator } from "@/components/coss/group"
import { NumberField, NumberFieldGroup, NumberFieldInput } from "@/components/coss/number-field"
import { Label } from "@/components/coss/label"
import { DemoSection, Feedback } from "@/components/prism-next/demo-parts"

const materials = ["一元二次方程的实数根", "函数的单调性", "导数与极值", "数列求和"]
export function SearchInputParticle() {
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const matches = materials.filter(item => item.includes(query.trim()))
  return <DemoSection title="搜索与清除" description="输入后即时筛选；清除后继续在原位置输入。" sources={["p-input-group-22"]}>
    <div className="max-w-md"><Label htmlFor="particle-search">查找材料</Label><InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput ref={inputRef} id="particle-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="例如：函数" />{query && <InputGroupAddon align="inline-end"><Button variant="ghost" size="icon-xs" aria-label="清除材料搜索" onClick={() => { setQuery(""); inputRef.current?.focus() }}><X /></Button></InputGroupAddon>}</InputGroup>
      <ul className="mt-4 space-y-2 text-ui-body">{matches.map(item => <li key={item}>{item}</li>)}</ul><Feedback>{matches.length ? `找到 ${matches.length} 份材料。` : "没有匹配的材料，请修改关键词。"}</Feedback>
    </div>
  </DemoSection>
}

export function NumberRangeParticle() {
  const [min, setMin] = useState<number | null>(5)
  const [max, setMax] = useState<number | null>(20)
  const invalid = min !== null && max !== null && min > max
  return <DemoSection title="两个数值组成范围" description="允许暂时留空；起点大于终点时就地提示并保留输入。" sources={["p-group-22"]}>
    <div className="max-w-80"><Label id="range-label">研读时长范围（分钟）</Label><Group aria-labelledby="range-label"><NumberField value={min} onValueChange={setMin} min={1} max={120} aria-label="最短研读时长" render={<NumberFieldGroup />}><NumberFieldInput className="text-left" placeholder="最短" aria-invalid={invalid} aria-describedby="number-range-feedback" /></NumberField><GroupSeparator /><NumberField value={max} onValueChange={setMax} min={1} max={120} aria-label="最长研读时长" render={<NumberFieldGroup />}><NumberFieldInput className="text-left" placeholder="最长" aria-invalid={invalid} aria-describedby="number-range-feedback" /></NumberField></Group>
      <p id="number-range-feedback" role={invalid ? "alert" : "status"} className={`mt-3 text-ui-hint ${invalid ? "text-destructive-foreground" : "text-muted-foreground"}`}>{invalid ? "最短时长不能大于最长时长。" : min === null || max === null ? "请填写完整的时长范围。" : `筛选 ${min}–${max} 分钟的材料。`}</p>
    </div>
  </DemoSection>
}
