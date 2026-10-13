import type { Metadata } from "next"
import { BlueprintExperiment } from "./blueprint-experiment"

export const metadata: Metadata = {
  title: "Prism Blueprint v0.2.1 · 页面风格实验",
  description: "C · 轻量 Blueprint。复用智能曜彩现有组件，比较页面结构与阅读节奏。",
}

export default function BlueprintExperimentPage() {
  return <BlueprintExperiment />
}
