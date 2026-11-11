"use client"

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react"
import { DialogPrimitive } from "@/components/coss/dialog"
import { cn } from "@/lib/utils"
import { BpSkeleton } from "./motion"

export interface BpWorkSkeletonProps {
  header?: ReactNode
  rail?: boolean
  inspector?: boolean
  label?: string
}

export function BpWorkSkeleton({ header, rail = true, inspector = true, label = "正在打开" }: BpWorkSkeletonProps) {
  return <div className="bp-work-skeleton flex h-full min-h-0 flex-col" role="status" aria-label={label}>
    {header ?? <div data-bp-work-skeleton-header className="flex h-14 shrink-0 items-center gap-6 border-b-[1.5px] border-(--line) px-6">
      <BpSkeleton width={96} height={14} /><BpSkeleton width={160} height={18} />
    </div>}
    <div className="flex min-h-0 flex-1">
      {rail && <aside data-bp-work-skeleton-rail className="hidden w-[232px] shrink-0 space-y-3 overflow-y-auto border-r border-border px-3 py-3.5 md:block">
        <BpSkeleton width="60%" height={14} /><BpSkeleton height={28} /><BpSkeleton width="40%" height={12} />
        {[52, 46, 58, 42, 50, 55].map(width => <BpSkeleton key={width} shape="row" lines={[`${width}%`, "36px"]} height={14} />)}
      </aside>}
      <div data-bp-work-skeleton-main className="min-w-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-5 border border-border bg-card px-4 py-7 lg:px-8">
          <BpSkeleton width="72%" height={28} /><BpSkeleton width="54%" height={12} />
          <div className="grid grid-cols-3 divide-x divide-border border-y border-border">
            {[0, 1, 2].map(index => <BpSkeleton key={index} shape="stat" />)}
          </div>
          <div className="grid grid-cols-3 gap-6"><BpSkeleton width={64} height={14} /><BpSkeleton width={72} height={14} /><BpSkeleton width={72} height={14} /></div>
          <div className="grid grid-cols-2 gap-4 lg:gap-8">
            <div className="min-w-0 space-y-3.5"><BpSkeleton width="40%" height={16} />{[0, 1, 2, 3].map(index => <BpSkeleton key={index} shape="block" height={40} />)}</div>
            <div className="min-w-0 space-y-3.5"><BpSkeleton width="50%" height={16} />{[0, 1].map(index => <BpSkeleton key={index} shape="block" height={58} />)}</div>
          </div>
          <BpSkeleton shape="block" height={180} />
        </div>
      </div>
      {inspector && <aside data-bp-work-skeleton-inspector className="hidden w-[380px] shrink-0 space-y-4 overflow-y-auto border-l border-border px-6 py-5 md:block">
        <BpSkeleton width="70%" height={12} /><BpSkeleton width="45%" height={18} />
        <BpSkeleton shape="block" height={96} /><BpSkeleton shape="block" height={96} />
      </aside>}
    </div>
  </div>
}

/** Give the skeleton a paint opportunity before mounting expensive host content. */
export function scheduleBpWorkLayerReady(callback: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined
  const frame = requestAnimationFrame(() => { timer = setTimeout(callback, 0) })
  return () => { cancelAnimationFrame(frame); clearTimeout(timer) }
}

export interface BpWorkLayerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenChangeComplete?: (open: boolean) => void
  label: string
  portalProps?: ComponentProps<typeof DialogPrimitive.Portal>
  initialFocus?: ComponentProps<typeof DialogPrimitive.Popup>["initialFocus"]
  finalFocus?: ComponentProps<typeof DialogPrimitive.Popup>["finalFocus"]
  skeleton?: ReactNode
  contentKey?: string | number
  popupProps?: Omit<ComponentProps<typeof DialogPrimitive.Popup>, "children" | "className"> & { className?: string; [data: `data-${string}`]: unknown }
  children: ReactNode
}

export function BpWorkLayer({ open, onOpenChange, onOpenChangeComplete, label, portalProps, initialFocus, finalFocus, skeleton = <BpWorkSkeleton />, contentKey, popupProps, children }: BpWorkLayerProps) {
  const [ready, setReady] = useState(false)
  const cancelReady = useRef<(() => void) | undefined>(undefined)
  useEffect(() => {
    if (!open) {
      cancelReady.current?.()
      cancelReady.current = undefined
    }
    return () => {
      cancelReady.current?.()
      cancelReady.current = undefined
    }
  }, [open])
  const handleOpenChangeComplete = (completedOpen: boolean) => {
    if (completedOpen && open) {
      cancelReady.current?.()
      cancelReady.current = scheduleBpWorkLayerReady(() => {
        cancelReady.current = undefined
        setReady(true)
      })
    }
    if (!completedOpen) {
      cancelReady.current?.()
      cancelReady.current = undefined
      setReady(false)
    }
    onOpenChangeComplete?.(completedOpen)
  }
  const { className, ...rest } = popupProps ?? {}
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} onOpenChangeComplete={handleOpenChangeComplete}>
    <DialogPrimitive.Portal {...portalProps}>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/8 transition-opacity duration-(--motion-slow) ease-bp data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--motion-base) motion-reduce:hidden" />
      <DialogPrimitive.Popup {...rest} data-ui-version="coss-v1" aria-label={label} aria-busy={open && !ready ? true : undefined}
        initialFocus={initialFocus ?? rest.initialFocus} finalFocus={finalFocus ?? rest.finalFocus}
        className={cn("bp-work-layer fixed inset-0 z-50 outline-none bg-background origin-[50%_40%] transition-[opacity,transform,scale] duration-(--motion-slow) ease-bp data-starting-style:opacity-0 data-starting-style:scale-[0.985] data-ending-style:opacity-0 data-ending-style:scale-[0.985] data-ending-style:duration-(--motion-base) motion-reduce:transition-opacity motion-reduce:duration-(--motion-fast) motion-reduce:data-ending-style:duration-(--motion-fast) motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100", className)}>
        {ready
          ? <div key={contentKey} className="h-full min-h-0 min-w-0 animate-in fade-in duration-(--motion-fast) ease-bp" data-bp-work-layer-content>{children}</div>
          : skeleton}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
}
