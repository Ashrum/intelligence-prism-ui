import type { LucideIcon } from "lucide-react"
import {
  Accessibility,
  ArrowLeftRight,
  BadgeCheck,
  Box,
  CreditCard,
  Languages,
  Layers3,
  LayoutGrid,
  MousePointerClick,
  Move,
  Palette,
  PanelTop,
  Ruler,
  Shapes,
  ShieldCheck,
  Sparkles,
  TextCursorInput,
  Type,
} from "lucide-react"

export type CatalogStatus = "stable" | "review" | "planned"
export type CatalogKind = "base" | "extension"

export type FoundationItem = {
  slug: string
  href: string
  label: string
  title: string
  summary: string
  icon: LucideIcon
}

export type CatalogItem = {
  id: string
  label: string
  status: CatalogStatus
  kind: CatalogKind
  href?: string
}

export type CatalogGroup = {
  slug: string
  label: string
  description: string
  icon: LucideIcon
  items: readonly CatalogItem[]
}

export const foundationItems = [
  { slug: "tokens-theming", href: "/foundations/tokens-theming", label: "Tokens & Theming", title: "设计令牌与主题", summary: "从三种源色到语义 Token 的稳定映射。", icon: Layers3 },
  { slug: "color", href: "/foundations/color", label: "Color", title: "色彩", summary: "文字对背景以 7:1 为目标，曜蓝、智绯与生长荧保持语义。", icon: Palette },
  { slug: "typography", href: "/foundations/typography", label: "Typography", title: "字体与排版", summary: "面向中文教育界面的清晰层级与紧凑阅读节奏。", icon: Type },
  { slug: "spacing-density", href: "/foundations/spacing-density", label: "Spacing & Density", title: "间距与密度", summary: "舒适与紧凑两种密度共享同一语义结构。", icon: Ruler },
  { slug: "layout-breakpoints", href: "/foundations/layout-breakpoints", label: "Layout & Breakpoints", title: "布局与断点", summary: "围绕工作台、文档与移动端建立稳定响应规则。", icon: LayoutGrid },
  { slug: "shape-elevation", href: "/foundations/shape-elevation", label: "Shape & Elevation", title: "形状与层级", summary: "以边框、表面和有限圆角表达层级，默认不依赖阴影。", icon: Shapes },
  { slug: "iconography", href: "/foundations/iconography", label: "Iconography", title: "图标", summary: "统一使用线性图标，并确保图标不替代必要文字。", icon: Box },
  { slug: "motion", href: "/foundations/motion", label: "Motion", title: "动效", summary: "短促、可中断，并尊重 Reduced Motion。", icon: Move },
  { slug: "accessibility", href: "/foundations/accessibility", label: "Accessibility", title: "无障碍", summary: "键盘、焦点、语义和状态表达从基础层开始。", icon: Accessibility },
  { slug: "localization-direction", href: "/foundations/localization-direction", label: "Localization & Direction", title: "本地化与文字方向", summary: "中文优先，同时为多语言和方向适配保留边界。", icon: Languages },
] as const satisfies readonly FoundationItem[]

const stable = (id: string, label: string, href: string): CatalogItem => ({ id, label, href, status: "stable", kind: "base" })
const review = (id: string, label: string, href: string): CatalogItem => ({ id, label, href, status: "review", kind: "base" })
const planned = (id: string, label: string): CatalogItem => ({ id, label, status: "planned", kind: "base" })
const extension = (id: string, label: string, href: string): CatalogItem => ({ id, label, href, status: "stable", kind: "extension" })

