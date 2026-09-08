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

export type CatalogStatus = "stable" | "planned"
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
      planned("checkbox", "Checkbox"),
      planned("radio-group", "Radio Group"),
      planned("switch", "Switch"),
      planned("slider", "Slider"),
      planned("select", "Select"),
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
      stable("tabs", "Tabs", "/components/tabs"),
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
      stable("card", "Card", "/components/card"),
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
      planned("alert-dialog", "Alert Dialog"),
      planned("context-menu", "Context Menu"),
      planned("dialog", "Dialog"),
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
    guidance: "Page Tabs 使用曜蓝文字与 2px 移动下划线；Surface Tabs 使用浅中性底和带清晰边界的白色选中面。高度 36／32px，主文字 14px，数量 12px。Hover 与按下只改变局部表面；选中位置、面板状态、未应用修改分别表达，切换保留对象范围与已有内容。",
    accessibility: "保留 tab / tabpanel 语义。有等待的面板手动激活：方向键移动焦点，Enter／Space 确认；已准备好的局部内容可自动激活。禁用项跳过且原因可读，焦点与选中分离。纵向键盘随排列变化，窄容器只滚动标签条；减少动效时内容和选择仍立即更新。",
  },
  "segmented-control": {
    itemIds: ["segmented-control"],
    eyebrow: "智能曜彩扩展",
    title: "Segmented Control",
    description: "立即切换视角、显示模式或时间粒度，不创建 TabPanel。",
    guidance: "用于少量互斥选项。高度 36／32px，14px 主文字与 12px 数量；浅中性轨道、白色选中面、8／6px 圆角，不使用阴影。长标签保持完整并局部滚动。选择立即改变结果的组织方式，保留班级、周期和同一组数据。",
    accessibility: "使用 RadioGroup 单选语义，方向键移动焦点并立即选中，禁用项不可进入；180ms 仅移动选中背景，内容不等待动画。系统减少动效时取消指示器移动。",
  },
  card: {
    itemIds: ["card"],
    eyebrow: "数据展示",
    title: "Card",
    description: "承载一组相关信息和操作，默认无阴影，以边框和轻表面建立层级。",
    guidance: "只有可点击 Card 才提供 Hover 与 Focus；不要用固定高度伪造整齐。",
    accessibility: "普通 Card 不伪装成按钮；可交互 Card 必须进入键盘焦点顺序。",
  },
  "input-field": {
    itemIds: ["input", "field"],
    eyebrow: "表单与选择",
    title: "Input / Field",
    description: "Input 接收输入值；Field 组织字段身份、约束和反馈，让输入、修正与应用保持连续。",
    guidance: "Input 保留原生输入行为；Field 关联标签、控件、说明与错误；TextField 将它们组合为已确认的浮动标签表现。可编辑字段常显实线边界；只读用中性底、间断边框与文字说明，禁用明确显示不可用。何时校验、何时应用以及保留哪些结果，由使用它的场景负责。",
    accessibility: "TextField 保持 Label、控件与反馈的关联，提供只读、禁用、错误语义和 Reduced Motion。此页的场景表单负责中文输入法确认期间的提交保护、首次错误定位与本页结果保留；应用结果仅在当前页面保留。",
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
export const catalogStats = {
  foundations: foundationItems.length,
  baseComponents: catalogItems.filter((item) => item.kind === "base").length,
  extensions: catalogItems.filter((item) => item.kind === "extension").length,
  stable: catalogItems.filter((item) => item.status === "stable").length,
  planned: catalogItems.filter((item) => item.status === "planned").length,
  documentedPages: Object.keys(componentDocuments).length,
} as const

export const internalModules = ["direction", "form", "label", "marker", "message-scroller"] as const

export const statusLabels: Record<CatalogStatus, string> = {
  stable: "稳定",
  planned: "规划中",
}

export const catalogIcons = {
  foundations: Layers3,
  components: Box,
  extensions: ArrowLeftRight,
}
