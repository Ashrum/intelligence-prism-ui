"use client"
import type {ReactElement} from 'react'
import {Tooltip,TooltipTrigger,TooltipPopup} from '@/components/coss/tooltip'
import {Kbd} from '@/components/coss/kbd'
import {Meter,MeterTrack,MeterIndicator} from '@/components/coss/meter'
export function Tip({label,keys,children}:{label:string;keys:string;children:ReactElement}){return <Tooltip><TooltipTrigger render={children}/><TooltipPopup className="surface-floating motion-reduce:transition-none" side="left">{label} <Kbd>{keys}</Kbd></TooltipPopup></Tooltip>}
export function Rate({value,label}:{value:number;label:string}){return <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><Meter value={value} max={100} aria-label={label}><MeterTrack><MeterIndicator className="motion-reduce:transition-none"/></MeterTrack></Meter></div><span className="text-ui-meta tabular-nums">{value}%</span></div>}
export function ThinBar({value}:{value:number}){return <span aria-hidden="true" className="block h-1 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-foreground" style={{width:`${Number.isFinite(value)?Math.max(0,Math.min(100,value)):0}%`}}/></span>}
