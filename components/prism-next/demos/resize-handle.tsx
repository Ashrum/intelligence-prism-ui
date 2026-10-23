"use client"

import { ResizeHandle } from "../resize-handle"
import { DemoSection } from "../demo-parts"

export function ResizeHandleDemo() {
  return <DemoSection title="ResizeHandle 拖动手柄（视觉夹具）" description="常驻短条提示可调整边界。悬停加粗变色，Tab 聚焦显示外环；拖动中为宿主传入的静态状态。本夹具不调整面板尺寸。">
    <div className="grid gap-6">
      {(["light", "paper", "dark", "blueprint", "blueprint-night"] as const).map(theme => <section key={theme} data-agent-preview data-prism-theme={theme} className="min-w-0 bg-background p-4 text-foreground">
        <h3 className="text-block-title">{theme}</h3>
        <div className="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3">
          {(["vertical", "horizontal"] as const).flatMap(orientation => (["start", "center", "end"] as const).map(align => <div key={`${orientation}-${align}`} className="min-w-0">
            <p className="mb-3 break-words text-ui-hint">{orientation} · {align}</p>
            <div role="separator" aria-label={`${theme} ${orientation} ${align} 视觉预览`} aria-orientation={orientation} aria-valuemin={0} aria-valuemax={100} aria-valuenow={50} tabIndex={0}
              title="视觉预览：实际拖动或方向键调整由宿主实现" className={`group/resize-handle relative outline-none ${orientation === "vertical" ? "h-24 w-4" : "h-4 w-full"}`}>
              <ResizeHandle orientation={orientation} align={align} />
            </div>
          </div>))}
          <div><p className="mb-3 text-ui-hint">拖动中（静态）</p><div className="relative h-24 w-4"><ResizeHandle dragging /></div></div>
        </div>
      </section>)}
    </div>
  </DemoSection>
}
