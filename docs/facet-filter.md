# FacetFilter 分面筛选

PO 2026-10-08 选定 C；正式目录项 `facet-filter`，页面 `/next/components/facet-filter`。公开入口 `components/prism-next/facet-filter.tsx`；类型同入口导出 `FacetFilterProps / FacetFilterValue / FacetFilterIntent / FacetFilterDimension / FacetFilterOption`。

| 属性 | 契约 |
| --- | --- |
| `dimensions` | `{id,label,mode:'single'|'multiple',options:{id,label,count?,tone?}[],description?,common?}[]`；id 唯一，名称与顺序均由宿主提供 |
| `value` | `{filters: Record<string, readonly string[]>, sort:string, favoritesOnly:boolean, search:string}`；完全受控 |
| `sortItems` | `{id,label}[]`；空数组不显示排序；示例用综合/最新/热门，不硬编码到组件 |
| `resultCount? / favoriteCount?` | 宿主当前查询口径下的事实；0 正常显示，未提供写未知，不从选项求和 |
| `endSlot?` | 结果栏附加操作，组件不实现该操作 |
| `onIntent` | `filter {dimensionId,values}` / `sort {value}` / `favorites {value}` / `search {value}` / `reset` |

只支持常用在外、其余进面板。按传入顺序取前 3 个 common，剩余均可从“全部筛选”进入；未指定 common 时保留面板、重置与收起入口。徽标为其余已启用维度数，不是选项数或题数。收起摘要列出宿主已选值。

单选即时发意图；多选是每维度的局部草稿，确定按 options 顺序发出，取消或关闭不提交。宿主回传维度定义（含可用性/数量）或该维度已选值变化时丢弃旧草稿；同内容新对象不重置。重置先清草稿，再发 reset，默认值由宿主决定。count=0 禁新选但允许移除已有选择，缺省不禁用；Option tone 只使用外部 success/info/warning，不由标签或数量推断。

语义 fieldset/legend、说明关联、ToggleGroup 键盘、Popover 焦点/Escape 沿用 coss；确定/取消多选返回按钮。搜索保留可访问名称；长中文保留 title 和完整名称；CSS 仅布局与响应式。示例提供 520/720/960 × 当前3维/未来6维，主题由页顶 light/paper/dark 切换；128/23 为固定演示事实，无模拟请求。

复用检索（离线）：coss ToggleGroup/Toggle、Popover、FramePanel、Tabs、Button、InputGroup、Label、Tooltip；本地 `selection-particles.tsx` 的 p-select-7 / p-combobox-9、`input-particles.tsx` 的 p-input-group-22。FilterBar 缺少分面候选、多选确认与完整面板，因此复用已选 C 组合形成独立组件。无 Beautiful UI 需求；沙箱不联网，未刷新远端注册索引。coss 原件、依赖和视觉令牌不变。

Workspace 接入：用查询层生成 dimensions/counts 与 value；收到意图后更新宿主状态、请求服务，再回传结果数。组件不负责查询、收藏持久化、权限或路由。浏览器验收按分工由 Supervisor 执行，真实服务尚未接入。
