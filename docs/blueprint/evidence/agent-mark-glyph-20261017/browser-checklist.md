# 交给 Supervisor 的浏览器验收清单

URL：/next/components/agent-components/agent-mark（使用 Supervisor 已运行服务）。

1. 选择预览主题 light / paper / dark / blueprint / blueprint-night；桌面 1280px 与代表窄屏 320px，查看「列表行首状态位 · glyph」的 Drive / Orbit / Dots × 六状态。
2. 行首槽应固定 16×16px，图形 13×13px；组件内部只有九宫格，无文字/耗时，旁边状态文字来自示例行。中文长名称不应挤压图形（必要时通过夹具加长行文本）。
3. 只有 thinking / working 闪动；idle / waiting-for-user / error / unknown 静止，状态不随动画改变。运行前景色、等待警示色、错误 destructive；两蓝图的 Dots 也须直角，核心三主题仍圆点。
4. 系统 reduce 首次进入即完整静态九点；运行时 no-preference → reduce 所有变体立即静止且九点完整；切回仅运行态恢复。分别检查 glyph 与既有 inline/loading。
5. accessibility tree：glyph 根 role=img，名称分别「就绪」「正在思考」「正在处理」「等待你确认」「发生错误」「状态未知」；点阵隐藏，无 status/live region。label 覆盖用 React 夹具核验自定义名称；禁止主状态播报用 glyph。
6. 既有三个 loading 样例与六个行内样例、固定「已用时 1 分 5 秒」维持原样。glyph 夹具传 startedAt=0 不出现耗时。
7. 外层 blueprint / blueprint-night 嵌套 light / paper / dark 预览，核心 Dots 不受直角规则污染；反向嵌套两蓝图可生效。用开发工具核对实际 computedStyle、主题颜色、窄屏布局。
8. 宿主动态切换 inline → glyph → loading，计时器应随进入 glyph 清除、返回 loading 恢复；真实读屏播报与实际执行状态接入另验。

本轮未打开浏览器或启动服务，无浏览器截图。浏览器验收：按分工由 Supervisor 执行。
