"use client"

import { useLayoutEffect, useRef, type FocusEvent } from "react"

/** Reveal only within this scroller; never scroll the page or move focus. */
export function revealHorizontalChoice(container: HTMLElement, item: HTMLElement) {
  if (container.scrollWidth <= container.clientWidth) return
  const viewport = container.getBoundingClientRect()
  const choice = item.getBoundingClientRect()
  const left = viewport.left + container.clientLeft
  const right = left + container.clientWidth
  if (choice.left < left || choice.right - choice.left > container.clientWidth) container.scrollLeft += choice.left - left
  else if (choice.right > right) container.scrollLeft += choice.right - right
}

/** Internal layout adapter for the existing tab/radio demos, not a new control. */
export function useHorizontalChoiceScroll(value: string, enabled = true) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const container = ref.current
    if (!container || !enabled) return
    const selected = () => container.querySelector<HTMLElement>('[role="tab"][aria-selected="true"], [role="radio"][aria-checked="true"]')
    const reveal = () => {
      const focused = container.ownerDocument.activeElement
      const item = focused instanceof HTMLElement && container.contains(focused) && focused.matches('[role="tab"], [role="radio"]')
        ? focused
        : selected()
      if (item) revealHorizontalChoice(container, item)
    }
    const item = selected()
    if (item) revealHorizontalChoice(container, item)
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(reveal)
    observer?.observe(container)
    // Font loading or label changes can resize the choices without resizing the viewport.
    container.querySelectorAll('[role="tab"], [role="radio"]').forEach(item => observer?.observe(item))
    return () => observer?.disconnect()
  }, [value, enabled])
  const onFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (!enabled) return
    const item = event.target.closest<HTMLElement>('[role="tab"], [role="radio"]')
    if (item && event.currentTarget.contains(item)) revealHorizontalChoice(event.currentTarget, item)
  }
  return { ref, onFocusCapture }
}