export const componentGroups = [
  {
    slug: "actions-commands",
    label: "操作与命令",
    description: "触发操作、切换模式和调起命令。",
    icon: MousePointerClick,
    items: [
      stable("button", "Button", "/components/button"),
      planned("button-group", "Button Group"),
      planned("toggle", "Toggle"),
      planned("toggle-group", "Toggle Group"),
      planned("command", "Command"),
    ],
  },
  {
    slug: "forms-selection",
    label: "表单与选择",
    description: "输入、验证和受约束选择。",
    icon: TextCursorInput,
    items: [
      stable("field", "Field", "/components/input-field"),
      stable("input", "Input", "/components/input-field"),
      planned("input-group", "Input Group"),
      planned("textarea", "Textarea"),
      review("checkbox", "Checkbox", "/components/choice-controls#checkbox"),
      review("radio-group", "Radio Group", "/components/choice-controls#radio-group"),
      review("switch", "Switch", "/components/choice-controls#switch"),
      planned("slider", "Slider"),
      stable("select", "Select", "/components/select"),
      planned("native-select", "Native Select"),
      planned("combobox", "Combobox"),
      planned("input-otp", "Input OTP"),
      planned("calendar", "Calendar"),
    ],
  },
  {
    slug: "navigation",
    label: "导航",
    description: "在页面、区域和数据集合之间移动。",
    icon: PanelTop,
    items: [
      planned("breadcrumb", "Breadcrumb"),
      review("tabs", "Tabs", "/components/tabs"),
      planned("pagination", "Pagination"),
      planned("navigation-menu", "Navigation Menu"),
      planned("menubar", "Menubar"),
      planned("sidebar", "Sidebar"),
    ],
  },
  {
    slug: "data-display",
    label: "数据展示",
    description: "组织信息、指标与结构化数据。",
    icon: CreditCard,
    items: [
      planned("accordion", "Accordion"),
      planned("aspect-ratio", "Aspect Ratio"),
      planned("avatar", "Avatar"),
      stable("badge", "Badge", "/components/badge-labels"),
      review("card", "Card", "/components/card"),
      planned("carousel", "Carousel"),
      planned("chart", "Chart"),
      planned("collapsible", "Collapsible"),
      planned("item", "Item"),
      planned("kbd", "Kbd"),
      planned("table", "Table"),
    ],
  },
  {
    slug: "feedback-status",
    label: "反馈与状态",
    description: "表达结果、进度、等待与异常。",
    icon: BadgeCheck,
    items: [
      planned("alert", "Alert"),
      planned("empty", "Empty"),
      planned("progress", "Progress"),
      planned("skeleton", "Skeleton"),
      planned("spinner", "Spinner"),
      planned("sonner", "Sonner"),
    ],
  },
  {
    slug: "overlays-menus",
    label: "浮层与菜单",
    description: "承载临时任务、补充信息和上下文操作。",
    icon: Layers3,
    items: [
      stable("alert-dialog", "Alert Dialog", "/components/dialog#alert-dialog"),
      planned("context-menu", "Context Menu"),
      stable("dialog", "Dialog", "/components/dialog"),
      planned("drawer", "Drawer"),
      planned("dropdown-menu", "Dropdown Menu"),
      planned("hover-card", "Hover Card"),
      planned("popover", "Popover"),
      planned("sheet", "Sheet"),
      planned("tooltip", "Tooltip"),
    ],
  },
  {
    slug: "layout-scrolling",
    label: "布局与滚动",
    description: "建立分区、尺寸关系和内容边界。",
    icon: LayoutGrid,
    items: [
      planned("resizable", "Resizable"),
      planned("scroll-area", "Scroll Area"),
      planned("separator", "Separator"),
    ],
  },
  {
    slug: "ai-conversation",
    label: "AI 与对话",
    description: "支持附件、消息与 AI 协作场景。",
    icon: Sparkles,
    items: [
      planned("attachment", "Attachment"),
      planned("bubble", "Bubble"),
      planned("message", "Message"),
    ],
  },
  {
    slug: "prism-extensions",
    label: "智能曜彩扩展",
    description: "在通用基础组件之上建立明确的智能语义。",
    icon: ShieldCheck,
    items: [
      extension("segmented-control", "Segmented Control", "/components/segmented-control"),
      extension("state-label", "State Label", "/components/badge-labels"),
      extension("ai-label", "AI Label", "/components/badge-labels"),
    ],
  },
] as const satisfies readonly CatalogGroup[]

