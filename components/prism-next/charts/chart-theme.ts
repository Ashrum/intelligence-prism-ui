"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { themePalette } from "@/lib/prism-next/config"
import { chartSeriesColors } from "@/lib/prism-next/chart-palette"
import { usePrismScope } from "../prism-scope"

const subscribe = () => () => {}
const serverTheme = () => undefined

export function useChartTheme() {
  const { theme: globalTheme } = useTheme()
  const { theme: localTheme } = usePrismScope()
  // Persisted next-themes state is unavailable on the server. React uses this
  // same snapshot during hydration, then reads the current client theme.
  // Explicit scopes are host-owned SSR props and remain immediately available.
  const hydratedTheme = useSyncExternalStore(subscribe, () => globalTheme ?? "light", serverTheme)
  const theme = localTheme ?? hydratedTheme
  return { theme, palette: themePalette[theme as keyof typeof themePalette] ?? themePalette.light, colors: chartSeriesColors(theme) }
}
