"use client"

import Link from "next/link"
import { useEffect, useReducer, useRef, useState } from "react"
import { Renderer } from "@openuidev/react-lang"
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react"
import { Badge, StateLabel } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ObjectCard, ObjectCardActions, ObjectCardHeader } from "@/components/ui/card"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Textarea } from "@/components/ui/textarea"
import { CandidateView, EvidenceView, LimitsView, ReviewOrigin, checkRenderableReview, reviewLibrary } from "@/components/prism/openui-review-library"
import { fixedResponse, initialReview, reviewReducer, tasks } from "@/lib/openui/review-contract"
import type { Task } from "@/lib/openui/review-contract"

export function OpenUIReview() {
  const [task, setTask] = useState<Task>("explain")
  const [mode, setMode] = useState("dynamic")
  const [checked, setChecked] = useState(() => checkRenderableReview(fixedResponse("explain")))
  const [origin, setOrigin] = useState<"sample" | "model">("sample")
  const [state, dispatch] = useReducer(reviewReducer, undefined, initialReview)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("当前为固定样例，可切换任务和布局进行比较。")
  const [failed, setFailed] = useState(false)
  const [renderFailed, setRenderFailed] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [modelConfigured, setModelConfigured] = useState(false)
  const [modelStatus, setModelStatus] = useState("正在检查模型连接。")
  const [runs, setRuns] = useState({ accepted: 0, rejected: 0 })
  const request = useRef<AbortController | null>(null)
  const sequence = useRef(0)
  const draftDirty = state.draft !== state.record.text

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/openui-review", { signal: controller.signal }).then(r => r.json()).then(data => {
      setModelReady(data.ready === true)
      setModelConfigured(data.configured === true)
      setModelStatus(data.ready ? "模型已配置，生成结果仍需验证。" : data.configured ? "真实生成仅向已配置的评审账号开放。" : "模型尚未连接；当前可体验固定样例。")
    }).catch(() => { if (!controller.signal.aborted) setModelStatus("暂时无法检查模型连接，固定样例仍可使用。") })
    return () => { controller.abort(); request.current?.abort(); sequence.current++ }
  }, [])

  function accept(input: unknown, source: "sample" | "model") {
    const next = checkRenderableReview(input)
    setChecked(next); setOrigin(source); setRenderFailed(false); setFailed(false)
    setRuns(value => ({ ...value, accepted: value.accepted + 1 }))
  }
  function changeTask(value: string) {
    sequence.current++; request.current?.abort(); setBusy(false)
    const next = value as Task
    setTask(next); accept(fixedResponse(next), "sample")
    setNotice("已切换固定样例；复核草稿与已应用内容保持不变。")
  }
  function reject() {
    setFailed(true); setRuns(value => ({ ...value, rejected: value.rejected + 1 }))
    setNotice("新结果未通过完整性校验，已保留上一份内容、草稿与复核状态。")
  }
  async function generate() {
    if (!modelReady || busy) return
    request.current?.abort(); const controller = new AbortController(); request.current = controller
    const current = ++sequence.current
    setBusy(true); setFailed(false); setNotice("正在生成，完整校验后更新；可继续编辑复核草稿。")
    try {
      const response = await fetch("/api/openui-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task }), signal: controller.signal })
      if (!response.ok) throw new Error("Generation unavailable")
      const data = await response.json()
      if (current !== sequence.current) return
      accept(data.response, "model"); setNotice("新的 AI 初稿已生成；请核对依据后再用于复核。")
    } catch { if (current === sequence.current && !controller.signal.aborted) { reject(); setNotice("本次生成未完成或结果无效，已保留上一份内容、草稿与复核状态。") } }
    finally { if (current === sequence.current) setBusy(false) }
  }

  return <main id="main-content" className="openui-page" tabIndex={-1}>
    <Link href="/" className="openui-back"><ArrowLeft aria-hidden="true" />返回智能曜彩</Link>
    <header className="openui-heading"><div><p className="openui-eyebrow">OpenUI · 受控组件试点</p><h1>证据解释与复核</h1><p>同一份证据，按任务调整阅读顺序。</p></div><Badge>候选 · 待评审</Badge></header>
    <section className="openui-object" aria-label="当前对象与范围"><div><strong>数学学习观察</strong><span>七年级 · 示例对象 01</span></div><p>近三周课堂作答与本周作业 <Badge>示例数据</Badge></p></section>
    <div className="openui-controls"><SegmentedControl label="阅读任务" value={task} onValueChange={changeTask} items={tasks.map(item => ({ value: item.value, label: item.label }))} /><SegmentedControl label="布局方式" value={mode} onValueChange={setMode} items={[["dynamic", "按任务排列"], ["fixed", "固定顺序"]]} size="sm" /></div>
    <div className="openui-workspace">
      <section className="openui-result" aria-label="证据与候选说明">
        <div className="openui-result-heading"><span>{origin === "model" ? "AI 生成结果" : "固定样例"} · {tasks.find(item => item.value === task)?.label}</span><Button variant="ghost" size="compact" disabled={!modelReady} loading={busy} loadingLabel="生成中" onClick={generate}><RefreshCw aria-hidden="true" />生成新初稿</Button></div>
        <ReviewOrigin.Provider value={origin}>
          {mode === "dynamic" && !renderFailed ? <Renderer response={checked.response} library={reviewLibrary} isStreaming={false} publishObservability={false} onError={(errors) => { if (!errors.length) return; setRenderFailed(true); setNotice("布局暂时不可用，已使用固定顺序保留内容。"); setFailed(true) }} /> : <div className="openui-blocks"><CandidateView text={checked.text} /><EvidenceView /><LimitsView /></div>}
        </ReviewOrigin.Provider>
      </section>
      <aside className="openui-editor" aria-labelledby="review-title">
        <ObjectCard className="openui-block"><ObjectCardHeader><h2 id="review-title">人工复核</h2><StateLabel tone={state.record.reviewed ? "completed" : "pending"}>{state.record.reviewed ? "已复核" : "待复核"}</StateLabel></ObjectCardHeader>
          <p className="openui-helper">此处保留编辑内容，切换阅读任务不会覆盖草稿。</p>
          <label htmlFor="review-draft" className="openui-field-label">复核草稿</label>
          <Textarea id="review-draft" value={state.draft} maxLength={1200} rows={7} aria-describedby="draft-help" onChange={e => dispatch({ type: "edit", text: e.target.value })} />
          <p id="draft-help" className="openui-helper">{draftDirty ? "有未应用的修改。应用后需要重新复核。" : "可编辑草稿，或使用左侧候选说明。"}</p>
          <ObjectCardActions><Button disabled={draftDirty || checked.text === state.draft} variant="secondary" onClick={() => { dispatch({ type: "candidate", text: checked.text, source: origin }); setNotice("候选说明已放入草稿，请核对后应用。") }}>使用候选说明<ArrowRight aria-hidden="true" /></Button></ObjectCardActions>
          <ObjectCardActions><Button disabled={!draftDirty || !state.draft.trim()} onClick={() => { dispatch({ type: "apply" }); setNotice("修改已应用，需重新复核。") }}>应用修改</Button>{draftDirty && <Button variant="ghost" onClick={() => dispatch({ type: "discard" })}>取消修改</Button>}</ObjectCardActions>
          <div className="openui-applied"><h3>已应用内容</h3><p>{state.record.text}</p><span className="openui-helper">{state.record.source === "model" ? "AI 来源" : "固定样例来源"}{state.record.edited ? " · 人工调整" : ""} · {state.record.reviewed ? "已人工复核" : "待人工复核"}</span></div>
          <ObjectCardActions><Button variant="secondary" disabled={draftDirty} onClick={() => { dispatch({ type: "review" }); setNotice(state.record.reviewed ? "已取消复核标记。" : "当前应用内容已标记复核。") }}>{state.record.reviewed ? "取消复核" : "标记已复核"}</Button><Button variant="ghost" disabled={!state.previous || draftDirty} onClick={() => { dispatch({ type: "undo" }); setNotice("已恢复上一份应用内容和复核状态。") }}>撤回应用</Button></ObjectCardActions>
          <p className="openui-helper">本页为交互试点，操作仅在本次页面中保留。</p>
        </ObjectCard>
      </aside>
    </div>
    <p className="openui-feedback" role="status" aria-live="polite" data-error={failed || undefined}>{notice}</p>
    <details className="openui-evaluation"><summary>试点评审与连接状态</summary><p>{modelStatus}</p>{modelConfigured && !modelReady && <a href="/signin-with-chatgpt?return_to=%2Freview%2Fopenui" target="_top">使用评审账号继续</a>}<p>本次通过 {runs.accepted} 次，拒绝 {runs.rejected} 次。此计数包含固定样例检查，不代表模型生成效果。</p><div className="openui-check-actions"><Button variant="secondary" disabled={busy} onClick={() => { try { accept(fixedResponse(task).replace("limits = Limits()", ""), "sample") } catch { reject() } }}>验证不完整结果回退</Button><Button variant="ghost" disabled={busy} onClick={() => { accept(fixedResponse(task), "sample"); setNotice("已恢复当前任务的固定样例，复核内容保持不变。") }}>恢复固定样例</Button></div><p>可先编辑草稿，再切换任务；也可标记已复核后验证失败回退，检查内容与状态是否保留。</p><a href="https://www.openui.com/docs/openui-lang/defining-components" target="_blank" rel="noreferrer">OpenUI 组件机制</a></details>
  </main>
}
