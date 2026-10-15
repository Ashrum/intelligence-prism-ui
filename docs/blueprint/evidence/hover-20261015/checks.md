# 主行动按钮悬停修复 · 2026-10-15

基线：GitHub main / 本地 / Site v120，`6cbbe50532495b7c1ca0b9d6b7bee9ed54e8b919`。用户指出“预览主行动”悬停时文字不可读，并询问原按钮是否取消。

原按钮未删除：`#actions` 保留主、次、小尺寸、危险及禁用样例；首批通用组件放在前面使原区域下移。本轮仅在示例顶部补两个锚点入口，未移动或替换原样例。

根因：通用 `.bp-btn:not(:disabled):hover` 的背景覆盖 primary 基础背景，而 primary hover 只指定投影和位移。修前测得浅底 `rgb(243,245,248)` 配白字。修复在现有 primary hover 规则成对声明 `background:var(--foreground)` 和 `color:var(--card)`，保留各主题的现有令牌与状态规则；未改 coss、API、依赖或全局主题令牌。

浏览器（Chromium / Windows，320px、1280px）四主题共8组：primary默认、hover、hover加键盘焦点、按下的文字对比度均通过4.5:1。蓝图为17.76:1；其余三主题最低13.92:1。等待过渡结束后采样，蓝图焦点仍有2px纸色分隔层与蓝色轮廓。次要/危险hover文字对比度均超过4.5:1；disabled前后颜色与位移不变；减少动态效果时primary hover无位移。两个导航锚点实际可用，原8个按钮样例保留。详见 `before.json`、`browser-results.json` 与截图。

工程检查：数学字体、307个TSX字号、生产构建、TypeScript均exit0；Blueprint 39/39。全量1949项，1688通过、261失败、0跳过，exit1；与上一轮最终基线失败描述集合一致，新增和移除均为空。原始日志保留在忽略目录 `.sites-runtime/hover-20261015/`。

独立审查：`/root/blueprint_gap_review` 给出 PASS WITH NOTES，无阻断；允许完成文档同步后push、PR、merge并发布同一main提交。修复完成后再次核对规范生成和链接。

边界：本轮仅验证这组按钮及入口；不宣称全站布局、全部控件、真机、读屏器或原生浏览器缩放完成验收。按钮对比度不等于完整可访问性合规认证。
