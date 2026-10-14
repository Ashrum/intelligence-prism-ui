# Foundations · 第四主题「蓝图」

2026-10-13 新增，候选状态。视觉语言参照 answer-me-with-html 站点的 blueprint 主题（MIT）：直角、1.5px 墨线、双线图框与坐标标尺、墨底字母块、偏移硬阴影。实现位于 `app/(next)/next/theme.css`（颜色令牌）、`app/(next)/next/blueprint.css`（几何与 `bp-*` 样式）及 [React 封装](../components/prism-next/blueprint/blueprint.tsx)。演示页为 `/next/foundations/blueprint`，从侧栏「蓝图组件」进入。

## 与核心三主题的边界

| 约定 | 说明 |
| --- | --- |
| 可选，不进矩阵 | `themeOptions` 含四项；新增 `coreThemes = light / paper / dark` 明确核心矩阵；现有演示与测试中的三主题数组保持原意，不批量改写。 |
| 只追加令牌块 | 蓝图块与 paper/dark 同级、同特异性，置于 dark 之后；三套核心令牌值不变。 |
| 显式声明全部角色 | 状态色、图表色、AI 来源、悬浮材质全部在蓝图块内重写，不继承 `:root`。 |
| 几何只在蓝图生效 | 现有组件的几何覆盖限定蓝图主题，并排除显式的其他主题预览；`bp-*` 是主动采用类名后才生效的呈现样式。几何规则未分层，活动标签的选择器与已有文字样式保持同等优先级。 |
| 不改 coss | 只按 `data-slot` 覆盖；coss 固定源码保持逐字节不变。 |
| 深色变体 | v9 已接入独立值 `blueprint-night`（夜图），与白图共享隔离几何；`dark:` 覆盖夜图并排除 light / paper / blueprint 预览。图表配色按核心深色回退，浏览器验收待 Supervisor，见 [v9 状态](blueprint/STATUS.md)。 |

## 颜色令牌

| 角色 | 令牌 | 值 |
| --- | --- | --- |
| 正文背景 | `--background` | #F6F6F3（叠 40px 网格 `--grid` rgba(29,32,38,.055)） |
| 浮层表面 / 卡片 | `--card` `--popover` | #FFFFFF |
| 次级背景 | `--secondary` `--muted` | #F3F5F8 |
| 分隔线 | `--border` | #D6DAE1 |
| 墨线（新增） | `--line` | #1D2026 |
| 正文 / 标题 | `--foreground` `--heading` | #16181D |
| 次要文字 | `--muted-foreground` | #4B5260 |
| 禁用文字 | `--disabled-foreground` | #8B929E |
| 链接 / 焦点 / 信息 | `--link` `--ring` `--info-foreground` | #1D5FBF |
| 强调底 | `--accent` | #E4ECF8 |
| 错误 | `--destructive-foreground` | #C62828 |
| 警告 | `--warning-foreground` | #A8620A |
| 成功 | `--success-foreground` | #216440（沿用智能曜彩绿色，不随参照站点并入蓝色） |

## 新增扩展令牌

三套核心主题在 `:root` 中有中性回退值，因此 `bp-*` 组件放在任何主题里都可以读。

| 令牌 | 核心主题回退 | 蓝图 |
| --- | --- | --- |
| `--line` | `var(--border)` | #1D2026 |
| `--line-width` | 1px | 1.5px |
| `--head-bg` / `--head-fg` | primary / primary-foreground | #16181D / #FFFFFF |
| `--grid` / `--grid-strong` | transparent | .055 / .09 墨色 |
| `--shadow-offset` / `-sm` | none | 4px 4px 0 / 2px 2px 0 #1D5FBF |
| `--code-bg` | `var(--secondary)` | #F3F5F8 |
| `--accent-ink` | primary-foreground | #FFFFFF |

## 五条几何规则

1. 直角：控件、卡片、徽标、浮层与品牌标识圆角归零；Radio 保持圆形。
2. 两级线：结构 1.5px `--line`，内部分隔 1px `--border`，虚线只用于分组。
3. 图纸：页面铺 40px 网格；区块用 `bp-sheet`，含 18px 内框和 `bp-ruler` 坐标标尺。
4. 编号：区块以 `bp-sheet-id` 墨底字母开头，右上角标 `bp-sheet-no`；表头、小标题用等宽大写。
5. 硬阴影：主要行动与浮层用不模糊的偏移阴影，替代 coss 柔和投影。

## 首期 `bp-*` React 封装（不计入组件目录）

`bp-sheet` / `bp-ruler` / `bp-sheet-head` · `bp-btn`（primary / danger / sm）· `bp-tool` · `bp-seg-tabs`（水平 / 垂直）· `bp-steps` · `bp-card` / `bp-card-note` · `bp-pane-head` · `bp-minor` / `bp-fig-cap` · `bp-size-bar` · `bp-metric` · `bp-facts` · `bp-titleblock` · `bp-callout` / `bp-error` · `bp-annot` · `bp-codebox` · `bp-toast`。

职责：coss 组件继续承担表单与操作；`bp-*` 只用于页面级呈现，两者不重名、不互相替换。

