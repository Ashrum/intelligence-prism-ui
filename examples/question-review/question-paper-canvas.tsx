"use client"
import type {ComponentProps} from 'react'
import {PaperPreviewMixed,type PaperPreviewMixedPage} from '@/components/prism-next/paper-preview-mixed'
import {rotatedPaperDimensions} from '@/components/prism-next/paper-preview'
export type QuestionPaper = PaperPreviewMixedPage
const positiveSize=(value:number,fallback:number)=>Number.isFinite(value)&&value>0?value:fallback
/** Legacy crop input and section-label adapter; gestures/visibility/rendering live in PaperPreview. */
export function QuestionPaperCanvas(props:ComponentProps<typeof PaperPreviewMixed>) {
 return PaperPreviewMixed({...props,resolveScanLayout:(page,rotation)=>{
  const source={width:positiveSize(page.width,794),height:positiveSize(page.height,1)}
  return {source,dimensions:rotatedPaperDimensions(source, rotation)}
 },renderSectionHeading:(page,index)=>props.pages.findIndex(p=>!p.content)===index?<h2 className="text-ui-body text-muted-foreground" data-answer-section>{props.answerLabel}</h2>:null})
}
