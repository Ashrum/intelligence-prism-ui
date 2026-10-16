# P76 · 实现与复用核对

- 日期：2026-10-16。分支 `feat/blueprint-shell-nav`，HEAD `780c2ef0cb14e378fd72f21194ee7f2835d7e045`，开工工作树干净；基于未合并的 P75，不冒充最新 main。
- 依据：Supervisor `task-P76.md`、`builder-preamble.md`、仓库 AGENTS §10.1，正式蓝图 §4.2 / §5.1 / §5.2 / §5.4。
- 检索顺序：先读已有 `components/prism-next/app-bar.tsx` / `app-bar.css`、`shell.tsx`、`demos/navigation.tsx`，再读固定 coss `sidebar.tsx` / `button.tsx` 和现有 `blueprint.css` / `typography.css`。这些组件已具备全部结构及状态 hook；只在蓝图 CSS 中适配，无需新组件或 particles。按 Builder 前置约定不联网，未检索在线 registry / particles，也未复制第三方代码；不称已验证最新 upstream。
- 运行时唯一修改：`app/(next)/next/blueprint.css`。从旧墨底选择器中移除 Sidebar 分支，Tabs / Toggle 原声明保留；新块限定 blueprint / blueprint-night，最终目标排除核心预览根及所有后代，伪元素也使用相同排除。
- AppBar / SpaceBar 与本站 header 采用 card 和结构底线；高度 56 / 48、现有容器断点保持。当前一级项 foreground 底部 2px inset 线，悬停伪元素 accent 直角；身份、图标、空间/个人菜单触发器及菜单项直角；空间触发器 card + 1px border。通知角标不在新规则中。
- Sidebar 同时覆盖 `sidebar` / `sidebar-inner` 纸面和实际 `sidebar-container` 的结构边；已有外层结构线规则保留。选中 accent + foreground + 左侧 inset 2px foreground；子菜单沿用相同选择线。悬停 secondary；选中项悬停仍保留 accent。分组标题仅调整颜色，不改现有 component-label 语义字号 / 行高。
- 图标轨：折叠 Sidebar 仅在 gap / container 实际布局目标设为 56px，按钮 40×40；不改祖先继承变量，避免把轨道宽度传入嵌套核心预览。左线与展开目录同一位置，切换时方向稳定、不另增底线。coss 的 `size-8!` 在 utilities 层，因此对应尺寸覆盖也在该层并使用更高特异性 + important；不修改冻结 coss。
- 焦点：导航控件移除 ring box-shadow，保留单 outline；选中 inset 标识仍保留。AppBar 导航旧 `::before` 焦点框取消。**顶栏一级项 outline-offset 为 −4px**：现有横向滚动容器会裁切外侧焦点，因此在保持结构 / 高度 / 断点的前提下仅此处内移，留出底部 2px 选中线的位置，避免焦点覆盖选择标识；其他控件仍 +2px。该局部适配供 Supervisor 浏览器复核，不声称完全满足所有状态的视觉焦点验收。
- 对比度来自实际 theme.css：蓝图 foreground/accent `14.927942:1`，夜图 `11.106881:1`，分别同时满足文字 ≥4.5 与选中线 ≥3。无需更换令牌；夜图数值不是浏览器渲染测量。
- 工程测试是 React SSR / CSS 规则匹配、层和特异性探针，包含两种样式加载顺序及内存变异；不冒充浏览器 computedStyle、布局或视觉验收。

- 既有测试变更单列：`tests/blueprint-theme.test.mjs` 原来一概拒绝 `@layer`，首轮全量因此 2201/2202（唯一失败）。改为只允许唯一 utilities 层、唯一精确隔离选择器及 width/height 两个 40px important 声明，其他层/规则/声明均拒绝；新增 5 个内存变异证明边界。没有把失败归为基线问题，也没有放宽 coss 散列或组件数量检查。
