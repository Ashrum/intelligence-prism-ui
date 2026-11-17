"use client"

import { useId, useState } from 'react'
import { Input } from '@/components/coss/input'
import { Textarea } from '@/components/coss/textarea'
import { Tabs, TabsList, TabsTab, TabsPanel } from '@/components/coss/tabs'
import { themeOptions, type PrismTheme } from '@/lib/prism-next/config'
import { Button } from '../button'
import { PrismScopeProvider } from '../prism-scope'
import { AuthoringSurface, AuthoringSection, AuthoringRow, QuietField, ChoiceKey, StatusDot, AiSuggestButton, AiSuggestField, type AiSuggestState } from '../authoring-surface'

export function AuthoringSurfaceDemo() {
  const id = useId()
  const [theme, setTheme] = useState<PrismTheme>('blueprint')
  const [narrow, setNarrow] = useState(false)
  const [selected, setSelected] = useState('B')
  const [analysis, setAnalysis] = useState('')
  const [analysisState, setAnalysisState] = useState<AiSuggestState>('loading')
  const [notice, setNotice] = useState('')
  const request = (field: string) => () => setNotice(`收到「${field}」意图；本页未连接 AI 服务。`)
  const toolbar = <span className="text-ui-meta text-muted-foreground">富内容工具栏插槽 · 由宿主接入公式、图片等工具</span>
  return <div className="space-y-6">
    <p className="text-ui-hint text-muted-foreground">设计候选 · 工程准入未开始。合成单选题，输入仅保留在本页；AI 状态是固定夹具，可用下方按钮切换。</p>
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="编辑表面预览主题">
      {themeOptions.map(option => <Button key={option.value} variant="outline" aria-pressed={theme === option.value} onClick={() => setTheme(option.value)}>{option.label}</Button>)}
      <Button variant="outline" aria-pressed={narrow} onClick={() => setNarrow(!narrow)}>390 窄容器</Button>
    </div>
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="解析状态夹具">
      <span className="text-ui-body">解析状态</span>
      {(['idle', 'loading', 'done'] as const).map((state, index) => <Button key={state} variant="outline" aria-pressed={analysisState === state} onClick={() => setAnalysisState(state)}>{['空闲', '生成中', '已给出'][index]}</Button>)}
    </div>
    <PrismScopeProvider theme={theme}>
      <div data-agent-preview data-prism-theme={theme} className="space-y-6 p-2" style={narrow ? { maxWidth: 390 } : undefined}>
        <AuthoringSurface no="02" title="第 2 题" status={<StatusDot tone="ok">可添加</StatusDot>} actions={<Button variant="ghost" onClick={request('预览题目')}>预览</Button>}>
          <AuthoringSection aria-label="题目本体">
            <AuthoringRow label="题型" trailing={<AiSuggestButton label="按题干建议" onSuggest={request('按题干建议')} />}>
              <Tabs defaultValue="single">
                <div className="overflow-x-auto"><TabsList variant="underline" aria-label="题型"><TabsTab value="single">单选题</TabsTab>{['多选题', '判断题', '填空题', '解答题', '材料·复合题'].map(type => <TabsTab key={type} value={type} disabled>{type}</TabsTab>)}</TabsList></div>
                <TabsPanel value="single"><span className="sr-only">单选题编辑示例；其他题型不在本夹具范围。</span></TabsPanel>
              </Tabs>
            </AuthoringRow>
            <AuthoringRow label="题干" htmlFor={`${id}-stem`}>
              <QuietField toolbar={toolbar}>
                <div data-demo="nested-quiet-field">
                  <div><Textarea id={`${id}-stem`} className="text-read-body" defaultValue="函数 y = x² − 1 在 x = 2 时的值是（　）。" /></div>
                </div>
              </QuietField>
            </AuthoringRow>
            <AuthoringRow label="选项" trailing={<AiSuggestButton label="建议正确答案" onSuggest={request('建议正确答案')} />} note={`点字母设为正确答案 · 当前 ${selected}`}>
              <div className="grid gap-x-7 gap-y-3 @min-[720px]:grid-cols-2" role="group" aria-label="选项与正确答案">
                {['1', '3', '√3', '−1'].map((value, index) => {
                  const key = String.fromCharCode(65 + index)
                  return <div key={key} className="flex min-w-0 items-center gap-3">
                    <ChoiceKey selected={selected === key} onClick={() => setSelected(key)} aria-label={`将 ${key} 设为正确答案`}>{key}</ChoiceKey>
                    <QuietField className="flex-1"><Input aria-label={`选项 ${key} 内容`} defaultValue={value} className="text-read-body" /></QuietField>
                  </div>
                })}
              </div>
            </AuthoringRow>
            <AuthoringRow label="分值" htmlFor={`${id}-score`}><div className="flex items-center gap-3"><div className="w-24"><Input nativeInput id={`${id}-score`} type="number" min={0} defaultValue={3} /></div><span className="text-ui-body">分</span></div></AuthoringRow>
          </AuthoringSection>
          <AuthoringSection no="01" title="答案与解析">
            <AuthoringRow label="解析" htmlFor={`${id}-analysis`} trailing={<AiSuggestButton state={analysisState} onSuggest={request('生成解析')} onStop={request('停止生成解析')} />} note={analysisState === 'loading' ? 'AI 正在写解析（状态示例）· 你可以继续编辑其他内容' : undefined}>
              <AiSuggestField state={analysisState} empty={!analysis}><QuietField toolbar={toolbar}><Textarea id={`${id}-analysis`} value={analysis} onChange={event => setAnalysis(event.target.value)} className="text-read-body" /></QuietField></AiSuggestField>
            </AuthoringRow>
          </AuthoringSection>
          <AuthoringSection no="02" title="教学定位" hint="选填">
            <AuthoringRow label="核心知识点" htmlFor={`${id}-knowledge`} trailing={<AiSuggestButton state="done" onSuggest={request('更换知识点建议')} />}>
              <AiSuggestField state="done"><QuietField><Input id={`${id}-knowledge`} defaultValue="二次函数求值" /></QuietField></AiSuggestField>
            </AuthoringRow>
            <AuthoringRow label="教材与章节" htmlFor={`${id}-book`} trailing={<AiSuggestButton onSuggest={request('教材与章节建议')} />}><QuietField><Input id={`${id}-book`} placeholder="人教版 · 九年级上册" /></QuietField></AuthoringRow>
          </AuthoringSection>
          <AuthoringSection no="03" title="题目档案" hint="系统记录"><AuthoringRow label="状态"><StatusDot tone="neutral">草稿 · 尚未添加</StatusDot></AuthoringRow></AuthoringSection>
        </AuthoringSurface>
        <AuthoringSurface variant="floating" no="02" title="题号卡" status={<StatusDot tone="check">需核对</StatusDot>}>
          <AuthoringSection aria-label="状态示例"><div className="flex flex-wrap gap-4"><StatusDot tone="miss">还差解析</StatusDot><StatusDot tone="ai">AI 建议</StatusDot><StatusDot tone="neutral">草稿</StatusDot></div></AuthoringSection>
        </AuthoringSurface>
      </div>
    </PrismScopeProvider>
    <p role="status" className="text-ui-hint">{notice}</p>
  </div>
}
