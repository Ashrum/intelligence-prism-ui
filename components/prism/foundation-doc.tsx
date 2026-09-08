import {
  Accessibility,
  ArrowRight,
  BookOpenText,
  CircleHelp,
  FileCheck2,
  Languages,
  MousePointerClick,
  Sparkles,
} from "lucide-react"

import { AILabel, StateLabel } from "@/components/ui/badge"
import { foundationItems } from "@/components/prism/catalog"
import { ColorContrastLab } from "@/components/prism/control-examples"

export type FoundationSlug = (typeof foundationItems)[number]["slug"]

type FoundationReference = {
  label: string
  value: string
  use: string
}

type FoundationDocData = {
  title: string
  description: string
  principles: readonly string[]
  references: readonly FoundationReference[]
  boundary: string
}

const typographyProduction = [
  {
    item: "字符覆盖与加载",
    accept: "锁定字体版本、来源和许可；覆盖产品界面、导入题目、姓名及动态输入所需字符。Web 字库可按字符分片，unicode-range 与实际字形覆盖一致，首屏按需载入；完整覆盖不等于首次下载整套 CJK。",
    reject: "固定演示样本冒充产品字库；只覆盖构建时页面文字，新增输入就缺字；声明了范围却没有对应字形。",
    source: { label: "CSS Fonts：字符范围", href: "https://www.w3.org/TR/css-fonts-4/#unicode-range-desc" },
  },
  {
    item: "真实字重",
    accept: "把每个角色使用的 CSS 字重映射到实际静态文件，或可变字体的有效 wght 范围；明确禁止合成粗体／斜体，核对实际命中的字体和字重。Noto Sans 与 Serif 的静态字重档位分别确认。",
    reject: "只有 400 文件却宣称已交付 500／600；把静态字体声明成连续可变范围；仅看到 computed font-weight 就认定字重真实。",
    source: { label: "Noto CJK：字体资源", href: "https://github.com/notofonts/noto-cjk" },
  },
  {
    item: "回退与载入失败",
    accept: "分别明确 UI、长文、公式内中文与数学符号的回退；注明何时允许系统字体，并用目标系统实测。冷缓存、字体失败和未覆盖字符时，文字仍可读、可输入、可复制，载入后不遮挡当前内容或操作。",
    reject: "未说明的系统字体替代；长期空白、方框缺字或符号丢失；把数学符号无条件交给普通正文后备字体。",
    source: { label: "CSS Fonts：匹配与回退", href: "https://www.w3.org/TR/css-fonts-4/#font-matching-algorithm" },
  },
  {
    item: "数学渲染路径",
    accept: "把输入格式、渲染器版本、输出模式和数学字体作为一组确定，并明确不支持表达式的处理。原生 MathML + STIX 是当前候选；若采用 MathJax，应使用相应 STIX2 字体支持并重新核对。保留语义与复制路径。",
    reject: "把 STIX 字体等同于渲染器；给 KaTeX 或 MathJax 的输出只改 font-family 就宣称等价；静默省略无法渲染的公式或符号。",
    source: { label: "MathJax：输出字体支持", href: "https://docs.mathjax.org/en/latest/output/fonts.html" },
  },
  {
    item: "跨系统结果",
    accept: "先在 Windows Edge、macOS Safari 与桌面 Firefox 复核；移动端交付再覆盖 Android Chrome、iOS Safari，并记录实际版本。用同一组中文、公式与输入内容检查字体命中、行高、断行、200% 缩放、复制和辅助技术的读序。允许不影响阅读的抗锯齿差异。",
    reject: "只凭单端截图或构建通过宣称一致；出现缺字、公式裁切、上下标关系错误、正文与公式重叠，或键盘编辑时焦点与文本丢失。",
  },
]

