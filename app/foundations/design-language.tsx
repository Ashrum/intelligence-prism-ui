import Link from "next/link"

const behaviors = [
  ["阅读", "对象明确，层级稳定，便于扫读与对照。", "接受名称、结论与成立条件共同可见；拒绝截掉决定结论是否成立的范围，却保留完整装饰标题。"],
  ["聚焦", "清楚指出动作将作用于哪里，相关工具就近出现。", "接受需确认的操作先聚焦、再确认；拒绝仅移动焦点就提交修改，或把关键入口只放在 Hover 中。"],
  ["操作", "输入、约束、帮助与反馈保持邻近，让人知道动作已被接收。", "接受错误替换输入旁的帮助文案，长文自然增高；拒绝叠加多条同义提示，或为保高度而裁掉错误原因。"],
  ["查看详情", "轻量内容就地展开，复杂内容获得更大的阅读空间。", "接受短证据就地展开、长推导进入可返回的宽阅读面；拒绝把多层证据持续嵌进狭窄侧栏。"],
  ["完成与返回", "说明改了什么、结果落在哪里，并自然接上下一步。", "接受确认后明确结果、保留必要草稿与位置，并由用户进入下一条；拒绝无提示清空草稿或自动跳走。"],
]
const componentRoles = [
  ["导航、Tabs、Segmented Control", "说明当前位置、视角与作用范围。接受切换图表／明细时保留班级和周期；拒绝视图切换暗中重置筛选。"],
  ["Card、列表、表格", "帮助识别对象、比较差异和作出判断。接受同类指标沿共同列对齐；拒绝每项再套一张卡导致无法横向比较。"],
  ["Text Fields", "引入 M3 的持续标签、邻近约束、前后缀和原位反馈。接受输入后仍能看到字段身份与单位；拒绝只靠 Placeholder 标识字段，或只用 Toast 说明字段错误。"],
  ["Button、菜单与操作区", "行动名称具体，主次清楚，结果能够接续。接受“应用修正”对应明确的对象和结果；拒绝用同一个“确定”掩盖不同后果。"],
  ["Badge、状态与通知", "分别表达来源、处理进度、内容质量和复核状态。接受“AI 初稿”与“待复核”各自有明确含义；拒绝用一枚彩色 AI 标签同时代表生成中、可信与已复核。"],
]

