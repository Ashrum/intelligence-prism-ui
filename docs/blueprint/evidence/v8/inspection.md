# BPv8 工程检查与证据说明

日期：2026-10-14；分支 `feat/learning-charts`，开工 HEAD `efe001ff6eaf3b228c41e5873fe22b9e3c4587ea`，开工工作树干净。

## 范围与复用

运行时只修改 `app/(next)/next/blueprint.css` 与 `lib/prism-next/chart-palette.ts`；新增 `tests/blueprint-print-a11y.test.mjs`，未改既有测试。无新增组件、API、Token 或依赖。其他 P 系列图表源码、冻结 coss 与核心三主题令牌保持不变。

离线读取固定 `components/coss/tabs.tsx`、缓存 `.sites-runtime/easyui-research-20261005/coss-source/p-tabs-1.tsx`（coss particles）、已有 Blueprint / HeatmapChart / EChart / ChartDataDisclosure。coss Tabs 与 p-tabs-1 已提供标签和面板语义，不解决蓝图专属打印和焦点几何；沿用原组件，只在已有 blueprint.css 适配。通用主题工程检查不属于 Agent 组件新增，不适用 Beautiful UI 优先检索。未联网刷新注册表、未复制第三方代码。按任务手动修正，无设计 patch，因此无 git apply 步骤。

## 打印规则与灰度图案

- 原打印规则只把 body 设白，隐藏 DemoSection 一项装饰；SidebarInset 仍覆盖 40px 网格，浮层、按钮和错误卡仍带硬投影。
- 新规则清除 body / 蓝图预览根 / SidebarInset / 缩略图区的网格背景，底色设白；移除已知偏移阴影及 ECharts SVG filter 阴影。保留边框、轴线、描边；TitleBlock 的 box-shadow 是结构分隔线，特意保留。
- 数据图案不与装饰网格一起删除。ECharts、SizeBar、Metric 数据表面请求 print-color-adjust:exact（含 WebKit 属性）；浏览器或打印机仍可覆盖此提示。
- 全部打印选择器要求 blueprint，排除嵌套核心预览根及后代，包括伪元素；未修改三核心主题打印规则。CSS AST 检查不是实际浏览器级联验证。
- 沿用六种图案几何，只把五种纹理的白色 alpha 从 .55/.6/.5 提高到 .8。原图案与底色对比度依次为 6.07、2.74、2.80、2.22、2.46:1；后四种不足本轮采用的 3:1 工程阈值。
- 不用系列灰度深浅作唯一区分：S1、S3 基底亮度分别为 0.122、0.127；S4、S6 为 0.165、0.167，过于接近。六系列以实底、相反斜线、点、横线、竖线区分。

| 系列 | 几何 / 密度（CSS px，未缩放） | 基底亮度 L | 图案亮度 L | 亮度差 ΔL | 图案/底色比值 |
| --- | --- | --- | --- | --- | --- |
| S1 | 实底，无纹理 | 0.122 | — | — | — |
| S2 | −45°；亮线 2 / 空隙 4，周期 6；覆盖约 33.3% | 0.009 | 0.637 | 0.628 | 11.61:1 |
| S3 | +45°；亮线 2 / 空隙 4，周期 6；覆盖约 33.3% | 0.127 | 0.713 | 0.586 | 4.31:1 |
| S4 | 圆点直径 2.4；8×8 点阵；覆盖约 7.1% | 0.165 | 0.759 | 0.594 | 3.76:1 |
| S5 | 0° 横线；亮线 3 / 空隙 3，周期 6；覆盖 50% | 0.196 | 0.770 | 0.573 | 3.33:1 |
| S6 | 90° 竖线；亮线 3 / 空隙 3，周期 6；覆盖 50% | 0.167 | 0.767 | 0.599 | 3.76:1 |

按 96 CSS px/in、100% 尺寸估算：2px 线宽约 0.53mm，6px 周期约 1.59mm，2.4px 点径约 0.64mm，8px 点距约 2.12mm。既有密度保留：斜线覆盖较低、横竖条纹较密，点阵稀疏；角度与形状共同编码。不是打印机实测，缩放、半色调、低墨量、窄柱 / 薄面积 / 小图例可能损失纹理，实体输出必须另验。

[six-textures-equal-grey.svg](six-textures-equal-grey.svg) 是当前本地 ECharts SVG SSR 生成的工程夹具：六系列全部强制相同 #555555 基底，验证纹理不依赖色相或不同底灰。输出含六个 pattern 定义（S1 为空纹理），±45° / 90° 旋转与 8×8 点阵均由引擎生成；这不是浏览器截图或人眼辨识通过记录。配置及亮度见 [decals.json](decals.json)。当前措施适用于 ECharts decal 支持的填充系列，不为 Recharts 趋势 / 比较、无填充折线、散点或热力图连续色阶添加六系列纹理。

## 四主题 SSR 语义与焦点

