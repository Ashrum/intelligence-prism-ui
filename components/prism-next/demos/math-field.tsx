"use client"
import { useRef, useState } from 'react'
import { MathField, FormulaQuickTools, FormulaFloatingToolbar, FormulaPalette, type MathFieldHandle, type MathFieldProps } from '../math-field'
import { Field, FieldLabel } from '@/components/coss/field'
import { Textarea } from '@/components/coss/textarea'
import { Button } from '../button'
import { Button as CossButton } from '@/components/coss/button'
import { ToolbarButton } from '@/components/coss/toolbar'
import { Tooltip, TooltipTrigger, TooltipPopup } from '@/components/coss/tooltip'
import { Kbd } from '@/components/coss/kbd'
import { ChevronDown } from 'lucide-react'
import { QuestionMath } from '../question-content'
const examples: { title: string; value: string; props?: Partial<MathFieldProps> }[] = [
  { title: '行内 · SHEET 08', value: String.raw`y=\frac{1}{}x^{2}-4x+3` },
  { title: '单独一行 · 方程组', value: String.raw`\begin{cases}x+y=5\\2x-y=1\end{cases}`, props: { mode: 'block' } },
  { title: '原文出错与定位', value: String.raw`\frac{1}{2x^{2}`, props: { mode: 'block' } },
  { title: '只读', value: String.raw`x+1\text{中文说明与长中文内容}`, props: { readOnlyReason: '当前公式只供查看。请由宿主切换到可编辑版本。' } },
  { title: '触屏数学键盘 · SHEET 08 七列', value: 'x^2+1' },
  { title: '化学式', value: String.raw`\ce{2H2 + O2 -> 2H2O}`, props: { subject: 'chemistry', mode: 'block' } },
  { title: '物理单位与矢量', value: String.raw`\vec{F}=m\vec{a}`, props: { subject: 'physics' } },
  { title: '挂载即打开 · 新建空公式', value: '', props: { autoOpen: true } },
]
function Example({ example }: { example: typeof examples[number] }) {
  const [value, setValue] = useState(example.value), [confirmed, setConfirmed] = useState(example.value)
  const [notice, setNotice] = useState('')
  return <div className="space-y-3 rounded-lg border border-border p-4">
    <MathField {...example.props} value={value} onChange={setValue} label={example.title}
      onConfirm={() => { setConfirmed(value); setNotice('已确认本页示例，未保存到业务。') }}
      onCancel={() => { setValue(confirmed); setNotice('已恢复本页上次确认的原文。') }}
      onSplitRequest={cursor => setNotice(`收到拆分意图：模型位置 ${cursor.position}。宿主尚未接入作答空位。`)} />
    {notice && <p role="status" className="text-ui-hint">{notice}</p>}
  </div>
}
export function MathFieldDemo() {
  const [narrow, setNarrow] = useState(false)
  return <div className="prism-demo-section space-y-6">
    <p className="text-ui-hint text-muted-foreground">设计候选 · 工程准入未开始。示例用本页状态，先点「打开公式框」；触屏点框或用「数学键盘」按钮展开键盘。数字页按 SHEET 08 四行七列排列，键面显示符号，中文含义供读屏使用；公式说明以当前公式原文为准。</p>
    <Button type="button" variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>390 窄容器</Button>
    <div className="space-y-6" style={narrow ? { maxWidth: 390 } : undefined}>
      {examples.map(example => <Example key={example.title} example={example} />)}
      <CompactExample />
      <FinishExample />
      <FloatingExample />
    </div>
  </div>
}

function CompactExample() {
  const field = useRef<MathFieldHandle>(null), following = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(String.raw`y=\frac{1}{}`)
  const [editing, setEditing] = useState(false), [more, setMore] = useState(false), [source, setSource] = useState(false)
  const [exits, setExits] = useState(0), [reason, setReason] = useState('尚未走出')
  const insert = (latex: string) => field.current?.insert(latex)
  return <section className="min-w-0 space-y-3 rounded-lg border border-border p-4" aria-label="紧凑就地写示例">
    <h3 className="text-block-title">紧凑就地写</h3>
    {!editing && <Button type="button" variant="outline" onClick={() => setEditing(true)}>编辑文中公式</Button>}
    {editing && <>
      <FormulaQuickTools onInsert={insert} trailing={<Button type="button" variant="outline" className="shrink-0" aria-expanded={more} onClick={() => setMore(!more)}>更多</Button>} />
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-read-body">
        <span>函数</span>
        <MathField ref={field} variant="compact" value={value} onChange={setValue} label="题干中的公式" onExit={direction => {
          setExits(count => count + 1); setReason(direction); following.current?.focus()
        }} />
        <span ref={following} tabIndex={-1}>的定义域是</span>
      </div>
      {more && <FormulaPalette onInsert={latex => { insert(latex); setMore(false) }} footer={
        <Button type="button" variant="outline" aria-expanded={source} onClick={() => setSource(!source)}>公式原文</Button>
      } />}
      {source && <Field className="w-full">
        <FieldLabel htmlFor="compact-example-source">公式原文</FieldLabel>
        <Textarea id="compact-example-source" value={value} onChange={event => setValue(event.target.value)} />
      </Field>}
    </>}
    <p role="status" className="text-ui-hint text-muted-foreground">走出回调 {exits} 次 · {reason}</p>
  </section>
}

