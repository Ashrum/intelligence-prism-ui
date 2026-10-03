"use client"

import { useEffect, useId, useState } from "react"
import { ReviewTools as ReviewToolsComponent, type ReviewToolsPosition } from "@/components/prism-next/review-tools"
import { Button } from "@/components/prism-next/button"
import { ThemePicker } from "@/components/prism-next/shell"
import { Select, SelectTrigger, SelectValue, SelectPopup, SelectItem } from "@/components/coss/select"
import { Switch } from "@/components/coss/switch"
export type { ReviewToolsPosition } from "@/components/prism-next/review-tools"

const targets = [{ value: "auto", label: "自适应" }, { value: "1440", label: "1440×900" }, { value: "1920", label: "1920×1080" }]
const storageKey = "prism-review-tools-edge-position-v2"

// Frozen review host adapter: only storage and review-page controls live here.
export function ReviewTools({ device, onDeviceChange, missing, onMissingChange, defaultPosition, onResetRailPreferences }: {
  device: string; onDeviceChange: (value: string) => void
  missing: boolean; onMissingChange: (value: boolean) => void
  defaultPosition?: ReviewToolsPosition
  onResetRailPreferences?: () => void
}) {
  const id = useId()
  const [position, setPosition] = useState<ReviewToolsPosition | null>(null)
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) ?? "null")
      if (value && ["left", "right"].includes(value.horizontal) && ["top", "bottom"].includes(value.vertical) && Number.isFinite(value.offsetX) && value.offsetX >= 0 && Number.isFinite(value.offsetY) && value.offsetY >= 0) setPosition(value)
    } catch { /* Unavailable or malformed storage uses the host default. */ }
  }, [])
  return <ReviewToolsComponent description="调整评审视口、主题与扫描图像。" position={position} defaultPosition={defaultPosition}
    onPositionChange={next => {
      setPosition(next)
      try { if (next) localStorage.setItem(storageKey, JSON.stringify(next)); else localStorage.removeItem(storageKey) } catch { /* Storage is optional. */ }
    }}
    footer={<Button variant="outline" className="w-full" render={<a href="/next" />}>返回组件库</Button>}>
        <div className="space-y-2"><label htmlFor={`${id}-viewport`} className="text-ui-body">视口</label>
          <Select value={device} items={targets} onValueChange={value => { if (value) onDeviceChange(value) }}>
            <SelectTrigger id={`${id}-viewport`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectPopup>{targets.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectPopup>
          </Select>
        </div>
        <div role="group" aria-labelledby={`${id}-theme`} className="space-y-2"><p id={`${id}-theme`} className="text-ui-body">主题</p><ThemePicker /></div>
        <label className="flex cursor-pointer items-center justify-between gap-3 text-ui-body" htmlFor={`${id}-missing`}>无扫描图像<Switch id={`${id}-missing`} checked={missing} onCheckedChange={onMissingChange} /></label>
        {onResetRailPreferences && <Button variant="outline" size="default" className="w-full" onClick={onResetRailPreferences}>恢复题目栏默认</Button>}
  </ReviewToolsComponent>
}