- `blueprint-{blueprint,tabs,heatmap}.html` 等 12 个主题文件是实际 React 组件输出；仅 useTheme 的主题值被替换，EChart、表格和 Tabs 没有替换。React effects 不在 SSR 执行，不据此断言水合、键盘或读屏行为。
- Blueprint：4 个 section 的 aria-labelledby 指向真实标题；标尺与字母装饰 aria-hidden；两组具名 radiogroup，各有一个被选中且可 Tab 到达的 radio；流程 aria-current=step，且有完成 / 当前文字；SizeBar 的 role=img 名称列出四项数值；图标按钮有“切换明暗”名称，note / alert / status 输出存在。
- Tabs：两组 tablist、两组关联 tabpanel，各一个 aria-selected=true；aria-labelledby / describedby 引用有效，禁用项带 aria-disabled。当前语义沿用 coss，不自行把单选组改成 Tabs。
- 热力图：role=img 有长中文与公式文本标签；details / summary“查看数据与选择项目”之后是真实 table，0 和缺测各自保留，行内按钮可以经原生按钮进入。SSR 尚无容器尺寸，不把它记成 320px 标签隐藏验证。
- `route-blueprint.html`、`route-tabs.html`、`route-evidence-matrix.html` 来自本轮构建 worker.fetch，3 个正式 URL 均为 HTTP 200。路由 SSR 不模拟客户端四主题切换；四主题组件检查与正式路由可达性分开计证。
- 原 bp-seg-tabs 焦点为内缩 −4px；其他 bp 按钮依赖 UA 默认外框。新增隔离的蓝图 :focus-visible 规则（包括 bp / coss Tabs / 热力图数据表控件），使用既有 --ring=#1D5FBF，2px solid、外偏移 2px。显式分段按钮选择器保证覆盖旧规则的特异性；分段容器加 4px 留白供外框完整呈现。核心主题的既有焦点样式不变，实际裁切与键盘复验仍待浏览器。

## 令牌对比度

采用 WCAG sRGB 相对亮度公式：(L高 + 0.05) / (L低 + 0.05)。校核黑白=21、同色=1、#777777/白=4.478089；从当前 theme.css 解析令牌，不以手抄阈值替代。每项为页面背景 / 卡片背景。

| 主题 | 正文 | 次要文字 | 链接 | 焦点（非文字 UI） |
| --- | --- | --- | --- | --- |
| light | 15.80 / 15.80:1 | 7.56 / 7.56:1 | 5.77 / 5.77:1 | 5.77 / 5.77:1 |
| paper | 12.97 / 14.50:1 | 6.70 / 7.49:1 | 5.94 / 6.64:1 | 5.94 / 6.64:1 |
| dark | 15.15 / 13.92:1 | 10.22 / 9.39:1 | 10.45 / 9.60:1 | 10.45 / 9.60:1 |
| blueprint | 16.40 / 17.76:1 | 7.25 / 7.85:1 | 5.64 / 6.10:1 | 5.64 / 6.10:1 |

蓝图页面背景 #F6F6F3 / 卡片 #FFFFFF；正文 #16181D、次要文字 #4B5260、链接与焦点 #1D5FBF。正文 / 次要 / 链接均 ≥4.5:1，焦点与墨线相对上述背景 ≥3:1。完整值见 [contrast.json](contrast.json)。本轮只计算不透明令牌及 decal 的 alpha 合成，未覆盖所有悬停 / 禁用 / 透明度 / 叠加网格后的像素，也不构成 WCAG 全站合规认证。

## 待 PO / 设计决定与未验范围

- 蓝色焦点环相对墨底 #16181D 的比值约 2.91:1（例如 PaneHead 内操作）；任务明确要求固定蓝环，本轮不自行改变令牌或新增双层环设计。需设计决定深墨表面的焦点分隔方式，并由 Supervisor 检查实际相邻颜色。
- 热力图表格操作名为“查看 zero / missing”等内部 ID，选中行仅 data-state=selected，未暴露对应的选择状态 ARIA。共享 DataRecordTable 的“查看”是否代表持久选择、可访问名称如何组合行列，需明确契约后另派修复，未改 P 系列共享组件。
- BpSizeBar 四填充中有多个纯色，不能把 ECharts 六纹理结论推广到它；虽然各项数值有可访问名称及图例，若要求所有图形都必须仅靠纹理辨认，需另定填充映射。小图例、面积透明度、调用方覆盖色亦未获纹理对比保证。
- 浏览器验收：按分工由 Supervisor 执行。真机、读屏器、实体打印未验；本轮未启动 / 重启服务、未打开浏览器、未生成浏览器截图、未提交 / 推送 / 发布。Builder 工程检查不等同于 Supervisor Review 或 PO 批准。

## 验证索引

[checks.json](checks.json) 记录六项命令 / 退出码；字体、304 TSX 排版、构建、全量 2034/2034（fail 0 / skipped 0）、类型 0 诊断、专项 11/11 均退出 0。先构建后全量测试，环境目录沿用 README、保留进程 HOME；未安装依赖。构建有既有 chunk 大小与静态路由分类提示。首轮新增 SSR 测试曾错误期待 aria-pressed，按真实“查看”按钮契约改为检查实际 data-state 及名称，并把未声明选择语义记入上方待定项；无运行时错误被测试修正掩盖。

[scope.diff](scope.diff) 是本轮运行时及新增测试的实际补丁；[integrity.json](integrity.json) 是保护范围核对；[status-before.txt](status-before.txt) 保存开工 STATUS，旧当前正文已逐字保留在历史。原 v4–v7 证据未改。浏览器清单见 [当前状态](../../STATUS.md)。