export const componentDocuments = {
  button: {
    itemIds: ["button"],
    eyebrow: "操作与命令",
    title: "Button",
    description: "七种操作层级共用同一实现：曜蓝承担主要操作，智绯仅用于明确的 AI 行为，中性表面承接次操作。",
    guidance: "默认高度 36px，紧凑高度 32px；一个操作区域只保留一个主要按钮，破坏性操作独立表达，导航使用 asChild 保留链接语义，文字链接仅通过操作色区分，所有状态均不使用下划线。行动名称指向具体对象，各操作的反馈独立并就近呈现；重新处理时保留上次结果，完成后再更新。",
    accessibility: "保留 2px 可见焦点；图标按钮必须提供 accessible name。Loading 保留原变体颜色并阻止重复激活，等待文案缺失或空白时继续使用原内容。",
  },
  tabs: {
    itemIds: ["tabs"],
    eyebrow: "导航",
    title: "Tabs",
    description: "在同一对象下切换相关内容面板，分为页面与局部两类样式，覆盖横向、纵向、等分与窄容器。",
    guidance: "Page Tabs 使用深灰选中文字与曜蓝 2px 移动下划线；Surface Tabs 使用浅中性底和带细边框的白色选中面。高度 36／32px，主文字 14px，数量 12px。Hover 与按下只改变局部表面；选中位置、面板状态、未应用修改分别表达，切换保留对象范围与已有内容。",
    accessibility: "保留 tab / tabpanel 语义。有等待的面板手动激活：方向键移动焦点，Enter／Space 确认；已准备好的局部内容可自动激活。禁用项跳过且原因可读，焦点与选中分离。纵向键盘随排列变化，窄容器只滚动标签条；减少动效时内容和选择仍立即更新。",
  },
  "segmented-control": {
    itemIds: ["segmented-control"],
    eyebrow: "智能曜彩扩展",
    title: "Segmented Control",
    description: "立即切换视角、显示模式或时间粒度，不创建 TabPanel。",
    guidance: "用于少量互斥选项。高度 36／32px，14px 主文字与 12px 数量；浅中性轨道、带细边框的白色选中面、10／8px 圆角，不使用阴影。长标签保持完整并局部滚动。选择立即改变结果的组织方式，保留班级、周期和同一组数据。",
    accessibility: "使用 RadioGroup 单选语义，方向键移动焦点并立即选中，禁用项不可进入；180ms 仅移动选中背景，内容不等待动画。系统减少动效时取消指示器移动。",
  },
  card: {
    itemIds: ["card"],
    eyebrow: "数据展示",
    title: "Card",
    description: "围绕同一对象组织相关内容，覆盖指标、资源、概览、任务与复杂复核；中性表面承托阅读，内容区块按任务取舍。",
    guidance: "普通 Card 为白色，指标 Card 使用浅中性底色，16px 圆角、细边框、无阴影。标题图标、资源与班级标识无底色；AI Card 使用智绯侧边与来源文字，主体保持白色。简单 Card 不强制包含状态、详情或操作区；链接和必要操作默认可识别。同一张卡片最多一条内部分隔线，展开详情时同样适用；优先用间距、对齐与字阶组织分组。选择、展开、编辑与复核使用明确控件，各对象的状态独立。加载、失败保留已有结果；长内容自然增高，不能为了对齐截断依据。",
    accessibility: "对象卡使用 article 与真实标题，整卡不进入焦点顺序。展开关联详情，选择使用 aria-pressed；编辑进入与退出保持焦点，反馈由当前对象独立播报。",
  },
  "input-field": {
    itemIds: ["input", "field"],
    eyebrow: "表单与选择",
    title: "Input / Field",
    description: "Input 接收输入值；Field 组织字段身份、约束和反馈，让输入、修正与应用保持连续。",
    guidance: "Input 保留原生输入行为；Field 关联标签、控件、说明与错误；TextField 将它们组合为已确认的浮动标签表现。可编辑字段常显实线边界；只读与禁用字段使用接近背景的浅灰白填充，以轻实线边界和只读／不可用文字说明模式。只读内容保持清晰，聚焦只加深、加粗原边框，禁用文字适度减弱。何时校验、何时应用以及保留哪些结果，由使用它的场景负责。",
    accessibility: "TextField 保持 Label、控件与反馈的关联，提供只读、禁用、错误语义和 Reduced Motion。此页的场景表单负责中文输入法确认期间的提交保护、首次错误定位与本页结果保留；应用结果仅在当前页面保留。",
  },
  select: {
    itemIds: ["select"],
    eyebrow: "表单与选择",
    title: "Select",
    description: "从一组已知选项中选择一个值。标签持续说明字段，选择与应用分开处理。",
    guidance: "白色控件、清楚的实线边界、10px 圆角，不使用阴影。基础高度 36／32px，文字 14px；长值自然增高，菜单内完整换行。选中项同时使用中性底色与勾选标记。少量互斥视角使用 Segmented Control；需要搜索或多选时另用相应组件。",
    accessibility: "标签、说明与错误关联到选择控件。Enter／Space 或方向键打开菜单，方向键移动、Enter 确认，Escape 关闭并返回控件；禁用项跳过且说明原因。应用失败时保留选择并聚焦错误字段。焦点和已选值分别表达。",
  },
  dialog: {
    itemIds: ["dialog", "alert-dialog"],
    eyebrow: "浮层与菜单",
    title: "Dialog / Alert Dialog",
    description: "Dialog 承载当前对象的简短设置；Alert Dialog 用于需要明确确认的内容清空。",
    guidance: "白色内容面、16px 圆角与细边框，以遮罩区分背景。标题说明任务，操作名称说明结果。普通关闭保留本页草稿；确认校验通过后才更新摘要。清空草稿另用 Alert Dialog，保留上次确认结果。长任务使用独立页面，窄屏允许弹窗内部滚动。",
    accessibility: "打开后焦点进入弹窗并限制在当前任务内，标题与说明关联弹窗。关闭返回打开入口；校验失败聚焦首错。Dialog 内的 Select 先响应 Escape，再次按键才关闭 Dialog。Alert Dialog 默认聚焦保留操作；清空后入口不可用时，焦点返回稳定的编辑入口。",
  },
  "choice-controls": {
    itemIds: ["checkbox", "radio-group", "switch"],
    eyebrow: "表单与选择",
    title: "Checkbox / Radio Group / Switch",
    description: "多选决定纳入哪些内容，单选确定一个值，开关立即改变当前设置。三种选择共用清晰的文字与单线焦点。",
    guidance: "复用既有选择控件，白色内容面、深灰文字、紧凑对齐；小控件使用深阶操作色，选中不为整行铺色。Checkbox 以勾选、横线分别表达全选与部分选中，全选跳过不可用项。Radio Group 只允许一个值；表单中的选择在应用后生效。Switch 以滑块位置与开关文字表达即时设置，不用于需要提交的选择或不可逆操作。禁用原因常显，不降低整行透明度。",
    accessibility: "标签可点击且与控件关联，说明就近提供。Checkbox 使用混合状态语义；Radio Group 保留方向键与单一 Tab 入口；Switch 使用二态语义与 Space 切换。空值在应用时才校验，失败保留已有结果并聚焦首错。单线焦点替换原边界；长标签完整换行，密度只压缩留白，减少动效时取消滑块移动动画。示例仅保留本页状态，未连接持久化或远端保存。",
  },
  "badge-labels": {
    itemIds: ["badge", "state-label", "ai-label"],
    eyebrow: "反馈与状态",
    title: "Badge & Labels",
    description: "区分静态元数据、运行状态和 AI 来源，避免同一种胶囊承担全部语义。",
    guidance: "Badge 用中性表面说明静态元数据，不承担链接或筛选操作。State Label 用图标与具体文字表达状态；处理完成不等于校验通过。AI Label 只表达来源，人工编辑后仍保留；复核状态独立表达。长标签完整换行，不截断条件。",
    accessibility: "标签不进入键盘焦点顺序，操作另用链接或按钮。状态图标不重复播报，完整文字说明含义；静态标签不主动播报，动态变化由所属场景的反馈区统一播报。",
  },
} as const