## 待验与已知限制

- 首期 `bp-*` 已有 React 封装及演示页；不登记组件目录，v3 接入时目录为 103 项。演示中的业务动作按钮、卡片内容为外观示例，不连接批阅、发布或保存服务。
- 320px 的 Tabs 示例存在横向溢出：本次浏览器抽查中蓝图页面宽 342px，浅色对照宽 339px。基础规范页宽 320px，色值表使用局部横向滚动。保留既有示例的窄屏问题，本轮不扩展为 Tabs 重构。 **v7（2026-10-14）已在 Prism 示例布局处理**：Tabs 标签行改为单行局部横向滚动，水平 `bp-seg-tabs` 同步保持单行，并补充选中项 / 焦点项滚动可见。上句保留为历史原文；修复后实际页面宽度、四主题视觉及 Toast 隔离测量待 Supervisor 浏览器验收，见 [v7 当前状态](blueprint/STATUS.md)。
- v4 已接入专用图表配色，见下方记录。Recharts 趋势、比较尚无图案，ECharts 无填充的折线与散点不使用面积图案；散点分组使用调用方提供的点形。实体黑白打印效果未验。
- 蓝图下默认热力图示例在 320px 页面中的格内文字拥挤；本轮只更改配色，未更改网格布局。并行新增的 `compact` 热力图不属于本轮验收范围。
- 尚未遍历所有组件、复杂嵌套预览与跨预览的 Portal 浮层，触摸、减少动态效果和打印也未做完整浏览器验收。不据令牌定义宣称通过对比度认证。

## 首次本地接入适配

按补丁映射将 `app/next/next/` 写入 `app/(next)/next/`，保持当前工作树与分支。README 追加第四主题说明；未新增 React 组件或组件目录条目。

- 固定字号改为既有语义字号令牌，字号检查保持原规则。
- 蓝图几何排除其他主题预览边界；基础规范主题卡使用真实主题属性。
- 去阴影规则避开具有焦点的控件或控件组，保留 coss 键盘焦点环。
- 修正实际 `tab-indicator` 插槽名及活动标签样式优先级；透明边框的 ghost、link 等按钮保留原边框语义。

## 首次本地验证（2026-10-13）

基于本地 `feat/reading-width-and-row-toggle` 分支、接入前提交 `4c7bdfe` 完成自测；未提交、推送、合并或发布站点。

- 数学字体检查与字号检查通过（290 个自有 TSX）；未放宽原检查规则。
- TypeScript 检查与 vinext 构建通过。
- 完整测试 1730/1730 通过，含补丁新增的 5 项蓝图主题测试；无失败或跳过。
- 与接入前提交逐项比较，原有 light / paper / dark 的 54 / 26 / 39 项令牌值均未改变；coss 源码无修改。
- 浏览器抽查基础规范与 Tabs：主题菜单含四项；蓝图可切换且导航后保持；蓝图和深色页面内的四张主题卡保持各自的颜色、圆角与线宽。蓝图控件为 0px 圆角与 1.5px 墨线，其他三个主题预览按钮仍为 10px 圆角、1px 线宽。
- 键盘抽查：Tab 可到达蓝图选择框，焦点环保留；Enter 打开菜单、Escape 关闭后焦点返回触发器。Tabs 可用方向键移动焦点、Enter 切换面板，选中项为白字墨底。

日志和截图保存在本地忽略目录 `.sites-runtime/blueprint-port/`。以上为接入自测与局部浏览器抽查，不代表全组件视觉验收或独立评审通过。

## v2 → v3 接入与验证（2026-10-13）

先应用 `Blueprint theme components ported.zip` 中的 v2，再应用 `Blueprint theme components ported2.zip` 中的 v3。路径 `app/next/next/` 映射为 `app/(next)/next/`；保留首次接入的主题隔离、焦点修正与基础规范底部排版修复。

### 本轮内容

- v2：网格铺到 `sidebar-inset`；提高演示与数据面板墨线优先级；既有 `DemoSection` 自动显示字母与 `SHEET` 序号、双线内框和刻度。760px 以下隐藏内框、刻度及序号，无需改动 `DemoSection`。
- v3：新增 React 封装、四组组件演示和侧栏入口；组件目录及原有计数测试保持不变。
- 分段选择遵循受控单选组协议。方向键切换并跳过禁用项，Home/End 跳转，首尾循环；传入无效或禁用选中值时，首个可用项仍可通过 Tab 到达，不擅自回写选中值。没有可用项时不创建 Tab 停留点。
- 步骤条、构成条、指标和批注带有可访问状态或数值文字；`BlueprintSheet` 的标尺和字母装饰标记为 `aria-hidden`。实际读屏器体验仍待专门验证。

### 接入中修正

- `.bp-minor` 和 `.bp-facts` 不再用 margin 简写覆盖调用方的间距类。
- 窄屏构成条占整行，图例取消桌面缩进；桌面指标列按内容分配宽度，数值与单位不拆行。
- 演示增加禁用分段项，并补充无效选中值、禁用选中值、全禁用及空列表的键盘入口回归测试。
- 复制示例改为复制当前演示链接，等待剪贴板写入成功再显示完成；失败显示重试，不用计时器伪造结果。

