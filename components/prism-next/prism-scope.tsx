"use client"

import { createContext, useContext, useMemo, type ComponentProps, type ReactNode } from "react"
import type { SelectPopup } from "@/components/coss/select"
import type { PrismTheme } from "@/lib/prism-next/config"

export type PrismPortalContainer = NonNullable<ComponentProps<typeof SelectPopup>["portalProps"]>["container"]

export type PrismScope = {
  /** The host owns this target and places it inside its theme boundary, outside clipping surfaces. */
  portalContainer?: PrismPortalContainer
  /** Match the host's data-prism-theme; this does not change DOM attributes or next-themes. */
  theme?: PrismTheme
}

const PrismScopeContext = createContext<PrismScope>({})

/** A new boundary replaces the outer scope. Omitted fields use the original global defaults. */
export function PrismScopeProvider({ children, portalContainer, theme }: PrismScope & { children: ReactNode }) {
  const value = useMemo(() => ({ portalContainer, theme }), [portalContainer, theme])
  return <PrismScopeContext.Provider value={value}>{children}</PrismScopeContext.Provider>
}

export function usePrismScope(): PrismScope {
  return useContext(PrismScopeContext)
}

/** Explicit containers (including null, which waits for a target) take priority over the scope. */
export function usePrismPortalProps<T extends { container?: PrismPortalContainer }>(portalProps?: T): T | (T & { container: PrismPortalContainer }) | { container: PrismPortalContainer } | undefined {
  const { portalContainer } = usePrismScope()
  if (portalProps?.container !== undefined || portalContainer === undefined) return portalProps
  return { ...portalProps, container: portalContainer }
}