export type ComponentDocumentSlug = keyof typeof componentDocuments

export const catalogItems = componentGroups.flatMap((group) => group.items)
export const catalogStatuses = ["stable", "review", "planned"] as const
export const statusLabels: Record<CatalogStatus, string> = {
  stable: "稳定",
  review: "待评审",
  planned: "规划中",
}

export function countCatalogItems(items: readonly CatalogItem[]) {
  return items.reduce((counts, item) => {
    counts[item.status] += 1
    return counts
  }, { stable: 0, review: 0, planned: 0 })
}

export function formatCatalogCounts(items: readonly CatalogItem[]) {
  const counts = countCatalogItems(items)
  return catalogStatuses.map((status) => `${counts[status]} ${statusLabels[status]}`).join(" / ")
}

export function componentDocumentStatus(slug: ComponentDocumentSlug): CatalogStatus {
  const statuses = componentDocuments[slug].itemIds.map((id) => {
    const item = catalogItems.find((entry) => entry.id === id)
    if (!item) throw new Error(`Missing catalog item: ${id}`)
    return item.status
  })
  return statuses.includes("planned") ? "planned" : statuses.includes("review") ? "review" : "stable"
}

export const catalogStats = {
  foundations: foundationItems.length,
  baseComponents: catalogItems.filter((item) => item.kind === "base").length,
  extensions: catalogItems.filter((item) => item.kind === "extension").length,
  ...countCatalogItems(catalogItems),
  documentedPages: Object.keys(componentDocuments).length,
} as const

export const internalModules = ["direction", "form", "label", "marker", "message-scroller"] as const

export const catalogSummary = [
  { label: "组件条目", value: catalogItems.length },
  ...catalogStatuses.map((status) => ({ label: statusLabels[status], value: catalogStats[status] })),
]
export const catalogMaturityNote = "稳定：当前规则与示例已确认；待评审：已有实现，仍在评审；规划中：尚未交付规范与场景。稳定不代表全部平台或无障碍验证已完成。"

export const catalogIcons = {
  foundations: Layers3,
  components: Box,
  extensions: ArrowLeftRight,
}
