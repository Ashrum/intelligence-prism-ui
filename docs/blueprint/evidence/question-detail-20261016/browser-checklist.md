# 交给 Supervisor 的浏览器验收清单

日期：2026-10-16。基线：`ab14ab4` + P75 未提交 diff。Builder 未打开浏览器、未启动或重启服务。以下全部是待执行清单，不是已通过记录。

## 正式组件页

URL：`http://localhost:5173/next/components/question`（若 Supervisor 的现有服务端口不同，使用其实际端口）。

1. 五主题 `light / paper / dark / blueprint / blueprint-night` × 视口宽度 **1280 / 320**，记录实际 viewport 宽高。
2. 「题型样本」选「解答题 · 动点与矩形面积」，「题卡组合」保留「选择」；在「可组合的内容与操作」下点击「详情」。上方纯展示卡没有详情入口，避免选错。
3. 依次选择「答案与解析 / 教学定位 / 题目档案」。窄容器显示短标签「答案 / 定位 / 档案」，完整 accessible name 保留。分别应看到「参考答案 / 解析」、知识点与教材字段、「题目编号 Q-M-004」等真实样本信息。
4. 两蓝图：detail 背景等于 card，直角，四边 **1px dashed**；padding 四边 **12px**；Tabs gap **12px**。白图 border 应为 `rgb(214, 218, 225)`，夜图 border 应为 `rgb(201, 214, 232)`；背景分别为 `rgb(255, 255, 255)` / `rgb(13, 28, 49)`。确认无双框、阴影或装饰标尺。
5. 量取实际 Tab 行与每个按钮高度，桌面按钮 ≥32px、coarse 模拟 ≥44px；分别检查鼠标、键盘 Tab / 方向键 / Enter / Space 切换和收起后焦点。fine 320px 原 h-8.5 = 34px 不应缩小。不要只用媒体查询的声明值代替实际 bounding rect。
6. 量取三面板的间距：答案相邻 section 12px，定位 grid row-gap 16px / 字段相邻行 12px，档案 row-gap 12px。检查中文、公式、长来源与图片，不能仅凭无溢出判定通过。
7. 三核心主题的详情维持 secondary 表面、16px padding、Tabs 20px gap、原圆角与原面板间距；用基线记录或禁用本轮 P75 CSS 块的前后 `getComputedStyle` 比较（背景、四边、圆角、padding、gap、margin、字号、line-height、按钮高度）。两蓝图内嵌核心预览根/后代也应与相同核心主题单独显示一致。伪元素不得出现新边框或阴影。

## 白底图与嵌套预览夹具

证据源：[fixture.tsx](fixture.tsx)，复用真实 QuestionCard / QuestionDetails，无新产品路由。白底 SVG 是已有 `CoordinateDiagram` 的序列化图片，见 [question-diagram-white.svg](question-diagram-white.svg)。图形本体没有重画。

在 Supervisor 已运行的 Vite 开发页上，可通过浏览器控制台装载以下夹具；只向当前 DOM 附加验收容器，不保存产品源码、不重启服务：

```js
const p75Host = document.createElement('div');
p75Host.id = 'p75-check';
document.querySelector('main').prepend(p75Host);
const p75Fixture = await import('/docs/blueprint/evidence/question-detail-20261016/fixture.tsx');
const p75Unmount = p75Fixture.mount(p75Host);
// 验收后：p75Unmount(); p75Host.remove();
```

开发模块导入仅适用于 Vite；若当前是生产服务，用 Supervisor 自己的临时夹具入口挂载该导出，不把此路径当成已发布路由。夹具 bundle / SSR 已由 Builder 检查，浏览器挂载尚未执行。

- 在夹具顶部切五主题，1280 / 320 各展开并切三 Tab。白底图在题面和解析内均可见；白图详情与白底图一致，夜图 card 仍为夜图色，白图自身不反色。
- 点击「嵌套核心主题」，逐个展开 light / paper / dark 卡片并切 Tab，采样同上属性；外层在 blueprint 和 blueprint-night 间切换时，核心详情不应出现本轮虚线、12px padding 或压缩间距。
- 原页面外层为夜图时，在夹具选择 blueprint，确认不会继承夜图 line 描边；原页面外层为三核心时，夹具选择两蓝图，确认蓝图样式生效。
- 复核正常/减少动态效果模式、长内容以及公式可读性。真实触屏、读屏器、实体打印另行记录是否执行。

## 记录格式

每个样本记录主题、外层主题、视口宽高、pointer 媒体状态、URL / fixture、Tab、detail 背景 / 四边宽度样式颜色 / 圆角 / 四边 padding、Tabs gap、面板间距、按钮及 Tab 行 rect 高度、字号和 line-height、结果与偏差。Screenshot 如需归档，放 `docs/blueprint/screens/question-detail-20261016/`，用 `<主题>-<宽度>-<内容>.png` 实际 PNG；本轮 Builder 没有截图。
