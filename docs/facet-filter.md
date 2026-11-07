# FacetFilter 分面筛选

PO 2026-10-08 选定 C；正式目录项 `facet-filter`，页面 `/next/components/facet-filter`。公开入口 `components/prism-next/facet-filter.tsx`；类型同入口导出 `FacetFilterProps / FacetFilterValue / FacetFilterIntent / FacetFilterDimension / FacetFilterOption`。

| 属性 | 契约 |
| --- | --- |
| `dimensions` | `{id,label,mode:'single'|'multiple',options:{id,label,count?,tone?}[],description?,common?}[]`；id 唯一，名称与顺序均由宿主提供 |
| `value` | `{filters: Record<string, readonly string[]>, sort:string, favoritesOnly:boolean, search:string}`；完全受控 |
| `sortItems` | `{id,label}[]`；空数组不显示排序；示例用综合/最新/热门，不硬编码到组件 |
| `resultCount? / favoriteCount?` | 宿主当前查询口径下的事实；0 正常显示，未提供写未知，不从选项求和 |
| `countUnit?: string` | 默认“题”；结果文字与常用行、全部筛选、多选草稿中的选项可访问名称使用同一单位。例如 `countUnit="份试卷"` → “共 12 份试卷”。紧凑选项计数仍显示数字；自定义单位时收藏可访问名称也包含数量与单位。未知结果在默认单位下仍为“题数未提供”，自定义单位下为“数量未提供” |
| `results?: boolean` | 默认 `true`；`false` 时隐藏末尾结果栏，宿主仍可单独使用导出的 `FilterResults` |
| `collapsible?: boolean` | 默认 `true`；`false` 时隐藏收起 / 展开按钮，始终展开，保留重置与全部筛选 |
| `showFavorites?` | 默认 `true`；`false` 时结果栏不渲染“我的收藏”开关，不改变受控值或发出意图 |
| `endSlot?` | 结果栏附加操作，组件不实现该操作 |
| `onIntent` | `filter {dimensionId,values}` / `sort {value}` / `favorites {value}` / `search {value}` / `reset` |

只支持常用在外、其余进面板。按传入顺序取前 3 个 common，剩余均可从“全部筛选”进入；仅当剩余维度非空时显示“全部筛选”（面板仍包含全部维度）；所有维度均已常驻或 dimensions 为空时隐藏入口，保留重置与收起。未指定 common 且维度非空时保留面板。徽标为其余已启用维度数，不是选项数或题数。收起摘要列出宿主已选值。

单选即时发意图；多选是每维度的局部草稿，确定按 options 顺序发出，取消或关闭不提交。宿主回传维度定义（含可用性/数量）或该维度已选值变化时丢弃旧草稿；同内容新对象不重置。重置先清草稿，再发 reset，默认值由宿主决定。count=0 禁新选但允许移除已有选择，缺省不禁用；Option tone 只使用外部 success/info/warning，不由标签或数量推断。

语义 fieldset/legend、说明关联、ToggleGroup 键盘、Popover 焦点/Escape 沿用 coss；确定/取消多选返回按钮。搜索保留可访问名称；长中文保留 title 和完整名称；CSS 仅布局与响应式。示例提供 520/720/960 × 当前3维/未来6维，支持切换收藏开关显示、所有维度标为常用（当前 3 维隐藏全部筛选，未来 6 维保留）；主题由页顶 light/paper/dark 切换；128/23 为固定演示事实，无模拟请求。

复用检索（离线）：coss ToggleGroup/Toggle、Popover、FramePanel、Tabs、Button、InputGroup、Label、Tooltip；本地 `selection-particles.tsx` 的 p-select-7 / p-combobox-9、`input-particles.tsx` 的 p-input-group-22。FilterBar 缺少分面候选、多选确认与完整面板，因此复用已选 C 组合形成独立组件。无 Beautiful UI 需求；沙箱不联网，未刷新远端注册索引。coss 原件、依赖和视觉令牌不变。

Workspace 接入：用查询层生成 dimensions/counts 与 value；收到意图后更新宿主状态、请求服务，再回传结果数。组件不负责查询、收藏持久化、权限或路由。浏览器验收按分工由 Supervisor 执行，真实服务尚未接入。

## P50：试卷计数单位

组件页的“计数单位”可在“题”和“份试卷”间切换，既有筛选、数量开关与宽度夹具保留。单位只影响文字，不改变数量、筛选值或意图；未传属性的输出逐字节不变。复核本地 coss ToggleGroup / Toggle / Frame / InputGroup 及 particles p-select-7、p-combobox-9、p-input-group-22 的既有组合，仅扩展现有公开属性，未联网刷新上游。

## P144：嵌入抽屉时的两个开关

`results` 和 `collapsible` 均为可选布尔属性，默认 `true`，未传时输出逐字节不变。`results={false}` 隐藏末尾结果栏；`collapsible={false}` 隐藏收起 / 展开按钮并始终展开，包括从已收起状态切换为 `false` 时。常用行、重置和原有全部筛选入口继续可用，受控值、计数与意图契约保持原有行为。

放进抽屉或面板时传入两个 `false`，结果栏由宿主放在列表上方，复用单独导出的 `FilterResults`。

```tsx
<FacetFilter {...filterProps} results={false} collapsible={false} />
<FilterResults {...filterProps} />
```

组件站提供“嵌入抽屉（不带结果栏、不可收起）”开关，默认关闭，复用同一组数据与筛选状态。复用检索采用现有 FacetFilter、FilterResults 和 coss Toggle，现有组合满足需求。
