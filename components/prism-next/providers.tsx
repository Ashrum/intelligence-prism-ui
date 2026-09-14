"use client"

import { ThemeProvider } from "next-themes"
import { MotionConfig } from "motion/react"
import { TooltipProvider } from "@/components/coss/tooltip"
import { ToastProvider } from "@/components/coss/toast"

export function Providers({children}:{children:React.ReactNode}) {
  return <ThemeProvider attribute="data-prism-theme" themes={["light","paper","dark"]} defaultTheme="light" enableSystem={false} storageKey="prism-v1-theme" disableTransitionOnChange>
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={400}><ToastProvider position="bottom-right">{children}</ToastProvider></TooltipProvider>
    </MotionConfig>
  </ThemeProvider>
}
