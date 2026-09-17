"use client"
import {useTheme} from 'next-themes'
import {themePalette,chartColors,heatmapColors,type PrismTheme} from '@/lib/prism-next/config'
export function useChartTheme(){
 const {theme}=useTheme()
 const key:PrismTheme=theme==='dark'||theme==='paper'?theme:'light'
 return {palette:themePalette[key],colors:chartColors[key],heatmapColors:heatmapColors[key]}
}
