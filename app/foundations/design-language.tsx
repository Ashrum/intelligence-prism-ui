import Link from "next/link"

const behaviors = [
  ["阅读", "对象明确，层级稳定，便于扫读与对照。", "优先呈现名称、当前内容和影响判断的条件；其他信息按需要展开。"],
  ["聚焦", "清楚指出动作将作用于哪里，相关工具就近出现。", "需确认的操作区分正在关注与已经生效；关键入口不能完全依赖悬停。"],
  ["操作", "输入、约束、帮助与反馈保持邻近，让人知道动作已被接收。", "帮助、加载、错误与结果尽量复用相应位置，长中文允许自然增高。"],
  ["查看详情", "轻量内容就地展开，复杂内容获得更大的阅读空间。", "按内容量选择展开、侧栏或聚焦页，避免无限嵌套。"],
  ["完成与返回", "说明改了什么、结果落在哪里，并自然接上下一步。", "保留必要的草稿、选择、阅读位置与筛选范围；适合撤回的操作提供明确入口。"],
]
const componentRoles = [
  ["导航、Tabs、Segmented Control", "说明当前位置、视角与作用范围；切换后保持上下文。"],
  ["Card、列表、表格", "帮助识别对象、比较差异和作出判断；详情与操作围绕对象展开。"],
  ["Text Fields", "引入 M3 的持续标签、邻近约束、前后缀组织和原位反馈机制，再按中文内容与密度调整比例。"],
  ["Button、菜单与操作区", "行动名称具体，主次清楚，处理中与完成后的结果能够接续；不同输入方式保持相同的动作含义。"],
  ["Badge、状态与通知", "分别表达来源、处理进度、内容质量和复核状态，避免把不同含义堆成一排标签。"],
]

