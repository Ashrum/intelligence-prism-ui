"use client"
import { BlueprintFloatingPreviewDemo } from "./blueprint-floating-preview"
import { AnnotationPaperPreviewDemo } from "./paper-preview-annotations"
import { MixedPaperPreviewDemo } from "./paper-preview-mixed"
import { ContinuousPaperPreviewDemo } from "./paper-preview-continuous"
import { RegionEditingPaperPreviewDemo } from "./paper-preview-region-editing"

export function PaperPreviewDemo() {
  return <><BlueprintFloatingPreviewDemo /><ContinuousPaperPreviewDemo /><MixedPaperPreviewDemo /><RegionEditingPaperPreviewDemo /><AnnotationPaperPreviewDemo /></>
}
