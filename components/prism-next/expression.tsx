"use client"
import { Button } from '@/components/coss/button'
import './expression.css'

/** Optional, non-semantic brand geometry. It never communicates task status. */
export function PrismSignature({compact=false}:{compact?:boolean}) {
 return <span className="prism-signature" data-compact={compact} aria-hidden="true"><i/><i/><i/></span>
}

/** Review control only; do not carry this into a product's task toolbar. */
export function ExpressionSwitch({candidate,onChange}:{candidate:boolean;onChange:(value:boolean)=>void}) {
 return <div role="group" aria-label="表现对照" className="expression-switch"><Button size="sm" variant={candidate?'ghost':'secondary'} aria-pressed={!candidate} onClick={()=>onChange(false)}>原版</Button><Button size="sm" variant={candidate?'secondary':'ghost'} aria-pressed={candidate} onClick={()=>onChange(true)}>候选</Button></div>
}
