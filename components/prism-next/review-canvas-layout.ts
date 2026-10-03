"use client"
import {useLayoutEffect,type RefObject,type Dispatch,type SetStateAction} from 'react'
import {dockPaperToolbar} from './paper-preview-layout'
export type StudentControlLayout={left:number;height:number}
export type PaperDockLayout={left:number;top:number;maxHeight:number}
export function usePaperPreviewDock({canvasArea,canvas,toolbar,scale,controlLayout,layoutKey,setDockPosition}:{canvasArea:RefObject<HTMLElement|null>;canvas:RefObject<HTMLDivElement|null>;toolbar:RefObject<HTMLDivElement|null>;scale:number;controlLayout:StudentControlLayout;layoutKey:string;setDockPosition:Dispatch<SetStateAction<PaperDockLayout>>}) {
  useLayoutEffect(() => {
    const area = canvasArea.current, node = canvas.current, bar = toolbar.current
    if (!area || !bar) return
    const measure = () => {
      const bounds = area.getBoundingClientRect(), factor = scale || 1
      const papers = [...area.querySelectorAll<HTMLElement>('[data-scan-paper]')].filter(paper=>{const rect=paper.getBoundingClientRect();return rect.bottom>bounds.top+(controlLayout.height+16)*factor&&rect.top<bounds.bottom})
      const right = papers.length ? Math.max(...papers.map(paper => paper.getBoundingClientRect().right)) : bounds.right - 64 * factor
      const size = dockPaperToolbar({ canvasWidth: area.clientWidth, paperRight: (right - bounds.left) / factor, toolbarWidth: bar.offsetWidth })
      const height = area.clientHeight, maxHeight = Math.max(44, height - 88 / factor - 16)
      const top = Math.max(8, Math.min((height - bar.offsetHeight) / 2, height - 88 / factor - 8 - bar.offsetHeight))
      setDockPosition(previous => previous.left === size.left && previous.top === top && previous.maxHeight === maxHeight ? previous : { left: size.left, top, maxHeight })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(area); observer.observe(bar)
    area.querySelectorAll<HTMLElement>('[data-review-page], [data-missing-paper]').forEach(paper => observer.observe(paper))
    node?.addEventListener('scroll', measure, { passive: true })
    return () => { observer.disconnect(); node?.removeEventListener('scroll', measure) }
  }, [layoutKey,scale,controlLayout.height])
 }
export function useStudentControlLayout({canvasArea,canvas,studentControls,scale,layoutKey,setControlLayout}:{canvasArea:RefObject<HTMLElement|null>;canvas:RefObject<HTMLDivElement|null>;studentControls:RefObject<HTMLDivElement|null>;scale:number;layoutKey:string;setControlLayout:Dispatch<SetStateAction<StudentControlLayout>>}) {
  useLayoutEffect(() => {
    const area=canvasArea.current, node=canvas.current, bar=studentControls.current
    if(!area||!node||!bar)return
    const measure=()=>{
      const paper=node.querySelector<HTMLElement>('.d1-paper-column'), bounds=area.getBoundingClientRect()
      if(!paper||!area.clientWidth)return
      const left=Math.max(8,Math.min((paper.getBoundingClientRect().left-bounds.left)/(scale||1),area.clientWidth-80))
      const height=bar.offsetHeight
      setControlLayout(previous=>previous.left===left&&previous.height===height?previous:{left,height})
    }
    measure();const observer=new ResizeObserver(measure)
    observer.observe(area);observer.observe(bar)
    const paper=node.querySelector<HTMLElement>('.d1-paper-column');if(paper)observer.observe(paper)
    node.addEventListener('scroll',measure,{passive:true})
    return()=>{observer.disconnect();node.removeEventListener('scroll',measure)}
  },[scale,layoutKey])
 }