const docs: Record<FoundationSlug, FoundationDocData> = {
  "tokens-theming": {
    title: "设计令牌与主题",
    description: "用语义 Token 连接品牌源色与真实界面，组件不直接消费品牌色值。",
    principles: ["中性表面以 85% 以上为常规版面的设计目标；源色只定义身份，不直接决定文字或交互颜色。", "Button 以曜蓝表示主操作、智绯表示 AI 操作，中性表面承接次操作，危险色只用于破坏性动作。", "组件使用 action、surface、text、border、status 等语义 Token。", "主题变化只替换 Token 映射，不改变组件结构和交互语义。"],
    references: [
      { label: "Source / Knowledge", value: "#339FF2", use: "品牌源色；操作、文字与状态继续使用各自的语义 Token。" },
      { label: "Source / AI", value: "#E0438F", use: "品牌源色；映射到 AI 行为与来源语义。" },
      { label: "Source / Growth", value: "#C2F25B", use: "预留给有明确目标、周期与证据支持的成长或达成提示；不用于常规进度、处理完成或浅色底正文。具体反馈待场景验证。" },
      { label: "Action / Primary", value: "#064B7E", use: "主要操作、选中状态和关键链接。" },
      { label: "Field / Border", value: "#686C65", use: "可填写区域的默认边界；--input 使用此映射，普通内容容器继续使用较轻边界。" },
      { label: "AI / Action", value: "#872056", use: "明确的 AI 操作，不用于普通强调。" },
      { label: "AI / Source · Review", value: "分开表达", use: "智绯说明 AI 来源与明确的 AI 行为；生成进度、人工复核、失败另用状态与文字。人工编辑后来源保留，不默认显示模型名称、置信度或已验证。" },
      { label: "Growth / Evidence", value: "目标 · 周期 · 证据", use: "掌握度需说明评价范围与依据，不把完成练习等同于已完全掌握。置信度只在有真实数据、计算口径与适用说明时显示；缺少数据时不填入默认百分比。" },
      { label: "Button / Secondary", value: "Surface / Neutral", use: "次操作使用中性表面，不与主操作争夺曜蓝层级。" },
      { label: "Button / Destructive", value: "#872725", use: "只用于删除等不可逆或高风险动作。" },
    ],
    boundary: "当前版本冻结浅色主题映射；深色主题在完成全部核心组件后单独评审。",
  },
  color: {
    title: "色彩",
    description: "在页面背景、内容表面和交互底色上保持清晰阅读，三种核心色通过语义映射表达用途。",
    principles: ["阅读与可操作文字以 7:1 为对比目标，正文、辅助信息、标签、占位文字和操作文案按真实背景校验。", "主要操作、AI 行为与状态文字使用加深后的语义色；品牌源色继续保留身份。", "可编辑输入、选择和焦点的必要识别边界至少达到 3:1；只读、禁用和普通内容容器使用较轻边界。", "层级依靠字号、字重、间距和位置；不通过文字透明度来表示精致。"],
    references: [
      { label: "Canvas", value: "#F5F5F3", use: "近白中性的页面背景。" },
      { label: "Surface", value: "#FFFFFF", use: "卡片、浮层和主要内容表面。" },
      { label: "Surface / Quiet", value: "#F7F7F5", use: "只读／禁用字段与 Segmented Control 未选中区域的浅灰白填充；具体模式仍由文字、边界与行为说明。" },
      { label: "Text / Primary", value: "#20231F", use: "标题与正文主信息。" },
      { label: "Text / Secondary", value: "#3B4039", use: "辅助说明与次级信息；在交互底色上仍保持文字清晰。" },
      { label: "Text / Tertiary", value: "#444940", use: "元信息和占位文字；在最深的中性交互底色上仍达到 7:1。" },
      { label: "Action / Primary", value: "#064B7E", use: "链接、操作文字与主按钮背景；链接仅用颜色区分，不使用下划线。" },
      { label: "AI / Action · Text", value: "#872056 / #751C4A", use: "AI 按钮与浅色 AI 表面上的文字。" },
      { label: "Status / Success · Warning · Danger", value: "#215631 / #684511 / #872725", use: "分别与成功、警告、错误表面成对使用。" },
      { label: "Field / Border", value: "#686C65", use: "可填写区域的常显边界；只读与禁用字段使用较轻实线和接近背景的浅灰白填充，只读聚焦时只强化原边框。" },
      { label: "Selection / Border", value: "#51758E", use: "选中对象和局部选中面的边界。" },
      { label: "Disabled / Background · Text · Border", value: "#F0F0ED / #62675D / #D5D6D1", use: "按钮等控件的禁用配色；TextField 填充使用 Surface / Quiet，边界使用 Border / Subtle，保留不可用说明与可读灰字。" },
      { label: "Border / Subtle", value: "#E3E4DE", use: "禁用字段的轻边界；填充使用 #F7F7F5，文字使用 #62675D。" },
      { label: "Border / Default", value: "#D5D6D1", use: "普通内容容器、只读字段与分隔线；可编辑输入和选择使用独立的边界 Token。" },
    ],
    boundary: "7:1 是当前浅色主题的阅读与可操作文字对比目标；禁用文字单独保持 4.5:1 以上，不等同于全站 AAA 验收。按相邻背景和透明度合成后的颜色检查；成功、警告、失败和 AI 来源仍同时提供文字。",
  },
  typography: {
    title: "字体与排版",
    description: "优先保证中文教育内容的阅读效率，并让英文组件名保持清晰。",
    principles: ["现有通用界面采用 14–16px，必要辅助说明使用 12px；长文与数学阅读按内容单独验证字号。", "标题依靠字号、字重和间距建立层级，不依赖彩色装饰。", "计分、指标、时间与数字列使用 tabular-nums；数学公式保留数学字体与渲染器度量。", "含行内公式的段落采用无单位阅读行距，让公式实际高度参与行盒计算；不固定段落高度，不裁切上下标。"],
    references: [
      { label: "UI / --font-ui", value: "Noto Sans CJK SC 2.004 / wght 100–900", use: "全站界面默认 400；已有 500、600、650、675、700、750 使用真实可变字重。中文、英文与数字由同一主字体承接。" },
      { label: "Reading / --font-reading", value: "Noto Serif CJK SC 2.003 / 400", use: "较长阅读与对应编辑区；仅提供 400，不合成粗体或斜体。普通说明、表单和导航继续使用 Sans。" },
      { label: "Math / --font-math", value: "STIX Two Math 2.13 b171 / 400", use: "原生 MathML 的数学符号与度量；公式内中文使用阅读字体。该变量提供字体，不代替渲染器。" },
      { label: "Display", value: "40–72px / 675", use: "介绍页的短标题。" },
      { label: "Page Title", value: "40px / 675", use: "组件和基础规范标题。" },
      { label: "Body", value: "14–16px / 400", use: "现有通用说明与表单；较长阅读与公式的字号按场景另行验证。" },
      { label: "Safe Line Leading", value: "unitless / natural height", use: "含行内公式时使用 2 的无单位基础行距，公式保留自然高度并沿基线排列；此值不是高度上限，也不是任意公式的安全保证。矩阵、多层分式与过高表达式转独立公式块。" },
      { label: "Numeric / Figures", value: "font-variant-numeric: tabular-nums", use: "对齐计分、指标和数字列；位数变化时按实际范围预留数字宽度。不覆盖数学字体的内部数字、上下标与运算符布局。" },
      { label: "Tabs / Segmented", value: "14px / 500", use: "选中与未选中保持相同字重；数量使用 12px。" },
      { label: "Label", value: "11–14px / 600–700", use: "分类和非关键目录标注。" },
    ],
    boundary: "不使用全大写中文、超细字重或仅靠字重区分交互状态。",
  },
  "spacing-density": {
    title: "间距与密度",
    description: "以 4px 基线组织空间，在舒适与紧凑模式之间保持结构一致。",
    principles: ["组件内部间距优先使用 4、8、12、16、24px。", "舒适模式用于默认工作台，紧凑模式用于高密度数据任务。", "密度变化只收紧高度和间距，不隐藏必要说明。"],
    references: [
      { label: "Base Unit", value: "4px", use: "全部间距的最小基线。" },
      { label: "Button / Comfortable", value: "36px / 14px", use: "默认按钮高度与文字尺寸。" },
      { label: "Button / Compact", value: "32px / 14px", use: "高密度数据和工具栏；不缩小按钮文字。" },
      { label: "Tabs / Segmented", value: "36px / 32px", use: "舒适／紧凑高度；主文字保持 14px，数量 12px。" },
      { label: "Page Tabs Gap", value: "24px / 16px", use: "舒适／紧凑间距；窄容器独立滚动，不压缩长标签。" },
      { label: "Section Gap", value: "24px", use: "基准页主要内容区间距。" },
      { label: "Section Padding", value: "24px", use: "卡片与基准区块内边距。" },
    ],
    boundary: "紧凑模式不等于缩小全部文字，也不能压缩触控任务所需的操作空间。",
  },
  "layout-breakpoints": {
    title: "布局与断点",
    description: "根据任务复杂度调整列数与导航方式，而不是简单按设备名称切换。",
    principles: ["内容宽度受控，避免超宽屏上出现过长阅读行。", "复杂两栏结构先降为单栏，再调整局部密度。", "移动端保留完整信息层级，导航允许自然换行。"],
    references: [
      { label: "Documentation", value: "max 1440px", use: "侧栏与文档内容的整体宽度。" },
      { label: "Narrative", value: "max 1280px", use: "介绍页与叙事内容。" },
      { label: "Wide Breakpoint", value: "1088px", use: "复杂网格降列。" },
      { label: "Tablet Breakpoint", value: "768px", use: "侧栏转为顶部导航、内容单列。" },
      { label: "Small Breakpoint", value: "512px", use: "操作区和次级网格完全纵向。" },
    ],
    boundary: "断点服务内容，不根据特定品牌设备硬编码。",
  },
  "shape-elevation": {
    title: "形状与层级",
    description: "使用有限圆角、清晰边框和表面差异建立克制的界面层级。",
    principles: ["小控件使用 6–8px 圆角，容器使用 8–12px。", "常规卡片默认无阴影，优先依赖边框与背景。", "浮层可以使用轻阴影，但不把阴影作为唯一边界。"],
    references: [
      { label: "Radius / Small", value: "6px", use: "标签、导航项和小型按钮。" },
      { label: "Radius / Medium", value: "8px", use: "按钮、输入与一般卡片。" },
      { label: "Radius / Large", value: "12px", use: "较大区块与预览容器。" },
      { label: "Border", value: "1px", use: "常规组件和容器边界。" },
      { label: "Card Shadow", value: "none", use: "默认卡片不使用阴影。" },
      { label: "Tabs / Segmented Surface", value: "8px / 6px / 3px", use: "外圆角／选中面圆角／内边距；浅中性底与白色选中面，无阴影。" },
    ],
    boundary: "不使用大面积玻璃拟态、彩色阴影或过度圆润的胶囊化容器。",
  },
  iconography: {
    title: "图标",
    description: "线性图标承担识别和方向提示，文字继续承担完整含义。",
    principles: ["统一使用 Lucide 风格线性图标；Card 的标题图标、资源与班级标识使用无底色的中性前景。", "常规尺寸以 16px 为主，状态和辅助图标可使用 12–14px。", "纯图标按钮必须提供可访问名称。"],
    references: [
      { label: "Inline", value: "16px", use: "按钮、导航和列表项。" },
      { label: "Status", value: "12–14px", use: "状态、标签与辅助提示。" },
      { label: "Feature", value: "18–20px", use: "原则卡片和功能分组。" },
      { label: "Stroke", value: "currentColor", use: "继承所在语义的文字颜色。" },
    ],
    boundary: "不混用填充图标、表情符号和多套线宽，也不让装饰图标抢占信息层级。",
  },
  motion: {
    title: "动效",
    description: "动效用于确认状态变化和空间关系，保持短促、可中断和可关闭。",
    principles: ["Button Hover 使用约 120ms 的颜色或边框过渡，Pressed 缩短至约 80ms。", "按压只改变颜色或边框，不增加位移、厚底或阴影。", "Loading 的处理指示不改变原变体；系统 Reduced Motion 开启时停止旋转并移除非必要过渡。"],
    references: [
      { label: "Button / Hover", value: "120ms", use: "按钮背景、前景与边框反馈。" },
      { label: "Button / Pressed", value: "80ms", use: "仅缩短颜色或边框反馈，不改变几何位置。" },
      { label: "Tabs / Segmented Indicator", value: "180ms", use: "仅移动下划线或选中面；文字与内容面板不跟随移动，交互状态即时生效。" },
      { label: "Easing", value: "cubic-bezier(.2,.8,.2,1)", use: "短距离界面反馈。" },
      { label: "Reduced Motion", value: "none", use: "操作系统要求减少动效时停止 Button 过渡、处理指示旋转及 Tabs／Segmented 指示器移动。" },
    ],
    boundary: "不使用循环发光、无意义漂浮或阻碍操作的长动画。",
  },
  accessibility: {
    title: "无障碍",
    description: "无障碍是组件完成条件，不作为上线前的补充检查。",
    principles: ["全部交互组件支持键盘，并保留清晰焦点。", "Button Loading 保持当前焦点并真正阻止激活；显式 Disabled 继续使用原生禁用。", "状态、错误和 AI 来源同时提供可读文字；等待文案缺失或空白时保留原可见内容与名称。", "语义元素优先，ARIA 只补充原生语义无法覆盖的部分。"],
    references: [
      { label: "Button / Focus Ring", value: "2px / 2px offset", use: "键盘焦点使用 #087BA8，并在 Loading 期间保持可见。" },
      { label: "Button / Loading", value: "aria-busy + blocked", use: "保留变体与焦点，同时阻止鼠标和键盘重复激活。" },
      { label: "Tabs / Keyboard", value: "manual / automatic", use: "手动激活时方向键仅移动焦点，Enter／Space 才切换；自动激活适用于即时可用的内容。" },
      { label: "Segmented / Keyboard", value: "radio / immediate", use: "方向键移动即选中；禁用项跳过，不创建 TabPanel。两类控件均保留 2px 焦点与 2px 间隔。" },
      { label: "Skip Link", value: "全站", use: "跳过重复导航并进入主要内容。" },
      { label: "Forced Colors", value: "支持", use: "高对比模式保留边界与状态。" },
      { label: "State Text", value: "必须", use: "不能只依赖颜色和图形表达。" },
      { label: "Reduced Motion", value: "支持", use: "遵循操作系统偏好。" },
    ],
    boundary: "单个示例通过检查不代表系统完成；每个新增组件仍需独立验证键盘和语义。",
  },
  "localization-direction": {
    title: "本地化与文字方向",
    description: "当前以简体中文教育界面为基线，同时避免阻断未来多语言适配。",
    principles: ["文档语言为 zh-CN，组件名称保留通用英文。", "布局使用逻辑方向属性，减少 left/right 硬编码。", "日期、数字和长文本必须在真实语言内容下验证。"],
    references: [
      { label: "Primary Locale", value: "zh-CN", use: "当前文档、示例和业务语言。" },
      { label: "Component Names", value: "English", use: "与 shadcn 和工程命名保持一致。" },
      { label: "Numeric Alignment", value: "tabular-nums", use: "指标、时间和状态更新。" },
      { label: "Direction", value: "LTR baseline", use: "当前稳定基线；RTL 尚未宣称完成。" },
    ],
    boundary: "RTL 属于后续验证范围；当前页面不得把未验证能力标记为稳定。",
  },
}

