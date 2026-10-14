# BPv7 定位与复用依据

日期：2026-10-14。基线：`feat/learning-charts` · `46303a46304955276af030c5059613096ef3be3f`（含 BPv6 / P64），开工工作树干净。以下是代码、构建产物和 SSR 依据；像素数字来自任务书中的 Supervisor 观察，本轮未操作浏览器。

## 根因与范围

- 正式入口是 `/next/components/tabs`：`app/(next)/next/components/[slug]/page.tsx:12` 使用 DemoRenderer；`components/prism-next/demo-renderer.tsx:7,22` 注册 navigationDemos；`components/prism-next/demos/navigation.tsx:14` 为 TabsDemo。新测试用当前构建的 worker.fetch 验证 HTTP 200、正式 shell、两组标签及七个 Tab；无监听端口。
- 基线 `navigation.tsx:13` 中 `<Tabs><TabsList>` 直接相连，没有局部滚动边界。[修改前 SSR](tabs-before.html) 确认两组分别有 4 / 3 个 Tab，第一组末项“已锁定”仍参与布局，只有交互禁用。
- `components/coss/tabs.tsx:48` 为 `flex w-fit`，`:87` 为 `shrink-0 grow whitespace-nowrap`；`lib/coss/segmented-control.ts:10` 保留每项左右内边距。四项文字加间距、内边距不能在窄示例区内收缩。`app/(next)/next/theme.css:284,297,325` 在 320px 给页面和演示区各 1.25rem 内边距；容器已有 min-width:0，但它本身没有裁定标签的滚动边界。面板是正常换行文本，根因是标签行，不是面板或整站主布局。
- Supervisor 的修复前证据：light 320×800 页面 scrollWidth=339，最后一项 right=337；历史 blueprint=342。上述数字不由 SSR 计算，不能据 SSR 宣称已恢复 320。
- `components/prism-next/demos/agent-semantic-group.tsx:156-157` 已有 min-w-0 根与 max-w-full / overflow-x-auto 包装；`agent-component-page.tsx:98-100` 还有 min-w-0 及独立面板。两页 SSR 均验证原结构，未修改。Base UI `internals/composite/root/useCompositeRoot.js:218` 通过原生 focus() 聚焦标签，未传 preventScroll；方向键焦点原生进入局部滚动区。外部 hash 驱动选中项是否可见不属于本轮修改，列入浏览器回归记录。
- `app/(next)/next/blueprint.css:80` 原 bp-seg-tabs 使用 flex-wrap:wrap；它不是 TabsDemo 的节点。原布局主要是换行，不是上述 339px 的根因，但不符合本轮保持单行的要求。改为 nowrap + 水平 overflow-x:auto + 水平项不收缩；纵向样式和 radiogroup 语义保留。显式 bp-* 类按 §10.1 可跨主题使用中性回退；没有新增普通组件的全局视觉覆盖。

## 修复取舍

- `navigation.tsx:19-25,32-37` 复用既有 coss Tabs，外加 min-w-0 / max-w-full / overflow-x-auto 容器。面板在滚动区外；py-1 / -my-1 留出垂直焦点环空间，抵消增加的垂直占位；不改文字、字号或标签尺寸。
- `components/prism-next/use-horizontal-choice-scroll.ts:6-43` 是内部布局 hook，不是新目录组件或第二套 Tabs。只调整拥有者 scrollLeft：焦点变化显示焦点项，受控值变化显示选中项，尺寸或字体变化显示焦点项或选中项；宽容器无操作，超长单项优先显示开头；无计时器、平滑动画、页面 scrollIntoView 或自行聚焦。
- coss Tabs 保留 Base UI activateOnFocus=false：方向键只移动焦点，Enter / Space 激活。BpSegTabs 保留原 radiogroup 方向键移动并选择的契约，不将其改成 Tab 语义。
- ≥640px 的现有字号、颜色、边框、尺寸、Token 保持原值；宽容器仍按原内容宽度显示。实际视觉和焦点环是否完整仍由 Supervisor 验收。

## 离线复用检索

- 读取固定 coss Tabs / Toast、分段尺寸映射，以及本地缓存 `.sites-runtime/easyui-research-20261005/coss-registry.json` 的 `tabs` 和 `p-tabs-1` 至 `p-tabs-15` 条目；摘要见 [reuse.json](reuse.json)。这些描述涵盖分段、下划线、纵向、图标、计数和大小，没有标记滚动组合。
- 完整读取缓存 `coss-source/p-tabs-1.tsx`，其 TabsList 也直接置于 Tabs 下。其余 14 项仅检索 registry 描述，不声称已读源码。`docs/paper-review-design.md:188` 的 p-tabs-14 / p-tabs-10 历史记录分别是小号和计数徽标，不能证明存在滚动封装。
- 复用本地两个 Agent 演示已采用的外层滚动布局，保留原始 coss 控件。按前置约定未联网刷新 particles；通用 Tabs 布局任务不涉及 Agent 执行组件，没有新增 Beautiful UI 代码、组件目录条目、依赖或 Token。

## Toast 的证据边界与 Supervisor 隔离测量

- `components/prism-next/providers.tsx:14` 配置 bottom-right。`components/coss/toast.tsx:75-86` 使用 fixed、right=--toast-inset、width=100%−2×inset、max-width=22.5rem；构建 CSS 确实生成合法的 `width:calc(100% - var(--toast-inset) * 2)` 和 `right:var(--toast-inset)`。320px 正常包含块、inset=16px 时，理论右边界应为 304px。
- 任务书的 right=323 与该理论值不符；单凭 fixed 或一个 right 数值，不能证明它计入或不计入文档 scrollWidth。Toast Portal 客户端挂载，SSR 不包含实际视口盒。未发现独立的静态越界依据，本轮不预防性覆盖冻结 Toast 的布局。
- Supervisor 在修复后记录 innerWidth、documentElement.clientWidth/scrollWidth、scrollX、Toast 的 rect / computed position / right / width / --toast-inset。临时隐藏 `[data-slot=toast-viewport]`（测量后还原）并比较 scrollWidth：有无 Toast 均应为 320；如仍超宽且隐藏后收敛，再据实委派 Prism 层适配。此项是浏览器验收清单，不声称已修复或排除 Toast。
