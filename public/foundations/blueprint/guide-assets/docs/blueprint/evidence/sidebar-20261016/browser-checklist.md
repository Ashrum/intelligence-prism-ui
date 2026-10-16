# 交给 Supervisor 的浏览器验收清单 · P80

基线：`bd0c8dd20c1453c25c3eef8db0e380f548a99c56` + P80 工作树；日期 2026-10-16。本清单为待执行步骤，不是已验记录。Builder 未启动服务或打开浏览器。

## URL 与矩阵

- `http://localhost:5173/next/foundations/blueprint#conversation-directory`：会话目录交互样本（现有服务实际端口如不同，由 Supervisor 对齐）。
- `http://localhost:5173/next/components/sidebar`：真实组件站 Sidebar；窄屏用站点左上按钮打开抽屉。
- `http://localhost:5173/next/foundations/blueprint/guide`：规则、样例链接与下载内容。
- 覆盖 light / paper / dark / blueprint / blueprint-night × 1280×900 / 320×800，共 10 个主题尺寸组合；1280 与 320 均需展开/折叠、过滤/焦点。核心三主题与当前基线相同组件作前后对照；新增样本中显式复用的 BpSegTabs 保留既有中性样式，不当作旧站点变化。

## 操作与应见结果

1. 示例展开表头依次为「对话」「3 条」「收起对话目录」。两蓝图有结构底线、等宽计数、muted 元信息；核心三主题不接收新的墨线/硬阴影/分组蓝色增量。确认计数字体可加载且中文正常回退，320 下不挤压收起按钮。
2. 新建按钮整宽墨底；两蓝图静态/hover/focus 的蓝色 2px 硬阴影可见，鼠标/触摸按下收回，松开恢复。焦点仅一个 ring 外环、不裁切；点击只出现「新建对话意图已触发；此示例不创建或保存对话。」条数不增加。测试 disabled 变体无位移/阴影，不把 CSS 测试当浏览器证据。
3. Tab 到「近期」，方向右键选择「已归档」，焦点随选项移动，只显示「九月课堂练习整理」，计数变成「1 条」。再次右键循环回近期，恢复三条；左/上/下及 Home/End 按既有单选键盘契约工作。无 tabpanel 宣称，Tab 只停当前 radio 一次；未选中段线框、选中段墨底反相文字，320 全宽不裁字。
4. 置顶/近期小标题为交互蓝 meta，中文不加字距/大写。近期两行之间仅一道 1px border，组末无分隔；条目保持行高，长中文标题截断，公式标题正确显示。选择切换保持 accent + 左 2px 墨线，hover secondary；更多在 hover/键盘 focus 时仍可用，点击只报告相应意图。
5. 点收起：轨道 56px，目录按钮 40×40 直角；新建为无硬阴影墨块，其他线框；当前项左墨线仍在。检查 group/menu 的居中留白与结构边线、按钮/焦点不溢出。点击展开恢复选项与当前列表；320 内嵌样本仍可操作，主站导航另按原抽屉路径验证。
6. 站点 Sidebar 各导航分组标题和账簿分隔生效，末行无分隔，导航仍正常，窄屏抽屉关闭后焦点返回原触发器。无强加会话表头/计数/过滤器。
7. 在两蓝图外层内分别放 light/paper/dark 的 `data-agent-preview data-prism-theme` 核心预览（沿用上述示例组件），检查核心根节点自身、所有后代和 before/after：表头/主按钮/分组/行/rail 不收到 P80 增量；切换嵌套主题后复核。现有单主题演示不能代替这个挂载矩阵；由 Supervisor 使用评审夹具挂载，不新增产品路由。
8. 减少动态效果初始开启/运行中切换时，无新增循环动画；高缩放、字体加载失败回退、长中文/公式可读性与焦点可见性一并检查。真实屏幕阅读器/触屏设备若未测需明确记未验。

## Workspace 单独验收

按 inspection.md 的接线清单确认 ConversationDirectory 真实 count、onNew、onArchived、分组/状态筛选、TooltipTrigger 最终 data-slot、56 图标轨与焦点恢复。路由 `/teacher/agent/workspace`。Prism 样本通过不表示 Workspace 已接入或服务流程通过。
