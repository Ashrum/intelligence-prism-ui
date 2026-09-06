"use client"

import { useImperativeHandle, useRef } from "react"
import type { ComponentProps } from "react"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useSelectionIndicator } from "@/components/ui/use-selection-indicator"
import { cn } from "@/lib/utils"

type SegmentedOption = { value: string; label: string; count?: number; disabled?: boolean }
type SegmentedControlProps = Omit<ComponentProps<typeof RadioGroup>, "children" | "asChild"> & {
  label: string
  items: readonly (readonly [string, string] | SegmentedOption)[]
  size?: "sm" | "md"
}

export function SegmentedControl({ label, items, size = "md", orientation = "horizontal", className, ref, onKeyUpCapture, ...props }: SegmentedControlProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => trackRef.current as HTMLDivElement)
  useSelectionIndicator(trackRef, '[data-slot="radio-group-item"][data-state="checked"]', ".segmented-item-label")
  return (
    <div className="selection-scroll" data-selection-scroll>
      <RadioGroup
        {...props} ref={trackRef} orientation={orientation} aria-label={label}
        className={cn("segmented-control", `segmented-control--${size}`, className)}
        onKeyUpCapture={(event) => {
          onKeyUpCapture?.(event)
          if (event.defaultPrevented || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return
          const releasedOn = event.target
          const group = event.currentTarget
          // Compensate only when keyup precedes Radix's deferred focus movement.
          // Normal keypresses already release on the destination and never click twice.
          setTimeout(() => {
            const focused = document.activeElement
            if (focused instanceof HTMLElement && focused !== releasedOn && group.contains(focused)
              && focused.matches('[data-slot="radio-group-item"][data-state="unchecked"]:not(:disabled)')) focused.click()
          }, 0)
        }}
      >
        <span aria-hidden="true" className="selection-indicator" data-selection-indicator />
        {items.map((item) => {
          const option: SegmentedOption = "value" in item ? item : { value: item[0], label: item[1] }
          return (
            <Label key={option.value} className="segmented-item-label" data-selection-option data-disabled={option.disabled || props.disabled || undefined}>
              <RadioGroupItem
                value={option.value}
                disabled={option.disabled || props.disabled}
                aria-label={`${option.label}${option.count === undefined ? "" : ` ${option.count}`}`}
                className="segmented-item"
              />
              <span className="selection-label"><span>{option.label}</span>{option.count !== undefined && <span className="selection-count">{option.count}</span>}</span>
            </Label>
          )
        })}
      </RadioGroup>
    </div>
  )
}
