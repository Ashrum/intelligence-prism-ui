"use client"
import {useTheme} from 'next-themes'
import {themePalette} from '@/lib/prism-next/config'
import {chartSeriesColors} from '@/lib/prism-next/chart-palette'
import {usePrismScope} from '../prism-scope'
export function useChartTheme(){const {theme:globalTheme}=useTheme();const {theme:localTheme}=usePrismScope();const theme=localTheme??globalTheme;return {theme,palette:themePalette[theme as keyof typeof themePalette]??themePalette.light,colors:chartSeriesColors(theme)}}
