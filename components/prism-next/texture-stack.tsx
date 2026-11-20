"use client"

import { Tooltip, TooltipTrigger } from "@/components/coss/tooltip"
import { TooltipPopup } from "./scoped-overlays"
import "./texture-stack.css"

export type TextureStackSegment = {
  id: string
  label: string
  value: number
  color: string
  shortLabel?: string
}

export type TextureStackProps = {
  segments: readonly TextureStackSegment[]
  onSelect?: (id: string) => void
  selectedId?: string
}

export function TextureStack({ segments, onSelect, selectedId }: TextureStackProps) {
  const visible = segments.filter(({ value }) => Number.isFinite(value) && value > 0)
  const total = visible.reduce((sum, { value }) => sum + value, 0)

  return <div>
    <div className="prism-texture-stack-track">
      {visible.map(({ id, label, value, color }) => {
        const percent = value / total * 100
        const description = `${label}：已完成 ${value} 份（占比 ${Math.round(percent)}%）`
        const style = { backgroundColor: color, flexGrow: percent, opacity: selectedId !== undefined && id !== selectedId ? 0.28 : undefined }

        return <Tooltip key={id}>
          {onSelect
            ? <TooltipTrigger type="button" className="prism-texture-stack-segment" style={style}
                aria-label={description} aria-pressed={id === selectedId} onClick={() => onSelect(id)} />
            : <TooltipTrigger render={<span />} className="prism-texture-stack-segment" style={style} aria-hidden="true" />}
          <TooltipPopup>{description}</TooltipPopup>
        </Tooltip>
      })}
    </div>
    <div className="prism-texture-stack-legend text-ui-meta text-muted-foreground tabular-nums">
      {segments.map(({ id, label, shortLabel, value, color }) => {
        const content = <><span className="prism-texture-stack-swatch" style={{ backgroundColor: color }} aria-hidden="true" />
          <span>{shortLabel ?? label} <strong className="text-foreground">{value}</strong></span></>
        return onSelect
          ? <button key={id} type="button" className="prism-texture-stack-item" aria-label={`${label} ${value} 份`}
              aria-pressed={id === selectedId} onClick={() => onSelect(id)}>{content}</button>
          : <span key={id} className="prism-texture-stack-item">{content}</span>
      })}
    </div>
  </div>
}
