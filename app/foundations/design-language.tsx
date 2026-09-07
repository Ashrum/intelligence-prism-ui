import Link from "next/link"

const behaviors = [
  ["阅读", "对象明确，层级稳定，便于扫读与对照。", "优先呈现名称、当前内容和影响判断的条件；其他信息按需要展开。"],
  ["聚焦", "当前对象获得清楚的关注区域，相关工具就近出现。", "保留可发现的操作入口，关键能力不能完全依赖悬停。"],
  ["操作", "输入、约束、帮助与反馈保持邻近。", "帮助、错误与进度尽量复用既有位置，长内容允许自然增高。"],
  ["查看详情", "轻量内容就地展开，复杂内容获得更大的阅读空间。", "按内容量选择展开、侧栏或聚焦页，避免无限嵌套。"],
  ["完成与返回", "结果变化可辨认，来源可追溯，工作可以继续。", "保留必要的草稿、位置与选择；适合撤回的操作提供明确入口。"],
]
const componentRoles = [
  ["导航、Tabs、Segmented Control", "说明当前位置、视角与作用范围；切换后保持上下文。"],
  ["Card、列表、表格", "帮助识别对象、比较差异和作出判断；详情与操作围绕对象展开。"],
  ["Text Fields", "引入 M3 的持续标签、邻近约束、前后缀组织和原位反馈机制，再按中文内容与密度调整比例。"],
  ["Button、菜单与操作区", "行动名称具体，主次清楚，处理中与完成后的结果能够接续。"],
  ["Badge、状态与通知", "分别表达来源、处理进度、内容质量和复核状态，避免把不同含义堆成一排标签。"],
]

