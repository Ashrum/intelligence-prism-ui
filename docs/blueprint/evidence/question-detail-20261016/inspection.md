# P75 实现与证据说明 · 2026-10-16

基线：`ab14ab4a59ef593e9d29061c892256d5e233bc3d`，`feat/blueprint-question-detail`，开工工作树干净。委派来源为 Supervisor 的 `task-P75.md` 与 `builder-preamble.md`。运行时只改 `app/(next)/next/blueprint.css`。

## 复用检索与取舍

- 已有 Prism：`question-card.tsx` 的 `.question-detail-region` 已能限定展开详情；`question-details.tsx` 使用真实 coss Tabs，包含答案、定位、档案三种面板；`question-content.tsx` 的 `.question-solution` 已能定位答案分段。现有类和 data-slot 足够，不新增 data 属性、API 或结构。
- 固定 coss：读取 `components/coss/tabs.tsx`、`lib/coss/segmented-control.ts`，确认 tabs / tabs-list / tabs-tab / tabs-content 挂点。默认 Tab 高 34px、sm 高 30px；现有 QuestionDetails 的 `pointer-coarse:min-h-11` 提供触屏 44px 最小高度。本轮只对 fine pointer 加 32px 下限，避免覆盖 coarse 工具类。
- 本地 particles：检索 `demos/input-particles.tsx`、`selection-particles.tsx`、`dialog-particles.tsx`、`table-particle.tsx`，没有题目详情表面适配项。该需求是既有组合的局部 CSS 修正，无须复制新的上游实现。未联网刷新 coss registry / particles，也未引入 Beautiful UI 代码。
- 已有图片资源：`fixtures/question-figure.tsx` 的 `CoordinateDiagram` 为题库 Q-M-004 使用的 SVG。现成页面图形透明、随文字着色，不是白底图片；因此证据夹具将同一 SVG 以固定白底/墨色序列化为 `question-diagram-white.svg`，在题面与解析各使用一次。未改原始图形或产品题目样本。

## 实际样式改动

| 目标 | 原始 | blueprint / blueprint-night |
| --- | --- | --- |
| detail 背景 | bg-secondary | var(--card) |
| detail 外框 | 无显式边框；rounded-xl | 1px dashed；0 圆角 |
| detail padding | 16px | 12px |
| Tabs 与面板 | gap-5 = 20px | 12px |
| 答案 / 解析 / 小问分段 | space-y-5 = 20px | 12px；末段不加尾距 |
| 定位网格行距 | gap-6 = 24px | 16px；列距保持 |
| 定位字段间距 | space-y-4 = 16px | 12px；末项不加尾距 |
| 档案网格行距 | gap-y-4 = 16px | 12px；列距保持 |
| 可编辑定位入口前距 | mt-5 = 20px | 12px |
| Tab 可点击高度 | 窄屏 34px / sm 30px，coarse 至少 44px | fine 最少 32px（窄屏原 34px 保留），coarse 原规则不变 |

所有新规则在蓝图家族下，并在最终目标排除嵌套核心预览根及其全部后代。夜图颜色例外使用仅夜图的预览 guard，白图嵌套在夜图内仍取白图 border。没有新伪元素、阴影、标尺、双框或字体规则。`line-height`、语义字号、内容内部小间距及文字颜色不改。

## 对比度（既有令牌的 sRGB 计算，不是截图采样）

| 主题与边线 | card | 比值 | 处理 |
| --- | --- | --- | --- |
| blueprint border `#D6DAE1` | `#FFFFFF` | 1.402334:1 | 按任务白图指定的 --border |
| blueprint-night border `#23385A` | `#0D1C31` | 1.453912:1 | 不满足任务夜图 3:1 |
| blueprint-night line `#C9D6E8` | `#0D1C31` | 11.622496:1 | 按授权使用既有较浅 --line |

白图 3:1 未被本轮任务设为门槛，没有擅自将其改成结构墨线。夜图使用现有 --line 的完整值，未新增令牌或自行做颜色混合。

## 工程验证边界

新增 `tests/blueprint-question-detail.test.mjs` 共 8 项。测试用真实 React / coss SSR 构造树，Lightning CSS 解析生产选择器，PostCSS 提取规则，在受支持的选择器子集上计算本轮样式增量。覆盖两蓝图、三核心、两种蓝图外层下的核心预览根/后代、夜图内嵌白图，以及三面板、fine / coarse 分支。

核心主题结果为本轮规则增量空对象，结合受保护源码散列及旧 CSS 块逐字不变证明工程范围内无覆盖；这不是浏览器 `getComputedStyle` 采样。真实 computedStyle、层叠后的像素、布局、键盘/触摸仍按[浏览器清单](browser-checklist.md)交接。

内存变异 **14/14 被检出**：整块回退、card 回灰底、虚线回实线、边框加粗、圆角恢复、padding 恢复、夜图 line 回 border、Tabs gap 恢复、答案分段恢复、定位网格恢复、档案行距恢复、家族 guard 移除、夜图 guard 移除、去掉主题前缀。没有改磁盘上的冻结 coss 或产品文件来做变异。

初次定向测试因 esbuild 未声明 CSS loader 而失败；仅测试 bundle 配置加 `.css: empty` 后 8/8 通过。样式不是靠空 CSS 验证：生产 blueprint.css 单独读取并经 CSS AST 检查。首轮错误日志单列，不计入最终通过证据。

五项顺序、实际时间和退出码见 [engineering.json](engineering.json)，最终全量为 **2192/2192，0 失败、0 跳过**。构建保留 chunk-size / 插件耗时提示，退出 0。字体检查通过，排版 311 个 owned TSX 通过，类型 0 错误。测试后仅补文档与验收夹具，运行时 CSS / 测试源码未变化；夹具另经 bundle 和 SSR 检查。Builder 自测不等同 Supervisor Review / PO 验收。
