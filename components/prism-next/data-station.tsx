"use client"

import { useId, type ReactNode } from "react"
import { ArrowLeftRight, ChevronRight, Monitor, Printer, X } from "lucide-react"
import { Card } from "@/components/coss/card"
import { Empty } from "@/components/coss/empty"
import { Radio, RadioGroup } from "@/components/coss/radio-group"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription, SheetPanel } from "@/components/coss/sheet"
import { Drawer, DrawerPopup, DrawerHeader, DrawerTitle, DrawerDescription, DrawerPanel, DrawerClose } from "@/components/coss/drawer"
import { Skeleton } from "@/components/coss/skeleton"
import { AgentStatus } from "./agent-visual-parts"
import { Button } from "./button"
import { DataStationConnectionStatus } from "./data-station-status"

export type DataStationDevice = {
  id: string; name: string; location?: string; number?: string; onlineTime?: string
  paperSizes?: readonly string[]; sides?: string; onlineDescription?: string
  availability: { kind: "available" } | { kind: "busy"; occupiedBy?: string; estimatedMinutes?: number }
    | { kind: "offline"; lostMinutesAgo?: number } | { kind: "unknown" }
}
export type DataStationConnection = { kind: "idle" } | { kind: "connecting" | "connected"; stationId: string }
  | { kind: "failed"; stationId: string; reason: string }
export type DataStationRetryIntent = { kind: "load" } | { kind: "connect"; stationId: string }
export type DataStationProps = {
  devices: readonly DataStationDevice[]; recommendedId?: string; selectedId: string | null
  connection: DataStationConnection
  state: { kind: "ready" | "loading" } | { kind: "empty"; nextStep: string } | { kind: "error"; reason: string }
  task: { className?: string; subject?: string; gradingMode?: string; bindingDescription: string }
  refreshDescription?: string
  onSelect?: (stationId: string) => void; onConnect?: (stationId: string) => void
  onDisconnect?: (stationId: string) => void; onRetry?: (intent: DataStationRetryIntent) => void
} & ({ presentation?: "sheet" | "drawer"; open: boolean; onClose: () => void } | { presentation: "inline"; open?: never; onClose?: () => void })
export type DataStationBadgeProps = {
  state: { kind: "connected"; name: string } | { kind: "available"; count: number } | { kind: "disconnected" }
  onOpen?: () => void
}
const known = (value?: string) => value?.trim() || "未提供"
const minutes = (value?: number) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? `${value} 分钟` : undefined
const actionClass = "h-auto sm:h-auto min-h-12 min-w-11 max-w-full whitespace-normal break-words py-2 motion-reduce:transition-none"

function unavailable(device: DataStationDevice) {
  const state = device.availability
  return state.kind === "busy" ? `使用中：${known(state.occupiedBy)} · ${minutes(state.estimatedMinutes) ? `预计 ${minutes(state.estimatedMinutes)}` : "预计用时未提供"}；暂不可选`
    : state.kind === "offline" ? `离线：${minutes(state.lostMinutesAgo) ? `${minutes(state.lostMinutesAgo)}前失联` : "失联时间未提供"}；暂不可选`
      : state.kind === "unknown" ? "可用状态未提供；暂不可选" : undefined
}

/** A button, not a connection executor. Counts and station names are explicit host facts. */
export function DataStationBadge({ state, onOpen }: DataStationBadgeProps) {
  const id = useId()
  const label = state.kind === "connected" ? `${known(state.name)} · 已连接`
    : state.kind === "available" ? `${Number.isInteger(state.count) && state.count >= 0 ? `${state.count} 台可用` : "可用数量未提供"}` : "未连接"
  return <span className="inline-flex min-w-0 max-w-full flex-col gap-1">
    <Button type="button" variant="outline" className={actionClass} data-station-badge disabled={!onOpen}
      aria-describedby={!onOpen ? `${id}-reason` : undefined} onClick={() => onOpen?.()}>
      <span className="min-w-0 [overflow-wrap:anywhere]">教学数据站 {label}</span><ChevronRight aria-hidden="true" className="shrink-0" />
    </Button>
    {!onOpen && <span id={`${id}-reason`} className="text-ui-hint">数据站入口暂不可用。</span>}
  </span>
}

