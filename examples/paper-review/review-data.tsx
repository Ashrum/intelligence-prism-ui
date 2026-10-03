"use client"
import type { RefObject } from "react"
import { PanelLeftClose } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/coss/avatar"
import { Kbd } from "@/components/coss/kbd"
import { Button } from "@/components/prism-next/button"
import { ReviewSwitcher } from "@/components/prism-next/review-switcher"
import { QuestionRail as SharedQuestionRail, type QuestionRailProps } from "@/components/prism-next/question-rail"
import type { QuestionInspectorProps } from "@/components/prism-next/question-inspector"
import { ReviewTip as Tip, ReviewConfirmation as Confirmation } from "@/components/prism-next/review-parts"
import { studentRecords, type Question } from "./fixture"
function scoreTone(value: number, max: number) { return value === max ? 'bg-success' : value === 0 ? 'bg-destructive' : 'bg-warning' }
function ScoreBar({ value, max }: { value: number; max: number }) {
  return <span aria-hidden="true" className="block h-1 w-10 overflow-hidden rounded-full bg-muted"><span className={`block h-full ${scoreTone(value, max)}`} style={{ width: `${value / max * 100}%` }} /></span>
}
export function StudentPanel({ current, open, onOpenChange, onSelect, triggerRef, records = studentRecords }: {
  records?: typeof studentRecords; current: number; open: boolean; onOpenChange: (open: boolean) => void; onSelect: (index: number) => void; triggerRef: RefObject<HTMLButtonElement | null>
}) {
  const items = records.map((student, index) => ({ ...student, index }))
  const groups = ['待复核', '已确认'].map(value => ({ value, items: items.filter(student => student.status === value) }))
  return <ReviewSwitcher items={items} groups={groups} current={current} open={open} onOpenChange={onOpenChange} onSelect={onSelect} triggerRef={triggerRef} searchId="student-search" itemKey={student => student.index} itemToStringLabel={student => `${student.name} ${student.examId}`}
    labels={{ navigation: '学生导航', previous: '上一位', next: '下一位', previousAria: '上一位学生', nextAria: '下一位学生', trigger: `选择学生，当前第 ${current + 1} / ${records.length} 位`, panel: '选择学生', search: '姓名或考号', empty: '没有匹配的学生' }}
    renderItem={student => <div className="flex items-center gap-2">
      <Avatar aria-hidden="true"><AvatarFallback>{student.name[0]}</AvatarFallback></Avatar>
      <span className="min-w-0 flex-1"><span className="block text-item-title">{student.name}</span><span className="block text-ui-meta text-muted-foreground">{student.examId}</span></span>
      <span className="grid w-10 shrink-0 justify-items-end gap-1"><span className="text-ui-body tabular-nums">{student.score}</span><ScoreBar value={student.score} max={student.max} /></span>
      <Confirmation>{student.status}</Confirmation>
    </div>}
    footer={<p className="flex flex-wrap items-center gap-2 border-t p-2 text-ui-meta text-muted-foreground"><Kbd>↑ ↓</Kbd>选人 <Kbd>Enter</Kbd>跳转 <Kbd>Esc</Kbd>关闭</p>} />
}
export function paperRailData(questions: Question[], filter: boolean, missing: boolean): Pick<QuestionRailProps, 'sections' | 'filters' | 'overview' | 'footer' | 'empty' | 'panelId'> {
  const list = questions.filter(q => !filter || q.score < q.max)
  const totals = [questions.filter(q => q.score === q.max).length, questions.filter(q => q.score > 0 && q.score < q.max).length, questions.filter(q => q.score === 0).length]
  return {
    panelId: 'question-filter-panel', empty: '没有错题', footer: missing ? '2 页 · 扫描质量未提供' : '2 页 · 扫描清晰 · 无缺页',
    filters: [{ value: 'all', label: '全部', count: questions.length, ariaLabel: `全部题目，共 ${questions.length} 题` }, { value: 'wrong', label: '错题', count: questions.filter(q => q.score < q.max).length, ariaLabel: `仅看错题，共 ${questions.filter(q => q.score < q.max).length} 题` }],
    overview: { segments: totals.map((count, i) => ({ count, tone: (['success','warning','destructive'] as const)[i] })), text: <>满分 {totals[0]} · 部分 {totals[1]} · 零分 {totals[2]}</> },
    sections: ['选择', '填空', '解答'].map(type => {
      const group = list.filter(q => q.type === type), all = questions.filter(q => q.type === type)
      return { id: type, label: `${type}题`, range: <>{all[0]?.number}–{all.at(-1)?.number}</>, summary: <>{all.reduce((sum, q) => sum + q.score, 0)} / {all.reduce((sum, q) => sum + q.max, 0)}</>, layout: type === '解答' ? 'row' : 'cell', pages: [...new Set(group.map(q => q.page))].map(page => ({ id: String(page), marker: list.find(q => q.page === page)?.type === type ? { label: <>第 {page + 1} 页</>, tooltip: `定位第 ${page + 1} 页 · ${missing ? '扫描质量未提供' : '清晰'}`, ariaLabel: `定位第 ${page + 1} 页，${missing ? '扫描质量未提供' : '清晰'}` } : undefined,
        items: group.filter(q => q.page === page).map(q => ({ id: q.id, number: q.number, tone: q.score === q.max ? 'neutral' : q.score === 0 ? 'destructive' : 'warning', value: q.score, denominator: q.max, detail: q.score < q.max ? <>−{q.max - q.score}</> : undefined, ratio: q.score / q.max * 100, ariaLabel: `第 ${q.number} 题，${q.type}题，${q.score} / ${q.max} 分，${q.score === q.max ? '满分' : q.score === 0 ? '零分' : '部分得分'}`, tooltip: <>第 {q.number} 题 · {q.score} / {q.max} 分</> })) })) }
    }),
  }
}
export function QuestionRail({ questions, selected, filter, missing, closeRef, onCollapse, onFilter, onSelect, onLocate, onPage }: {
  questions: Question[]; selected: string; filter: boolean; missing: boolean; closeRef: RefObject<HTMLButtonElement | null>; onCollapse: () => void
  onFilter: (value: boolean) => void; onSelect: (id: string) => void; onLocate: () => void; onPage: (page: number) => void
}) {
  return <SharedQuestionRail {...paperRailData(questions, filter, missing)} selected={selected} filter={filter ? 'wrong' : 'all'} onFilterChange={value => onFilter(value === 'wrong')} onSelect={onSelect} onLocate={onLocate} onPage={id => onPage(Number(id))} collapse={<Tip label="收起题目栏" keys="T"><Button ref={closeRef} variant="ghost" size="icon" aria-label="收起题目栏" onClick={onCollapse}><PanelLeftClose /></Button></Tip>} />
}
export function paperInspectorData(q: Question, studentId: string, confirmed: boolean, hasWrong: boolean): Omit<QuestionInspectorProps, 'onStep' | 'onWrong' | 'onIntent'> {
  return { title: `第 ${q.number} 题 · ${q.type}题`, status: confirmed ? '最终确认' : '待复核', navigation: { previous: q.number !== 1, next: q.number !== 20, nextWrong: hasWrong },
    score: { value: q.score, max: q.max, text: q.score, denominator: <>/ {q.max} 分</>, judgement: q.score === q.max ? '达成' : '需改进' },
    points: q.points.map((point, index) => ({ id: String(index), label: point.label, value: <>{point.score}/{point.max}</>, reason: point.reason ? <>缺失：{point.reason}</> : undefined, tone: point.score === point.max ? 'success' : point.score === 0 ? 'destructive' : 'warning', status: point.score === point.max ? '满分' : point.score === 0 ? '零分' : '部分得分' })),
    evidence: q.evidence, knowledge: [q.knowledge],
    comparison: [{ id: 'rate', label: '本题得分率', text: <>{q.rate}%</>, value: q.rate, max: 100, ariaLabel: '本题班级得分率' }, { id: 'affected', label: '受影响学生比例', text: <>{Math.round(q.affected / 36 * 100)}% <span className="text-ui-meta text-muted-foreground">{q.affected} / 36</span></>, value: q.affected, max: 36, ariaLabel: '受影响学生比例' }],
    extraLink: <Button data-question-review-link variant="link" className="ml-2" render={<a href={`/next/reviews/question-review?question=${q.id}&student=${studentId}`} />}>看全班此题 →</Button>,
    actions: [{ id: '更正评分', label: '更正评分', primary: true }, { id: '教师批阅', label: '教师批阅' }],
  }
}
