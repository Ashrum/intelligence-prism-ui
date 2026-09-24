"use client"

import { useRef, type ComponentProps, type ReactNode, type RefObject } from "react"
import { XIcon } from "lucide-react"
import { Button } from "@/components/coss/button"
import { Drawer, DrawerPopup, DrawerHeader, DrawerTitle, DrawerDescription, DrawerPanel, DrawerFooter, DrawerClose } from "@/components/coss/drawer"

/** Reuse coss's edge Drawer motion, with the work surface still usable. */
export function QuestionWorkPanel({id,open,title,description,onClose,children,footer,footerVariant="default",headerActions,headerContent,className="",scrollMemory,position="right",initialFocus,finalFocus,showCloseButton=true}:{id:string;open:boolean;title:string;description:string;onClose:()=>void;children:ReactNode;footer?:ReactNode;footerVariant?:ComponentProps<typeof DrawerFooter>["variant"];headerActions?:ReactNode;headerContent?:ReactNode;className?:string;scrollMemory?:RefObject<number>;position?:"right"|"bottom";initialFocus?:ComponentProps<typeof DrawerPopup>["initialFocus"];finalFocus?:ComponentProps<typeof DrawerPopup>["finalFocus"];showCloseButton?:boolean}) {
  const popup=useRef<HTMLDivElement>(null)
  function restoreScroll() {const root=popup.current;const viewport=root&&getComputedStyle(root).overflowY==="auto"?root:root?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');if(viewport&&scrollMemory)viewport.scrollTop=scrollMemory.current}
  return <Drawer position={position} open={open} modal={false} disablePointerDismissal onOpenChange={value=>{if(!value)onClose()}} onOpenChangeComplete={value=>{if(value)restoreScroll()}}>
    <DrawerPopup ref={popup} id={id} className={`q-task-drawer q-no-print motion-reduce:transition-none! ${className}`} portalProps={{className:"q-task-drawer-portal"}} initialFocus={initialFocus} finalFocus={finalFocus??(()=>document.querySelector<HTMLButtonElement>(`button[aria-controls="${id}"]`)??false)} onScrollCapture={event=>{const target=event.target as HTMLElement;if(scrollMemory&&(target===popup.current||target.dataset.slot==="scroll-area-viewport"))scrollMemory.current=target.scrollTop}}>
      <DrawerHeader allowSelection>{headerActions?<div className={`flex flex-wrap items-center justify-between gap-2 ${showCloseButton?"pe-8":""}`}><DrawerTitle>{title}</DrawerTitle>{headerActions}</div>:<DrawerTitle>{title}</DrawerTitle>}<DrawerDescription>{description}</DrawerDescription>{headerContent}</DrawerHeader>
      <DrawerPanel>{children}</DrawerPanel>
      {footer&&<DrawerFooter variant={footerVariant}>{footer}</DrawerFooter>}
      {showCloseButton&&<DrawerClose aria-label={`收起${title.split(" · ")[0]}`} className="absolute end-2 top-2" render={<Button size="icon" variant="ghost"/>}><XIcon/></DrawerClose>}
    </DrawerPopup>
  </Drawer>
}
