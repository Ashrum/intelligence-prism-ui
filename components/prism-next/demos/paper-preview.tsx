"use client"
import { MixedPaperPreviewDemo } from "./paper-preview-mixed"
import { ContinuousPaperPreviewDemo } from "./paper-preview-continuous"

export function PaperPreviewDemo() {
  return <><ContinuousPaperPreviewDemo /><MixedPaperPreviewDemo /></>
}