/** Default host is a controlled right Sheet. Inline uses the exact same panel. */
export function DataStation(props: DataStationProps) {
  const description = `选择并连接本次批阅使用的数据站${props.refreshDescription?.trim() ? ` · ${props.refreshDescription}` : ""}`
  if (props.presentation === "inline") return <DataStationPanel {...props} description={description} />
  if (props.presentation === "drawer") return <Drawer position="right" open={props.open} onOpenChange={open => { if (!open) props.onClose() }}>
    <DrawerPopup className="w-full max-w-xl motion-reduce:transition-none"
      portalProps={{ className: "motion-reduce:[&_[data-slot=drawer-backdrop]]:transition-none motion-reduce:[&_[data-slot=scroll-area-viewport]]:transition-none motion-reduce:[&_[data-slot=scroll-area-scrollbar]]:transition-none" }}>
      <DrawerHeader className="pr-16"><DrawerTitle>教学数据站</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader>
      <DrawerPanel><DataStationPanel {...props} description={description} hideHeading /></DrawerPanel>
      <DrawerClose aria-label="关闭教学数据站" render={<Button variant="ghost" className="absolute end-2 top-2 min-h-11 min-w-11" />}><X aria-hidden="true" /></DrawerClose>
    </DrawerPopup>
  </Drawer>
  return <Sheet open={props.open} onOpenChange={open => { if (!open) props.onClose() }}>
    <SheetPopup side="right" className="w-full max-w-xl motion-reduce:transition-none" showCloseButton
      closeProps={{ "aria-label": "关闭教学数据站", className: "absolute end-2 top-2 min-h-11 min-w-11" }}>
      <SheetHeader className="pr-16"><SheetTitle>教学数据站</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
      <SheetPanel><DataStationPanel {...props} description={description} hideHeading /></SheetPanel>
    </SheetPopup>
  </Sheet>
}

