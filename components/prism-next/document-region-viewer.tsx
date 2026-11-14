"use client"
import { useEffect,useRef,type ReactNode } from "react"
import "./review-workspace.css"
import { Card } from "@/components/coss/card"
import { Button } from "./button"
export type DocumentRegion={id:string;label:string;rect:[number,number,number,number];checked?:boolean;content?:ReactNode;tone?:"default"|"current"|"pending";tag?:string}
/** pageLayout delegates sizing/scrolling to a containing viewer and uses the Prism surface. */
export function DocumentRegionViewer({regions,selectedId,selectedRegionIds,onSelect,zoom=100,header,footer,background,label="文档区域",pageLayout,locateRequest=0,pageRotation=0,locateOnResize=true}:{regions:DocumentRegion[];selectedId?:string;selectedRegionIds?:readonly string[];onSelect?:(id:string)=>void;zoom?:number;header?:ReactNode;footer?:ReactNode;background?:ReactNode;label?:string;pageLayout?:{width:number;height:number};locateRequest?:number;pageRotation?:0|90|180|270;locateOnResize?:boolean}){
 const canvas=useRef<HTMLDivElement>(null)
 function locate(id?:string){const target=[...canvas.current?.querySelectorAll<HTMLElement>('[data-region]')??[]].find(node=>node.dataset.region===id);target?.scrollIntoView({block:"nearest",inline:"nearest"})}
 useEffect(()=>{locate(selectedId)},[selectedId,locateRequest,locateOnResize?pageLayout?.width:undefined,locateOnResize?pageLayout?.height:undefined])
 const framed=regions.some(item=>item.tone!==undefined||item.tag!==undefined)
 const overlay=framed?<DocumentRegionOverlay regions={regions} selectedRegionIds={selectedRegionIds??(selectedId===undefined?[]:[selectedId])} onSelect={onSelect} onLocate={locate} legacy={!pageLayout}/>:null
 if(pageLayout)return <div ref={canvas} aria-label={label} style={pageRotation ? {position:"absolute",transformOrigin:"0 0",transform:`translate(${pageRotation===90?pageLayout.height:pageRotation===180?pageLayout.width:0}px, ${pageRotation===180?pageLayout.height:pageRotation===270?pageLayout.width:0}px) rotate(${pageRotation}deg)`} : undefined}><Card className="relative overflow-hidden" style={pageLayout}>{background}{header}{framed?overlay:regions.map(item=><div key={item.id} className="absolute" data-region={item.id} style={{left:`${item.rect[0]}%`,top:`${item.rect[1]}%`,width:`${item.rect[2]}%`,height:`${item.rect[3]}%`}}>{item.content}<Button className="absolute inset-0 h-full sm:h-full w-full items-start justify-start whitespace-normal p-0 border-border aria-pressed:border-2 aria-pressed:border-primary hover:bg-transparent data-pressed:bg-transparent" variant="ghost" disabled={!onSelect} aria-label={`定位${item.label}`} aria-pressed={(selectedRegionIds?.includes(item.id)??selectedId===item.id)} onClick={()=>{locate(item.id);onSelect?.(item.id)}}><span className="text-ui-action">{item.checked?"已核对 · ":""}{item.label}</span></Button></div>)}{footer}</Card></div>
 return <div className="review-sheet-viewport" ref={canvas} tabIndex={0} aria-label={label}><div className="review-sheet" style={{width:`${Math.max(50,Math.min(300,zoom))}%`}}>{background}{header&&<header className="review-sheet-heading">{header}</header>}{framed?overlay:regions.map(item=><div key={item.id} className="review-sheet-region" data-region={item.id} style={{left:`${item.rect[0]}%`,top:`${item.rect[1]}%`,width:`${item.rect[2]}%`,height:`${item.rect[3]}%`}}>{item.content&&<div className="review-sheet-answer">{item.content}</div>}<button type="button" className="review-region-hit" data-selected={(selectedRegionIds?.includes(item.id)??selectedId===item.id)} data-checked={item.checked} aria-label={`定位${item.label}`} aria-pressed={(selectedRegionIds?.includes(item.id)??selectedId===item.id)} onClick={()=>{locate(item.id);onSelect?.(item.id)}}><span>{item.checked?"已核对 · ":""}{item.label}</span></button></div>)}{footer&&<footer className="review-sheet-footer">{footer}</footer>}</div></div>
}

/** Internal shared overlay for original digital pages and opt-in viewer regions. */
export function DocumentRegionOverlay({regions,selectedRegionIds,onSelect,onLocate,legacy=false}:{regions:DocumentRegion[];selectedRegionIds?:readonly string[];onSelect?:(id:string)=>void;onLocate?:(id:string)=>void;legacy?:boolean}) {
 const framed=regions.some(item=>item.tone!==undefined||item.tag!==undefined)
 return <>{regions.map(item=>{
  const selected=selectedRegionIds?.includes(item.id)??false
  const current=selected||item.tone==="current"
  const tone=item.tone==="pending"?"pending":current?"current":"default"
  const props={"aria-label":`定位${item.label}`,"aria-pressed":selected,onClick:()=>{onLocate?.(item.id);onSelect?.(item.id)}}
  return <div key={item.id} className={framed?"prism-document-region":"absolute"} data-region={item.id} data-region-tone={framed?tone:undefined} data-region-current={framed?current:undefined} style={{left:`${item.rect[0]}%`,top:`${item.rect[1]}%`,width:`${item.rect[2]}%`,height:`${item.rect[3]}%`}}>
   {item.content}
   {legacy?<button type="button" className="review-region-hit prism-document-region-hit" data-selected={selected} data-checked={item.checked} {...props}/>:<Button className={framed?"prism-document-region-hit":"absolute inset-0 h-full sm:h-full w-full items-start justify-start whitespace-normal p-0 border-border aria-pressed:border-2 aria-pressed:border-primary hover:bg-transparent data-pressed:bg-transparent"} variant="ghost" disabled={!onSelect} {...props}>{!framed&&<span className="text-ui-action">{item.checked?"已核对 · ":""}{item.label}</span>}</Button>}
   {framed&&item.tag!==undefined&&<span className="prism-document-region-tag text-component-label" aria-hidden="true">{item.tag}</span>}
  </div>
 })}</>
}
