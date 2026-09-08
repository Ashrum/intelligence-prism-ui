"use client"

import { useState } from "react"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { StateLabel } from "@/components/ui/badge"
import { CardWorkbench, CommonCardExamples, type CardDensity } from "@/components/prism/card-patterns"
import { componentDocumentStatus, statusLabels } from "@/components/prism/catalog"

const cardTypes = [
  ["EvidenceRecord", "证据卡", "阅读与追溯", "身份、来源、范围、时间、判断、核验状态", "原图、OCR 与关联对象按需展开；整卡不作为按钮"],
  ["ProcessingRun", "处理卡", "运行与复核", "任务、输入范围、启动时间、进度、异常、运行反馈", "选择与阶段展开使用两个独立控件"],
  ["DiagnosisHypothesis", "复核卡", "AI 与人工判断", "AI 来源、观察周期、样本限制、待复核状态", "仅用于需要人工判断的候选结论；普通 AI 文案不升级"],
] as const

export function CardDoc() {
  const [density, setDensity] = useState<CardDensity>("comfortable")
  const status = componentDocumentStatus("card")
  return <article className="component-article">
    <header className="component-hero">
      <div className="component-eyebrow">数据展示</div>
      <div className="component-title-row"><h1>Card</h1><StateLabel tone={status === "stable" ? "completed" : "pending"}>{statusLabels[status]}</StateLabel></div>
      <p>Card 围绕一个对象或任务组织相关内容。指标、资源、概览与任务按用途取舍信息；操作时，对象身份、范围和已有结果保持连续。</p>
    </header>

    <section className="doc-section" aria-labelledby="card-common-title">
      <div className="doc-section-heading"><h2 id="card-common-title">常见样式</h2><p>按阅读任务选择结构，简单内容省略不需要的区块。所有示例每卡最多一条内部分隔线。</p></div>
      <div className="common-card-toolbar"><p>示例数据；来源可以展开，任务可以标记与撤回。操作只在本页保留，刷新恢复初始内容。</p><div><span>界面密度</span><SegmentedControl label="Card 界面密度" size="sm" value={density} onValueChange={value => setDensity(value as CardDensity)} items={[["comfortable", "舒适"], ["compact", "紧凑"]]} /></div></div>
      <CommonCardExamples density={density} />
    </section>

    <section className="doc-section" aria-labelledby="card-preview-title">
      <div className="doc-section-heading"><h2 id="card-preview-title">阅读、运行与复核</h2><p>查看证据、选择运行、重试失败任务，再编辑与复核 AI 结论。各对象保持独立。</p></div>
      <div className="component-preview component-preview--card"><CardWorkbench density={density} /></div>
    </section>

    <section className="doc-section" aria-labelledby="card-types-title">
      <div className="doc-section-heading"><h2 id="card-types-title">组成与适用边界</h2><p>以下三类复杂对象在常见 Card 基础上，按需组织身份、范围、状态、结论、详情与操作。</p></div>
      <div className="card-type-table-wrap" tabIndex={0} role="region" aria-label="Card 类型与适用边界">
        <table className="card-type-table"><thead><tr><th scope="col">对象类型</th><th scope="col">主要任务</th><th scope="col">稳定信息层级</th><th scope="col">适用边界</th></tr></thead><tbody>{cardTypes.map(([id, label, task, hierarchy, boundary]) => <tr key={id}><th scope="row"><strong>{label}</strong><small>{id}</small></th><td>{task}</td><td>{hierarchy}</td><td>{boundary}</td></tr>)}</tbody></table>
      </div>
    </section>

    <section className="doc-section doc-notes-grid" aria-label="使用与无障碍说明">
      <div className="doc-note"><h2>使用规则</h2><p>普通 Card 使用白色，指标 Card 使用浅中性底色；16px 圆角、细边框、无阴影。AI Card 的智绯侧边仅标识来源，同时保留 AI 来源文字。每张卡片最多一条内部分隔线，按需用于正文与集中操作区；身份、元数据和详情通过间距、对齐与字阶分组。标题图标、资源与班级标识使用无底色的中性前景，避免静态标识抢占内容层级。默认内容服务扫读和判断，必要操作保持可见；详情与编辑由用户主动展开。身份、状态、反馈与操作区按任务取舍，普通卡片不强制包含全部区块。复杂对象使用简短状态信号与就近反馈，承接帮助、加载、错误与结果。选择保持中性主体，只以边框、选中标记与文字、轻表面共同表达；AI 来源、判断限制和人工复核状态必须分开呈现。</p></div>
      <div className="doc-note"><h2>语义与操作保障</h2><p>Card 使用 article 与真实标题建立对象语义，普通 Card 不进入焦点顺序。展开按钮提供 aria-expanded 与 aria-controls；选择使用独立按钮和 aria-pressed；异步状态在稳定 live region 中替换。关闭内联编辑后焦点返回原操作，关键状态至少同时使用图标或形状与可读文字。空白应用保留输入并报错；取消、失败保留上次结果，应用修正可撤回。修改与重新生成后重新待复核，人工确认后仍保留 AI 来源。</p></div>
    </section>
  </article>
}