export function DesignLanguageRecord() {
  return <article id="design-language" className="prism-language-record" aria-labelledby="language-title">
    <header className="language-record-heading">
      <div className="language-record-meta"><span>阶段记录</span><time dateTime="2026-09-07">2026-09-07</time></div>
      <h2 id="language-title">阅读时的秩序，操作中的变化，变化之后的连续。</h2>
      <p>稳定的结构让人安心阅读，恰当的变化让人理解操作；操作结束后，对象、依据和工作进度仍然接得上。</p>
      <p className="language-philosophy">正为道，奇为用。熟悉的阅读秩序构成基础，明确的局部变化服务当下意图。</p>
      <p className="language-record-scope">整体方向与字体分工已确认；场景细则持续验证。本记录区分设计依据、候选观察和后续实现，不代表全部组件已回填。</p>
    </header>

    <section className="language-record-section" aria-labelledby="language-character-title">
      <h3 id="language-character-title">精致、清晰、空间高效，配色雅致并具有记忆点</h3>
      <p>沿用 B 方向：熟悉的组件轮廓、清楚的边界、克制的表面。通过比例、排版、间距、状态和动效形成完成度。克制主要约束装饰，关键信息、选中状态与操作反馈应当鲜明。</p>
      <div className="language-source-colors" aria-label="三种已确认源色"><span><i className="language-color-knowledge" aria-hidden="true" />曜蓝 <code>#4EB1D9</code></span><span><i className="language-color-ai" aria-hidden="true" />智绯 <code>#E0438F</code></span><span><i className="language-color-growth" aria-hidden="true" />生长荧 <code>#C2F25B</code></span></div>
      <p>颜色沿用既有语义 Token，集中表达当前操作、选择、AI 参与和必要反馈。三种颜色不必均分面积或同时突出。正文、边界、底色与强调色保持清楚的强弱关系；不能用一律变淡、变小来代替精致。</p>
      <p>空间效率优先来自减少重复标题、重复信息、无效分隔和多余跳转。中文长文、公式与证据仍需获得充分的阅读空间。常规表面避免厚阴影、装饰竖线、厚底与复杂材质。</p>
    </section>

    <section className="language-record-section" aria-labelledby="language-behavior-title">
      <h3 id="language-behavior-title">一套共同的行为方式</h3>
      <div className="language-table-wrap" role="region" aria-label="阅读到返回的行为与边界" tabIndex={0}><table className="language-table"><thead><tr><th scope="col">时刻</th><th scope="col">表现</th><th scope="col">边界</th></tr></thead><tbody>{behaviors.map(([stage, behavior, boundary]) => <tr key={stage}><th scope="row">{stage}</th><td>{behavior}</td><td>{boundary}</td></tr>)}</tbody></table></div>
      <p>稳定的是信息关系与对象身份，不要求所有内容固定高度，也不要求来源、时间、范围等元信息全部常驻。决定当前判断所需的条件应保持可见。</p>
    </section>

    <section id="language-typography" className="language-record-section" aria-labelledby="language-type-title">
      <h3 id="language-type-title">文字与数学构成阅读气质</h3>
      <div className="language-table-wrap" role="region" aria-label="已确认字体分工" tabIndex={0}><table className="language-table"><thead><tr><th scope="col">用途</th><th scope="col">已选字体</th><th scope="col">设计责任</th></tr></thead><tbody>
        <tr><th scope="row">界面与短说明</th><td>Noto Sans CJK SC</td><td>导航、表格和控件保持清楚、稳定，支持快速识别。</td></tr>
        <tr><th scope="row">较长阅读</th><td>Noto Serif CJK SC</td><td>题目、正文、解释和证据具有适合持续阅读的笔画层次与节奏。</td></tr>
        <tr><th scope="row">数学公式</th><td>STIX Two Math</td><td>保持符号、上下标、分式与根式的辨识度。</td></tr>
      </tbody></table></div>
      <p>从优秀日文排版中吸收层级、节奏、对齐和细节控制，再按中文的字形、标点与断行习惯处理。短式随文，复杂推导独立组织；按视觉大小和黑度协调中文与公式，保留根式、分式和上下标所需空间。</p>
      <p>字体方向已经确定；完整字库、字重、回退、数学渲染器和跨系统一致性仍待落实。当前候选采用固定样本子集，具体字号仅属于场景参数，尚未成为全站定值。</p>
      <div className="language-inline-links"><Link href="/review/typography">字体与数学对照 →</Link><Link href="/foundations/typography">当前字体规范与实现 →</Link></div>
    </section>

    <section className="language-record-section" aria-labelledby="language-components-title">
      <h3 id="language-components-title">组件承担不同职责，使用同一种语言</h3>
      <dl className="language-role-list">{componentRoles.map(([name, role]) => <div key={name}><dt>{name}</dt><dd>{role}</dd></div>)}</dl>
      <p>共同准则用于后续实现与评审，已收口的 Button、Tabs 和 Segmented Control 不因此重新展开设计。Text Fields 的借鉴方向已明确，具体样式与空间比例仍需在中文场景中验证。</p>
    </section>

    <section className="language-record-section" aria-labelledby="language-motion-ai-title">
      <h3 id="language-motion-ai-title">动效表达关系，AI 表达责任</h3>
      <p>动效说明哪个对象被展开、什么范围发生改变、结果落在何处。高频切换要利落，输入与内容及时响应，快速反向操作能够接住。遵循减少动态效果的偏好，避免持续发光、无意义漂浮和阻碍操作的长动画。</p>
      <dl className="language-role-list">
        <div><dt>来源</dt><dd>哪些内容由 AI 参与形成，人工修正后是否仍能追溯其来源。</dd></div>
        <div><dt>质量与限制</dt><dd>判断依据是什么，哪里存在不确定性；不把 AI 参与自动归为错误。</dd></div>
        <div><dt>处理状态</dt><dd>是否需要复核、是否已被人工修改。人工确认不能被表达为系统已经证明内容正确。</dd></div>
      </dl>
      <p>关键状态至少同时具有文字、图标、形状或边界中的两种可读信号。颜色提供强调，文字承担明确含义。</p>
    </section>

    <section id="language-validation" className="language-record-section" aria-labelledby="language-validation-title">
      <h3 id="language-validation-title">当前证据与未决点</h3>
      <dl className="language-role-list">
        <div><dt>已确认的依据</dt><dd>B 方向、三源色与既有语义 Token、字体分工，以及“秩序—变化—连续”的主线。</dd></div>
        <div><dt>候选中已观察</dt><dd>结论复核的同源码浏览器预览已操作证据展开、局部编辑、空值反馈、跨条目草稿保留、初稿对照和撤回。首版留白过多的问题已修正，桌面中短结论、完整证据与操作区能够同屏呈现。</dd></div>
        <div><dt>场景取舍待确认</dt><dd>短证据在结论下展开；历史默认收起、按需对照；允许离开未应用草稿并返回继续。这些仍是候选规则。</dd></div>
        <div><dt>仍需验证</dt><dd>完整画面的视觉辨识度、高密度工作、长证据与复杂公式、连续高频操作，以及窄视口、200% 缩放、系统 Reduced Motion 和屏幕阅读器。</dd></div>
      </dl>
      <p>最有辨识潜力的组合，是有阅读质感的中文与数学排版、围绕稳定对象发生的局部变化，以及准确、克制的语义配色。当前已经形成骨架，独特的品牌辨识度仍需通过完整场景证明。</p>
      <div className="language-inline-links"><Link href="/review/reading-review">体验结论复核候选 →</Link><Link href="/benchmark">查看 Benchmark →</Link><a href="https://github.com/Ashrum/intelligence-prism-ui/pull/5" target="_blank" rel="noreferrer">候选与评审记录 ↗</a></div>
    </section>
  </article>
}
