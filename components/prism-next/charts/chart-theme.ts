"use client"
import {useTheme} from 'next-themes'
import {themePalette} from '@/lib/prism-next/config'
import {chartSeriesColors} from '@/lib/prism-next/chart-palette'
export function useChartTheme(){const {theme}=useTheme();return {theme,palette:themePalette[theme as keyof typeof themePalette]??themePalette.light,colors:chartSeriesColors(theme)}}
