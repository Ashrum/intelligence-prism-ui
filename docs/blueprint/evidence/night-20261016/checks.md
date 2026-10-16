# 夜图恢复 · 本轮验证

- 日期：2026-10-16。实施基线：main 773724595ab36d0574252da8503821d93eb9c6a1（含警告色 PR #194）；分支 feat/blueprint-night。
- 来源：本机交接 bpv9-wip-20261016.patch，SHA-256 cf598cb902e8267e37313bd48e9adcdc6b14d1e90fbd5598eb6014140fa2ee5e。原 stash d94d5ab650569302c6c1cc8e473ecc410e1df1a6 保留；实际 stash 父提交为 10480b3c4a93490854c958e60f0dcba725f33aa1（P72），修正交接中“P72 之前”的表述。
- 原补丁在最新 main 不能直接应用；逐文件适配后 git apply --check 通过再应用。保留 main 的通用组件、字体、警告色与 P69 核心深色色板；未导入旧 STATUS 或旧 evidence/v9。
- 夜图回退与已知限制以 docs/blueprint-theme.md 的夜图恢复段为准。核心三主题及白图 CSS 令牌使用本轮基线独立散列锁定；冻结 coss 与依赖不变。

## 实际浏览器

Codex 内置 Chromium，桌面视口模拟，不是真机。记录见 [browser.json](browser.json)。

- /next/foundations/blueprint：五主题 × 1280×960 / 320×960，读取正文、标题、warning 与 color-scheme；主题切换正常，没有页面横溢。查看实际截图，长中文、章节、控件分组仍可读。核心截图采于最后文案修改前，其样式与令牌未再改动。
- /next/foundations：五种外层主题 × 五种真实嵌套预览，前景、背景、color-scheme 与按钮圆角按内层保持；包括白图与夜图互嵌。CSS 预览边界不等于 React Theme Context 隔离。
- 夜图实际描边 hover：#E6EDF7 / #16305A；危险实底：#081322 / #FF7070。打开确认框后取消，没有清空内容。
- 夜图 320px Dialog：中文表单、结构墨线与焦点可见；Escape 后弹窗消失，焦点返回“打开演示对话框”。
- /next/components/tabs：夜图 320 / 1280，ArrowRight 后 Enter 激活材料信息；内容正确，局部横滚保留、页面不横溢。COSS Tabs 使用手动激活，禁用项可获焦但不能激活，未擅改其行为。蓝图自有单选分段 End 选中“异常”，禁用“已锁定”保持禁用。
- /next/components/evidence-matrix：夜图 1280 宽图约 792.7px 显示数字，300px 小图隐藏；320px 下两图隐藏数字，ARIA 描述说明原因。点按零值格显示 0；展开数据表同时存在 0 和缺测。真实提示框有夜图墨线与蓝色硬阴影。披露隐藏的例外仅在单元 / SSR 中验证。
- 控制台最终 error 查询为空；主题选择经过路由跳转保持。已恢复浏览器默认视口。

## 工程与边界

实际命令、时间、退出码与测试数字见 [engineering.json](engineering.json)。先构建再全量测试；最终文档回填后重新生成 guide，再执行文档同步检查、相关测试与最终构建。当前运行结果不会用旧 v9 的数字代替。

独立代码审查为 [PASS WITH NOTES](review.md)，不冒充 Claude Supervisor 的浏览器验收。未验证实体打印、真机、读屏器、原生缩放、全站像素、所有浮层 / 输入组合、夜图所有图表类别的视觉矩阵及 Site 发布；Recharts 仍主要依赖颜色区分系列。已知弱分隔 / 图案对比度仍待设计确认。

截图存放于 ../../screens/night-20261016/；文件名包含主题、宽度与内容。components 为通用组件，controls 为修正后 hover，danger 为实色危险确认，dialog 为 320px 表单，tabs 为正式页，heatmap-zero 为零值提示框和数据表，nested 为内层预览。工具返回的截图实际为 JPEG；按文件头核对并使用 .jpg 扩展名，未重编码。

## 截图索引

均为 2026-10-16、基线 7737245 上的本轮工作树，视口高度 960px。

| 文件 | 路由 |
| --- | --- |
| [blueprint-1280-components.jpg](../../screens/night-20261016/blueprint-1280-components.jpg) | `/next/foundations/blueprint` |
| [blueprint-320-components.jpg](../../screens/night-20261016/blueprint-320-components.jpg) | `/next/foundations/blueprint` |
| [blueprint-night-1280-components.jpg](../../screens/night-20261016/blueprint-night-1280-components.jpg) | `/next/foundations/blueprint` |
| [blueprint-night-1280-controls.jpg](../../screens/night-20261016/blueprint-night-1280-controls.jpg) | `/next/foundations/blueprint` |
| [blueprint-night-1280-danger.jpg](../../screens/night-20261016/blueprint-night-1280-danger.jpg) | `/next/foundations/blueprint` |
| [blueprint-night-1280-heatmap-zero.jpg](../../screens/night-20261016/blueprint-night-1280-heatmap-zero.jpg) | `/next/components/evidence-matrix` |
| [blueprint-night-1280-nested.jpg](../../screens/night-20261016/blueprint-night-1280-nested.jpg) | `/next/foundations` |
| [blueprint-night-1280-tabs.jpg](../../screens/night-20261016/blueprint-night-1280-tabs.jpg) | `/next/components/tabs` |
| [blueprint-night-320-components.jpg](../../screens/night-20261016/blueprint-night-320-components.jpg) | `/next/foundations/blueprint` |
| [blueprint-night-320-dialog.jpg](../../screens/night-20261016/blueprint-night-320-dialog.jpg) | `/next/foundations/blueprint` |
| [blueprint-night-320-heatmap-zero.jpg](../../screens/night-20261016/blueprint-night-320-heatmap-zero.jpg) | `/next/components/evidence-matrix` |
| [blueprint-night-320-tabs.jpg](../../screens/night-20261016/blueprint-night-320-tabs.jpg) | `/next/components/tabs` |
| [dark-1280-components.jpg](../../screens/night-20261016/dark-1280-components.jpg) | `/next/foundations/blueprint` |
| [dark-320-components.jpg](../../screens/night-20261016/dark-320-components.jpg) | `/next/foundations/blueprint` |
| [light-1280-components.jpg](../../screens/night-20261016/light-1280-components.jpg) | `/next/foundations/blueprint` |
| [light-320-components.jpg](../../screens/night-20261016/light-320-components.jpg) | `/next/foundations/blueprint` |
| [paper-1280-components.jpg](../../screens/night-20261016/paper-1280-components.jpg) | `/next/foundations/blueprint` |
| [paper-320-components.jpg](../../screens/night-20261016/paper-320-components.jpg) | `/next/foundations/blueprint` |
