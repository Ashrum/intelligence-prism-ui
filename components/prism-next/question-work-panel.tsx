"use client"

import { useEffect, useRef, type ReactNode, type RefObject } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/coss/button"

/** An inline companion region: no portal, backdrop, focus trap or outside-click dismissal. */
export function QuestionWorkPanel({id,title,description,onClose,children,footer,className="",scrollMemory}:{id:string;title:string;description:string;onClose:()=>void;children:ReactNode;footer?:ReactNode;className?:string;scrollMemory?:RefObject<number>}) {
  const panel=useRef<HTMLElement>(null),body=useRef<HTMLDivElement>(null)
  useEffect(()=>{if(body.current&&scrollMemory)body.current.scrollTop=scrollMemory.current},[scrollMemory])
  useEffect(()=>{let frame=0;const resize=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(panel.current){const room=`${Math.max(280,window.innerHeight-Math.max(80,panel.current.getBoundingClientRect().top)-16)}px`;if(panel.current.style.getPropertyValue("--q-panel-room")!==room)panel.current.style.setProperty("--q-panel-room",room)}})};resize();window.addEventListener("scroll",resize,{passive:true});window.addEventListener("resize",resize);return()=>{cancelAnimationFrame(frame);window.removeEventListener("scroll",resize);window.removeEventListener("resize",resize)}},[])
  return <aside ref={panel} id={id} aria-labelledby={`${id}-title`} className={`q-work-panel q-no-print ${className}`}>
    <header className="flex shrink-0 items-start justify-between gap-3 px-4 pt-4 pb-3">
      <div><h3 id={`${id}-title`} className="text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>
      <Button variant="ghost" size="icon-sm" aria-label={`收起${title.split(" · ")[0]}`} onClick={()=>{onClose();requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>(`button[aria-controls="${id}"]`)?.focus({preventScroll:true}))}}><X/></Button>
    </header>
    <div ref={body} onScroll={event=>{if(scrollMemory)scrollMemory.current=event.currentTarget.scrollTop}} className="q-work-panel-body min-h-0 overflow-auto px-4 pb-4">{children}</div>
    {footer&&<footer className="flex shrink-0 flex-wrap items-center gap-2 border-t p-4">{footer}</footer>}
  </aside>
}
