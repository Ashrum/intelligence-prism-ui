"use client"

import { useState } from 'react'
import { TypographyPreview } from './typography-preview'
import audit from '@/lib/prism-next/typography-audit.json'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/coss/table'
import { Button } from '@/components/coss/button'
import { Textarea } from '@/components/coss/textarea'
import { Badge } from '@/components/prism-next/badge'
import { DemoSection } from '@/components/prism-next/demo-parts'
import { RootFormula } from '@/components/prism-next/math-content'
import { typographyRoles, TYPOGRAPHY_VERSION } from '@/lib/prism-next/typography'

const question='已知函数 f(x) = x² − 2x + 1，x ∈ R。求 f(x) 的最小值，并写出取到最小值时 x 的值。'
const states=['题目与公式识别中','部分完成','等待核对'] as const

export function TypographyFoundation(){
  const [editing,setEditing]=useState(false),[draft,setDraft]=useState(question),[stage,setStage]=useState(0)
  return <div className="prism-content">
    <header className="prism-page-heading"><h1>字体与字号</h1><p>同一文字角色，使用同一套字号、行高与字重。</p><p className="text-ui-hint">Typography v{TYPOGRAPHY_VERSION} · 实施验证版</p></header>
    <nav aria-label="字体规范目录" className="mb-8 flex flex-wrap gap-x-6 gap-y-3 text-ui-action"><a className="prism-link" href="#type-roles">字号角色</a><a className="prism-link" href="#type-samples">解析样本</a><a className="prism-link" href="#type-rules">使用边界</a><a className="prism-link" href="#type-audit">全站检查</a></nav>
    <DemoSection id="type-roles" title="字号角色" description="数值以默认 16px 根字号为参照。字号使用 rem，行高使用比例；用户放大文字时，容器随内容展开。">
      <div>{typographyRoles.map(role=><div key={role.id} className="prism-type-role" data-type-sample={role.id}>
        <div><h3 className="text-item-title">{role.label}</h3><p className="mt-2 text-ui-meta font-mono text-muted-foreground">{role.id}</p><p className="mt-2 text-ui-body tabular-nums">{role.size} / {role.lineHeight} px · {role.weight}</p></div>
        <div className="prism-type-specimen"><p className={role.className}>{role.id==='stat-display'?<span className="tabular-nums">−12.5%</span>:'清楚地阅读题目与学习证据'}</p><p className="mt-3 text-ui-hint text-muted-foreground">{role.usage}</p></div>
      </div>)}</div>
    </DemoSection>
    <DemoSection id="type-samples" title="解析工作区的五类样本" description="材料说明、任务状态、Agent 回复、题目阅读和题干编辑。切换页面顶部主题，比较相同内容。">
      <div className="grid gap-10 xl:grid-cols-2">
        <div className="space-y-7"><section><h3 className="text-block-title">添加材料</h3><p className="mt-3 text-ui-hint text-muted-foreground">支持图片与 PDF。请确认正反面齐全、页序正确，公式区域清晰。</p><p className="mt-2 text-ui-hint text-warning-foreground">已选择 3 页，缺少第 2 页，请先补齐材料。</p></section>
          <section><h3 className="text-block-title">任务阶段</h3><div className="mt-3 flex flex-wrap items-center gap-3"><Badge size="lg" variant={stage===0?'info':'warning'}>{states[stage]}</Badge><Button size="sm" variant="outline" onClick={()=>setStage((stage+1)%states.length)}>切换示例状态</Button></div><p className="mt-3 text-ui-hint text-muted-foreground">已完成 2/3 页，失败页可单独重试。</p></section>
          <section><h3 className="text-block-title">Agent 完整回复</h3><div className="mt-3 space-y-3 text-read-body"><p>已整理题目结构，并保留原题号与小问关系。</p><p>第 2 题跨第 2、3 页，请先确认原稿完整，再核对题干。材料未提供参考答案，本次不自动补造。</p></div></section></div>
        <section><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-block-title">同一题干，查看与编辑</h3><Button variant="outline" onClick={()=>setEditing(!editing)}>{editing?'查看题干':'编辑题干'}</Button></div><div className="mt-4">{editing?<Textarea aria-label="题干编辑样本" value={draft} onChange={e=>setDraft(e.target.value)} className="prism-long-edit"/>:<p className="text-read-body whitespace-pre-wrap" data-reading-sample>{draft}</p>}</div><div className="prism-equation"><RootFormula/></div><p className="text-ui-hint text-muted-foreground">公式保留自己的垂直度量。分式、根号和上下标可以撑开内容，不锁死在 28px 高度内。</p><a href="/next/use-cases/parsing?case=images" className="prism-link mt-5 inline-block text-ui-action">进入解析工作区 →</a></section>
      </div><TypographyPreview/>
    </DemoSection>
    <DemoSection id="type-rules" title="使用边界" description="字号由信息角色决定，不根据卡片的宽窄或外形临时缩小。">
      <div className="grid gap-8 lg:grid-cols-2"><section><h3 className="text-block-title">列表项与独立内容块</h3><p className="mt-3 text-read-body">同一集合内的一条材料或任务使用 14px 项目标题，即使包含摘要和操作。独立的原稿对照、题干编辑模块使用 16px 内容块标题。</p><p className="mt-3 text-ui-hint text-muted-foreground">完整题干始终按 16px 正文处理；“共 3 页”涉及范围或缺页判断时，至少使用 14px。</p></section>
      <section><h3 className="text-block-title">指标与单位</h3><div className="mt-4 flex flex-wrap gap-8"><p className="text-stat-display tabular-nums">−12.5%</p><p className="flex items-baseline gap-1"><span className="text-stat-display tabular-nums">128.6</span><span className="text-ui-body">万元</span></p></div><p className="mt-3 text-ui-hint text-muted-foreground">使用 tabular-nums 数字特性，保留界面字体。百分号和正负号跟随主数值，其他单位使用 14px。</p></section>
      <section><h3 className="text-block-title">字体与语言</h3><p className="mt-3 text-read-body">界面采用系统字体，公式使用本地 STIX Two Math。中文页面声明 lang="zh-CN"，外语材料保留对应语言。</p><div className="mt-4 space-y-2 text-read-body"><p className="font-normal">400　教学材料 Aa 0123</p><p className="font-medium">500　教学材料 Aa 0123</p><p className="font-semibold">600　教学材料 Aa 0123</p></div><p className="mt-3 text-ui-hint text-muted-foreground">Windows 字重可能合并；层次同时依靠字号、位置和间距。实际字形需真机核对。</p></section>
      <section><h3 className="text-block-title">辅助文字的承载背景</h3><div className="mt-3 rounded-lg bg-secondary p-5"><p className="text-ui-hint text-muted-foreground">字段说明与状态解释保持可读，浅灰底不沿用未经验证的浅字色。</p></div><p className="mt-3 text-ui-hint text-muted-foreground">#6B7280 / #F4F5F7 约为 4.43:1，不通过普通小字门槛。当前浅色辅助文字采用更深的统一语义色；以实际背景和透明度检查。</p></section></div>
    </DemoSection>
    <DemoSection id="type-audit" title="全站检查" description="2026-09-20 · 浏览器检查与源码检查分别记录；本轮结果适用于当次展示状态。">
      <div className="grid gap-6 sm:grid-cols-3"><div><p className="text-ui-hint text-muted-foreground">页面入口</p><p className="mt-2 text-stat-display tabular-nums">{audit.pageCount}<span className="ml-1 text-ui-body">页</span></p></div><div><p className="text-ui-hint text-muted-foreground">三主题展示检查</p><p className="mt-2 text-stat-display tabular-nums">{audit.themeVisits}<span className="ml-1 text-ui-body">次</span></p></div><div><p className="text-ui-hint text-muted-foreground">本轮检查项的待修问题</p><p className="mt-2 text-stat-display tabular-nums">{audit.unresolved}<span className="ml-1 text-ui-body">项</span></p></div></div>
      <p className="mt-6 text-ui-hint">已检查全部 80 个组件页，以及基础规范、阅读、Agent、教师用例、页面骨架和应用示例。检查实际字号、明确角色的行高与字重、普通 DOM 文字的合成对比度及页面横向溢出。</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><section><h3 className="text-block-title">已操作的代表性状态</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-ui-hint"><li>题干查看与编辑：均为 16 / 28 / 400。</li><li>执行中、部分完成、等待核对：均为 14 / 20 / 500。</li><li>短输入：1024px 视窗为 14 / 20，390px 视窗为 16 / 24。</li><li>长编辑区：两种视窗均为 16 / 28。</li><li>弹窗错误说明为 14 / 22；侧面板标题为 20 / 30，长编辑为 16 / 28。</li><li>解析工作区 390px 视窗：标题与题干字号保持，页面没有横向溢出。</li></ul></section><section><h3 className="text-block-title">工程约束与验证边界</h3><p className="mt-3 text-ui-hint">93 个自有 TSX 文件纳入语义字号扫描。局部 CSS 字号也由构建检查约束；54 个固定 coss 组件源文件保持一致，现有回归测试通过。</p><p className="mt-3 text-ui-hint text-muted-foreground">MathML 上下标、SVG / Canvas 图中文字、打印纸面和禁用态单独处理，不计入普通 DOM 文字的通过结论。未穷举所有交互状态组合。</p><p className="mt-3 text-ui-hint text-warning-foreground">待真机确认：Windows / Apple 实际字形与字重区分、iOS Safari 聚焦表现。云端浏览器结果不代替真机结论。</p></section></div>
      <details className="mt-7 border-t pt-5"><summary className="cursor-pointer text-ui-action">查看全部 {audit.pageCount} 个页面的检查清单</summary><div className="mt-4 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>页面</TableHead><TableHead>浅色</TableHead><TableHead>暖纸</TableHead><TableHead>深色</TableHead></TableRow></TableHeader><TableBody>{audit.routes.map(route=><TableRow key={route.path}><TableCell><a className="prism-link" href={route.path}>{route.title}</a></TableCell>{['light','paper','dark'].map(theme=><TableCell key={theme}>{route.checks.some(c=>c.theme===theme&&c.roleMismatches===0&&c.unexpectedTypography===0&&c.lowContrast===0&&!c.pageOverflow)?'通过':'待复核'}</TableCell>)}</TableRow>)}</TableBody></Table></div></details>
    </DemoSection>
  </div>
}
