import { BlueprintComponentsDemo } from "@/components/prism-next/demos/blueprint"
export const metadata = { title: "蓝图组件 · 智能曜彩" }
export default function BlueprintPage() {
  return <div className="prism-content">
    <header className="prism-page-heading"><p>FOUNDATIONS / BLUEPRINT</p><h1>蓝图组件</h1><p className="text-ui-hint text-muted-foreground">第四主题的首期页面级呈现组件。可在任意主题使用；在「蓝图」下呈现完整几何。扩展组件，不计入组件目录数量。</p></header>
    <p className="mb-6 text-ui-action"><a className="prism-link" href="/next/foundations/blueprint/guide">Foundations · 第四主题「蓝图」 → 规范、来源与验收记录</a></p>
    <BlueprintComponentsDemo />
  </div>
}
