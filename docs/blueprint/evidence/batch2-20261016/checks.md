# 第二批通用组件与配色规则 · 验收记录

日期：2026-10-16（Asia/Taipei）。开工基线：`2865942bb755efaa516a0f6f4252cdf79b4b1969` / Site v121。任务分支：`feat/blueprint-common-batch-two`。以下证据来自该基线上的本轮工作树；发布提交与 Site 版本以合并和部署终态为准。

## 修复及边界

- 复用既有 InputGroup、Combobox、ToggleGroup、Progress、Menu、Popover、Tooltip、Toast、AlertDialog、Sheet、Skeleton、Empty；新夹具仍属于蓝图示例页，不新增组件目录项或业务能力。
- InputGroup 的焦点线由内部输入转移到整组外框：2px 蓝线、2px 偏移。输入内部不再绘制第二条线；搜索、清除及单位全部处于完整边界内，错误红边保留。清除按钮保留独立焦点。
- 修正实际 Combobox / Toast 表面、方角触发器、Progress 填充对比度、Tooltip 可访问关联；Portal 归属本样例，Toast 使用实例 manager。
- 局部主题在 Blueprint 相关真实预览边界重新绑定 `--radius-lg`、`--radius-md`、`--color-muted` 三个既有派生别名，避免继承外层已计算值。样例根补 `text-foreground`，与既有正式预览容器一致。几何覆盖的核心主题排除规则未放宽。
- 不修改冻结 coss、核心三主题色值、依赖、组件目录、品牌原色或业务源码。配色语义原位记入现有规范。

## 实际浏览器结果

使用 Playwright CLI 驱动 Chrome；路由为 `http://127.0.0.1:5173/next/foundations/blueprint`。测量 JSON 内保留时间、主题、视口及实际状态。

| 范围 | 结果与证据 |
| --- | --- |
| InputGroup 焦点 | [focus.json](focus.json) 全部通过，覆盖可编辑 / 错误 / 只读与独立清除按钮；1280px 整组 439px，内部 386px / 411px；[320px 路由与焦点](routes.json) 整组 246.67px，内层 outline / shadow 均 none |
| 第二批交互 | [interactions.json](interactions.json) 47/47：输入、选择、键盘、焦点、错误、禁用、静态进度、菜单、浮层、Tooltip 关联、实例 Toast、确认取消、Sheet 长中文与 MathML、Skeleton 与 Empty |
| 第二批矩阵 | [matrix.json](matrix.json) 223/223；四主题 × 320 / 768 / 1280 共 12 组布局；11 个浮层情景；6 组双向局部主题对照均一致，包含伪元素圆角、真实绘制表面和浮层宿主 |
| 首批回归 | [first-interactions.json](first-interactions.json) 31/31；[first-matrix.json](first-matrix.json) 12 组布局、8 个真实浮层记录，局部主题比较全部相等；打印媒介投影与 CSS zoom 2 通过，后者不等于原生浏览器缩放 |
| 原按钮 | [first-hover.json](first-hover.json) 四主题 × 320 / 1280 共 8 情景；默认 / hover / 键盘焦点 / 按下 / 禁用 / 减少动态效果检查通过，原有 8 个按钮保留，蓝图主按钮对比度 17.76:1 |
| 正式组件页 | [routes.json](routes.json) 12 页 × 320 / 1280 共 24 次访问为 200、存在真实样例、无页面横向溢出；具体交互以上述夹具记录为准 |
| 核心主题 Progress | [修改前](core-before.json)、[修改后](core-after.json)、[逐项对照](core-comparison.json) 三主题轨道 / 填充样式完全一致；蓝图填充与轨道对比度由 1.09:1 提升至 16.26:1（见 [修前](before.json) 与交互证据） |

独立审查发现旧浏览器截图底部显示滚动条，故追加全新会话复验：[fresh-focus.json](fresh-focus.json)。1280px / 320px 下 html 与 body 的 clientWidth / scrollWidth 均等于视口，html / body zoom=1、DPR=1、visualViewport.scale=1；只有既有局部 Tabs 滚动区，不存在文档横向溢出。新会话整组宽度分别为 446.5px / 246px，蓝色外框仍为 2px。下方窄屏焦点截图已替换为此干净会话；上表的 439px / 246.67px 保留为旧会话实测，不与新记录混用。

## 视觉证据

以下均为本轮本地实际浏览器截图；父页面为 `/next/foundations/blueprint`，浮层通过真实触发器打开。截图扩展名与 PNG 编码一致。

- 蓝图 / 320×960：[完整组合焦点](../../screens/batch2-20261016/blueprint-320-input-group-focus.png)。
- 蓝图 / 1280×960：[输入与进度](../../screens/batch2-20261016/blueprint-1280-inputs.png)、[菜单与反馈](../../screens/batch2-20261016/blueprint-1280-menus-and-feedback.png)、[确认与占位](../../screens/batch2-20261016/blueprint-1280-dialogs-and-placeholders.png)。
- 蓝图 / 1280×960：[Combobox](../../screens/batch2-20261016/global-blueprint-1280-combobox.png)、[Toast](../../screens/batch2-20261016/global-blueprint-1280-toast.png)。
- 蓝图 / 320×960：[AlertDialog](../../screens/batch2-20261016/global-blueprint-320-alertDialog.png)、[Sheet](../../screens/batch2-20261016/global-blueprint-320-sheet.png)。
- 1280×960 双向预览：[蓝图内深色 Combobox](../../screens/batch2-20261016/global-blueprint-local-dark-1280-combobox.png)、[深色内蓝图 Popover](../../screens/batch2-20261016/global-dark-local-blueprint-1280-popover.png)。

## 工程验证与独立审查

- `node scripts/check-math-font.mjs`：通过。
- `node scripts/check-typography.mjs`：308 个 owned TSX，通过。
- `node node_modules/vinext/dist/cli.js build`：运行时代码最后修订后通过。
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`：运行时代码最后修订后通过。
- Blueprint 专项最终 39/39 通过（包含 6 项 guide 检查）。
- 全量：文档生成完成后重新构建并复跑，最终 1949 项 / 1688 通过 / 261 既有失败，[最终失败集合对照](complete-failure-delta.json) 的 `new=[]`、`removed=[]`。中间一次曾为 263 失败，其中两项为文档生成物未同步（内容与资产 hash），见 [中间结果](release-failure-delta.json)；这两项已消除。没有宣称全量通过。
- 独立 Reviewer 已复核源码、真实预览边界及冻结范围：源码 PASS。六组矩阵随后全部通过；最终文档和工程检查完成后按同一 main 提交同步 GitHub 与 Site。正式结论见 [独立审查](review.md)。

所有工程命令通过 Windows 本地环境包装执行；保留 HOME，临时文件放 `.sites-runtime/`。原始运行日志不作为站点文档资产发布。

[工程命令、时间及退出码](engineering.json) 对应运行时代码最后修订后的检查；全量退出码 1 对应上述 261 项既有失败。最终测试结果回填后的改动仅为证据与说明，重新生成 guide 并再次检查内容及下载资产 hash。

## 限制

没有验证真机、读屏器、实体打印、原生浏览器 200% 缩放或所有状态笛卡尔积。不以静态截图、源码断言、无溢出或上述有限交互推定全站通过。Toast / Skeleton / Progress 使用明确标注的本页状态样例，不产生真实任务成功事实。