export function DesignLanguageRecord() {
  return <article id="design-language" className="prism-language-record" aria-labelledby="language-title">
    <header className="language-record-heading">
      <div className="language-record-meta"><span>设计语言</span><time dateTime="2026-09-07">2026-09-07</time></div>
      <h2 id="language-title">阅读时的秩序，操作中的变化，变化之后的连续。</h2>
      <p>以中文与数学的阅读质感建立秩序，以清楚而克制的局部响应承接意图，以可追溯、可恢复的结果保持工作的连续。</p>
      <p className="language-philosophy">正为道，奇为用。熟悉的阅读秩序构成基础，明确的局部变化服务当下意图。</p>
      <p className="language-record-scope">本记录汇合组件、优秀软件、中文与数学排版、游戏界面、社区设计、可视化与设备系统的研究。共同原则、三种源色与字体分工已明确；表现强度和场景细则持续验证，正式组件的回填状态单独记录。</p>
    </header>

    <section className="language-record-section" aria-labelledby="language-principles-title">
      <h3 id="language-principles-title">秩序、变化与连续</h3>
      <dl className="language-role-list">
        <div><dt>阅读时的秩序</dt><dd>让重要内容自然成为视觉中心。默认画面帮助识别对象、理解内容和比较差异；标题、正文、公式、数据与来源各有权重，容器和说明不能压过真正需要判断的内容。</dd></div>
        <div><dt>操作中的变化</dt><dd>让用户感到系统准确接住了意图。聚焦、查看、编辑和执行围绕同一对象展开，清楚说明动作作用于哪里、是否已被接收、结果发生在何处。</dd></div>
        <div><dt>变化之后的连续</dt><dd>让结果、依据与下一步接得上。操作完成后能够理解改了什么、找到原对象并继续工作；必要的草稿、位置、范围与来源关系得到保留。</dd></div>
      </dl>
    </section>

    <section className="language-record-section" aria-labelledby="language-character-title">
      <h3 id="language-character-title">精致、清晰、空间高效，配色雅致并具有记忆点</h3>
      <p>沿用 B 方向：熟悉的组件轮廓、清楚的边界、克制的表面。通过比例、排版、间距、状态和动效形成完成度。克制主要约束装饰，关键信息、选中状态与操作反馈应当鲜明。</p>
      <div className="language-source-colors" aria-label="三种已确认源色"><span><i className="language-color-knowledge" aria-hidden="true" />曜蓝 <code>#339FF2</code></span><span><i className="language-color-ai" aria-hidden="true" />智绯 <code>#E0438F</code></span><span><i className="language-color-growth" aria-hidden="true" />生长荧 <code>#C2F25B</code></span></div>
      <p>颜色沿用既有语义 Token，集中表达当前操作、选择、AI 参与和必要反馈。三种颜色不必均分面积或同时突出。正文、边界、底色与强调色保持清楚的强弱关系；不能用一律变淡、变小来代替精致。</p>
      <p>源色定义品牌身份；操作、文字和状态使用独立的语义映射。源色更新不直接覆盖这些已验证的语义色。</p>
      <p>空间高效，是在合适的阅读距离与输入条件下，让人用更少的寻找完成理解和操作。优先减少重复标题、重复容器、无效分隔和多余跳转；比较信息沿共同的行列排列。中文长文、复杂公式与重要证据获得充分的阅读空间，留白用于组织关系。</p>
      <p>常规表面避免厚阴影、装饰竖线、厚底与复杂材质。清雅来自强弱关系与准确用色，精致仍需要鲜明的比例、节奏和强调。</p>
    </section>

    <section className="language-record-section" aria-labelledby="language-behavior-title">
      <h3 id="language-behavior-title">一套共同的行为方式</h3>
      <div className="language-table-wrap" role="region" aria-label="阅读到返回的行为与边界" tabIndex={0}><table className="language-table"><thead><tr><th scope="col">时刻</th><th scope="col">表现</th><th scope="col">边界</th></tr></thead><tbody>{behaviors.map(([stage, behavior, boundary]) => <tr key={stage}><th scope="row">{stage}</th><td>{behavior}</td><td>{boundary}</td></tr>)}</tbody></table></div>
      <p>稳定的是信息关系与对象身份，不要求所有内容固定高度，也不要求来源、时间、范围等元信息全部常驻。决定当前判断所需的条件应保持可见。</p>
      <p>注意力可以被清楚地交接：主内容暂时让出部分空间，辅助操作就近出现，处理结束后返回原段落、选区或对象。长文本和复杂比较需要充分的阅读空间，不能将所有功能压进侧栏。</p>
      <p>鼠标、键盘和触控可以使用不同的触达方式，对象名称、动作含义和结果反馈保持一致。操作提示出现在使用现场；偶然的输入变化不应让提示反复跳变，也不应打断当前操作。</p>
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
      <p>动效说明哪个对象被展开、什么范围发生改变、结果落在何处。高频切换要利落，输入与内容及时响应，快速反向操作能够接住；避免反复播放整页入场、持续发光、无意义漂浮和阻碍操作的长动画。减少动态效果时仍保留清楚的状态表达。</p>
      <dl className="language-role-list">
        <div><dt>来源</dt><dd>哪些内容由 AI 参与形成，人工修正后是否仍能追溯其来源。</dd></div>
        <div><dt>质量与限制</dt><dd>判断依据是什么，哪里存在不确定性或模型分歧；AI 参与不自动意味着错误，高置信度也不能直接等同于事实正确。</dd></div>
        <div><dt>处理状态</dt><dd>是否需要复核、是否已被人工修改。人工确认不能被表达为系统已经证明内容正确。</dd></div>
      </dl>
      <p>关键状态至少同时具有文字、图标、形状或边界中的两种可读信号。颜色提供强调，文字承担明确含义。</p>
    </section>

    <section id="language-visualization" className="language-record-section" aria-labelledby="language-visualization-title">
      <h3 id="language-visualization-title">让数据可以比较，让关系可以解释</h3>
      <p>数据可视化帮助判断多少、相差多少、怎样变化与判断有多确定；信息可视化帮助理解属于哪里、如何关联、先后怎样与依据来自哪里。两者围绕同一对象和判断任务衔接。</p>
      <dl className="language-role-list">
        <div><dt>比较有尺度</dt><dd>单位、时间、范围、基线与必要来源贴近结果。分母和参照系属于结果身份；图表、表格与明细切换时保留相关筛选，范围发生变化时明确说明。</dd></div>
        <div><dt>形态有含义</dt><dd>根据比较、趋势、覆盖、层级或关联选择形态。颜色、面积、距离与连线必须有可解释含义；相近、共现、支持与因果不能混为一谈。概览应能通向可核查的内容。</dd></div>
        <div><dt>编码有分工</dt><dd>品牌强调、类别区分、数值递增、正负偏离与真实对象颜色各有职责。三种源色不能自动承担全部数据编码；实测、估计、预测、缺失与模型分歧需要可读的区分，具体色阶和形式仍待验证。</dd></div>
        <div><dt>探索可接续</dt><dd>选择对象、改变参数或追问结论时，显露相应的位置、影响或依据。中文说明、公式、参数与图形相互解释；日常判断可以直接查看结果，叙事过渡不阻碍操作。</dd></div>
      </dl>
    </section>

    <section id="language-validation" className="language-record-section" aria-labelledby="language-validation-title">
      <h3 id="language-validation-title">当前证据与未决点</h3>
      <dl className="language-role-list">
        <div><dt>已明确的共同原则</dt><dd>B 方向、更新后的三源色与既有语义 Token、字体分工，以及“秩序—变化—连续”的主线。本轮提炼已纳入本页，具体表现强度与场景参数仍需验证。</dd></div>
        <div><dt>候选中已观察</dt><dd>结论复核的同源码浏览器预览已操作证据展开、局部编辑、空值反馈、跨条目草稿保留、初稿对照和撤回。首版留白过多的问题已修正，桌面中短结论、完整证据与操作区能够同屏呈现。</dd></div>
        <div><dt>场景取舍待确认</dt><dd>结论与编辑采用相同的较大宋体，操作区靠近结论，完成后将主行动交给“下一条”；短证据就地展开，历史按需对照，保留未应用草稿。这些仍是候选表达，尚未成为全站定值。</dd></div>
        <div><dt>表现强度待验证</dt><dd>字阶与密度、局部色彩与动效的力度、长证据和复杂公式需要更大空间的时机，以及数据色阶与不确定性的编码。</dd></div>
        <div><dt>体验边界待验证</dt><dd>完整画面的品牌辨识度、高密度连续工作、窄视口、200% 缩放、系统 Reduced Motion 与屏幕阅读器。参考案例的官方说明和截图不等同于本系统的实际交互验收。</dd></div>
      </dl>
      <p>最有辨识潜力的组合，是有质感的中文与数学阅读、围绕当前对象发生的清楚响应，以及能够自然接续的工作过程。用户发起动作时，局部轮廓、表面、指示器或状态给出一致而鲜明的回应，强度适合当前任务与操作频率。</p>
      <p>清楚、稳定、可撤回属于基础质量；品牌辨识度需要由这些表达在完整画面中反复成立来证明。当前已形成设计语言骨架，尚不宣称成熟、独有的风格已经完成。</p>
      <div className="language-inline-links"><Link href="/review/reading-review">体验结论复核候选 →</Link><Link href="/benchmark">查看 Benchmark →</Link><a href="https://github.com/Ashrum/intelligence-prism-ui/pull/5" target="_blank" rel="noreferrer">候选与评审记录 ↗</a></div>
    </section>
  </article>
}