export function FoundationDoc({ slug }: { slug: FoundationSlug }) {
  const doc = docs[slug]

  return (
    <article className="component-article foundation-article">
      <header className="component-hero">
        <div className="component-eyebrow">Foundations</div>
        <div className="component-title-row">
          <h1>{doc.title}</h1>
          <StateLabel tone={slug === "typography" || slug === "motion" ? "pending" : "completed"}>{slug === "typography" ? "基础层已接入 · 跨端待反馈" : slug === "motion" ? "基础动效已接入 · AI 场景待验证" : "基线已建立"}</StateLabel>
        </div>
        <p>{doc.description}</p>
        {slug === "typography" && <p>全站已接入共用字体基础层：Noto Sans CJK SC 用于界面，Noto Serif CJK SC 用于较长阅读，STIX Two Math 用于公式。字号与组件交互沿用现有参数；跨系统结果按本页的<a href="#typography-production" className="text-primary no-underline">生产交付条件</a>记录。</p>}
      </header>

      <section className="doc-section" aria-labelledby="foundation-preview-title">
        <div className="doc-section-heading">
          <h2 id="foundation-preview-title">Reference</h2>
          <p>{slug === "typography" ? "当前全站样式参考，不代表新字体已完成生产验收。" : slug === "color" ? "同一内容置于页面背景、内容表面与交互底色中对照。" : "当前实现中使用的视觉与交互基线。"}</p>
        </div>
        <FoundationPreview slug={slug} />
      </section>

      <section className="doc-section doc-notes-grid" aria-label="基础原则">
        {doc.principles.map((principle, index) => (
          <div className="doc-note" key={principle}>
            <span className="principle-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <p>{principle}</p>
          </div>
        ))}
      </section>

      <section className="doc-section" aria-labelledby="foundation-table-title">
        <div className="doc-section-heading">
          <h2 id="foundation-table-title">Specification</h2>
          <p>用于设计、实现和评审的共同参考。</p>
        </div>
        <div className="foundation-table-wrap" role="region" aria-label={`${doc.title}规范表`} tabIndex={0}>
          <table className="foundation-table">
            <thead><tr><th scope="col">项目</th><th scope="col">基线</th><th scope="col">使用方式</th></tr></thead>
            <tbody>{doc.references.map((reference) => <tr key={reference.label}><th scope="row">{reference.label}</th><td><code>{reference.value}</code></td><td>{reference.use}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      {slug === "color" && <section className="doc-section" aria-labelledby="color-pairing-title">
        <div className="doc-section-heading"><h2 id="color-pairing-title">前景、背景与必要边界</h2><p>源色用于品牌识别，界面使用成对的语义 Token。中性表面承托阅读，颜色只说明明确用途。</p></div>
        <p>AI 标签使用深阶前景 #751C4A 与浅色背景 #FDF0F6，计算对比度约 9.39:1。浅色填充或装饰边框可以较轻；承担输入、选择与状态识别的必要边界仍需满足相邻色 3:1。10%–15% 透明度不能自动保障对比度，应计算合成后的颜色。</p>
        <p>普通文字的 AA 门槛为 4.5:1；本站阅读与操作文字继续以 7:1 为目标。禁用组件在 WCAG 中有例外，本站仍保留可读文字。配对检查依据 <a href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html" target="_blank" rel="noreferrer">WCAG 文字对比度</a> 与 <a href="https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html" target="_blank" rel="noreferrer">非文字对比度</a>，不据此宣称全站符合性。</p>
        <div className="doc-section-heading"><h3>对比度实验区</h3><p>先比较图1方向的真实组件，再检查单个浅／深色配对。主文字、辅助信息与按钮使用相同内容；候选仍待评审。</p></div>
        <ColorContrastLab />
      </section>}

      {slug === "motion" && <section className="doc-section" aria-labelledby="ai-motion-title">
        <div className="doc-section-heading"><h2 id="ai-motion-title">AI 动态排版与自适应滚动</h2><p>以下为待场景验证的实现约束；AI 对话组件尚未交付。</p></div>
        <div className="foundation-table-wrap" role="region" aria-label="AI 动态排版规则" tabIndex={0}><table className="foundation-table">
          <thead><tr><th scope="col">场景</th><th scope="col">规则</th></tr></thead>
          <tbody>
            <tr><th scope="row">流式追加</th><td>内容随正常布局增长，合并频繁更新；不对每次追加重新启动高度动画。图片与其他异步内容尽量预留空间，减少布局跳动。</td></tr>
            <tr><th scope="row">末尾跟随</th><td>仅在用户保持末尾跟随时更新滚动位置；用户向上阅读立即停止跟随，提供“回到最新”。恢复跟随由用户明确操作，不能因新内容强行拉回。</td></tr>
            <tr><th scope="row">滚动锚定</th><td>优先保留浏览器锚定；应用若自行补偿，仅在相应容器协调 overflow-anchor，避免两套补偿同时改变滚动位置。原生锚定不等于自动跟随末尾。</td></tr>
            <tr><th scope="row">生成指示与播报</th><td>默认使用静态“生成中”，光标闪动不是必需；如采用，需可停止并响应减少动效。播报开始、阶段和完成，不逐字追加到 live region。</td></tr>
            <tr><th scope="row">过程展开</th><td>展示公开步骤、来源与解释摘要。按钮支持键盘、aria-expanded 与内容关联，展开和收起保持焦点；收起包含焦点的区域前把焦点移回按钮。默认即时展开，弹簧曲线留待真实场景验证。</td></tr>
            <tr><th scope="row">减少动效</th><td>取消平滑滚动、闪动与非必要尺寸过渡，内容和状态立即更新；用户停止跟随后的阅读位置继续保留。</td></tr>
          </tbody>
        </table></div>
        <p>接受条件：长文本与公式连续追加时不抢走阅读位置；用户上滚、回到最新、展开／收起、取消生成及减少动效均需分别验证。参考 <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll_anchoring/Overview" target="_blank" rel="noreferrer">滚动锚定</a>、<a href="https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/" target="_blank" rel="noreferrer">Disclosure 模式</a> 与 <a href="https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html" target="_blank" rel="noreferrer">暂停、停止、隐藏</a>。</p>
      </section>}

      {slug === "typography" && <section className="doc-section" aria-labelledby="math-leading-title">
        <div className="doc-section-heading"><h2 id="math-leading-title">公式混排的行高保护</h2><p>沿用原生 MathML 与 STIX Two Math。此处提供行内／独立公式样本；跨系统、缩放与辅助技术结果仍待记录。</p></div>
        <div className="math-leading-sample reading-prose">
          <p>若 <span className="reading-inline-math" dangerouslySetInnerHTML={{ __html: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mfrac><mi>a</mi><mi>b</mi></mfrac></math>' }} /> 表示每次练习的平均得分，需同时说明总分与作答次数。积分 <span className="reading-inline-math" dangerouslySetInnerHTML={{ __html: '<math xmlns="http://www.w3.org/1998/Math/MathML"><msubsup><mo>∫</mo><mn>0</mn><mn>1</mn></msubsup><msup><mi>x</mi><mn>2</mn></msup><mspace width="0.2em"/><mi>d</mi><mi>x</mi></math>' }} /> 与正文沿基线排列，段落高度由内容自然撑开。</p>
          <p>矩阵等较高表达式另起一块，保留前后说明：</p>
          <div className="reading-formula-block" role="region" aria-label="二行二列矩阵示例" tabIndex={0} dangerouslySetInnerHTML={{ __html: '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mi>A</mi><mo>=</mo><mrow><mo>(</mo><mtable><mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr><mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr></mtable><mo>)</mo></mrow></math>' }} />
        </div>
        <p>共用阅读区域 reading-prose 内含行内 MathML 的段落自动启用无单位行距；reading-inline-math 仅约束外层自然高度与基线，不覆盖渲染器内部定位。vertical-align: baseline 本身不是高度补偿；不使用固定负偏移强行拉齐分式，也不把 line-height: relaxed 当作有效 CSS。</p>
        <p>复杂分式、矩阵或明显打断阅读节奏的公式使用独立块，窄容器允许局部键盘滚动，不裁切公式。数字列与计分使用 tabular-nums；位数变化仍需预留宽度。数学字体保留自身数字与运算符度量。参考 <a href="https://www.w3.org/TR/mathml-core/" target="_blank" rel="noreferrer">MathML Core</a>、<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-height" target="_blank" rel="noreferrer">line-height</a> 与 <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric" target="_blank" rel="noreferrer">font-variant-numeric</a>。</p>
      </section>}

      {slug === "typography" && <section id="typography-production" className="doc-section" aria-labelledby="typography-production-title">
        <div className="doc-section-heading">
          <h2 id="typography-production-title">字体与数学的生产交付条件</h2>
          <p>以下是设计与工程的共同接受标准，实现进度与跨系统结果按下表分别记录。</p>
        </div>
        <p>全站基础层现已自托管完整源字符集合的分片：Noto Sans CJK SC 2.004 为 44,810 个字符，界面沿用真实可变字重；Noto Serif CJK SC 2.003 为 44,777 个字符、400 字重。两套字体各保留源字体的 25 个 Unicode 变体序列。完整源集合不等于覆盖全部 Unicode 或通过 GB 18030；源字体外字符仍需后备字体。原字体对照页的样本子集保持独立。</p>
        <p>完整字体声明由根布局统一载入，界面、阅读、数学使用共用字体变量；常用分片覆盖现有页面与组件文案，其他字符继续按需加载。阅读复核中的公式沿用完整 STIX Two Math 2.13 b171 与原生 MathML；公式内中文单独使用阅读字体，加载失败时保留公式文字表达和编辑能力。字体、来源、许可及分片校验记录见<a href="/fonts/typography-review/SOURCES.md" className="text-primary no-underline">现有字体来源记录</a>。</p>
        <div className="foundation-table-wrap" role="region" aria-label="字体生产验收进度" tabIndex={0}>
          <table className="foundation-table">
            <thead><tr><th scope="col">验收范围</th><th scope="col">当前结果 · 2026-09-07</th></tr></thead>
            <tbody>
              <tr><th scope="row">字体文件</th><td>24 个分片的实际字符表、变体序列、哈希及字重通过独立校验。变体字形与源字体一致；Sans 400／500 为真实可变字重。STIX 保留 MATH 表。</td></tr>
              <tr><th scope="row">云端 Chrome</th><td>版本 25 的桌面基础排版、长证据公式、编辑与文本复制通过。真实中文字体失败时可回退、编辑、复制；STIX 失败时保留公式文字表达。本次基础层回填的云端浏览器未能访问预览，新增视觉检查待完成。</td></tr>
              <tr><th scope="row">Windows Edge／macOS Safari／桌面 Firefox</th><td>由用户手动测试，待反馈实际版本与结果；继续推进字体基础层回填，不预记为通过。</td></tr>
              <tr><th scope="row">Android Chrome／iOS Safari</th><td>由用户手动测试，待移动端结果；未用桌面画面代替真机结果。</td></tr>
              <tr><th scope="row">仍待完成</th><td>实际字体命中、目标系统版本记录、窄视口、200% 原生缩放、冷缓存与慢网测量、公式复制语义及辅助技术读序。跨系统生产验收尚未完成。</td></tr>
            </tbody>
          </table>
        </div>
        <div className="foundation-table-wrap" role="region" aria-label="字体生产方案的接受与拒绝条件" tabIndex={0}>
          <table className="foundation-table">
            <thead><tr><th scope="col">交付项</th><th scope="col">接受条件</th><th scope="col">拒绝方案</th></tr></thead>
            <tbody>{typographyProduction.map((rule) => <tr key={rule.item}>
              <th scope="row">{rule.item}</th><td>{rule.accept}{rule.source && <> <a href={rule.source.href} target="_blank" rel="noreferrer" className="text-primary no-underline">{rule.source.label}</a></>}</td><td>{rule.reject}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <p>最小内容样本复用现有候选并补入：生僻姓名、简体中文标点与中英数字混排；行内／独立公式、嵌套分式、根式、上下标、积分、求和、伸缩括号、矩阵和公式内中文。读、改、保存与复制使用同一份内容；公式加载失败须明确提示并保留可恢复的源内容。</p>
        <p>STIX Two Math 提供数学字形和排版度量；原生 MathML 的布局仍由浏览器实现，两者要一起验证。参考 <a href="https://www.w3.org/TR/mathml-core/" target="_blank" rel="noreferrer" className="text-primary no-underline">MathML Core</a>。本页的平台范围与接受条件是智能曜彩的交付要求，不宣称 W3C 指定了字体名单或已经完成标准符合性认证。</p>
      </section>}

      <aside className="foundation-boundary" aria-label="当前边界"><CircleHelp aria-hidden="true" /><div><strong>当前边界</strong><p>{doc.boundary}</p></div></aside>
    </article>
  )
}

function FoundationPreview({ slug }: { slug: FoundationSlug }) {
  if (slug === "tokens-theming") {
    return <div className="foundation-preview color-foundation"><div className="color-chip color-chip--knowledge"><span /><strong>曜蓝</strong><small>#339FF2</small></div><div className="color-chip color-chip--ai"><span /><strong>智绯</strong><small>#E0438F</small></div><div className="color-chip color-chip--growth"><span /><strong>生长荧</strong><small>#C2F25B</small></div><ArrowRight aria-hidden="true" /><div className="semantic-color-stack"><span>Action</span><span>AI</span><span>Status</span></div></div>
  }

  if (slug === "color") {
    return <div className="foundation-preview color-background-grid">
      {[["canvas", "页面背景"], ["surface", "内容表面"], ["active", "交互底色"]].map(([mode, label]) => <section key={mode} className={`color-reading-sample color-reading-sample--${mode}`}>
        <small>{label}</small><h3>本周学习记录</h3><p>课堂观察与复核记录保持清晰，辅助说明也可以直接阅读。</p><small>更新于今日 09:30</small><a href="/components/input-field">查看课堂记录 →</a>
      </section>)}
      <div className="color-status-samples" aria-label="状态颜色"><StateLabel tone="running">处理中</StateLabel><AILabel>AI 初稿</AILabel><StateLabel tone="completed">已完成</StateLabel><StateLabel tone="pending">待复核</StateLabel><StateLabel tone="danger">处理失败</StateLabel></div>
    </div>
  }

  if (slug === "typography") {
    return <div className="foundation-preview type-specimen"><span>Display · 教育智能从清晰开始</span><strong>Page title · 智能曜彩组件系统</strong><p>界面正文 · 设计系统让产品、设计与工程使用同一种界面语言。</p><p className="type-reading-sample">阅读正文 · 从原文证据回到当前结论，保留成立条件，让每一次判断都有可追溯的依据。</p><small>Label · EDUCATION EVIDENCE / 教育证据</small></div>
  }

  if (slug === "spacing-density") {
    return <div className="foundation-preview spacing-specimen">{[4, 8, 12, 16, 24, 32].map((size) => <div key={size}><span style={{ width: `${size * 3}px` }} /><code>{size}px</code></div>)}</div>
  }

  if (slug === "layout-breakpoints") {
    return <div className="foundation-preview layout-specimen"><div className="layout-sidebar" /><div className="layout-content"><span /><span /><span /></div></div>
  }

  if (slug === "shape-elevation") {
    return <div className="foundation-preview shape-specimen"><div className="shape-card shape-card--sm">6px</div><div className="shape-card shape-card--md">8px</div><div className="shape-card shape-card--lg">12px</div></div>
  }

  if (slug === "iconography") {
    return <div className="foundation-preview icon-specimen"><MousePointerClick aria-label="操作" /><FileCheck2 aria-label="证据" /><Sparkles aria-label="AI" /><BookOpenText aria-label="学习" /></div>
  }

  if (slug === "motion") {
    return <div className="foundation-preview motion-specimen"><span><i />Hover · 120ms</span><span><i />Indicator · 180ms</span><span><i />Reduced · none</span></div>
  }

  if (slug === "accessibility") {
    return <div className="foundation-preview accessibility-specimen"><button type="button" className="a11y-focus-demo"><Accessibility aria-hidden="true" />可见焦点</button><StateLabel tone="success">校验通过</StateLabel><p>状态同时使用颜色、文字与语义。</p></div>
  }

  return <div className="foundation-preview locale-specimen"><Languages aria-hidden="true" /><div><strong>九年级数学 · 教育证据</strong><span>2026年8月29日 · 1,280 份记录</span><small>zh-CN · LTR baseline</small></div></div>
}
