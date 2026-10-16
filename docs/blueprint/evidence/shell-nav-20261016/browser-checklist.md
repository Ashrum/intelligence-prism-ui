# 交给 Supervisor 的浏览器验收清单

浏览器验收：按分工由 Supervisor 执行。Builder 未启动 / 重启服务，未打开浏览器，无本轮截图。

## 路由与矩阵

现有开发服务的基址由 Supervisor 确认（通常 `http://localhost:5173`）。每个页面覆盖 light / paper / dark / blueprint / blueprint-night × 1280×900 / 320×900；记录实际 innerWidth / height、主题、日期、Git 基线和状态。

1. `/next`：本站 Sidebar 与 sticky 顶栏。用「切换主题」依次切五主题；侧栏「组件总览」为当前项。蓝图纸面 card、顶栏结构底线、侧栏实际容器结构边；未选项 hover 为 secondary，当前项 accent / foreground / 左 inset 2px。分组标题 muted-foreground，保持原字号行高。320 下打开抽屉、点击目录导航、关闭、Escape / 焦点返回；不能把桌面 fixed 容器的通过当作抽屉通过。
2. `/next/components/sidebar`：「当前页面的导航侧栏」→「收起导航 / 打开导航」，Ctrl / ⌘ + B；验证截断、长中文、组标题、滚动和当前项。本站是 offcanvas 模式，不足以验证折叠图标轨。
3. `/next/use-cases/workspace-app-bar`：这是现有 AppBar / SpaceBar 综合示例页（目录无独立 AppBar 组件路由）。检查顶部「Agent / 组卷」当前项和 hover、品牌、身份、通知角标、个人菜单、空间切换；320 检查 compact 空间触发器。切换空间并打开个人菜单，当前项 accent，菜单项直角。AppBar 56px / SpaceBar 48px 保持，侧栏切换前后工具栏底线一致；数字角标圆角、底色、前景与 P75 基线逐项比较。
4. 在既有评审夹具入口挂载本目录 `fixture.tsx` 的 `ShellNavFixture`（仅评审用途、不注册产品路由），覆盖展开与 56px 图标轨、两种蓝图根内嵌核心三主题、核心根内嵌蓝图、空间/个人菜单。记录触发器和 Portal 实际 DOM 祖先主题。`theme` 为夹具自身主题，`outerTheme` 可为另一主题；从宿主切换 props 即可。实际布局、开关和 Portal 尚未由 Builder 验收。

## 应记录的实值与操作

- AppBar / SpaceBar / 本站 header：background、border-bottom width/style/color、height；导航默认 / hover / current / current+hover / focus-visible / current+focus，检查 2px 线贴合底边。顶栏导航为单 outline、offset −4px，旧 ::before outline 为 none；目视确认未被横向滚动容器裁切。
- 身份、品牌条、图标、空间触发器和两类菜单项：border-radius；空间触发器 background、1px border；数字角标保持原形与色。Tab → Enter / Space → 上下键 → Escape，记录开合与焦点返回，不仅检查初态。
- Sidebar：外层、inner 和 container 的 background / border；选中与未选 hover 的 background / color / box-shadow；未选和已选焦点只有一套 outline，选中线不丢。更多按钮显隐保持。
- 图标轨：实际宽 56px；按钮实际 40×40、直角、左 inset 2px；展开后恢复原行高。1280 与代表窄屏分别记录，320 的抽屉机制仍由原组件控制，不强制显示轨道。
- 蓝图 foreground/accent 理论对比度 14.927942:1；夜图 11.106881:1。用 computedStyle 的最终色重新计算选中文字 ≥4.5 与左墨线 ≥3。
- 每个核心主题比较 P75 基线与本轮，覆盖根主题、蓝图内的嵌套核心**根节点及后代**，包含 ::before / ::after。普通核心布局、颜色、圆角、阴影、字体、尺寸和焦点应无增量；嵌套根也带目标 class / data-slot 的情形须检查。
- 回归 Tabs / Toggle 选中仍为原墨底白字；留意长中文、公式内容区域和320阅读不被导航挤压。必要局部横向导航允许，但不以无溢出代替视觉判断。

## Workspace 接线（本仓未修改 Workspace）

Agent 页选择 blueprint / blueprint-night 外观时，把 AppBar 放入对应主题根内；其他路由继续使用原主题。SpaceBar、会话 Sidebar、56 图标轨应在同一局部主题范围。AppBar 目前直接使用固定 coss Menu / Popover，可通过既有 `popupProps.portalProps.container` 指向已挂载的主题内宿主；仅包外层而让浮层继续挂到核心 body，菜单不会继承蓝图。个人/空间/任教菜单按现有 API 接线，不新增组件 API。离开 Agent 页恢复原根和浮层归属，不改全站持久主题。

未验证：真实 Workspace 接入、真实服务、移动设备 / 触屏、读屏器、实体打印、浏览器像素与完整交互矩阵。以上清单是待执行步骤，不是通过记录。
