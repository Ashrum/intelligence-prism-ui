"use client"

import { CardWorkbench } from "@/components/prism/card-patterns"

const cardTypes = [
  ["EvidenceRecord", "证据卡", "阅读与追溯", "身份、来源、范围、时间、判断、核验状态", "原图、OCR 与关联对象按需展开；整卡不作为按钮"],
  ["ProcessingRun", "处理卡", "运行与复核", "任务、输入范围、启动时间、进度、异常、运行反馈", "选择与阶段展开使用两个独立控件"],
  ["DiagnosisHypothesis", "复核卡", "AI 与人工判断", "AI 来源、观察周期、置信度、不确定性、待复核状态", "仅用于需要人工判断的候选结论；普通 AI 文案不升级"],
] as const

export function CardDoc() {
  return <article className="component-article">
    <header className="component-hero">
      <div className="component-eyebrow">数据展示</div>
      <div className="component-title-row"><h1>Card</h1><span className="state-label state-label--completed"><span className="state-dot" aria-hidden="true" />稳定</span></div>
      <p>Card 是连续对象的阅读与判断表面：对象身份在聚焦、展开、选择和编辑中保持不变，状态与上下文占据稳定位置。</p>
    </header>

    <section className="doc-section" aria-labelledby="card-preview-title">
      <div className="doc-section-heading"><h2 id="card-preview-title">Preview</h2><p>在同一工作台直接验证扫读、状态替换、选择、展开与 AI 编辑。</p></div>
      <div className="component-preview component-preview--card"><CardWorkbench showDensityControl /></div>
    </section>

    <section className="doc-section" aria-labelledby="card-types-title">
      <div className="doc-section-heading"><h2 id="card-types-title">Types & boundaries</h2><p>三类真实对象共用 Identity → Context → Stable status → Summary → Disclosure / Actions。</p></div>
      <div className="card-type-table-wrap" tabIndex={0} role="region" aria-label="Card 类型与适用边界">
        <table className="card-type-table"><thead><tr><th>对象类型</th><th>主要任务</th><th>稳定信息层级</th><th>适用边界</th></tr></thead><tbody>{cardTypes.map(([id, label, task, hierarchy, boundary]) => <tr key={id}><th><strong>{label}</strong><small>{id}</small></th><td>{task}</td><td>{hierarchy}</td><td>{boundary}</td></tr>)}</tbody></table>
      </div>
    </section>

    <section className="doc-section doc-notes-grid" aria-label="使用与无障碍说明">
      <div className="doc-note"><h2>Usage</h2><p>默认内容服务扫读和判断；详情与操作只在用户意图出现后就地展开。头部保留简短状态信号，底部固定状态槽承接帮助、加载、错误与成功反馈。选择保持中性主体，只以边框、勾选与文字、轻表面共同表达；AI 来源、置信度和人工复核状态必须分开呈现。</p></div>
      <div className="doc-note"><h2>Accessibility</h2><p>Card 使用 article 与真实标题建立对象语义，普通 Card 不进入焦点顺序。展开按钮提供 aria-expanded 与 aria-controls；选择使用独立按钮和 aria-pressed；异步状态在稳定 live region 中替换。关闭内联编辑后焦点返回原操作，关键状态至少同时使用图标或形状与可读文字。</p></div>
    </section>
  </article>
}
