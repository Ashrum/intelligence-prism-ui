"use client"
import type { ReactNode } from "react"
import { TooltipProvider } from "@/components/coss/tooltip"
import type { QuestionRailProps } from "../question-rail"
import type { QuestionInspectorProps } from "../question-inspector"
export const reviewFormula = <math><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>y</mi><mn>2</mn></msup><mo>=</mo><mn>1</mn></math>
export function ReviewDemoThemes({ children }: { children: (theme: string) => ReactNode }) {
  return <TooltipProvider><div className="flex flex-wrap items-start gap-4">{['light', 'paper', 'dark'].map(theme => <section key={theme} data-agent-preview data-ui-version="coss-v1" data-prism-theme={theme} className="w-80 max-w-full space-y-3 bg-background p-3 text-foreground"><h3 className="text-item-title">{theme} · 320px</h3>{children(theme)}</section>)}</div></TooltipProvider>
}
export const reviewRailFixture: Pick<QuestionRailProps, 'sections' | 'filters' | 'overview' | 'footer' | 'empty'> = {
  filters: [{ value: 'all', label: '全部', count: 4, ariaLabel: '全部题目，共 4 题' }, { value: 'attention', label: '关注', count: 2, ariaLabel: '需关注，共 2 题' }],
  overview: { segments: [{ count: 2, tone: 'success' }, { count: 1, tone: 'warning' }, { count: 1, tone: 'destructive' }], text: '稳定 2 · 待核对 2' },
  footer: '扫描质量未提供', empty: '当前筛选没有题目',
  sections: [{ id: 'choice', label: '选择题', range: '1–3', summary: '正确率 70%', layout: 'cell', pages: [{ id: 'a', marker: { label: '第 1 页', tooltip: '定位第 1 页 · 扫描质量未提供', ariaLabel: '定位第 1 页' }, items: [
    { id: '1', number: 1, value: '90%', tone: 'neutral', ariaLabel: '第 1 题，正确率 90%，结论待核对', tooltip: '正确率 90% · 区分度未提供', content: <span className="text-ui-meta">90%</span> },
    { id: '2', number: 2, value: '60%', tone: 'warning', ariaLabel: '第 2 题，正确率 60%，请核对原始证据', tooltip: '正确率 60% · 区分度未提供', content: <span className="text-ui-meta">60%</span> },
    { id: '3', number: 3, value: '30%', tone: 'destructive', ariaLabel: '第 3 题，正确率 30%，评分依据待确认', tooltip: '正确率 30% · 区分度未提供', content: <span className="text-ui-meta">30%</span> },
  ] }] }, { id: 'written', label: '解答题', range: '4', summary: '得分率 80%', layout: 'row', pages: [{ id: 'b', items: [{ id: '4', number: 4, tone: 'neutral', value: '80%', ratio: 80, ariaLabel: '第 4 题，得分率 80%，请核对完整推导过程', tooltip: <>长中文推导过程与数学关系：{reviewFormula}</> }] }] }],
}
export const reviewInspectorFixture: Omit<QuestionInspectorProps, 'onStep' | 'onWrong' | 'onIntent'> = {
  title: '第 4 题 · 解答题', status: '待复核', navigation: { previous: true, next: false, nextWrong: true },
  score: { value: 6, max: 12, text: '6', denominator: '/ 12 分', judgement: '需核对' },
  points: [{ id: 'setup', label: <>根据题设建立椭圆参数关系并核对适用条件 {reviewFormula}</>, value: '4/4', tone: 'success', status: '已达成' }, { id: 'reasoning', label: '逐步推导并保留完整论证过程，说明参数范围和等价变形依据', value: '2/8', reason: '缺失：未说明参数取值约束与最终结论之间的逻辑联系', tone: 'warning', status: '部分达成' }],
  evidence: <>原始推导中的条件尚需核实。请对照完整作答与评分标准检查 {reviewFormula}，判定只来自宿主事实。</>,
  knowledge: ['椭圆焦距关系与参数范围的完整推导'], comparison: [{ id: 'rate', label: '本题得分率', text: '47%', value: 47, max: 100, ariaLabel: '班级得分率' }, { id: 'attention', label: '待核对人数', text: '2 / 36', value: 2, max: 36, ariaLabel: '待核对人数比例' }],
  actions: [{ id: 'correct', label: '更正评分', primary: true }, { id: 'review', label: '教师批阅' }],
}
