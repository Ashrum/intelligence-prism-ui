"use client"

import { useId, useState } from "react"
import { ReviewTools } from "../review-tools"
import { Button } from "../button"
import { ThemePicker } from "../shell"
import { DemoSection } from "../demo-parts"
import { ToggleGroup, ToggleGroupItem } from "@/components/coss/toggle-group"
import { Switch } from "@/components/coss/switch"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { AlertDialog, AlertDialogTrigger, AlertDialogPopup, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogClose } from "@/components/coss/alert-dialog"
import { ReviewDemoThemes, reviewFormula } from "./review-workspace-fixtures"

const viewports = [{ value: "auto", label: "自适应" }, { value: "320", label: "320px 窄容器" }]
const scenarios = [{ value: "normal", label: "完整数据" }, { value: "missing", label: "缺少参考材料" }]

/** All mutations below affect this local fixture only; the component has no executor. */
export function ReviewToolsDemo() {
  const id = useId()
  const [mode, setMode] = useState("review")
  const [viewport, setViewport] = useState("auto")
  const [missing, setMissing] = useState(false)
  const [scenario, setScenario] = useState("normal")
  const [records, setRecords] = useState<string[]>([])
  const [notice, setNotice] = useState("尚未生成本页示例记录。")
  return <DemoSection title="评审与测试工具" description="仅用于评审/测试工具，不得用于产品界面。点击或指向右下角橙红按钮；可拖动，方向键移动，Esc 关闭。">
    <div className="space-y-4">
      <div role="group" aria-labelledby={`${id}-mode`} className="space-y-2">
        <p id={`${id}-mode`} className="text-ui-body">工具用法</p>
        <ToggleGroup variant="outline" value={[mode]} onValueChange={values => { if (values[0]) setMode(values[0]) }}>
          <ToggleGroupItem value="review">评审工具</ToggleGroupItem><ToggleGroupItem value="test">测试工具</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <p role="status" className="text-ui-hint">{notice}</p>
      <div style={{ maxWidth: viewport === "320" ? 320 : undefined }} className="space-y-3">
        <p className="text-ui-body">当前视口：{viewport === "320" ? "320px 窄容器" : "自适应"}；参考材料：{missing ? "未提供" : "已提供"}；本页示例记录：{records.length} 条。</p>
        <ReviewDemoThemes>{() => <div className="space-y-3">
          <p className="text-ui-body">长中文示例：核对完整推导过程、适用条件与参考材料，缺失信息由宿主明确呈现。</p>
          <p className="text-read-body">{reviewFormula}</p>
          <p className="text-ui-hint">{missing ? "参考材料未提供，请先核对原始来源。" : "参考材料已提供；此处为本页演示数据。"}</p>
          {records.length > 0 && <ul className="space-y-2 text-ui-body">{records.map((record, index) => <li key={index}>{record}</li>)}</ul>}
        </div>}</ReviewDemoThemes>
      </div>
    </div>
    <ReviewTools title={mode === "review" ? "评审工具" : "测试工具"}
      description={mode === "review" ? "调整本页视口、主题与数据状态。" : "生成、批量调整或清除本页示例记录。"}
      groups={mode === "review" ? [
        { id: "viewport", title: "视口", children: <Select items={viewports} value={viewport} onValueChange={value => { if (value) setViewport(value) }}>
          <SelectTrigger aria-label="评审视口" className="w-full"><SelectValue /></SelectTrigger>
          <SelectPopup>{viewports.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup>
        </Select> },
        { id: "theme", title: "主题", children: <ThemePicker /> },
        { id: "data", title: "数据状态", children: <label htmlFor={`${id}-missing`} className="flex items-center justify-between gap-3 text-ui-body">缺少参考材料<Switch id={`${id}-missing`} checked={missing} onCheckedChange={setMissing} /></label> },
      ] : [
        { id: "scenario", title: "测试场景", children: <div className="space-y-2">
          <Select items={scenarios} value={scenario} onValueChange={value => { if (value) setScenario(value) }}>
            <SelectTrigger aria-label="测试场景" className="w-full"><SelectValue /></SelectTrigger>
            <SelectPopup>{scenarios.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup>
          </Select>
          <Button variant="outline" className="w-full" onClick={() => { setRecords(["示例记录 1 · 待核对", "示例记录 2 · 待核对"]); setMissing(scenario === "missing"); setNotice("已在本页生成 2 条示例记录。"); }}>生成场景</Button>
        </div> },
        { id: "batch", title: "批量动作", children: <div className="space-y-2">
          <Button variant="outline" className="w-full" disabled={!records.length} aria-describedby={!records.length ? `${id}-disabled` : undefined} onClick={() => { setRecords(records.map((_, index) => `示例记录 ${index + 1} · 已标记`)); setNotice("已标记本页的全部示例记录。"); }}>标记全部示例</Button>
          {!records.length && <p id={`${id}-disabled`} className="text-ui-hint">请先生成场景，当前没有可标记的记录。</p>}
        </div> },
        { id: "clear", title: "清除示例", children: <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive-outline" className="w-full" disabled={!records.length} aria-describedby={!records.length ? `${id}-empty` : undefined} />}>清除本页记录</AlertDialogTrigger>
          {!records.length && <p id={`${id}-empty`} className="text-ui-hint">当前没有可清除的记录。</p>}
          <AlertDialogPopup><AlertDialogHeader><AlertDialogTitle>清除本页 {records.length} 条示例记录？</AlertDialogTitle><AlertDialogDescription>仅清除本页内存中的演示数据。之后可重新生成场景。</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogClose render={<Button variant="outline" />}>取消</AlertDialogClose><AlertDialogClose render={<Button variant="destructive-outline" />} onClick={() => { setRecords([]); setNotice("已清除本页示例记录。"); }}>确认清除</AlertDialogClose></AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog> },
      ]} />
  </DemoSection>
}
