import type { Metadata } from "next"
import { BlueprintExperiment } from "./blueprint-experiment"

export const metadata: Metadata = {
  title: "Prism Blueprint v0.3 · 官网源样式移植",
  description: "从 Answer me with HTML 官网移植图框、尺带、分区标题与图签，保留智能曜彩现有组件和三主题。",
}

export default function BlueprintExperimentPage() {
  return <BlueprintExperiment />
}
