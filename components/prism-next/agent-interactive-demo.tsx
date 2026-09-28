"use client"

import { useId, type ReactNode } from "react"
import { Card } from "@/components/coss/card"
import { Button } from "./button"
import { RecordDetails } from "./agent-record-parts"
import { SubjectCapabilities, SubjectNumberControl, SubjectValues, hasText, uniqueIds, validDefinition, validValue, type SubjectCapability, type SubjectNumber } from "./agent-subject-demo-parts"

export type AgentDemoContext = { demoId: string; version: string }
export type AgentDemoParameter = SubjectNumber
export type AgentDemoCapability = SubjectCapability
export type AgentDemoCapabilities = Record<"interact" | "fullscreen" | "record" | "share", AgentDemoCapability>
export type AgentDemoIntent = AgentDemoContext & (
  | { type: "param-change"; parameterId: string; value: number | null }
  | { type: "reset" | "request-fullscreen" | "open-source" }
)
export type AgentInteractiveDemoProps = AgentDemoContext & {
  title: string
  subject?: string
  grade?: string
  parameters: readonly AgentDemoParameter[]
  /** Passive rendering only. Host must update content and text with the same parameters. */
  preview?: ReactNode
  content?: ReactNode
  description: string
  teachingTips: readonly string[]
  capabilities: AgentDemoCapabilities
  mobileSupport: SubjectCapability
  source?: { label: string; openable: boolean }
  view?: "inline" | "workspace"
  density?: "default" | "compact"
  details?: ReactNode
  readOnlyReason?: string
  onIntent?: (intent: AgentDemoIntent) => void
  onExpand?: (trigger: HTMLButtonElement, context: AgentDemoContext) => void
  onBack?: (context: AgentDemoContext) => void
}

const labels = { interact: "参数交互", fullscreen: "全屏", record: "演示记录", share: "分享" }
export function AgentInteractiveDemo({ demoId, version, title, subject, grade, parameters, preview, content, description, teachingTips,
  capabilities, mobileSupport, source, view = "inline", density = "default", details, readOnlyReason, onIntent, onExpand, onBack }: AgentInteractiveDemoProps) {
  const id = useId(), workspace = view === "workspace", context = { demoId, version }
  const identity = hasText(demoId) && hasText(version) && uniqueIds(parameters)
  const reason = readOnlyReason !== undefined ? readOnlyReason || "当前仅供查看。" : !identity ? "演示或版本信息未确认，暂不可操作。" : !onIntent ? "当前仅供查看。" : undefined
  const editable = !reason && capabilities.interact?.supported === true
  const unknown = [!hasText(subject) && "学科", !hasText(grade) && "适用年级", !source && "来源", ...parameters.filter(item => item.value === null || !Number.isFinite(item.value)).map(item => item.label)].filter(Boolean)
  const invalid = parameters.filter(item => !validDefinition(item) || item.value !== null && Number.isFinite(item.value) && !validValue(item, item.value))
  function send(type: "reset" | "request-fullscreen" | "open-source") {
    if (reason) return
    if (type === "reset" && !editable || type === "request-fullscreen" && !capabilities.fullscreen?.supported || type === "open-source" && !source?.openable) return
    onIntent?.({ ...context, type })
  }
  return <Card data-agent-demo-view={view} data-density={density} className={`min-w-0 ${density === "compact" ? "gap-3 p-3" : "gap-4 p-4"}`}>
    <h3 className="text-block-title break-words">{title}</h3>
    {(hasText(subject) || hasText(grade)) && <p className="text-ui-body break-words">{[subject, grade].filter(hasText).join(" · ")}</p>}
    {unknown.length > 0 && <p className="text-ui-hint break-words">未知：{unknown.join("、")}。</p>}
    {invalid.length > 0 && <p className="text-ui-hint break-words">请核对范围与步长：{invalid.map(item => item.label).join("、")}。</p>}
    {reason && <p className="text-ui-hint break-words">{reason}</p>}
    <SubjectCapabilities id={`${id}-capabilities`} labels={labels} capabilities={capabilities} />
    <p className="text-ui-hint break-words">移动端：{mobileSupport.supported ? "支持" : "暂不支持"}{hasText(mobileSupport.reason) ? ` · ${mobileSupport.reason}` : ""}</p>
    <div className={`grid min-w-0 ${density === "compact" ? "gap-3" : "gap-4"}`}>
      <section aria-label="演示参数" className="min-w-0 space-y-3">
        <h4 className="text-ui-action">演示参数</h4>
        {workspace && editable ? parameters.map((item, index) => <SubjectNumberControl key={index} item={item} disabled={!editable} slider describedBy={`${id}-capabilities ${id}-boundary`}
          onChange={value => { if (editable && validDefinition(item) && (value === null || Number.isFinite(value))) onIntent?.({ ...context, type: "param-change", parameterId: item.id, value }) }} />) : <SubjectValues items={parameters} />}
        {workspace && editable && <Button type="button" variant="outline" onClick={() => send("reset")}>重置参数</Button>}
      </section>
      <section aria-label={workspace ? "演示区域" : "演示预览"} className={`min-w-0 space-y-2 ${workspace ? "" : "max-w-sm"}`}>
        {workspace ? content : preview}
        <p className="text-read-body break-words" aria-live="polite">{description.trim() || "演示说明未提供"}</p>
      </section>
    </div>
    {workspace && <section aria-label="教学提示" className="space-y-2">
      <h4 className="text-ui-action">教学提示</h4><ul className="space-y-2 text-read-body break-words">{teachingTips.map((tip, index) => <li key={index}>{tip}</li>)}</ul>
    </section>}
    {source && <p className="text-ui-hint break-words">来源：{source.label}</p>}
    <div className="flex flex-wrap gap-2">
      {workspace && capabilities.fullscreen?.supported && <Button type="button" variant="outline" disabled={!!reason} onClick={() => send("request-fullscreen")}>请求全屏</Button>}
      {source?.openable && <Button type="button" variant="outline" disabled={!!reason} onClick={() => send("open-source")}>查看来源</Button>}
    </div>
    <p id={`${id}-boundary`} className="text-ui-hint break-words">演示用于课堂观察；参数调整不代表结论已验证或记录已保存。</p>
    <RecordDetails>{details}</RecordDetails>
    {workspace ? onBack && <div><Button type="button" variant="outline" onClick={() => onBack(context)}>返回原位置</Button></div>
      : onExpand && <div><Button data-demo-expand type="button" variant="outline" onClick={event => onExpand(event.currentTarget, context)}>打开演示</Button></div>}
  </Card>
}
