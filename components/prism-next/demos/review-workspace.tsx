"use client"
import { useState } from "react"
import { DemoSection } from "../demo-parts"
import { ReviewWorkspace, ReviewWorkspaceShortcuts } from "../review-workspace"
import { Button } from "../button"
import { ReviewDemoThemes, reviewFormula } from "./review-workspace-fixtures"
export function ReviewWorkspaceFixture() {
  const [open, setOpen] = useState(true), [immersive, setImmersive] = useState(false), [pane, setPane] = useState('canvas'), [help, setHelp] = useState(false), [takeover, setTakeover] = useState(false)
  const topbar = <header className="d1-topbar flex items-center gap-2 border-b px-4"><h2 className="text-block-title">试卷预览</h2><Button variant="ghost" onClick={() => setHelp(true)}>快捷键</Button></header>
  return <><Button variant="outline" aria-pressed={takeover} onClick={() => setTakeover(!takeover)}>宿主接管顶栏</Button><div className="h-[540px]">{takeover && topbar}<div style={{ height: takeover ? 'calc(100% - 56px)' : '100%' }}><ReviewWorkspace label="通用预览框架" topbar={takeover ? undefined : topbar} open={open} onOpenChange={value => { setOpen(value); setPane(value ? 'rail' : 'canvas') }} immersive={immersive} pane={pane} onPaneChange={setPane} shortcuts={[{ key: 't', intent: 'rail' }, { key: 'f', intent: 'immersive' }, { key: 'escape', intent: 'exit' }, { key: '?', intent: 'help' }]} onShortcut={intent => { if (intent === 'rail') setOpen(!open); if (intent === 'immersive') setImmersive(!immersive); if (intent === 'exit') setImmersive(false); if (intent === 'help') setHelp(true) }} rail={<aside data-review-rail className="d1-rail p-3 text-ui-body">题目栏由宿主提供外部事实。</aside>} canvas={<section data-review-canvas className="d1-canvas bg-border p-4"><div className="space-y-3 text-ui-body"><p>请核对完整解题过程中的参数条件与最终推导结论。</p>{reviewFormula}<Button variant="outline" onClick={() => setOpen(!open)}>切换题目栏</Button><Button variant="outline" onClick={() => setImmersive(!immersive)}>{immersive ? '退出沉浸' : '沉浸'}</Button></div></section>} inspector={<aside data-review-inspector className="d1-inspector p-3 text-ui-body">本题反馈与判断依据。</aside>} /></div></div><ReviewWorkspaceShortcuts open={help} onOpenChange={setHelp} entries={[["T","题目栏"],["F / Esc","沉浸 / 退出"],["?","快捷键"]]} /></>
}
export function ReviewWorkspaceNoRailFixture() {
  const [pane, setPane] = useState('canvas'), [immersive, setImmersive] = useState(false), [fullscreen, setFullscreen] = useState(false)
  return <div className={fullscreen ? 'fixed inset-0 z-50 bg-background' : 'h-[540px]'}>
    <ReviewWorkspace label="两栏预览框架" immersive={immersive} pane={pane} onPaneChange={setPane}
      topbar={<header className="d1-topbar flex items-center gap-2 border-b px-3"><h2 className="text-block-title whitespace-nowrap">学生试卷</h2><Button variant="outline" onClick={() => setFullscreen(!fullscreen)}>{fullscreen ? '返回示例' : '全屏查看'}</Button></header>}
      panes={[{ value: 'canvas', label: '试卷' }, { value: 'inspector', label: '接收信息' }]}
      shortcuts={[{ key: 'f', intent: 'immersive' }, { key: 'escape', intent: 'exit' }]}
      onShortcut={intent => { if (intent === 'immersive') setImmersive(!immersive); if (intent === 'exit') setImmersive(false) }}
      canvas={<section data-review-canvas className="d1-canvas bg-border p-4"><div className="space-y-3 text-ui-body"><p>请核对学生试卷的完整作答与扫描范围，确认长中文推导过程和公式清晰可读。</p>{reviewFormula}<Button variant="outline" onClick={() => setImmersive(!immersive)}>{immersive ? '退出沉浸' : '沉浸'}</Button></div></section>}
      inspector={<aside data-review-inspector className="d1-inspector p-3 text-ui-body"><h3 className="text-item-title">接收信息</h3><p>尚未批阅，每题得分未提供。接收状态由宿主提供。</p></aside>}
    />
  </div>
}
export function ReviewWorkspaceDemo() { return <><DemoSection title="三栏与宿主顶栏接管" description="窄容器切换题目、试卷与本题反馈；顶栏可省略，由已有业务流程顶栏承接内容。"><ReviewDemoThemes>{() => <ReviewWorkspaceFixture />}</ReviewDemoThemes></DemoSection><DemoSection title="两栏（无题目栏）" description="仅画布与接收信息；无题目分区、题目栏按钮或 T 快捷键。全屏查看可检查桌面两栏布局。"><ReviewDemoThemes>{() => <ReviewWorkspaceNoRailFixture />}</ReviewDemoThemes></DemoSection></> }
