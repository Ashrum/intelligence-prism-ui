"use client"
import { useState } from 'react'
import { MathField, type MathFieldProps } from '../math-field'
import { Button } from '../button'
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
    </div>
  </div>
}