### 验证结果

| 检查 | 结果 |
| --- | --- |
| `blueprint-theme` + `blueprint-components` | 12/12 通过（原 5 项主题测试、补丁 6 项、追加 1 项回归） |
| 全量测试 | 1737/1737 通过；失败、跳过均为 0 |
| 字号检查 | 293 个自有 TSX 通过，未放宽规则 |
| 数学字体、TypeScript、vinext 构建 | 全部通过 |
| 四主题 × 1280px / 320px | 8 组均已检查；页面及四组演示区块无横向溢出，窄屏标尺收起 |
| 键盘 | 横向与纵向方向键、Home/End、首尾循环、禁用项跳过正常；每组一个可用 Tab 入口 |
| 复制示例 | 浏览器实际写入后显示「已复制链接」；失败分支未做浏览器故障注入 |
| v2 原页面回归 | `/next/foundations` 确认内容区网格、1.5px 墨线、A/B 与 SHEET 编号；320px 收起框线和刻度 |
| 控制台 | 演示页检查期间未捕获 error |

截图、构建与测试日志以及 `browser-checks.json` 保存在本地忽略目录 `.sites-runtime/blueprint-v3/`。未提交、推送、合并或发布。以上为 Builder 自测；当时未验的图表数据序列配色在下方 v4 记录中更新，Tabs 窄屏问题和未完成的全组件验收范围继续保留。

## v4 图表配色接入与验证（2026-10-13）

按 `patch-v4/README.md` 应用 6 个文件，并手动适配 `config.ts`、`theme.css` 和 `blueprint.css`。沿用现有 ECharts / Recharts，未改 coss、依赖、组件目录或业务逻辑；保留 BP-05 网格与投影分隔线修复。

- `chart-palette.ts` 集中提供主题系列色、箱线图形色与默认连续色阶。蓝图第 1 系列为 #1D5FBF，第 2 系列为 #16181D，第 3–6 系列为 #B8266E / #2B8050 / #A57013 / #6B7280；调用方显式颜色仍优先。
- ECharts 第 1 系列实色，后五系列依次为两种方向斜线、点阵、横线、竖线。用临时浏览器夹具验证六系列柱形与堆叠面积图，夹具入口已从 `public/` 移除，源文件与截图保留在忽略目录。
- 箱线图普通线条 #16181D，选中线条 #1D5FBF，填充 #E4ECF8。热力图使用 #F3F5F8 → #88AADD → #1D5FBF，继续区分缺测与零值。
- 轴线使用 `palette.line`，网格线仍使用 `border`；Recharts 只覆盖原本已显示的轴线，不强制开启隐藏的轴线。
- 提示框为直角、1.5px 墨线与 6px 硬阴影。浏览器发现 ECharts 6.1 的 `richText` 内部固定 1px，忽略配置的 `borderWidth`；已在蓝图 CSS 中对带硬阴影与墨线的 SVG 提示框补充适配。SVG 先画描边再画填充，所以用 3px 描边得到外侧可见的 1.5px 边框，保留富文本渲染方式。

### 自测与浏览器证据

- v4 初次接入时：相关 29/29、全量 1743/1743 通过，TypeScript、数学字体、字号检查与构建通过。收尾独立复跑新增的 `blueprint-charts` 6/6 通过。
- 配色测试逐项核对核心主题系列色、形状色与连续色阶；蓝图系列色在白底和页面底色上均超过 3:1，1001 个连续色阶采样的数值标签均超过 4.5:1，亮度单调。
- 1280px：实际检查六系列柱形、面积、箱线、热力、分组散点、趋势、比较；确认箱线选择回调与蓝色选中态、热力图缺测标识、散点圆形/菱形，以及两种引擎的提示框。
- 四主题回归：六系列柱形/面积夹具与正式趋势页检查通过；核心三主题没有生成蓝图图案。Recharts 核心主题仍为 8px 圆角、1px 边框、无新增阴影；蓝图为 0px / 1.5px / 6px 硬阴影。
- 320px：检查箱线、分组散点、趋势和热力图；默认热力图标签拥挤已如实保留，不据页面无溢出宣称布局验收通过。未做真实打印、移动设备或读屏器验收。
- 浏览器检查期间未捕获 console error。测试日志、图案夹具、截图、`browser-checks.json` 和 v4 范围 diff 位于 `.sites-runtime/blueprint-v4/`。

### 并行工作树说明

收尾时同一工作树另有环形图、雷达图、紧凑热力图及记录列表改动，目录从 103 增至 105。这些改动均保留，不归入 v4 交付。最后一次全量检查为 1761/1766，5 项目录数量断言失败，均为 `105 !== 103`：`blueprint-components`、`dialog-layout`、`facet-filter`、`grading-review-components-route`、`segmented-bar`。类型、构建和字号检查（296 个自有 TSX）仍通过；因此本次不能把当前混合工作树称为全量通过。目录数量断言需随并行组件扩展一起更新。

本轮仅更新本地文件；未提交、推送、合并或发布。以上均为 Builder 自测，不是独立 Review 结论。
