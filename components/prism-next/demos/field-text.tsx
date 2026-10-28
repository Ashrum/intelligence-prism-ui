"use client"

import { useId, useState } from 'react'
import { Field, FieldLabel, FieldDescription } from '@/components/coss/field'
import { Input } from '@/components/coss/input'
import { Textarea } from '@/components/coss/textarea'
import { Kbd, KbdGroup } from '@/components/coss/kbd'
import { themeOptions, type PrismTheme } from '@/lib/prism-next/config'
import { FieldRow } from '../field-row'
import { InlineStatus } from '../inline-status'
import { KeyboardHint, usePrimaryModifier } from '../keyboard-hint'
import { Button } from '../button'
import { MathField } from '../math-field'
import { QuestionSelect } from '../question-controls'
import { PrismScopeProvider } from '../prism-scope'

export function FieldTextDemo() {
  const id = useId(), modifier = usePrimaryModifier()
  const [theme, setTheme] = useState<PrismTheme>('blueprint')
  const [portal, setPortal] = useState<HTMLDivElement | null>(null)
  const [value, setValue] = useState('x^2 + 1'), [current, setCurrent] = useState('2')
  const [narrow, setNarrow] = useState(false), [notice, setNotice] = useState('')
  return <div className="prism-content space-y-6">
    <header className="prism-page-heading"><p>FOUNDATIONS / P121</p><h1>字段与说明文字</h1><span>设计候选 · 工程准入未开始；合成数据，仅演示字段布局与信息层级。</span></header>
    <div className="flex flex-wrap items-center gap-4">
      <FieldRow><FieldLabel htmlFor={`${id}-theme`}>预览主题</FieldLabel><QuestionSelect id={`${id}-theme`} label="预览主题" value={theme} onChange={value => setTheme(value as PrismTheme)} items={[...themeOptions]} /></FieldRow>
      <Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>切换 240 窄容器</Button>
    </div>
    <section data-agent-preview="" data-prism-theme={theme} className="min-w-0 space-y-6 bg-background p-4 text-foreground">
      <div ref={setPortal} />
      <PrismScopeProvider theme={theme} portalContainer={portal}>
        <div className="grid min-w-0 gap-6" style={narrow ? { maxWidth: 240 } : undefined}>
          <section className="space-y-3"><h2 className="text-block-title">R1 / S1 / S4 · 纵向字段</h2>
            <Field><FieldLabel>课堂练习标题</FieldLabel><Input id={`${id}-title`} placeholder="例如：二次函数课堂练习" aria-describedby={`${id}-help`} /><FieldDescription id={`${id}-help`}>用于区分同一天的多份练习；较长的中文辅助说明应完整换行，不截断。</FieldDescription></Field>
          </section>
          <section className="space-y-3"><h2 className="text-block-title">R2 · 横排字段</h2>
            <FieldRow><FieldLabel htmlFor={`${id}-current`}>当前编辑的子题</FieldLabel><QuestionSelect id={`${id}-current`} label="当前编辑的子题" value={current} onChange={setCurrent} items={[{ value: '1', label: '子题 1 · 求函数解析式' }, { value: '2', label: '子题 2 · 分析函数与坐标轴交点' }]} /></FieldRow>
          </section>
          <section className="space-y-3"><div className="flex flex-wrap items-center gap-2"><h2 className="text-block-title">S2 / S3 · 快捷键与状态</h2><KeyboardHint modifier={modifier} /><InlineStatus className="ml-auto" tone="warning" details="演示降级说明；真实状态由宿主提供。">改用原文</InlineStatus></div>
            <div className="flex flex-wrap gap-2"><InlineStatus>信息</InlineStatus><InlineStatus tone="warning">警告</InlineStatus><InlineStatus tone="destructive" details="详细原因供键盘聚焦查看。">不可用</InlineStatus></div>
            <div className="flex flex-wrap gap-2"><Button onClick={() => setNotice('已确认本页演示。')}>确认<KbdGroup><Kbd>{modifier}</Kbd><Kbd>↵</Kbd></KbdGroup></Button><Button variant="outline" onClick={() => setNotice('已取消本页演示。')}>取消<Kbd>Esc</Kbd></Button></div>
            {notice && <InlineStatus>{notice}</InlineStatus>}
          </section>
        </div>
        <section className="space-y-4"><h2 className="text-block-title">MathField · 改前 / 改后</h2>
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <section className="space-y-3" aria-label="改前说明排版示意"><h3 className="text-item-title">改前 · 静态示意</h3><div className="text-ui-action">编辑公式</div><div className="text-ui-hint text-muted-foreground">直接打字或点模板输入公式；Tab / 方向键移动，⌘ / Ctrl + Enter 确认，Esc 取消。</div><div className="text-ui-hint">公式框暂不可用，可继续编辑公式原文并确认。</div><Field><FieldLabel htmlFor={`${id}-before`}>公式原文</FieldLabel><Textarea id={`${id}-before`} value="x^2 + 1" readOnly /></Field><div className="text-right text-ui-hint">单独一行或答案中的公式不插作答空。</div></section>
            <section className="space-y-3"><h3 className="text-item-title">改后 · 可操作</h3><MathField label="编辑公式" value={value} onChange={setValue} onConfirm={() => setNotice('已确认公式演示。')} onCancel={() => { setValue('x^2 + 1'); setNotice('已恢复演示原文。') }} /></section>
          </div>
        </section>
        <section className="space-y-3"><h2 className="text-block-title">蓝图逐项检查</h2><ul className="list-disc space-y-2 pl-5 text-ui-hint"><li>键帽：直角、实线、mono；夜图检查文字与边框对比度。</li><li>辅助说明和状态：sans、12 / 18，不大写；状态详情可聚焦。</li><li>标签沿用现有样式；横排间距为两倍现有 spacing（8px）。</li><li>键盘提示沿用直角线框与 6px 偏移阴影。</li><li>切换 240 窄容器检查标签位于控件上方，再检查桌面和 390 页面。</li></ul></section>
        <section data-agent-preview="" data-prism-theme="paper" className="space-y-3 bg-background p-4 text-foreground"><h3 className="text-item-title">嵌套核心主题 · paper</h3><Field><FieldLabel>核对蓝图隔离</FieldLabel><Input id={`${id}-nested`} placeholder="核心主题字段" /><FieldDescription>此处保留核心主题外观。</FieldDescription></Field><Kbd>Esc</Kbd><InlineStatus tone="warning">待核对</InlineStatus></section>
      </PrismScopeProvider>
    </section>
  </div>
}
