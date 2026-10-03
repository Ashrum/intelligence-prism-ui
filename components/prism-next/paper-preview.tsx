"use client"

import { useRef, useState, type ComponentProps } from "react"
import { FileImage } from "lucide-react"
import type { DocumentRegion } from "./document-region-viewer"
import { PaperPreviewMixed } from "./paper-preview-mixed"
import { PaperPreviewContinuous, type PaperPreviewContinuousProps } from "./paper-preview-continuous"
export { PaperPreviewContinuous, locatePaperTarget, type PaperPreviewLocation, type PaperPreviewContinuousProps } from "./paper-preview-continuous"
export { PaperPreviewSurface, type PaperPreviewSurfaceProps } from "./paper-preview-surface"
export { dockPaperToolbar } from "./paper-preview-layout"

export type PaperPreviewRotation = 0 | 90 | 180 | 270
export type PaperPreviewZoom = "page" | "width" | number
export type PaperPreviewPage = {
  id: string; imageUrl?: string; thumbnailUrl?: string; alt?: string
  paperSize?: "A4" | "A3"; orientation?: "portrait" | "landscape"
  dimensions?: { width: number; height: number }
  regions?: DocumentRegion[]
}
export type PaperPreviewProps = {
  /** Continuous canvas is the default; compose it in a fullscreen ReviewWorkspace. */
  layout?: "continuous"
  pages: readonly PaperPreviewPage[]
  continuous?: Omit<PaperPreviewContinuousProps, "pages" | "zoom" | "rotations" | "selected" | "onZoom" | "onSelect">
  zoom?: PaperPreviewZoom; defaultZoom?: PaperPreviewZoom; onZoomChange?: (zoom: PaperPreviewZoom) => void
  rotation?: Record<string, PaperPreviewRotation>; defaultRotation?: Record<string, PaperPreviewRotation>
  selectedRegionId?: string; onRegionSelect?: (pageId: string, regionId: string) => void
} | {
  layout: "mixed"
  mixed: ComponentProps<typeof PaperPreviewMixed>
}

export function clampPaperZoom(percent: number) { return Math.max(5, Math.min(300, Number.isFinite(percent) ? percent : 100)) }
export function paperDimensions(size: "A4" | "A3" = "A4", orientation: "portrait" | "landscape" = "portrait") {
  const [w, h] = size === "A3" ? [297, 420] : [210, 297]
  return { width: (orientation === "landscape" ? h : w) * 96 / 25.4, height: (orientation === "landscape" ? w : h) * 96 / 25.4 }
}
export function paperZoomPercent(zoom: PaperPreviewZoom, viewport: { width: number; height: number }, paper: { width: number; height: number }) {
  return typeof zoom === "number" ? clampPaperZoom(zoom) : clampPaperZoom(100 * (zoom === "width" ? viewport.width / paper.width : Math.min(viewport.width / paper.width, viewport.height / paper.height)))
}
export function rotatedPaperDimensions(paper: { width: number; height: number }, rotation: PaperPreviewRotation) {
  return rotation === 90 || rotation === 270 ? { width: paper.height, height: paper.width } : paper
}

function ThumbnailImage({ page }: { page: PaperPreviewPage }) {
  const [failed, setFailed] = useState(false)
  const src = page.thumbnailUrl ?? page.imageUrl
  if (!src || failed) return <span role="img" className="flex h-full w-full flex-col items-center justify-center gap-2" aria-label={failed ? "图像加载失败" : "扫描图像未接入"}><FileImage aria-hidden="true" /><span className="text-ui-meta">{page.paperSize ?? "A4"}</span></span>
  return <img src={src} alt="" className="h-full w-full object-contain" onError={() => setFailed(true)} />
}

/** Shared passive thumbnail for Attachment; source changes reset image failure. */
export function PaperThumbnail({ page, label: _label }: { page: PaperPreviewPage; label: string }) {
  return <ThumbnailImage key={`${page.id}:${page.thumbnailUrl ?? page.imageUrl ?? "missing"}`} page={page} />
}

export function PaperPreview(props: PaperPreviewProps) {
  const mixed = props.layout === "mixed"
  const [localZoom, setLocalZoom] = useState<PaperPreviewZoom>(mixed ? "page" : props.defaultZoom ?? "page")
  const [initialRotation] = useState(mixed ? {} : props.defaultRotation ?? {})
  const viewportRef = useRef<HTMLDivElement>(null)
  if (props.layout === "mixed") return <PaperPreviewMixed {...props.mixed} />
  function changeZoom(next: PaperPreviewZoom) {
    if (props.layout === "mixed" || !props.pages.length) return
    if (props.zoom === undefined) setLocalZoom(next)
    props.onZoomChange?.(next)
  }
  return <PaperPreviewContinuous {...props.continuous} viewportRef={props.continuous?.viewportRef ?? viewportRef} pages={props.pages} zoom={props.zoom ?? localZoom} rotations={props.rotation ?? initialRotation} selected={props.selectedRegionId} onZoom={changeZoom} onSelect={props.onRegionSelect ? (regionId, pageId) => props.onRegionSelect?.(pageId, regionId) : undefined} />
}

export { PaperPreviewMixed } from './paper-preview-mixed'
export type { PaperPreviewMixedPage } from './paper-preview-mixed'
export { PaperPreviewGroup } from './paper-preview-group'
