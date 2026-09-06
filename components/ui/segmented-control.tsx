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

export function SegmentedControl({ label, items, size = "md", orientation = "horizontal", className, ref, ...props }: SegmentedControlProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  useImperativeHandle(ref, () => trackRef.current as HTMLDivElement)
  useSelectionIndicator(trackRef, '[data-slot="radio-group-item"][data-state="checked"]', ".segmented-item-label")
  return (
    <div className="selection-scroll" data-selection-scroll>
      <RadioGroup {...props} ref={trackRef} orientation={orientation} aria-label={label} className={cn("segmented-control", `segmented-control--${size}`, className)}>
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
                onFocus={(event) => {
                  // Selection follows focus without depending on the duration of an arrow keypress.
                  if (event.currentTarget.dataset.state !== "checked") event.currentTarget.click()
                }}
              />
              <span className="selection-label"><span>{option.label}</span>{option.count !== undefined && <span className="selection-count">{option.count}</span>}</span>
            </Label>
          )
        })}
      </RadioGroup>
    </div>
  )
}
