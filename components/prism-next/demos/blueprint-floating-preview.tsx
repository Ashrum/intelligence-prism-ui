"use client"

import { useState } from "react"
import { TooltipProvider } from "@/components/coss/tooltip"
import { Button } from "../button"
import { DemoSection } from "../demo-parts"
import { PaperPreviewGroup } from "../paper-preview-group"
import { ReviewWorkspaceShortcuts } from "../review-workspace"
import { ContinuousPreviewFixture } from "./paper-preview-continuous"
import { StudentControlBarFixture } from "./student-control-bar"

function FloatingPreviewFixture() {
  const [open, setOpen] = useState(false), [help, setHelp] = useState(false)
  return <>
    <StudentControlBarFixture />
    <div data-review-canvas className="d1-canvas">
      <PaperPreviewGroup count={2} open={open} onOpenChange={setOpen} />
    </div>
    <ContinuousPreviewFixture />
    <Button variant="outline" onClick={() => setHelp(true)}>快捷键</Button>
    <ReviewWorkspaceShortcuts open={help} onOpenChange={setHelp} entries={[["Esc", "关闭快捷键表"]]} />
  </>
}

export function BlueprintFloatingPreviewDemo() {
  return <DemoSection id="p104-floating" title="原件预览浮动控件 · P104" description="合成数据。对照学生控制条、学生面板、纸边工具坞、满分作答披露和快捷键弹窗；蓝图与夜图使用实色纸面、直角墨线和无模糊硬阴影。">
    <TooltipProvider><div className="grid min-w-0 gap-6 xl:grid-cols-3">
      {['blueprint', 'blueprint-night', 'light'].map(theme => <section key={theme} data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} className="min-w-0 space-y-4 bg-background p-3 text-foreground">
        <h3 className="text-item-title">{theme}</h3>
        <FloatingPreviewFixture />
      </section>)}
    </div></TooltipProvider>
  </DemoSection>
}