function FinishExample() {
  const [value, setValue] = useState(String.raw`\frac{1}{}`)
  const [editing, setEditing] = useState(false)
  const [last, setLast] = useState('尚未写完')
  return <section className="space-y-3" aria-label="写完方式">
    <h3 className="text-block-title">写完方式</h3>
    <p className="text-ui-hint">Enter、边界方向键、末格 Tab（Shift+Tab 反向）、Esc 或移开焦点，按最新内容写回。</p>
    <Button type="button" variant="outline" onClick={() => setEditing(true)}>试写公式</Button>
    {editing && <MathField variant="compact" value={value} onChange={setValue} label="写完方式示例" onFinish={(next, reason) => {
      setValue(next); setLast(`${reason} · ${next || '（空串）'}`); setEditing(false)
    }} />}
    <p role="status" className="text-ui-hint">最近一次 onFinish：{last}</p>
  </section>
}

function FloatingExample() {
  const region = useRef<HTMLElement>(null)
  const isInternal = (target: EventTarget | null | undefined) => target instanceof Element && (region.current?.contains(target) || Boolean(target.closest('[data-prism-formula-floating-toolbar]')))
  const field = useRef<MathFieldHandle>(null)
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false), [more, setMore] = useState(false)
  const [editing, setEditing] = useState(false)
  const [side, setSide] = useState<'top' | 'bottom'>('top')
  const [toolset, setToolset] = useState<'math' | 'physics' | 'chemistry' | 'text'>('math')
  const [align, setAlign] = useState<'start' | 'end'>('start')
  const [value, setValue] = useState(String.raw`\frac{1}{2}`)
  const [last, setLast] = useState('尚未完成')
  const finish = () => { const next = field.current?.getValue() ?? value; setValue(next); setLast(next); setOpen(false); setEditing(false); setMore(false) }
  return <section ref={region} className="space-y-3" aria-label="浮动公式工具条" onBlur={event => { if (!isInternal(event.relatedTarget)) finish() }}>
    <h3 className="text-block-title">浮动图标条 · SHEET 56</h3>
    <div className="flex flex-wrap gap-2">
      {(['top', 'bottom'] as const).map(value => <CossButton key={value} variant="outline" aria-pressed={side === value} onClick={() => setSide(value)}>{value === 'top' ? '上方' : '下方'}</CossButton>)}
      {(['start', 'end'] as const).map(value => <CossButton key={value} variant="outline" aria-pressed={align === value} onClick={() => setAlign(value)}>{value === 'start' ? '起点对齐' : '末端对齐'}</CossButton>)}
      {(['math', 'physics', 'chemistry', 'text'] as const).map((value, index) => <CossButton key={value} variant="outline" aria-pressed={toolset === value} onClick={() => setToolset(value)}>{['数学', '物理', '化学', '语文 / 英语'][index]}</CossButton>)}
    </div>
    <Button type="button" variant="outline" onClick={() => setEditing(true)}>试用浮动工具条</Button>
    {editing && <div ref={setAnchor} onFocus={() => setOpen(true)}>
      <MathField ref={field} variant="compact" value={value} onChange={setValue} label="浮动工具条示例" virtualKeyboard="off"
        onFinish={(next, reason, detail) => { if (reason === 'blur' && isInternal(detail?.relatedTarget)) return; setValue(next); setLast(next); setOpen(false); setEditing(false); setMore(false) }} />
    </div>}
    <FormulaFloatingToolbar anchor={anchor} open={open} side={side} align={align} toolset={toolset}
      onOpenFormula={() => setMore(true)} onInsertUnderline={() => setLast('宿主收到填空线意图')} onInsert={latex => field.current?.insert(latex)} finish={{ onFinish: finish }} trailing={
      <Tooltip open><TooltipTrigger render={<ToolbarButton render={<CossButton variant="ghost" size="icon-sm" />} aria-label="更多公式" aria-expanded={more}
        onPointerDown={event => event.preventDefault()} onClick={() => setMore(!more)} />}><ChevronDown /></TooltipTrigger>
        <TooltipPopup side="bottom">更多公式 <Kbd>▾</Kbd></TooltipPopup></Tooltip>
    } />
    {more && <FormulaPalette onInsert={latex => field.current?.insert(latex)} />}
    <p role="status" className="text-ui-hint">最近完成：{last}</p>
    <div className="space-y-3 text-read-body">
      <p>之前（小分式）：已知 <QuestionMath label="小分式"><mstyle displaystyle={false} scriptlevel={0}><mfrac><mn>1</mn><mn>2</mn></mfrac></mstyle></QuestionMath> 与 x 的关系。</p>
      <p>现在（大分式）：已知 <QuestionMath label="大分式"><mfrac><mn>1</mn><mn>2</mn></mfrac><mo>+</mo><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mroot><mi>x</mi><mn>3</mn></mroot></QuestionMath> 与 x 的关系。</p>
    </div>
  </section>
}
