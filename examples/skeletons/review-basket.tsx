"use client"
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ShoppingBasket, X } from 'lucide-react'
import { Button } from '@/components/coss/button'
import { Badge } from '@/components/prism-next/badge'
import { QuestionWorkPanel } from '@/components/prism-next/question-work-panel'
import './workbench-review.css'

export type ReviewBasketAdapter = { open: boolean; position: 'right'|'bottom'; empty: boolean; sampleAction: ReactNode }
/** Shared fixture only. Real applications pass their existing basket adapter. */
export function useReviewBasket(external?: ReviewBasketAdapter) {
 const [open,setOpen]=useState(false), [selected,setSelected]=useState(false), [wide,setWide]=useState(true)
 const launcher=useRef<HTMLButtonElement>(null)
 useEffect(()=>{const media=window.matchMedia('(min-width:1100px), (min-width:560px) and (max-height:500px)');const sync=()=>setWide(media.matches);sync();media.addEventListener('change',sync);return()=>media.removeEventListener('change',sync)},[])
 const position=wide?'right' as const:'bottom' as const
 return { basket:external ?? {open,empty:!selected,position}, sampleAction:external?.sampleAction ?? <Button size="sm" variant="outline" onClick={()=>setSelected(v=>!v)}>{selected?'移出示例题':'加入示例题'}</Button>, panel:external?null:<>
  <div className="review-basket-launcher"><Button ref={launcher} size="lg" variant="outline" className="w-36" aria-controls="shell-review-basket" aria-expanded={open} aria-label={`${open?'收起':'打开'}试题篮，${selected?1:0} 道题`} onClick={()=>setOpen(v=>!v)}><ShoppingBasket />{open?'收起题篮':'试题篮'}<Badge variant="info-solid" size="sm">{selected?1:0}</Badge></Button></div>
  <QuestionWorkPanel id="shell-review-basket" open={open} position={position} title="试题篮" description="演示题篮 · 可继续在正文选题" initialFocus={false} finalFocus={()=>document.querySelector('.workbench-shell[data-shell-panel], [data-agent-overlay][data-open]') ? false : launcher.current ?? false} showCloseButton={false} onClose={()=>setOpen(false)} className={`review-basket-panel workbench-basket-panel workbench-basket-${position}${selected?'':' workbench-basket-empty'}`} footerVariant="bare" footer={<div className="h-10" />}>
   {selected?<div className="space-y-4"><div className="flex items-center justify-between gap-3"><Badge variant="outline">示例题</Badge><Button size="icon" variant="ghost" aria-label="移出示例题" onClick={()=>{setSelected(false);launcher.current?.focus()}}><X /></Button></div><p className="text-base leading-8">已知 <math><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn></math>，求函数的最小值。</p><p className="text-sm text-muted-foreground">仅验证选题与空间，本页不进入编辑发布流程。</p></div>:<p className="py-2 text-sm text-muted-foreground leading-relaxed">还没有选题。可在正文中加入示例题，页面保持可操作。</p>}
  </QuestionWorkPanel>
 </> }
}
