"use client"

import { useRef, type ReactNode, type RefObject } from "react"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription, SheetPanel, SheetFooter } from "@/components/coss/sheet"

/** Business composition of the existing coss right Sheet; no custom panel geometry. */
export function QuestionWorkPanel({id,open,title,description,onClose,children,footer,className="",scrollMemory}:{id:string;open:boolean;title:string;description:string;onClose:()=>void;children:ReactNode;footer?:ReactNode;className?:string;scrollMemory?:RefObject<number>}) {
  const popup=useRef<HTMLDivElement>(null)
  function restoreScroll() {const viewport=popup.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');if(viewport&&scrollMemory)viewport.scrollTop=scrollMemory.current}
  return <Sheet open={open} modal={false} disablePointerDismissal onOpenChange={value=>{if(!value)onClose()}} onOpenChangeComplete={value=>{if(value)restoreScroll()}}>
    <SheetPopup ref={popup} id={id} side="right" className={`q-task-sheet q-no-print ${className}`} portalProps={{className:"q-task-sheet-portal"}} closeProps={{"aria-label":`收起${title.split(" · ")[0]}`}} finalFocus={()=>document.querySelector<HTMLButtonElement>(`button[aria-controls="${id}"]`)??false} onScrollCapture={event=>{const target=event.target as HTMLElement;if(scrollMemory&&target.dataset.slot==="scroll-area-viewport")scrollMemory.current=target.scrollTop}}>
      <SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{description}</SheetDescription></SheetHeader>
      <SheetPanel>{children}</SheetPanel>
      {footer&&<SheetFooter>{footer}</SheetFooter>}
    </SheetPopup>
  </Sheet>
}