export function DesignLanguageRecord() {
  return <article id="design-language" className="prism-language-record" aria-labelledby="language-title">
    <header className="language-record-heading">
      <div className="language-record-meta"><span>设计语言</span><time dateTime="2026-09-07">2026-09-07</time></div>
      <h2 id="language-title">阅读时的秩序，操作中的变化，变化之后的连续。</h2>
      <p>以中文与数学的阅读质感建立秩序，以清楚而克制的局部响应承接意图，以可追溯、可恢复的结果保持工作的连续。</p>
      <p className="language-philosophy">正为道，奇为用。熟悉的阅读秩序构成基础，明确的局部变化服务当下意图。</p>
      <p className="language-record-scope">案例寻找阶段已结束，当前进入设计语言的应用定型。共同原则、三种源色与字体分工已明确；以下接受／拒绝示例用于设计与工程判断方案，具体表现强度和场景细则由真实页面验证。</p>
    </header>

    <section className="language-record-section" aria-labelledby="language-principles-title">
      <h3 id="language-principles-title">秩序、变化与连续</h3>
      <dl className="language-role-list">
        <div><dt>阅读时的秩序</dt><dd>让重要内容自然成为视觉中心。接受待判断的结论与公式比区块标题更突出、比较数据沿共同列对齐；拒绝装饰标题、容器和说明压过真正需要判断的内容。</dd></div>
        <div><dt>操作中的变化</dt><dd>让用户感到系统准确接住了意图。接受在同一结论处显露编辑边界和工具，持续显示对象名称；拒绝一点击就把内容搬入失去对象身份的空白弹窗。</dd></div>
        <div><dt>变化之后的连续</dt><dd>让结果、依据与下一步接得上。接受修正后能核对改动、撤回并继续处理；拒绝保存成功后回到列表顶部，丢失筛选和阅读位置。</dd></div>
      </dl>
    </section>

    <section className="language-record-section" aria-labelledby="language-character-title">
      <h3 id="language-character-title">精致、清晰、空间高效，配色雅致并具有记忆点</h3>
      <p>沿用 B 方向：熟悉的组件轮廓、清楚的边界、克制的表面。接受用准确的字阶、留白和清晰的选中边界形成层级；拒绝把所有文字、边界一律变淡变小来表示精致。</p>
      <div className="language-source-colors" aria-label="三种已确认源色"><span><i className="language-color-knowledge" aria-hidden="true" />曜蓝 <code>#339FF2</code></span><span><i className="language-color-ai" aria-hidden="true" />智绯 <code>#E0438F</code></span><span><i className="language-color-growth" aria-hidden="true" />生长荧 <code>#C2F25B</code></span></div>
      <p>颜色沿用既有语义 Token，集中表达当前操作、选择、AI 参与和必要反馈。接受中性表面上的局部强调；拒绝为展示三源色而给三个并列区块平均铺色。</p>
      <p>曜蓝的唯一源色为 <code>#339FF2</code>。接受通过既有语义映射获得操作色和文字色；拒绝组件硬编码品牌源色，或将源色直接覆盖全部操作、文字与状态色。</p>
      <p>空间高效，是在合适的阅读距离与输入条件下，让人用更少的寻找完成理解和操作。接受删除重复标题和容器、对齐比较信息，为长文和复杂公式保留阅读空间；拒绝靠缩小必要文字、隐藏单位或挤压触控区域提高密度。</p>
      <p>清雅来自强弱关系与准确用色。接受边界与表面足以说明层级的常规容器；拒绝用厚阴影、装饰竖线、厚底和复杂材质制造完成感。</p>
    </section>

    <section className="language-record-section" aria-labelledby="language-behavior-title">
      <h3 id="language-behavior-title">一套共同的行为方式</h3>
      <div className="language-table-wrap" role="region" aria-label="阅读到返回的行为与方案判定" tabIndex={0}><table className="language-table"><thead><tr><th scope="col">时刻</th><th scope="col">表现</th><th scope="col">接受／拒绝的方案</th></tr></thead><tbody>{behaviors.map(([stage, behavior, boundary]) => <tr key={stage}><th scope="row">{stage}</th><td>{behavior}</td><td>{boundary}</td></tr>)}</tbody></table></div>
      <p>稳定的是信息关系与对象身份。接受把次要来源详情折叠、让长反馈自然增高；拒绝为了统一高度隐藏决定当前判断的范围和条件。</p>
      <p>注意力应当可以交接和归还。接受工具就近出现、关闭后回到原选区或入口；拒绝关闭辅助面后把焦点送到页面开头。</p>
      <p>鼠标、键盘和触控保持相同的动作含义。接受点击、Enter 或触控都执行同一个明确操作；拒绝某一输入方式绕过必要确认，或因偶然移动鼠标而清空键盘操作上下文。</p>
    </section>

    <section id="language-typography" className="language-record-section" aria-labelledby="language-type-title">
      <h3 id="language-type-title">文字与数学构成阅读气质</h3>
      <div className="language-table-wrap" role="region" aria-label="已确认字体分工" tabIndex={0}><table className="language-table"><thead><tr><th scope="col">用途</th><th scope="col">已选字体</th><th scope="col">设计责任</th></tr></thead><tbody>
        <tr><th scope="row">界面与短说明</th><td>Noto Sans CJK SC</td><td>接受清楚的黑体导航、控件与表格；拒绝用超细小字承载必读信息。</td></tr>
        <tr><th scope="row">较长阅读</th><td>Noto Serif CJK SC</td><td>接受宋体正文与黑体工具分工；拒绝为了塞入一屏压缩长文行距。</td></tr>
        <tr><th scope="row">数学公式</th><td>STIX Two Math</td><td>接受完整、可选择的数学表达；拒绝用正文行高裁切分式、根式与上下标。</td></tr>
      </tbody></table></div>
      <p>中文与数学按实际字形、标点和断行习惯组织。接受短式随文、复杂推导独立排版，并按视觉大小与黑度协调；拒绝机械照搬日文断行习惯或把不同字体的相同 CSS 字号当作视觉等大。</p>
      <p>字体分工已确认，生产交付尚未完成。当前中文候选仅包含固定样本和 400 字重；STIX Two Math 配合原生 MathML 仍是候选实现。生产回填必须明确字符覆盖与分片、真实字重、回退策略、数学渲染路径及跨系统结果，不能把样张通过当作产品完成。</p>
      <p>接受覆盖真实业务输入、可核对实际字体与渲染路径的交付；拒绝固定样本子集冒充完整字库、合成粗体冒充已交付字重，或只凭一个浏览器画面声称跨系统一致。具体要求集中在<Link href="/foundations/typography#typography-production">字体与数学的生产交付条件</Link>。</p>
      <div className="language-inline-links"><Link href="/review/typography">字体与数学对照 →</Link><Link href="/foundations/typography">当前字体规范与实现 →</Link></div>
    </section>

    <section className="language-record-section" aria-labelledby="language-components-title">
      <h3 id="language-components-title">组件承担不同职责，使用同一种语言</h3>
      <dl className="language-role-list">{componentRoles.map(([name, role]) => <div key={name}><dt>{name}</dt><dd>{role}</dd></div>)}</dl>
      <p>共同准则用于后续实现与评审，已收口的 Button、Tabs 和 Segmented Control 不因此重新展开设计。Text Fields 的借鉴方向已明确，具体样式与空间比例仍需在中文场景中验证。</p>
    </section>

    <section className="language-record-section" aria-labelledby="language-motion-ai-title">
      <h3 id="language-motion-ai-title">动效表达关系，AI 表达责任</h3>
      <p>动效说明对象、范围与结果的关系。接受可中断的局部展开，内容立即响应，Reduced Motion 下仍保留文字与边界；拒绝等动画播完才接受输入，或每次切换都重放整页入场。</p>
      <dl className="language-role-list">
        <div><dt>来源</dt><dd>接受 AI 初稿在人工修正后仍可追溯，并明确人工修改；拒绝编辑后抹掉来源关系，或只用光效表示 AI 参与。</dd></div>
        <div><dt>质量与限制</dt><dd>接受结论旁说明适用范围、证据不足或模型分歧；拒绝用高置信度表示“事实正确”，也不把 AI 来源自动等同于错误。</dd></div>
        <div><dt>处理状态</dt><dd>接受“待复核”“人工已确认”等准确文案；拒绝人工点击确认后显示“系统已证明正确”。</dd></div>
      </dl>
      <p>关键状态至少有两种可读信号。接受“待复核”文字配合状态图标，或选中边界配合标记；拒绝只把一段字变红或把整个对象染色。</p>
    </section>

    <section id="language-visualization" className="language-record-section" aria-labelledby="language-visualization-title">
      <h3 id="language-visualization-title">让数据可以比较，让关系可以解释</h3>
      <p>数据可视化帮助判断多少、相差多少、怎样变化与判断有多确定；信息可视化帮助理解属于哪里、如何关联、先后怎样与依据来自哪里。两者围绕同一对象和判断任务衔接。</p>
      <dl className="language-role-list">
        <div><dt>比较有尺度</dt><dd>单位、时间、范围与基线贴近结果。接受百分比同时说明分母和周期；拒绝比较不同范围的数据却隐藏口径差异。</dd></div>
        <div><dt>形态有含义</dt><dd>形态服务比较、趋势、层级或关联。接受趋势按时间排列、连线说明关系类型并通向证据；拒绝把共现画成因果，或用无含义的距离与面积装饰关系。</dd></div>
        <div><dt>编码有分工</dt><dd>品牌、类别、数值与偏离各有编码职责。接受数值色阶配合刻度，预测配合明确标注；拒绝让三源色循环充当连续数值色阶，或把缺失数据画成零。具体色阶仍需应用验证。</dd></div>
        <div><dt>探索可接续</dt><dd>中文、公式、参数与图形相互解释。接受从图表进入明细后保留对象、周期和选择；拒绝返回后重置范围，或必须看完叙事动画才能查看数据。</dd></div>
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
