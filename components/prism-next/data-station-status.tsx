"use client"

import { AgentStatus, type AgentStatusTone } from "./agent-visual-parts"

export type DataStationStatus = "connected" | "available" | "disconnected" | "offline" | "unknown" | "idle" | "connecting" | "failed"
const statuses: Record<DataStationStatus, { label: string; tone: AgentStatusTone }> = {
  connected: { label: "已连接", tone: "success" }, available: { label: "可用", tone: "info" },
  disconnected: { label: "未连接", tone: "warning" }, offline: { label: "离线", tone: "error" },
  unknown: { label: "连接状态未提供", tone: "neutral" }, idle: { label: "待连接", tone: "neutral" },
  connecting: { label: "连接中", tone: "info" }, failed: { label: "失败", tone: "error" },
}

/** Shared with MaterialIntake; never infer connection from availability. */
export function DataStationConnectionStatus({ status }: { status: DataStationStatus }) {
  const value = statuses[status]
  return <AgentStatus tone={value.tone}>{value.label}</AgentStatus>
}
