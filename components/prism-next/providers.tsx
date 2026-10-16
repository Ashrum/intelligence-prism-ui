"use client"

import { ThemeProvider } from "next-themes"
import { MotionConfig } from "motion/react"
import { TooltipProvider } from "@/components/coss/tooltip"
import type { ToastProviderProps } from "@/components/coss/toast"
import { ToastProvider } from "./scoped-overlays"
import { themeOptions } from "@/lib/prism-next/config"

const themes = themeOptions.map(option => option.value)

export type ProvidersProps = {
  children: React.ReactNode
  /** Controls this provider's entire toast queue; use separate managers for separate page scopes. */
  toastPortalProps?: ToastProviderProps["portalProps"]
  toastManager?: ToastProviderProps["toastManager"]
}

export function Providers({children, toastPortalProps, toastManager}:ProvidersProps) {
  return <ThemeProvider attribute="data-prism-theme" themes={themes} defaultTheme="light" enableSystem={false} enableColorScheme={false} storageKey="prism-v1-theme" disableTransitionOnChange>
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={400}><ToastProvider position="bottom-right" portalProps={toastPortalProps} {...(toastManager === undefined ? {} : { toastManager })}>{children}</ToastProvider></TooltipProvider>
    </MotionConfig>
  </ThemeProvider>
}
