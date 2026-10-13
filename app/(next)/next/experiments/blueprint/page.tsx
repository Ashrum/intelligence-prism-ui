import type { Metadata } from "next"
import { BlueprintExperiment } from "./blueprint-experiment"

export const metadata: Metadata = {
  title: "Prism Blueprint v0.4 · 主画面精修",
  description: "以教学任务为主画面的 Blueprint 页面实验：保留官网图纸结构，收紧评审说明与图签，完整呈现证据标题和来源。",
}

export default function BlueprintExperimentPage() {
  return <BlueprintExperiment />
}
