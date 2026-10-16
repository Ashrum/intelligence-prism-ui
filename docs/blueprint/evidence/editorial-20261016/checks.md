# 编辑式排版与 Geist Mono · 定向检查

- 日期：2026-10-16（Asia/Taipei）；基线 `9b5ac0c389abb5fb232b0356a920a60706d86e27`，Site v123。
- 节奏：新周期第 1/3 轮。用户批准每轮定向检查，第 3 个完成小轮进行完整回归与独立综合审查；本轮未运行全量工程测试或上轮组件交互矩阵。
- 改动：复用 `BlueprintSheet`、`BpMinor`、`BpFigCap`，提炼独立章节 Header 并应用两批常用组件展示；本地托管真实 Geist Mono 子集。冻结 coss、依赖和核心主题令牌值未改。

## 实际验证

- [Builder 工程记录](engineering.json)：TypeScript 0 错误；Typography 308 文件；现有组件/API 定向测试 10/10；两份 WOFF2、许可、manifest 检查通过；固定 Python / fontTools / Brotli 的 `--check` 在内存重新生成后逐字节一致。时间为结果汇总时间，不当作各命令开始时间。
- [浏览器记录](browser.json)：Chrome 桌面视口模拟 1280×960、320×960，6 个章节 Header 与 18 个分节标题；页面宽度分别为 1280 / 320，所有 folio 可见。章节标题 20/30、小节中文 16/24、编号和 folio 12/18，48×48 章号块使用 24/32、500。
- Chrome 实际字体查询：folio 使用 GeistMono-Regular，分节索引使用 GeistMono-Medium，中文标题使用系统中文字体；MathML 中数学字形使用 STIX Two Math。不是仅凭 CSS 字体栈推定命中。
- 隔离浏览器上下文阻断两份 Geist WOFF2 后，两 FontFace 为 error；320px 仍能完整显示页序和文案，无页面横溢，回退截图可读。默认 `font-display:swap`。
- [改动前](before.json)与浏览器记录中的四主题普通 body / Input 样本逐项相等；该比较只覆盖记录属性，不外推全站像素一致。InputGroup 整组焦点仍为 2px 蓝色 outline，内部输入无第二道 outline。
- 已修复首次字体 CSS 二层导入造成的开发页 500；改为 `theme.css` 同级导入并重启唯一开发服务后恢复 200。脚本增加等待交互初始化，排除 SSR 阶段提前点击导致的自动化超时；最终结果来自修复后的页面。

## 截图

- [桌面原图纸标题](../../screens/editorial-20261016/blueprint-1280-actions.png)
- [窄屏原图纸标题](../../screens/editorial-20261016/blueprint-320-actions.png)
- [桌面第二批章节](../../screens/editorial-20261016/blueprint-1280-second-batch.png)
- [窄屏第二批章节](../../screens/editorial-20261016/blueprint-320-second-batch.png)
- [字体加载失败回退](../../screens/editorial-20261016/blueprint-320-fallback.png)

已人工查看以上截图：中文与编号层级清楚，横线作为分组边界，窄屏页序换行；没有仅以无溢出代替视觉检查。截图为浏览器视口，不是真机或打印。

## 发布边界

最终生产构建在文档与 guide 冻结后由发布流程执行，结果记录在 PR 和最终部署记录；不为回填本文重复构建。独立差异审查见 [review.md](review.md)。本轮不重复全站回归，也未验证真机、读屏器、原生缩放、实体打印或所有语言字形。网络资源计时中的 0 字节为缓存记录，文件体积以字体 manifest 的实际文件字节数为准。
