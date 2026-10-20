"use client"
import { useSyncExternalStore } from "react"

// A single page-wide presentation clock; no business callbacks or state changes.
const listeners = new Set<() => void>()
let current = 0
let timer: ReturnType<typeof setInterval> | undefined
function tick() {
  current = Date.now()
  listeners.forEach(listener => listener())
}
function stop() {
  if (timer !== undefined) clearInterval(timer)
  timer = undefined
}
function visibilityChanged() {
  stop()
  if (!document.hidden && listeners.size) {
    tick()
    timer = setInterval(tick, 60000)
  }
}
export function subscribeMessageTime(listener: () => void) {
  if (typeof document === "undefined") return () => {}
  listeners.add(listener)
  if (listeners.size === 1) {
    document.addEventListener("visibilitychange", visibilityChanged)
    visibilityChanged()
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      stop()
      document.removeEventListener("visibilitychange", visibilityChanged)
    }
  }
}
const snapshot = () => current
const serverSnapshot = () => 0
const noSubscribe = () => () => {}
export function useMessageTimeClock(enabled: boolean) {
  return useSyncExternalStore(enabled ? subscribeMessageTime : noSubscribe, snapshot, serverSnapshot)
}