function DataStationPanel({ devices, recommendedId, selectedId, connection, state, task, description, hideHeading,
  onSelect, onConnect, onDisconnect, onRetry, onClose,
}: DataStationProps & { description: string; hideHeading?: boolean }) {
  const id = useId()
  const recommended = devices.find(device => device.id === recommendedId)
  const selected = devices.find(device => device.id === selectedId)
  const active = connection.kind !== "idle" ? devices.find(device => device.id === connection.stationId) : undefined
  const locked = connection.kind === "connecting" || connection.kind === "connected"
  const selectionReason = locked ? connection.kind === "connecting" ? "正在连接，请等待结果。" : "请先断开当前连接，再选择数据站。"
    : !onSelect ? "数据站选择暂不可用。" : undefined
  const connectReason = connection.kind === "connecting" ? "正在连接，请等待结果。" : !selected ? "请先选择可用的数据站。"
    : unavailable(selected) || (!onConnect ? "连接操作暂不可用。" : undefined)
  const retryReason = !onRetry ? "重试操作暂不可用。" : connection.kind === "failed"
    ? !active ? "连接目标未提供，请重新加载设备信息。" : unavailable(active) : undefined
  const disconnectReason = !onDisconnect ? "断开操作暂不可用。" : undefined
  const closeReason = !onClose ? "返回操作暂不可用。" : undefined
  function action(key: string, label: ReactNode, reason: string | undefined, intent: () => void, primary = false) {
    return <div className="min-w-0 space-y-1" key={key}>
      <Button type="button" variant={primary ? "default" : "outline"} className={`${actionClass} w-full`} data-station-action={key}
        disabled={!!reason} aria-describedby={reason ? `${id}-${key}-reason` : undefined} onClick={() => { if (!reason) intent() }}>{label}</Button>
      {reason && <p id={`${id}-${key}-reason`} className="break-words text-ui-hint">{reason}</p>}
    </div>
  }
  return <section data-data-station data-state={state.kind} aria-label={hideHeading ? "数据站连接面板" : undefined}
    aria-labelledby={!hideHeading ? `${id}-title` : undefined} className="min-w-0 space-y-4 [overflow-wrap:anywhere]">
    {!hideHeading && <header className="space-y-2"><h2 id={`${id}-title`} className="text-block-title">教学数据站</h2><p className="text-ui-hint">{description}</p></header>}
    {state.kind === "loading" ? <><p role="status" className="text-ui-hint">正在加载数据站</p><div aria-busy="true" className="space-y-4"><Skeleton className="h-32 w-full motion-reduce:animate-none" /><Skeleton className="h-48 w-full motion-reduce:animate-none" /></div></>
      : state.kind === "error" ? <div className="space-y-3"><p role="alert" className="text-ui-hint">数据站加载失败：{known(state.reason)}</p>{action("load", "重新加载", !onRetry ? "重试操作暂不可用。" : undefined, () => onRetry?.({ kind: "load" }))}</div>
        : state.kind === "empty" ? <Empty><h3 className="text-block-title">本校未配置数据站</h3><p className="text-ui-hint">{known(state.nextStep)}</p></Empty>
          : <>
            <div role="status" aria-live="polite" className="flex flex-wrap items-center gap-2">
              <DataStationConnectionStatus status={connection.kind} />
              {connection.kind !== "idle" && <span className="text-ui-hint">{active?.name || `数据站 ${connection.stationId}`}</span>}
            </div>
            {recommended ? <Card className="min-w-0 gap-3 p-4" aria-label="推荐设备">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex shrink-0 items-center gap-2" role="img" aria-label="打印/扫描与终端双向连接">
                  <span className="flex flex-col items-center gap-2 text-ui-hint"><Printer aria-hidden="true" className="size-8" />打印 / 扫描</span>
                  <ArrowLeftRight aria-hidden="true" className="size-5" />
                  <span className="flex flex-col items-center gap-2 text-ui-hint"><Monitor aria-hidden="true" className="size-8" />终端</span>
                </div>
                <div className="min-w-0 flex-1 basis-48 space-y-2"><p className="text-ui-hint">推荐设备</p><h3 className="text-item-title">{recommended.name}</h3>
                  <p className="text-ui-hint">{known(recommended.location)}</p><p className="text-ui-hint">{known(recommended.onlineDescription)}</p>
                  <DataStationConnectionStatus status={connection.kind !== "idle" && connection.stationId === recommended.id ? connection.kind : "idle"} />
                </div>
              </div>
            </Card> : <p className="text-ui-hint">推荐设备未提供，请从列表选择可用数据站。</p>}
            <Card className="min-w-0 gap-2 p-4" aria-label="当前任务"><h3 className="text-item-title">当前任务</h3>
              <p className="text-ui-body">{known(task.className)} · {known(task.subject)} · {known(task.gradingMode)}</p><p className="text-ui-hint">{known(task.bindingDescription)}</p>
            </Card>
            <div className="space-y-2"><h3 id={`${id}-devices`} className="text-item-title">选择数据站</h3>
              {selectionReason && <p id={`${id}-selection-reason`} className="text-ui-hint">{selectionReason}</p>}
              <RadioGroup value={selectedId} aria-labelledby={`${id}-devices`} aria-describedby={selectionReason ? `${id}-selection-reason` : undefined}
                disabled={!!selectionReason} onValueChange={value => { const device = devices.find(item => item.id === value); if (!selectionReason && device && !unavailable(device)) onSelect?.(device.id) }}>
                {devices.map((device, index) => { const reason = unavailable(device), labelId = `${id}-device-${index}`
                  return <Card key={device.id} render={<label />} className="min-h-11 min-w-0 gap-2 p-4" data-station-device={device.id}>
                    <span className="flex min-w-0 items-center gap-3"><Radio value={device.id} disabled={!!reason || !!selectionReason} aria-labelledby={`${labelId}-name`} aria-describedby={`${labelId}-details`} /><span id={`${labelId}-name`} className="min-w-0 text-item-title">{device.name}</span></span>
                    <span id={`${labelId}-details`} className="flex min-w-0 flex-col gap-2 text-ui-hint">
                      {reason ? <span>{reason}</span> : <AgentStatus tone="success">空闲可用</AgentStatus>}
                      <span>{known(device.location)}</span><span>编号 {known(device.number)} · 在线时间 {known(device.onlineTime)} · {device.paperSizes?.length ? device.paperSizes.join(" / ") : "纸张能力未提供"} · {known(device.sides)}</span>
                    </span>
                  </Card>
                })}
              </RadioGroup>
              {!devices.length && <p className="text-ui-hint">当前列表为空，请核对数据站信息。</p>}
            </div>
            {connection.kind === "failed" && <div className="space-y-2"><p role="alert" className="text-ui-hint">连接失败：{known(connection.reason)}</p>
              {action("retry", `重试连接${active?.name || "数据站"}`, retryReason, () => onRetry?.({ kind: "connect", stationId: connection.stationId }))}</div>}
            {connection.kind === "connected" ? action("disconnect", "断开连接", disconnectReason, () => onDisconnect?.(connection.stationId))
              : action("connect", connection.kind === "connecting" ? "连接中" : selectedId && selectedId === recommendedId ? "连接推荐数据站" : "连接所选数据站", connectReason, () => { if (selected) onConnect?.(selected.id) }, true)}
          </>}
    {action("close", "返回", closeReason, () => onClose?.())}
  </section>
}
