"use client"

import { useLayoutEffect } from "react"
import type { RefObject } from "react"

function keepOptionVisible(option: HTMLElement) {
  const viewport = option.closest<HTMLElement>("[data-selection-scroll]")
  if (!viewport) return
  const item = option.getBoundingClientRect()
  const view = viewport.getBoundingClientRect()
  if (item.left < view.left + 4) viewport.scrollLeft -= view.left + 4 - item.left
  else if (item.right > view.right - 4) viewport.scrollLeft += item.right - view.right + 4
}

export function useSelectionIndicator(
  trackRef: RefObject<HTMLElement | null>,
  activeSelector: string,
  targetSelector?: string,
) {
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    let readyFrame = 0
    let initialized = false
    let disposed = false
    const measure = () => {
      if (disposed) return
      const active = track.querySelector<HTMLElement>(activeSelector)
      const target = targetSelector ? active?.closest<HTMLElement>(targetSelector) : active
      if (!target) {
        track.dataset.indicatorVisible = "false"
        return
      }
      track.style.setProperty("--indicator-x", `${target.offsetLeft}px`)
      track.style.setProperty("--indicator-y", `${target.offsetTop}px`)
      track.style.setProperty("--indicator-width", `${target.offsetWidth}px`)
      track.style.setProperty("--indicator-height", `${target.offsetHeight}px`)
      track.dataset.indicatorVisible = "true"
      const focused = document.activeElement instanceof HTMLElement
        ? document.activeElement.closest<HTMLElement>("[data-selection-option]") : null
      keepOptionVisible(focused && track.contains(focused) ? focused : target)
      if (!initialized) {
        initialized = true
        readyFrame = requestAnimationFrame(() => { track.dataset.indicatorReady = "true" })
      }
    }
    const focus = (event: FocusEvent) => {
      const option = event.target instanceof HTMLElement
        ? event.target.closest<HTMLElement>("[data-selection-option]") : null
      if (option) keepOptionVisible(option)
    }
    track.dataset.indicatorReady = "false"
    const resizeObserver = new ResizeObserver(measure)
    const observeOptions = () => {
      track.querySelectorAll<HTMLElement>("[data-selection-option]").forEach((option) => resizeObserver.observe(option))
      measure()
    }
    resizeObserver.observe(track)
    const mutationObserver = new MutationObserver(observeOptions)
    mutationObserver.observe(track, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-state", "disabled"] })
    track.addEventListener("focusin", focus)
    observeOptions()
    void document.fonts?.ready.then(measure)
    return () => {
      disposed = true
      cancelAnimationFrame(readyFrame)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      track.removeEventListener("focusin", focus)
      delete track.dataset.indicatorReady
      delete track.dataset.indicatorVisible
    }
  }, [activeSelector, targetSelector, trackRef])
}
