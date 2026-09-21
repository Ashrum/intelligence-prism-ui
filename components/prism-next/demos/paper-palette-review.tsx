"use client"
import {useTheme} from 'next-themes'
import {Button} from '@/components/coss/button'
export function PaperPaletteReview({candidate,onChange}:{candidate:boolean;onChange:(v:boolean)=>void}){
 const {theme,setTheme}=useTheme()
 return <section className="mb-6 space-y-3 rounded-lg bg-secondary p-4" aria-label="暖纸配色对照"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-item-title">暖纸配色对照 · 候选 v0.1</h3>{theme==='paper'?<div className="flex gap-2" role="group" aria-label="图表配色"><Button size="sm" variant={candidate?'outline':'secondary'} aria-pressed={!candidate} onClick={()=>onChange(false)}>现有配色</Button><Button size="sm" variant={candidate?'secondary':'outline'} aria-pressed={candidate} onClick={()=>onChange(true)}>候选配色</Button></div>:<Button variant="outline" size="sm" onClick={()=>setTheme('paper')}>切到暖纸比较</Button>}</div><p className="text-ui-hint text-muted-foreground">同一份数据、同一布局与标签，仅比较配色。候选只用于本页暖纸主题；选中项目保持。</p></section>
}
