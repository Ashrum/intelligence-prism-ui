"use client"

import { useEffect, useRef } from "react"

/** Notify the host at expiry; visibility remains host-owned. */
export function useToastTimer(duration?: number, onTimeout?: () => void) {
  const callback = useRef(onTimeout)
  useEffect(() => { callback.current = onTimeout }, [onTimeout])
  const lifetime = duration !== undefined && Number.isFinite(duration) && duration > 0 ? duration : undefined
  useEffect(() => {
    if (lifetime === undefined) return
    const timer = setTimeout(() => callback.current?.(), lifetime)
    return () => clearTimeout(timer)
  }, [lifetime])
  return lifetime
}
