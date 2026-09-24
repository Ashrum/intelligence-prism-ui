"use client"
import {useState} from 'react'
import {AgentQuestionCard,AgentContextList,AgentChangeReview,type AgentChangeDecision} from '../agent-components'
import {Button} from '@/components/coss/button'
import {Field,FieldLabel} from '@/components/coss/field'
import {Textarea} from '@/components/coss/textarea'
import {Dialog,DialogPopup,DialogHeader,DialogTitle,DialogDescription,DialogPanel} from '@/components/coss/dialog'

/** Fixture only: the reusable patterns above remain controlled and business-neutral. */
export function AgentPatternsDemo({alternate=false}:{alternate?:boolean}) {
 const [choice,setChoice]=useState(''),[note,setNote]=useState(''),[source,setSource]=useState(false),[decision,setDecision]=useState<AgentChangeDecision>('pending')
 const before=alternate?'周三完成阅读。提交一段摘要。':'已知 x² − 3x + 2 = 0。求方程的实数根。'
 const after=before.replace('。','。\n')
 return <div className="mt-8 space-y-8"><div className="space-y-2"><h3 className="text-section-title">追问、依据与修改对照</h3><p className="text-ui-hint text-muted-foreground">借鉴 Beautiful UI 的交互组织，以现有 Prism / coss 组件实现。选择与采用只回传给调用方。</p></div>
 <AgentQuestionCard question={alternate?'这次整理到什么程度？':'这次需要整理哪些内容？'} value={choice} onValueChange={setChoice} options={[{value:'content',label:alternate?'保留原文结构':'只提取题目',description:'保留来源，不补造内容。'},{value:'with-notes',label:alternate?'原文与已有批注':'题目与已有参考答案',description:'分别整理，完成后人工核对对应关系。'}]}><Field><FieldLabel>补充要求</FieldLabel><Textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="也可以补充自己的要求"/></Field></AgentQuestionCard>
 <p role="status" className="text-ui-hint text-muted-foreground">{choice?`已选择：${choice==='content'?'仅正文':'正文与附加材料'}，尚未执行任务。`:'等待选择处理范围。'}</p>
 <AgentContextList items={[{id:'source',title:alternate?'阅读记录 B':'课堂练习 A',location:'第 1 页 · 原稿 v1',description:'人工构造示例，点击查看本条来源。'}]} onInspect={()=>setSource(true)}/>
 <AgentChangeReview title="分段建议" before={before} after={after} reason="只改变分段；原文、建议与采用动作分开。" decision={decision} onDecision={setDecision}/>
 {decision!=='pending'&&<Button variant="ghost" onClick={()=>setDecision('pending')}>重置对照示例</Button>}
 <Dialog open={source} onOpenChange={setSource}><DialogPopup><DialogHeader><DialogTitle>{alternate?'阅读记录 B':'课堂练习 A'}</DialogTitle><DialogDescription>第 1 页 · 原稿 v1 · 固定示例</DialogDescription></DialogHeader><DialogPanel><p className="text-read-body">{before}</p></DialogPanel></DialogPopup></Dialog>
 </div>
}
