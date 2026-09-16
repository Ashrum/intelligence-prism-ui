"use client"
import {useTheme} from 'next-themes'
import {themePalette} from '@/lib/prism-next/config'
export function useChartTheme(){const {theme}=useTheme();return {palette:themePalette[theme as keyof typeof themePalette]??themePalette.light,colors:theme==='dark'?['#86C5FF','#F296C2','#99DFB4','#F4CC86','#BDACED','#B6BEC9']:['#1769AA','#B8266E','#2B8050','#A57013','#7159A7','#6B7280']}}
