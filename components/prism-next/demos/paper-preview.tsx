"use client"
import { AnnotationPaperPreviewDemo } from "./paper-preview-annotations"
import { MixedPaperPreviewDemo } from "./paper-preview-mixed"
import { ContinuousPaperPreviewDemo } from "./paper-preview-continuous"
import { RegionEditingPaperPreviewDemo } from "./paper-preview-region-editing"

export function PaperPreviewDemo() {
  return <><ContinuousPaperPreviewDemo /><MixedPaperPreviewDemo /><RegionEditingPaperPreviewDemo /><AnnotationPaperPreviewDemo /></>
}
